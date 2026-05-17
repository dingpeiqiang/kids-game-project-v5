# 🚀 Flappy Bird 快速启动指南

## ⚡ 30秒快速开始

### 1️⃣ 安装依赖（首次运行）
```bash
npm install
```

### 2️⃣ 启动游戏
```bash
npm run dev
```

### 3️⃣ 开始玩耍
浏览器会自动打开 http://localhost:10002

---

## 🎮 游戏控制

| 操作 | 方式 |
|------|------|
| **让小鸟飞** | 点击屏幕 或 按空格键/上箭头 |
| **全屏模式** | 💻 **PC 推荐：按 F11 键**（最可靠）<br>🖱️ 备选：点击右上角 ⛶ 按钮 |
| **退出全屏** | 按 ESC 键 或 F11 或点击 ✕ 按钮 |
| **重新开始** | 游戏结束后点击重启按钮 |

> 💡 **提示：** PC 端特别是横向显示器，强烈建议使用 **F11 键**进行全屏，这是最稳定可靠的方式！

---

## 📱 屏幕自适应特性

✅ **自动适配所有屏幕尺寸**
- 桌面电脑（1920x1080, 1366x768, 2560x1440...）
- 平板电脑（iPad, Android 平板）
- 手机设备（iPhone, Android 手机）

✅ **保持游戏比例**
- 原始比例 288:512 始终保持
- 游戏不会变形或拉伸
- 自动居中对齐

✅ **响应式布局**
- 窗口大小改变时自动调整
- 横屏/竖屏都支持
- 触摸操作流畅

---

## 🛠️ 常用命令

```bash
# 开发模式（带热更新）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试脚本
node test-adaptation.js
```

---

## 📂 项目结构

```
flappy-bird/
├── assets/              # 游戏资源（图片）
├── css/                 # 样式文件
├── js/
│   └── game.js         # 游戏主逻辑
├── index.html          # HTML 入口
├── package.json        # 项目配置
├── vite.config.js      # Vite 配置
├── README.md           # 项目说明
├── SCREEN_ADAPTATION.md # 技术文档
├── OPTIMIZATION_REPORT.md # 优化报告
└── test-adaptation.js  # 测试脚本
```

---

## 🎯 核心功能

### 1. Vite 开发环境
- ⚡ 极速启动（< 200ms）
- 🔥 热模块替换（HMR）
- 📦 优化的构建输出
- 🌐 自动打开浏览器

### 2. 屏幕自适应
- 📐 Phaser.Scale.FIT 模式
- 🎯 自动居中（CENTER_BOTH）
- 📱 支持所有设备
- 🔄 动态响应窗口变化

### 3. 全屏体验
- 🔲 一键全屏切换
- 🌍 跨浏览器兼容
- ✨ 优雅的 UI 设计
- ⌨️ 键盘快捷键支持

---

## 🔧 自定义配置

### 修改端口
编辑 `vite.config.js`：
```javascript
server: {
    port: 3000,  // 改为你想要的端口
}
```

### 修改游戏尺寸
编辑 `js/game.js`：
```javascript
const configurations = {
    width: 288,   // 游戏宽度
    height: 512,  // 游戏高度
    // ...
}
```

### 更改缩放模式
编辑 `js/game.js`：
```javascript
scale: {
    mode: Phaser.Scale.FIT,      // FIT / ENVELOP / STRETCH / NONE
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // ...
}
```

---

## 🐛 常见问题

### Q: 游戏无法加载？
A: 确保已运行 `npm install` 安装依赖

### Q: 端口被占用？
A: Vite 会自动尝试下一个可用端口，或修改 `vite.config.js` 中的端口

### Q: 全屏按钮不显示？
A: 清除浏览器缓存并刷新页面（Ctrl+F5）

### Q: 移动端无法触摸？
A: 检查是否有浏览器扩展阻止了触摸事件

### Q: 游戏画面模糊？
A: 这是正常的，Phaser 会自动处理高 DPI 屏幕

---

## 📚 更多文档

- [README.md](README.md) - 项目总览
- [SCREEN_ADAPTATION.md](SCREEN_ADAPTATION.md) - 详细技术说明
- [OPTIMIZATION_REPORT.md](OPTIMIZATION_REPORT.md) - 优化报告

---

## 🎉 享受游戏！

现在你可以：
1. 在不同设备上测试游戏
2. 体验流畅的全屏模式
3. 观察自适应效果
4. 享受经典的 Flappy Bird 玩法

祝玩得开心！🎮✨
