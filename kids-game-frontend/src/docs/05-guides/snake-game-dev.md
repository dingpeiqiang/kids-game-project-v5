# 贪吃蛇游戏开发指南

## 🎮 游戏概览

贪吃蛇大冒险是基于 Phaser 3.80 + Vue 3 的 HTML5 游戏。

**技术栈**：
- 引擎：Phaser 3.80
- 框架：Vue 3 + TypeScript
- 构建：Vite
- 端口：3003

---

## 🚀 快速开始

### 安装依赖
```bash
cd kids-game-house/snake-vue3
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

---

## 📁 目录结构

```
snake-vue3/
├── src/
│   ├── components/
│   │   └── game/
│   │       └── PhaserGame.ts    # Phaser游戏主组件
│   ├── scenes/
│   │   ├── BootScene.ts        # 启动场景
│   │   ├── PreloadScene.ts     # 预加载场景
│   │   ├── MenuScene.ts        # 菜单场景
│   │   ├── GameScene.ts        # 游戏主场景
│   │   └── GameOverScene.ts    # 游戏结束场景
│   ├── configs/
│   │   └── ThemeConfig.ts      # 主题配置
│   └── main.ts                 # 入口文件
├── public/                      # 静态资源
├── package.json
└── vite.config.ts
```

---

## 🎯 核心配置

### Phaser 最优缩放配置

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1080,    // 设计宽度
  height: 1920,   // 设计高度
  
  scale: {
    mode: Phaser.Scale.ENVELOP,           // 沉浸式全屏
    autoCenter: Phaser.Scale.CENTER_BOTH,  // 自动居中
    expandParent: true,
    autoRound: true,                       // 高清渲染
    min: { width: 320, height: 480 },
    max: { width: 3840, height: 2160 }
  },
  
  parent: 'game',
  backgroundColor: '#1a1a2e',
  
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene]
}
```

### 设计尺寸选择

| 游戏类型 | 宽度 | 高度 | 说明 |
|----------|------|------|------|
| 竖屏游戏 | 1080 | 1920 | 贪吃蛇、跑酷等 |
| 横屏游戏 | 1920 | 1080 | 横向卷轴游戏 |
| 正方形 | 1080 | 1080 | 棋类、卡牌游戏 |

---

## 🛠️ 场景开发

### 场景生命周期

```typescript
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }
  
  // 1. 初始化（可选）
  init() {
    // 接收前一个场景传递的数据
  }
  
  // 2. 预加载（如需要）
  preload() {
    // 加载资源
  }
  
  // 3. 创建（必须）
  create() {
    // 初始化游戏元素
  }
  
  // 4. 更新（游戏循环）
  update() {
    // 游戏逻辑
  }
}
```

### UI 元素固定

```typescript
create() {
  // 分数文本（固定在左上角）
  const scoreText = this.add.text(50, 50, '分数：0', { 
    fontSize: 48 
  }).setScrollFactor(0)  // 关键：不随场景滚动
  
  // 全屏按钮
  const fullscreenBtn = this.add.text(950, 50, '⛶', { fontSize: 48 })
    .setInteractive()
    .setScrollFactor(0)
    .on('pointerdown', () => {
      this.scale.toggleFullscreen()
    })
}
```

### 监听窗口变化

```typescript
create() {
  // 监听 resize 事件
  this.scale.on('resize', this.handleResize.bind(this))
}

private handleResize(gameSize: Phaser.Structs.Size): void {
  console.log('窗口变化:', gameSize.width, 'x', gameSize.height)
  this.createBackground()
  this.createGrid()
}
```

---

## 🎨 主题系统集成

### 加载主题

```typescript
import { GTRSThemeLoader } from '@/shared/utils/GTRSThemeLoader'

async loadTheme(themeId: string) {
  const themeLoader = new GTRSThemeLoader()
  const theme = await themeLoader.loadTheme(themeId)
  return theme
}
```

### 应用主题资源

```typescript
create() {
  // 应用背景图片
  themeApplier.applyImageToSprite(this, 'background_img', 'background')
  
  // 应用全局样式
  themeApplier.applyGlobalStyleToDOM()
  
  // 播放背景音乐
  themeApplier.playAudio('bgm', 'bgm_main', { loop: true })
}
```

---

## 🔧 调试技巧

### 查看实时尺寸

```typescript
create() {
  console.log('游戏尺寸:', {
    gameSize: `${this.scale.gameSize.width} × ${this.scale.gameSize.height}`,
    displaySize: `${this.scale.displaySize.width} × ${this.scale.displaySize.height}`
  })
}
```

### FPS 显示

```typescript
update() {
  if (this.debugText) {
    this.debugText.setText([
      `FPS: ${this.game.loop.actualFps}`,
      `Canvas: ${this.scale.gameSize.width} × ${this.scale.gameSize.height}`
    ])
  }
}
```

---

## ❌ 常见问题

### Q1: 画面模糊？
**A:** 确保开启 `autoRound: true`

```typescript
scale: {
  autoRound: true  // 必须开启
}
```

### Q2: 有黑边？
**A:** 切换到 `ENVELOP` 模式

```typescript
scale: {
  mode: Phaser.Scale.ENVELOP  // 无黑边
}
```

### Q3: 横屏游戏怎么适配？
**A:** 修改设计尺寸

```typescript
width: 1920,   // 横屏宽度
height: 1080   // 横屏高度
```

---

## 📚 相关文档

- [Phaser 3 最优配置方案](./phaser-best-practice.md)
- [主题资源模板规范](./theme-resource-spec.md)
- [GTRS 游戏集成指南](./gtrs-integration.md)

---

**最后更新**: 2026-03-20
