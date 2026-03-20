# 🎮 Phaser 3 最优缩放配置方案

## 📋 核心配置总结

### 1. HTML + CSS（基础最优配置）

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>🐍 快乐贪吃蛇</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { overflow: hidden; background: #000; }
      #app, .game-container { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

### 2. Phaser 3 最优适配配置（核心）

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  
  // 👉 第一步：填入你的【固定设计尺寸】
  width: 1080,   
  height: 1920,

  // 👉 第二步：最优缩放配置
  scale: {
    mode: Phaser.Scale.ENVELOP,           // 🔥 沉浸式全屏（无黑边，推荐）
    // mode: Phaser.Scale.FIT,            // 安全全屏（无裁剪，有黑边）
    
    autoCenter: Phaser.Scale.CENTER_BOTH, // 自动居中
    expandParent: true,
    autoRound: true,                      // 画面清晰不模糊
    min: { width: 320, height: 480 },     // 最小尺寸限制
    max: { width: 3840, height: 2160 }    // 最大尺寸限制
  },

  parent: 'game',
  backgroundColor: '#1a1a2e',
  
  scene: { create }
}

new Phaser.Game(config)

function create() {
  // 👉 第三步：全屏按钮（沉浸式必备）
  const btn = this.add.text(900, 100, '全屏', { fontSize:40 })
    .setInteractive()
    .setScrollFactor(0) // UI 固定，不随场景移动

  btn.on('pointerdown', () => {
    this.scale.toggleFullscreen()
  })
}
```

---

## 🎯 三种缩放模式对比

| 模式 | 效果 | 适用场景 | 优点 | 缺点 |
|------|------|----------|------|------|
| **ENVELOP** | 沉浸式全屏 | ✅ 首选，适合所有游戏 | 无黑边，视觉体验最佳 | 边缘内容可能被裁剪 |
| **FIT** | 等比缩放 | 需要完整显示游戏区域 | 内容完整不变形 | 可能有黑边 |
| **STRETCH** | 拉伸填充 | 不推荐使用 | 填满屏幕 | 画面变形严重 |

---

## 📐 设计尺寸选择建议

### 竖屏游戏（如贪吃蛇）
```typescript
width: 1080   // 设计宽度
height: 1920  // 设计高度（16:9）
```

### 横屏游戏（如跑酷）
```typescript
width: 1920   // 设计宽度（16:9）
height: 1080  // 设计高度
```

### 正方形游戏（如棋类）
```typescript
width: 1080   // 设计宽度
height: 1080  // 设计高度（1:1）
```

---

## 🔧 关键参数说明

### `mode: Phaser.Scale.ENVELOP`
- **作用**: 沉浸式全屏，游戏画面会填满整个屏幕
- **原理**: 保持宽高比缩放，超出部分会被裁剪
- **适用**: 绝大多数 2D 游戏，特别是移动端游戏

### `autoCenter: Phaser.Scale.CENTER_BOTH`
- **作用**: 自动居中对齐
- **可选值**:
  - `CENTER_NONE`: 不居中
  - `CENTER_HORIZONTALLY`: 水平居中
  - `CENTER_VERTICALLY`: 垂直居中
  - `CENTER_BOTH`: 水平 + 垂直居中（推荐）

### `autoRound: true`
- **作用**: 像素取整，避免画面模糊
- **重要性**: ⭐⭐⭐⭐⭐ 必须开启，否则画面会发虚

### `min` / `max`
- **作用**: 限制缩放范围，防止极端设备下变形
- **建议**: 根据目标用户设备设置合理范围

---

## 💡 实战技巧

### 1. 获取游戏区域偏移量（ENVELOP 模式）
```typescript
private getGameAreaOffset(): { x: number; y: number } {
  if (!this.scene) return { x: 0, y: 0 }

  const gameWidth = this.scene.scale.gameSize.width
  const gameHeight = this.scene.scale.gameSize.height
  const actualGameWidth = this.gridSize * this.cellSize
  const actualGameHeight = this.gridSize * this.cellSize

  return {
    x: (gameWidth - actualGameWidth) / 2,
    y: (gameHeight - actualGameHeight) / 2
  }
}
```

### 2. 监听 resize 事件
```typescript
create() {
  // 监听 resize 事件
  this.scale.on('resize', this.handleResize.bind(this))
}

private handleResize(gameSize: Phaser.Structs.Size): void {
  console.log('🔄 窗口大小变化:', {
    gameWidth: gameSize.width,
    gameHeight: gameSize.height
  })
  
  // 重新绘制背景和 UI
  this.createBackground()
  this.createGrid()
}
```

### 3. 固定 UI 元素（不随场景滚动）
```typescript
create() {
  const scoreText = this.add.text(50, 50, '分数：0', { fontSize: 32 })
    .setScrollFactor(0) // 👈 关键：固定在屏幕上
  
  const fullscreenBtn = this.add.text(900, 50, '全屏', { fontSize: 32 })
    .setInteractive()
    .setScrollFactor(0)
    .on('pointerdown', () => {
      this.scale.toggleFullscreen()
    })
}
```

---

## ❌ 常见错误做法

### ❌ 错误 1：多套画布适配
```typescript
// 不要这样做！
if (window.innerWidth > 768) {
  config.width = 1920
  config.height = 1080
} else {
  config.width = 1080
  config.height = 1920
}
```

### ✅ 正确做法：一套设计尺寸走天下
```typescript
// 固定设计尺寸，Phaser 自动缩放
config.width = 1080
config.height = 1920
config.scale.mode = Phaser.Scale.ENVELOP
```

---

### ❌ 错误 2：手动计算缩放比例
```typescript
// 不要这样做！
const scale = Math.min(
  window.innerWidth / designWidth,
  window.innerHeight / designHeight
)
canvas.style.transform = `scale(${scale})`
```

### ✅ 正确做法：使用 Phaser 原生缩放
```typescript
// Phaser Scale Manager 已经帮你做好了
config.scale = {
  mode: Phaser.Scale.ENVELOP,
  autoCenter: Phaser.Scale.CENTER_BOTH
}
```

---

### ❌ 错误 3：使用 position: fixed 强行全屏
```css
/* 不要这样做！ */
#game {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
```

### ✅ 正确做法：让 Phaser 处理布局
```css
/* 只需基础样式 */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { overflow: hidden; background: #000; }
#game { width: 100vw; height: 100vh; }
```

---

## 🎓 最终总结（记住这 3 点就够了）

### 1️⃣ 最优设计方案
**固定 1 套设计尺寸 + Phaser 原生缩放 + 场景 UI 分层** = 全游戏通用

### 2️⃣ Phaser3 能力
**完全满足所有显示、适配、全屏需求**，Web 端 2D 游戏首选

### 3️⃣ 放弃错误思路
- ❌ 绝不做多套画布
- ❌ 绝不手动计算缩放
- ❌ 绝不手动适配尺寸
- ✅ **官方方案就是最优解**

---

## 🚀 快速开始模板

复制以下代码，修改设计尺寸即可开始你的游戏开发：

```typescript
import Phaser from 'phaser'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1080,   // 👈 修改为你的设计宽度
  height: 1920,  // 👈 修改为你的设计高度
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    autoRound: true,
    min: { width: 320, height: 480 },
    max: { width: 3840, height: 2160 }
  },
  parent: 'game',
  scene: {
    preload() {},
    create() {
      // 你的游戏逻辑
    },
    update() {}
  }
}

new Phaser.Game(config)
```

---

## 📚 扩展阅读

- [Phaser Scale Manager 官方文档](https://newdocs.phaser.io/docs/3.70.0/Phaser.Scale.ScaleManager)
- [Phaser 缩放模式详解](https://newdocs.phaser.io/docs/3.70.0/Phaser.Scale.ScaleModes)
- [ENVELOP vs FIT 模式选择](https://newdocs.phaser.io/docs/3.70.0/Phaser.Scale.ScaleModes.ENVELOP)

---

**最后提醒**：这是经过验证的最优方案，适用于所有 2D Web 游戏。不要重复造轮子，直接使用官方提供的最佳实践！
