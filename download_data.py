import hashlib
import inspect
import os
import json
import time
import urllib.error
import urllib.request

from threading import Lock

root = os.path.dirname(os.path.abspath(
    inspect.getfile(inspect.currentframe())))

PREFIX = "https://dos-bin.zczc.cz/"
DESTINATION = os.path.join(root, 'bin')
BUF_SIZE = 65536
RETRY_COUNT = 5

_progress_lock = Lock()

# read game infos from games.json
with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
    game_infos = json.load(f)


def generate_sha256(file):
    sha256 = hashlib.sha256()
    with open(file, 'rb') as f:
        while True:
            data = f.read(BUF_SIZE)
            if not data:
                break
            sha256.update(data)
    return sha256.hexdigest()


def _parse_content_range(value):
    range_bytes, total = value.split(' ', 1)[1].split('/', 1)
    start, end = (int(part) for part in range_bytes.split('-', 1))
    return start, end, None if total == '*' else int(total)


def _print_progress(identifier, downloaded, total_size, last_report):
    now = time.monotonic()
    if total_size is not None:
        downloaded = min(downloaded, total_size)
    if downloaded != total_size and now - last_report < 1:
        return last_report

    if total_size:
        status = f'{downloaded / total_size * 100:5.1f}% '
        status += f'({downloaded}/{total_size} bytes)'
    else:
        status = f'{downloaded} bytes'
    with _progress_lock:
        print(f'\rDownloading {identifier}: {status}', end='', flush=True)
    return now


def download(identifier, url, file, expected_sha256=None):
    temp_file = file + '.part'
    if not os.path.exists(temp_file) and os.path.exists(file):
        os.replace(file, temp_file)
    if (expected_sha256 is not None and os.path.exists(temp_file)
            and generate_sha256(temp_file) == expected_sha256):
        os.replace(temp_file, file)
        return

    for attempt in range(1, RETRY_COUNT + 1):
        discard_partial = False
        try:
            downloaded = (os.path.getsize(temp_file)
                          if os.path.exists(temp_file) else 0)
            request = urllib.request.Request(url)
            if downloaded:
                request.add_header('Range', f'bytes={downloaded}-')
            with _progress_lock:
                print(f'Downloading {identifier} game file '
                      f'(attempt {attempt}/{RETRY_COUNT}, '
                      f'resuming at {downloaded} bytes)')

            try:
                response = urllib.request.urlopen(request)
            except urllib.error.HTTPError as error:
                if error.code == 416:
                    discard_partial = True
                raise

            with response:
                status_code = response.getcode()
                content_length = response.headers.get('Content-Length')
                total_size = None
                expected_response_size = None

                if status_code == 206:
                    content_range = response.headers.get('Content-Range')
                    if content_range is None:
                        discard_partial = True
                        raise ValueError('partial response has no Content-Range')
                    range_start, range_end, total_size = (
                        _parse_content_range(content_range))
                    if range_start != downloaded:
                        discard_partial = True
                        raise ValueError(
                            f'wrong range start: expected {downloaded}, '
                            f'got {range_start}')
                    expected_response_size = range_end - range_start + 1
                    mode = 'ab'
                elif status_code == 200:
                    if downloaded:
                        with _progress_lock:
                            print(f'\nServer ignored resume request for '
                                  f'{identifier}; restarting download')
                    downloaded = 0
                    mode = 'wb'
                    if content_length is not None:
                        total_size = int(content_length)
                        expected_response_size = total_size
                else:
                    discard_partial = True
                    raise ValueError(f'unexpected HTTP status {status_code}')

                if status_code == 206 and total_size is None:
                    if content_length is not None:
                        total_size = downloaded + int(content_length)
                elif total_size is None and content_length is not None:
                    total_size = int(content_length)

                last_report = 0
                received = 0
                with open(temp_file, mode) as output:
                    while True:
                        data = response.read(BUF_SIZE)
                        if not data:
                            break
                        output.write(data)
                        received += len(data)
                        downloaded += len(data)
                        last_report = _print_progress(
                            identifier, downloaded, total_size, last_report)

                if (expected_response_size is not None
                        and received != expected_response_size):
                    raise IOError(
                        f'retrieval incomplete: got {received} out of '
                        f'{expected_response_size} bytes in this attempt')

            if expected_sha256 is not None:
                actual_sha256 = generate_sha256(temp_file)
                if actual_sha256 != expected_sha256:
                    discard_partial = True
                    raise ValueError(
                        f'checksum mismatch: expected {expected_sha256}, '
                        f'got {actual_sha256}')

            os.replace(temp_file, file)
            with _progress_lock:
                print(f'\nDownloaded {identifier}')
            return
        except Exception as error:
            if discard_partial:
                try:
                    os.remove(temp_file)
                except FileNotFoundError:
                    pass
            with _progress_lock:
                print(f'\nDownload failed for {identifier}: {error}')
            if attempt == RETRY_COUNT:
                raise
            time.sleep(attempt)


def main(prefix=PREFIX, destination=DESTINATION):
    # create folder
    os.makedirs(destination, exist_ok=True)

    failures = list()
    downloaded = list()
    for identifier in game_infos['games'].keys():
        file = os.path.normcase(os.path.join(destination, identifier + '.zip'))
        url = prefix + urllib.parse.quote(identifier) + '.zip'
        expected_sha256 = game_infos['games'][identifier]['sha256']
        if os.path.isfile(file) and generate_sha256(file) == expected_sha256:
            continue

        downloaded.append(identifier)
        try:
            download(identifier, url, file, expected_sha256)
        except Exception as error:
            failures.append((identifier, error))

    if failures:
        details = '; '.join(f'{identifier}: {error}'
                            for identifier, error in failures)
        raise RuntimeError(f'{len(failures)} download(s) failed: {details}')
    return downloaded


if __name__ == '__main__':
    main()
