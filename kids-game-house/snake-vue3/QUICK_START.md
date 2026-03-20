# 🚀 Phaser 3 最优配置 - 快速上手指南

## ✅ 已完成的配置（开箱即用）

你的贪吃蛇游戏已经应用了 **Phaser 3 最优缩放配置**，现在它是：

- ✨ **沉浸式全屏**（ENVELOP 模式，无黑边）
- 📐 **固定设计尺寸**（1080×1920，可调整）
- 🎯 **自动居中**（CENTER_BOTH）
- 🔍 **高清渲染**（autoRound: true）
- 📱 **移动端友好**（min/max 限制保护）

---

## 🎮 如何修改设计尺寸

如果你想修改设计尺寸（不是画布大小，而是你的游戏设计稿尺寸），只需修改这一处：

```typescript
// src/components/game/PhaserGame.ts

export class SnakePhaserGame {
  // 👇 修改这里的设计尺寸
  private designWidth: number = 1080   // 设计宽度
  private designHeight: number = 1920  // 设计高度
  
  // ... 其他代码保持不变
}
```

### 常见设计尺寸推荐

| 游戏类型 | 宽度 | 高度 | 说明 |
|---------|------|------|------|
| 竖屏游戏 | 1080 | 1920 | ✅ 当前配置（贪吃蛇、跑酷等） |
| 横屏游戏 | 1920 | 1080 | 适合横向卷轴游戏 |
| 正方形 | 1080 | 1080 | 适合棋类、卡牌游戏 |
| 平板优化 | 1536 | 2048 | 适配 iPad 等平板设备 |

---

## 🎨 UI 元素适配技巧

### 方法 1：使用 setScrollFactor(0) 固定 UI

```typescript
create() {
  // 分数文本（固定在左上角）
  const scoreText = this.add.text(50, 50, '分数：0', { 
    fontSize: 48,
    fontFamily: 'Arial'
  }).setScrollFactor(0) // 👈 关键：不随场景滚动
  
  // 全屏按钮（固定在右上角）
  const fullscreenBtn = this.add.text(950, 50, '⛶', { 
    fontSize: 48 
  })
    .setInteractive()
    .setScrollFactor(0)
    .on('pointerdown', () => {
      this.scale.toggleFullscreen()
    })
}
```

### 方法 2：使用 Container 管理 UI 层

```typescript
create() {
  // 创建 UI 容器
  const uiContainer = this.add.container(0, 0)
  
  const scoreText = this.add.text(50, 50, '分数：0', { fontSize: 48 })
  const pauseBtn = this.add.text(950, 50, '⏸️', { fontSize: 48 })
    .setInteractive()
  
  uiContainer.add([scoreText, pauseBtn])
  
  // 固定 UI 容器
  uiContainer.setScrollFactor(0)
}
```

---

## 📱 全屏功能实现

### 浏览器全屏 API（推荐）

```typescript
// 在 Vue 组件中
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('全屏失败:', err)
    })
  } else {
    document.exitFullscreen()
  }
}
```

### Phaser 内置全屏

```typescript
// 在 Phaser 场景中
const btn = this.add.text(950, 50, '⛶', { fontSize: 48 })
  .setInteractive()
  .setScrollFactor(0)
  .on('pointerdown', () => {
    this.scale.toggleFullscreen() // Phaser API
  })
```

---

## 🔧 调试技巧

### 1. 查看实时画布尺寸

```typescript
create() {
  console.log('📏 游戏画布尺寸:', {
    gameSize: `${this.scale.gameSize.width} × ${this.scale.gameSize.height}`,
    baseSize: `${this.scale.baseSize.width} × ${this.scale.baseSize.height}`,
    displaySize: `${this.scale.displaySize.width} × ${this.scale.displaySize.height}`
  })
  
  // 监听 resize
  this.scale.on('resize', (gameSize) => {
    console.log('🔄 窗口变化:', gameSize.width, '×', gameSize.height)
  })
}
```

### 2. 显示调试信息

```typescript
update() {
  // 在屏幕上显示当前 FPS 和画布尺寸
  if (this.debugText) {
    this.debugText.setText([
      `FPS: ${this.game.loop.actualFps}`,
      `Canvas: ${this.scale.gameSize.width} × ${this.scale.gameSize.height}`,
      `Design: 1080 × 1920`
    ])
  }
}
```

---

## ❓ 常见问题解答

### Q1: 为什么我的游戏画面模糊？
**A:** 确保开启了 `autoRound: true`
```typescript
scale: {
  autoRound: true // 👈 必须开启
}
```

### Q2: 为什么有黑边？
**A:** 你使用的是 `FIT` 模式，切换到 `ENVELOP` 模式
```typescript
scale: {
  mode: Phaser.Scale.ENVELOP // 👈 沉浸式无黑边
}
```

### Q3: 如何让游戏在不同设备上保持清晰？
**A:** 使用足够大的设计尺寸 + `autoRound: true`
```typescript
width: 1080,    // 或更大（如 1440）
height: 1920,
scale: {
  autoRound: true
}
```

### Q4: 横屏游戏怎么适配？
**A:** 修改设计尺寸为横向（如 1920×1080），其他配置不变
```typescript
width: 1920,   // 横屏宽度
height: 1080,  // 横屏高度
```

### Q5: 如何禁止用户缩放页面？
**A:** 在 HTML 中添加 meta 标签
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

---

## 🎯 核心原则（再次强调）

✅ **三要**
1. 要使用固定设计尺寸
2. 要使用 Phaser 原生缩放（ENVELOP）
3. 要使用 `setScrollFactor(0)` 固定 UI

❌ **三不要**
1. 不要手动计算缩放比例
2. 不要做多套画布适配
3. 不要用 CSS transform 强行缩放

---

## 📦 完整配置示例

```typescript
import Phaser from 'phaser'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  
  // 设计尺寸（根据游戏类型选择）
  width: 1080,   
  height: 1920,

  scale: {
    mode: Phaser.Scale.ENVELOP,           // 沉浸式全屏
    autoCenter: Phaser.Scale.CENTER_BOTH, // 自动居中
    expandParent: true,
    autoRound: true,                      // 高清渲染
    min: { width: 320, height: 480 },     // 最小尺寸
    max: { width: 3840, height: 2160 }    // 最大尺寸
  },

  parent: 'game',
  backgroundColor: '#1a1a2e',
  
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  
  scene: {
    preload() {},
    create() {
      // 固定 UI
      this.add.text(50, 50, '分数：0', { fontSize: 48 })
        .setScrollFactor(0)
      
      // 全屏按钮
      this.add.text(950, 50, '⛶', { fontSize: 48 })
        .setInteractive()
        .setScrollFactor(0)
        .on('pointerdown', () => {
          this.scale.toggleFullscreen()
        })
    },
    update() {}
  }
}

new Phaser.Game(config)
```

---

## 🎉 恭喜！

你的游戏现在已经使用了 **业界最优的 Phaser 缩放方案**：

- ✅ 所有设备自动适配
- ✅ 画面清晰无模糊
- ✅ 沉浸式体验无黑边
- ✅ 一套代码走天下

**接下来只需专注于游戏逻辑开发即可！** 🚀
