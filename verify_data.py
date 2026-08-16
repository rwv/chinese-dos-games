"""校验 bin/ 下的游戏文件与 games.json 记录是否一致。

检查项：
  1. 文件是否存在
  2. SHA-256 是否匹配
  3. 文件大小是否与 games.json 记录一致
  4. ZIP 结构是否完整（testzip）

用法：
  python verify_data.py              # 全量校验
  python verify_data.py --no-zip     # 跳过 ZIP 完整性检查（更快）
  python verify_data.py --verbose    # 输出每个文件的详细状态
"""

import argparse
import hashlib
import json
import os
import sys
import zipfile

BUF_SIZE = 65536


def generate_sha256(path):
    sha256 = hashlib.sha256()
    with open(path, 'rb') as f:
        while True:
            data = f.read(BUF_SIZE)
            if not data:
                break
            sha256.update(data)
    return sha256.hexdigest()


def check_zip(path):
    """返回 (ok, detail)。ok=True 表示 ZIP 结构完整。"""
    try:
        with zipfile.ZipFile(path) as zf:
            bad = zf.testzip()
            if bad:
                return False, f'corrupt entry: {bad}'
            return True, f'{len(zf.namelist())} entries'
    except zipfile.BadZipFile as e:
        return False, f'bad zip: {e}'
    except Exception as e:
        return False, f'error: {e}'


def main():
    parser = argparse.ArgumentParser(description='校验游戏文件完整性')
    parser.add_argument('--no-zip', action='store_true', help='跳过 ZIP 完整性检查')
    parser.add_argument('--verbose', action='store_true', help='输出每个文件的详细状态')
    args = parser.parse_args()

    root = os.path.dirname(os.path.abspath(__file__))
    bin_dir = os.path.join(root, 'bin')
    games_path = os.path.join(root, 'games.json')

    with open(games_path, encoding='utf8') as f:
        data = json.load(f)

    games = data['games']
    total = len(games)

    missing = []
    sha_mismatch = []
    size_mismatch = []
    zip_corrupt = []
    ok_count = 0

    for i, (identifier, info) in enumerate(games.items(), 1):
        filename = identifier + '.zip'
        path = os.path.join(bin_dir, filename)

        if not os.path.exists(path):
            missing.append(identifier)
            if args.verbose:
                print(f'[{i}/{total}] {identifier}: MISSING')
            continue

        # SHA-256
        actual_sha = generate_sha256(path)
        if actual_sha != info['sha256']:
            sha_mismatch.append((identifier, actual_sha, info['sha256']))
            if args.verbose:
                print(f'[{i}/{total}] {identifier}: SHA256 MISMATCH')
            continue

        # File size
        actual_size = os.path.getsize(path)
        expected_size = info.get('filesize')
        if expected_size and actual_size != expected_size:
            size_mismatch.append((identifier, actual_size, expected_size))

        # ZIP integrity
        if not args.no_zip:
            zip_ok, detail = check_zip(path)
            if not zip_ok:
                zip_corrupt.append((identifier, detail))
                if args.verbose:
                    print(f'[{i}/{total}] {identifier}: ZIP CORRUPT ({detail})')
                continue

        ok_count += 1
        if args.verbose:
            print(f'[{i}/{total}] {identifier}: OK')

    # Summary
    print()
    print('=' * 60)
    print(f'校验完成: {ok_count}/{total} OK, {len(missing)} missing, '
          f'{len(sha_mismatch)} sha mismatch, {len(size_mismatch)} size mismatch, '
          f'{len(zip_corrupt)} zip corrupt')
    print('=' * 60)

    if missing:
        print(f'\n缺失文件 ({len(missing)}):')
        for name in missing:
            print(f'  {name}')

    if sha_mismatch:
        print(f'\nSHA-256 不匹配 ({len(sha_mismatch)}):')
        for name, actual, expected in sha_mismatch:
            print(f'  {name}')
            print(f'    actual:   {actual}')
            print(f'    expected: {expected}')

    if size_mismatch:
        print(f'\n文件大小不匹配 ({len(size_mismatch)}):')
        for name, actual, expected in size_mismatch:
            print(f'  {name}: {actual} (expected {expected}, diff {actual - expected})')

    if zip_corrupt:
        print(f'\nZIP 结构损坏 ({len(zip_corrupt)}):')
        for name, detail in zip_corrupt:
            print(f'  {name}: {detail}')

    has_issues = missing or sha_mismatch or size_mismatch or zip_corrupt
    return 1 if has_issues else 0


if __name__ == '__main__':
    sys.exit(main())
