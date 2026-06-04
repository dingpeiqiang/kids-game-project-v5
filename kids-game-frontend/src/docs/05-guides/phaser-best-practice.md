# Phaser 3 最优配置方案

## 🎯 核心原则

✅ **三要**
1. 使用固定设计尺寸
2. 使用 Phaser 原生缩放（ENVELOP）
3. 使用 `setScrollFactor(0)` 固定 UI

❌ **三不要**
1. 不要手动计算缩放比例
2. 不要做多套画布适配
3. 不要用 CSS transform 强行缩放

---

## 📋 核心配置

### HTML + CSS

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>游戏标题</title>
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

### Phaser 3 最优配置

```typescript
import Phaser from 'phaser'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  
  // 固定设计尺寸
  width: 1080,   
  height: 1920,

  scale: {
    mode: Phaser.Scale.ENVELOP,           // 沉浸式全屏（无黑边）
    autoCenter: Phaser.Scale.CENTER_BOTH,  // 自动居中
    expandParent: true,
    autoRound: true,                      // 高清渲染
    min: { width: 320, height: 480 },
    max: { width: 3840, height: 2160 }
  },

  parent: 'game',
  backgroundColor: '#1a1a2e',
  
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  
  scene: { preload, create, update }
}

new Phaser.Game(config)
```

---

## 🔄 三种缩放模式对比

| 模式 | 效果 | 适用场景 | 优点 | 缺点 |
|------|------|----------|------|------|
| **ENVELOP** | 沉浸式全屏 | ✅ 首选 | 无黑边，视觉最佳 | 边缘可能被裁剪 |
| **FIT** | 等比缩放 | 需要完整显示 | 内容完整不变形 | 可能有黑边 |
| **STRETCH** | 拉伸填充 | 不推荐 | 填满屏幕 | 画面变形 |

---

## 📐 设计尺寸参考

| 游戏类型 | 宽度 | 高度 | 说明 |
|----------|------|------|------|
| 竖屏游戏 | 1080 | 1920 | 贪吃蛇、跑酷等 |
| 横屏游戏 | 1920 | 1080 | 横向卷轴游戏 |
| 正方形 | 1080 | 1080 | 棋类、卡牌游戏 |
| 平板优化 | 1536 | 2048 | 适配 iPad |

---

## 💡 实战技巧

### 1. 全屏按钮

```typescript
create() {
  const btn = this.add.text(900, 100, '全屏', { fontSize: 40 })
    .setInteractive()
    .setScrollFactor(0)
    
  btn.on('pointerdown', () => {
    this.scale.toggleFullscreen()
  })
}
```

### 2. 监听窗口变化

```typescript
create() {
  this.scale.on('resize', this.handleResize.bind(this))
}

private handleResize(gameSize: Phaser.Structs.Size): void {
  console.log('窗口变化:', gameSize.width, 'x', gameSize.height)
  this.createBackground()
}
```

### 3. 获取游戏区域偏移

```typescript
private getGameAreaOffset(): { x: number; y: number } {
  const gameWidth = this.scale.gameSize.width
  const gameHeight = this.scale.gameSize.height
  const actualGameWidth = this.gridSize * this.cellSize
  const actualGameHeight = this.gridSize * this.cellSize

  return {
    x: (gameWidth - actualGameWidth) / 2,
    y: (gameHeight - actualGameHeight) / 2
  }
}
```

### 4. 固定 UI 元素

```typescript
create() {
  const scoreText = this.add.text(50, 50, '分数：0', { fontSize: 32 })
    .setScrollFactor(0)  // 固定在屏幕上
}
```

---

## ❌ 常见错误

### ❌ 错误：多套画布适配
```typescript
// 不要这样做！
if (window.innerWidth > 768) {
  config.width = 1920
} else {
  config.width = 1080
}
```

### ✅ 正确：一套设计尺寸
```typescript
// Phaser 自动缩放
config.width = 1080
config.height = 1920
config.scale.mode = Phaser.Scale.ENVELOP
```

### ❌ 错误：手动计算缩放
```typescript
// 不要这样做！
const scale = Math.min(
  window.innerWidth / designWidth,
  window.innerHeight / designHeight
)
canvas.style.transform = `scale(${scale})`
```

### ✅ 正确：使用 Phaser 原生缩放
```typescript
config.scale = {
  mode: Phaser.Scale.ENVELOP,
  autoCenter: Phaser.Scale.CENTER_BOTH
}
```

---

## 📚 官方文档

- [Phaser Scale Manager](https://newdocs.phaser.io/docs/3.70.0/Phaser.Scale.ScaleManager)
- [Phaser 缩放模式](https://newdocs.phaser.io/docs/3.70.0/Phaser.Scale.ScaleModes)

---

**最后更新**: 2026-03-20
