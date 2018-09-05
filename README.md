# 🎮 中文 DOS 游戏

浏览器游玩中文 DOS 游戏

## 运行

### 下载游戏文件

在根目录下运行以下 python 3 代码

``` python
import urllib.request, os
from game_infos import game_infos

PREFIX = "https://dos.zczc.cz/static/gamedata/"
DESTINATION = os.path.normcase('static/gamedata/')

for identifier in game_infos['games'].keys():
    urllib.request.urlretrieve(PREFIX + identifier + '.zip', os.path.join(DESTINATION, identifier + '.zip'))
```

### 运行网页

使用 python 3 运行 `app.py`

## 游戏列表

* 仙剑奇侠传
* 模拟城市 2000
* 美少女梦工厂
* 同级生 2
* 大富翁3
* 明星志愿1
* 三国志IV
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


## Known issues

* 游戏界面在游戏运行时会改变 `<title>`

## Contributing

欢迎提 Issue 和 Pull request 来增加新的游戏!

## Credits

* [dreamlayers/em-dosbox: An Emscripten port of DOSBox](https://github.com/dreamlayers/em-dosbox)
* [db48x/emularity: easily embed emulators](https://github.com/db48x/emularity)