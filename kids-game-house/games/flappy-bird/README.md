# Flappy Bird ![Flappy Bird](img/favicon.png) 
A Flappy Bird game in [Phaser 3](https://phaser.io/).

[Check it live!](https://igorrozani.github.io/flappy-bird)

## ✨ 新特性
- ✅ **Vite 支持**：使用 Vite 构建工具，快速开发和热更新
- ✅ **屏幕自适应**：自动适应不同屏幕尺寸和分辨率
- ✅ **全屏模式**：支持一键全屏游戏体验
- ✅ **响应式布局**：游戏自动居中并保持宽高比

## Table of Contents
* [Game screenshots](#game-screenshots)
* [Assets](#assets)
* [How to](#how-to)
    * [Run it](#run-it)
    * [Generate documentation](#generate-documentation)
* [Wiki](#wiki)
* [License](#license)


## Game screenshots
![Main menu](img/print01.png)

*Main menu*


![Playing](img/print02.png)

*Playing*

![Game over screen](img/print03.png)

*Game over*

## Assets
The assets used in this project came from the project [FlapPyBird](https://github.com/sourabhv/FlapPyBird) created by [Sourabh Verma](https://github.com/sourabhv).

## How to 

### Run it (Vite 方式 - 推荐)
1. 克隆仓库或下载 ZIP 并解压
```bash
git clone https://github.com/IgorRozani/flappy-bird.git
cd flappy-bird
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器（自动打开浏览器）
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

5. 预览生产构建
```bash
npm run preview
```

### Run it (传统方式)
1. Clone this repository or click Download ZIP in right panel and extract it 
```
git clone https://github.com/IgorRozani/flappy-bird.git 
```
2. Install [Http-Server](https://www.npmjs.com/package/http-server)
```
npm install http-server -g
```
3. Run the http-server from the repository's directory
```
http-server
``` 

### Generate documentation
1. Install [documentation.js](http://documentation.js.org/)
```
npm install -g documentation
```
2. Generate game.js documentation
```
documentation build js/game.js -f md > docs/game.md
```

## Wiki
We have a wiki, [check it](https://github.com/IgorRozani/flappy-bird/wiki/Wiki).

## 🎮 游戏控制
- **点击屏幕** 或 **按空格键/上箭头**：让小鸟飞起来
- **全屏模式**：
  - 💻 **PC 推荐**：按 **F11** 键（最可靠，支持横向）
  - 🖱️ **备选方案**：点击右上角 ⛶ 按钮
  - ⌨️ **退出全屏**：按 ESC 键 或 F11 或点击 ✕ 按钮
- **自适应屏幕**：游戏会自动适应不同尺寸的屏幕，保持最佳视觉效果

📖 详细的全屏使用说明请查看 [FULLSCREEN_GUIDE.md](FULLSCREEN_GUIDE.md)

## 📱 技术特性
- **Phaser.Scale.FIT**：使用 FIT 模式保持游戏宽高比
- **自动居中**：游戏内容始终在屏幕中央显示
- **响应式设计**：支持桌面和移动设备
- **Vite 热更新**：开发时实时预览更改

## License

[MIT License](http://opensource.org/licenses/MIT)
