# 🎮 中文 DOS 游戏

浏览器游玩中文 DOS 游戏

## 运行

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

### 通过Docker运行
> 优点: 随便折腾 数据安全

```sh
# 1. 下载 build.dockerfile文件 到一个空目录下

wget https://raw.githubusercontent.com/Kuangcp/chinese-dos-games/master/build.dockerfile 

# 2. 构建镜像
docker build -t game -f build.dockerfile .

# 3. 构建容器
docker run --name game -it -p 8888:5000 game

# 也可以拉取已经构建好的镜像 docker pull hub.baidubce.com/dos-game/dos-game:1.0 
# 进入容器下载游戏数据(暂时不清楚为什么不能在构建镜像的时候下好)
docker exec -it game sh 
cd 
python3 download_data.py

# 下载好了之后, 就可以退出容器了
# 以后启动游戏就是
docker start game

# 关闭游戏
docker stop game

# 进入游戏
localhost:8888
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

欢迎提 Issue 和 Pull request 来增加新的游戏!

## Credits

* [dreamlayers/em-dosbox: An Emscripten port of DOSBox](https://github.com/dreamlayers/em-dosbox)
* [db48x/emularity: easily embed emulators](https://github.com/db48x/emularity)
