import os
import json
import hashlib
import shutil
import requests

from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote
from retrying import retry


class Config:
    BUF_SIZE = 65536  # 读取缓冲区大小（字节）
    THREADS_NUM = 10  # 用于同时下载任务的线程数

    BASE_URL: str = "https://dos-bin.zczc.cz"  # 游戏文件源的基本URL

    DESTINATION_PATH: Path = (
        Path(__file__).resolve().parent / "bin"
    )  # 保存下载的游戏文件的目标路径。

    GAMES_JSON_PATH: Path = (
        Path(__file__).resolve().parent / "games.json"
    )  # JSON数据文件，包含有关游戏的信息。

    PROXY: str = os.getenv(
        "DOWNLOAD_PROXY"
    )  # 从环境变量中提取的代理服务器地址。


@retry(stop_max_attempt_number=3)
def make_request(
    session: requests.Session, url_encoded: str, proxies=None, headers=None
):
    return session.get(url_encoded, stream=True, proxies=proxies, headers=headers)


class GameDownloader:
    """ 创建新方法用于获得已下载文件的字节数 """
    @staticmethod
    def get_downloaded_size(file_path: Path) -> int:
        # 获取已部分下载的文件的大小。
        return file_path.stat().st_size if file_path.exists() else 0

    @staticmethod
    def calculate_sha256(file_path: Path) -> str:
        """ 计算给定文件的SHA-256哈希。"""
        # 在尝试打开文件之前，请检查该文件是否存在
        if not file_path or not file_path.exists():
            return None

        sha256_hasher = hashlib.sha256()

        with file_path.open("rb") as f:
            for data in iter(lambda: f.read(Config.BUF_SIZE), b""):
                sha256_hasher.update(data)

        return sha256_hasher.hexdigest()

    @staticmethod
    def download_file(
        session: requests.Session, identifier: str, url_encoded: str, destination: str
    ):
        print(f"Downloading {identifier} game file")

        proxies = None

        if Config.PROXY and Config.PROXY.startswith(
            ("socks5h://", "socks5://", "http://", "https://")
        ):
            proxies = {
                "http": Config.PROXY,
                "https": Config.PROXY,
            }

        # 获取已经下载了多少字节
        downloaded_bytes = GameDownloader.get_downloaded_size(Path(destination))

        # 添加 Range header 到 HTTP 请求中以实现断点续传功能
        headers = {"Range": f"bytes={downloaded_bytes}-"}

        try:
            with make_request(
                session, url_encoded, proxies=proxies, headers=headers
            ) as r:
                r.raise_for_status()

                with open(destination, "ab") as f:
                    shutil.copyfileobj(r.raw, f)

        except Exception as e:
            print(f"Error downloading {identifier}: {e}")

            # 仅当下载过程出错时才删除文件
            if Path(destination).exists():
                Path(destination).unlink()

    @staticmethod
    def load_game_info(path: Path) -> dict:

        """从指定json文件加载游戏信息"""

        with open(path, "r") as f:
            return json.load(f)["games"]

    @classmethod
    def download_games(
        cls, base_url=Config.BASE_URL, destination_path=Config.DESTINATION_PATH
    ):

        """此功能使用多线程处理游戏文件的下载和保存。"""

        destination_path.mkdir(
            parents=True, exist_ok=True
        )  # 创建目录（如果不存在）

        game_infos = cls.load_game_info(Config.GAMES_JSON_PATH)

        tasks = []

        with ThreadPoolExecutor(max_workers=Config.THREADS_NUM) as executor:

            hash_futures = {
                executor.submit(
                    cls.calculate_sha256,
                    Path(f"{destination_path}/{identifier}.zip")
                    if (Path(f"{destination_path}/{identifier}.zip").exists())
                    else None,
                ): identifier
                for identifier in game_infos.keys()
            }

            json_futures = {
                executor.submit(
                    cls.load_game_info, Config.GAMES_JSON_PATH
                ): "game_infos"
            }

            for future in as_completed(hash_futures):
                identifier = hash_futures[future]
                try:
                    sha_hash_of_file = (
                        future.result() if future.result() is not None else ""
                    )
                except Exception as exc:
                    print(f"{identifier} generated an exception: {exc}")
                else:
                    file_path = destination_path / f"{identifier}.zip"
                    url_encoded = quote(f"{base_url}/{identifier}.zip", safe="/:")

                    if file_path.exists() and sha_hash_of_file == game_infos.get(
                        identifier
                    ).get("sha256"):
                        print(f"Skipping {identifier}")
                        continue

                    tasks.append((identifier, url_encoded, str(file_path)))

            with requests.Session() as session:

                list(
                    executor.map(lambda args: cls.download_file(session, *args), tasks)
                )


if __name__ == "__main__":
    GameDownloader.download_games()
