# 🎮 中文 DOS 游戏

网址： https://dos.lol


中文 DOS 游戏合集，目前共有 1898 款游戏。

## 下载游戏文件

在根目录下运行 Python 3 脚本

``` python
python download_data.py
```

若下载出错请参见 [Issue #26](https://github.com/rwv/chinese-dos-games/issues/26)

## 游戏列表

参见 https://dos.lol/games

## IPFS

IPNS Hash: [`k2k4r8oyknzob8jjqpj6toer4dw3jc6srsbqlbsalktnw1fopb7iyqd2`](https://ipfs.io/ipns/k2k4r8oyknzob8jjqpj6toer4dw3jc6srsbqlbsalktnw1fopb7iyqd2)

## 网站源代码

前后端分离架构：

- 后端 API（Flask）：[`backend/`](backend/)，详见 [`backend/README.md`](backend/README.md)
- 前端（React + Vite）：[`frontend/`](frontend/)，详见 [`frontend/README.md`](frontend/README.md)

## 版权问题

本人明白此项目存在版权上的侵权，如版权方介意的话，请联系 [chinese.dos.games@outlook.com](mailto:chinese.dos.games@outlook.com)，本人将立刻删除有关文件。

## Contributing

欢迎提 [Issue](https://github.com/rwv/chinese-dos-games/issues) 和 [Pull request](https://github.com/rwv/chinese-dos-games/pulls) 来增加新的游戏!

PR 具体参见 [CONTRIBUTING.md](https://github.com/rwv/chinese-dos-games/blob/master/CONTRIBUTING.md)

## 引擎与兼容性

- **emularity (默认)**：基于 dosbox 0.74-3。兼容性好，大多数游戏可运行。
- **js-dos 8 (试用)**：基于 DOSBox-X (Wasm)。适合多盘游戏(Vipatho/SHIB)多碟同挂。游戏页顶在选择发动机。

## 已修过的常见问题

- **1588+** 游戏的 executable 文件名大小写已归一化(原为 BrowserFS ZipFS 大小写敏感)修复。
- **112+** 游戏补了 `cdrom: true` (有 cdImage 但原 cdrom=false)。
- **117+** CD 游戏加 `cycles=max` (DOS/4GW 保护模式需要快 CPU 速度)。
- **多盘支持**：`cdImages: [d1, d2]` 可以同时挂载两张光碟(如仙客英雄传3、炎龙骑士团外传)。
- **存档保存**：`js-dos` 引擎每 30s 自动存档且可导入/导出。`emularity` 引擎可导出完整 IndexedDB。
- **倍速控制**：游戏页有「减速/加速」按钮，Ctrl-F11/F12 同步。
- **UI 语言切换**：齿轮按钮切换中文/英文名。

## 文件结构

- `games.json` - 1898 个游戏元数据 (id, 启动器, cdImage, machine 等)
- `bin/` - 1898 个游戏 ZIP
- `img/` - 封面图
- `frontend/src/jsdos/config.ts` - dosbox conf 生成逻辑
- `check_games.py` - 验证 games.json 与 bin/ 一致性
- `verify_data.py` - 验证 ZIP 完整性/大小/sha256

## Credits

* [dreamlayers/em-dosbox: An Emscripten port of DOSBox](https://github.com/dreamlayers/em-dosbox)
* [db48x/emularity: easily embed emulators](https://github.com/db48x/emularity)
* [caiiiycuk/js-dos: DOS emulator for the browser](https://github.com/caiiiycuk/js-dos)
* [衡兰若芷制作的DOS游戏合集](https://tieba.baidu.com/p/3962261741)
