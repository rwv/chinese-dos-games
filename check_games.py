"""校验 games.json 配置与 bin/ ZIP 内容的一致性。

检查项：
  1. executable 在 ZIP 中存在（大小写精确匹配）
  2. cdImage / cdImages / bootImage / img 在 ZIP 中存在（大小写精确匹配）
  3. cdImages 至少 2 项（单盘应使用 cdImage）
  4. dosboxArgs 为 -c/value 成对结构

与 verify_data.py（校验 ZIP 完整性/大小/哈希）互补；本脚本只查配置层。

用法：
  python check_games.py            # 全量检查
  python check_games.py --verbose  # 输出每项详情
"""

import argparse
import json
import os
import sys
import zipfile


def main():
    parser = argparse.ArgumentParser(description='校验 games.json 配置一致性')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    root = os.path.dirname(os.path.abspath(__file__))
    bin_dir = os.path.join(root, 'bin')

    with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
        games = json.load(f)['games']

    errors = []
    checked = 0

    for name, g in games.items():
        path = os.path.join(bin_dir, name + '.zip')
        if not os.path.exists(path):
            continue  # 缺文件由 verify_data.py 报告
        try:
            names = set(zipfile.ZipFile(path).namelist())
        except zipfile.BadZipFile:
            continue  # 坏 ZIP 由 verify_data.py 报告

        checked += 1

        # executable: bootImage 游戏不运行 executable，跳过
        # dosboxArgs 含 'cd X' 时 executable 位于子目录, 仅在根目录校验
        da = g.get('dosboxArgs') or []
        has_cd = any(v.strip().lower().startswith('cd ') for v in da[1::2])
        if not g.get('bootImage') and not has_cd and g.get('executable') not in names:
            exe = g.get('executable', '')
            if '/' not in exe and ' ' not in exe:
                errors.append((name, 'executable', f"{exe!r} not in zip"))

        for field in ('cdImage', 'bootImage', 'img'):
            v = g.get(field)
            if v and v not in names:
                errors.append((name, field, f"{v!r} not in zip"))

        cd_images = g.get('cdImages') or []
        for v in cd_images:
            if v not in names:
                errors.append((name, 'cdImages', f"{v!r} not in zip"))
        if cd_images and len(cd_images) < 2:
            errors.append((name, 'cdImages', f'single disc {cd_images!r}; use cdImage'))

        # dosboxArgs: 偶数长度且奇数位为 -c
        da = g.get('dosboxArgs') or []
        if len(da) % 2 != 0 or any(da[i] != '-c' for i in range(0, len(da), 2)):
            errors.append((name, 'dosboxArgs', f'malformed pairs: {da!r}'))

    print(f'checked {checked} games against ZIP contents')
    if errors:
        print(f'\n{len(errors)} configuration errors:')
        for name, field, detail in errors:
            print(f'  {name} [{field}]: {detail}')
        return 1
    print('all configurations consistent')
    return 0


if __name__ == '__main__':
    sys.exit(main())
