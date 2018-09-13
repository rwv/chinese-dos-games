# 🎮 中文 DOS 游戏

浏览器游玩中文 DOS 游戏

## 运行

### 克隆仓库

由于历史原因，git 历史内包含游戏的二进制文件，仓库较大。使用 `git clone --depth=1 https://github.com/rwv/chinese-dos-games.git` 来减少文件大小。

### 下载游戏文件

在根目录下运行 Python 3 脚本 `download_data.py`

若下载出错请参见 [Issue #26](https://github.com/rwv/chinese-dos-games/issues/26)

### 安装 Flask

运行以下命令安装 Flask

``` sh
$ pip3 install flask
```

### 运行网页

使用 Python 3 运行 `app.py`

``` sh
$ python3 app.py
```

## 游戏列表

* 仙剑奇侠传
* 模拟城市 2000
* 美少女梦工厂
* 同级生 2
* 大富翁3
* 明星志愿1
* 金庸群侠传
* 轩辕剑1
* 轩辕剑2
* 皇帝
* 轩辕剑外传：枫之舞
* 疯狂医院
* 大航海时代
* 大航海时代2
* 银河英雄传说III SP
* 三国志II
* 三国志III
* 三国志IV
* 三国志V
* 三国志V 威力加强版
* 三国志英杰传
* 主题医院
* 三国演义
* 三界谕：邦沛之迷
* 殖民计划
* 炎龙骑士团II‧黄金城之谜
* 倚天屠龙记
* 信长之野望·天翔记
* 信长之野望·霸王传
* 金瓶梅之偷情宝鉴
* 江南才子唐伯虎
* 暗棋圣手
* 太阁立志传
* 非洲探险2
* 航空霸业2
* 中国球王
* 艾蒂丝魔法大冒险
* 卧龙传

## Known issues

* 游戏界面在游戏运行时会改变 `<title>`

## Contributing

欢迎提 [Issue](https://github.com/rwv/chinese-dos-games/issues) 和 [Pull request](https://github.com/rwv/chinese-dos-games/pulls) 来增加新的游戏!

PR 具体参见 [CONTRIBUTING.md](https://github.com/rwv/chinese-dos-games/blob/master/CONTRIBUTING.md)

## Credits

* [dreamlayers/em-dosbox: An Emscripten port of DOSBox](https://github.com/dreamlayers/em-dosbox)
* [db48x/emularity: easily embed emulators](https://github.com/db48x/emularity)

