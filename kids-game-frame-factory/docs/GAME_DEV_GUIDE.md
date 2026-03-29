# 游戏开发完整指南

基于 frame-factory 模板创建新游戏的完整步骤。

---

## 准备工作

确认已安装：
- Node.js >= 18
- npm >= 9
- 编辑器（推荐 VS Code）

---

## 第一步：初始化游戏

### 推荐：使用脚本（自动完成所有准备工作）

```powershell
# Windows
.\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-puzzle -GameName 拼图游戏

# macOS/Linux
bash kids-game-frame-factory/scripts/init-game.sh my-puzzle 拼图游戏
```

### 手动方式

```bash
# 复制模板
cp -r kids-game-frame-factory/templates/game-template kids-game-house/games/my-puzzle

# 进入目录并安装依赖
cd kids-game-house/games/my-puzzle
npm install
```

手动方式需要将文件中的 `__GAME_ID__` 替换为你的游戏 ID，`__GAME_NAME__` 替换为游戏名称。

---

## 第二步：修改配置文件

### 2.1 GTRS.json - 主题资源配置

位置：`src/config/GTRS.json`

```json
{
  "specMeta": {
    "schemaVersion": "1.0.0",
    "gameId": "my-puzzle",
    "gameType": "my-puzzle"
  },
  "themeInfo": {
    "themeId": "my-puzzle_default",
    "themeName": "拼图游戏",
    "isDefault": true
  },
  "globalStyle": {
    "primaryColor": "#4ade80",
    "bgColor": "#1a1a2e"
  },
  "resources": {
    "images": {
      "scene": {
        "tile": { "src": "/images/my-puzzle/tile.png" },
        "background": { "src": "/images/my-puzzle/bg.png" }
      }
    },
    "audio": {
      "bgm": {
        "bgm_main": { "src": "/audio/my-puzzle/bgm.mp3" }
      },
      "effect": {
        "effect_match": { "src": "/audio/my-puzzle/match.mp3" },
        "effect_gameover": { "src": "/audio/my-puzzle/gameover.mp3" }
      }
    }
  }
}
```

### 2.2 difficulty.json - 难度配置

位置：`src/config/difficulty.json`

```json
{
  "difficulties": [
    {
      "id": "easy",
      "label": "简单",
      "description": "4×4 棋盘，适合新手",
      "gridCols": 4,
      "gridRows": 4,
      "speed": 300,
      "scoreMultiplier": 1.0
    },
    {
      "id": "normal",
      "label": "普通",
      "description": "5×5 棋盘，一般挑战",
      "gridCols": 5,
      "gridRows": 5,
      "speed": 200,
      "scoreMultiplier": 1.5
    },
    {
      "id": "hard",
      "label": "困难",
      "description": "6×6 棋盘，高手专属",
      "gridCols": 6,
      "gridRows": 6,
      "speed": 150,
      "scoreMultiplier": 2.0
    }
  ]
}
```

### 2.3 game-config.json - 游戏参数

位置：`src/config/game-config.json`

```json
{
  "gameId": "my-puzzle",
  "gameName": "拼图游戏",
  "version": "1.0.0",
  "grid": {
    "baseCellSize": 80
  },
  "gameplay": {
    "initialLives": 3
  }
}
```

---

## 第三步：实现游戏场景

核心工作：编辑 `src/scenes/GameScene.ts`

### 基本框架

```typescript
import Phaser from 'phaser'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import GameScene from './GameScene'  // 继承模板基类

export default class MyPuzzleScene extends GameScene {
  // 游戏专有属性
  private board: number[][] = []
  private tileGroup!: Phaser.GameObjects.Group
  
  // ─── 1. 加载资源 ───────────────────────────────────────────
  preload(): void {
    const themeStore = useThemeStore()
    
    const tileImg = themeStore.getImageUrl('tile')
    if (tileImg) this.load.image('tile', tileImg)
    
    const bgm = themeStore.getAudioUrl('bgm_main', 'bgm')
    if (bgm) this.load.audio('bgm_main', bgm)
  }

  // ─── 2. 创建游戏对象 ────────────────────────────────────────
  create(): void {
    super.create()  // ⚠️ 必须调用
    
    this.tileGroup = this.add.group()
    this.createBoard()
    this.setupInput()
  }
  
  // ─── 3. 游戏主循环 ──────────────────────────────────────────
  protected gameLoop(time: number, delta: number): void {
    this.updateAnimations(delta)
    this.checkWinCondition()
  }
  
  // ─── 4. 游戏结束 ────────────────────────────────────────────
  protected handleGameOver(): void {
    // 播放结束音效
    const themeStore = useThemeStore()
    const effectSrc = themeStore.getAudioUrl('effect_gameover', 'effect')
    if (effectSrc) this.sound.play('effect_gameover')
    
    // 触发父类流程（延迟通知 Vue）
    super.handleGameOver()
  }
  
  // ─── 私有方法 ───────────────────────────────────────────────
  private createBoard(): void {
    // 使用基类提供的适配参数
    // this.cellSize - 格子大小
    // this.offsetX / this.offsetY - 游戏区域偏移
    // this.gridCols / this.gridRows - 网格尺寸
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const { x, y } = this.gridToPixelCenter(col, row)
        const tile = this.add.image(x, y, 'tile')
        tile.setDisplaySize(this.cellSize - 4, this.cellSize - 4)
        this.tileGroup.add(tile)
      }
    }
  }
  
  private setupInput(): void {
    this.input.on('pointerdown', this.handleTap, this)
  }
  
  private handleTap(pointer: Phaser.Input.Pointer): void {
    // 点击位置转网格坐标
    const col = Math.floor((pointer.x - this.offsetX) / this.cellSize)
    const row = Math.floor((pointer.y - this.offsetY) / this.cellSize)
    
    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
      this.addScore(10)  // 加分（会自动应用难度倍率）
    }
  }
  
  private checkWinCondition(): void {
    if (this.score >= 1000) {
      this.handleGameOver()
    }
  }
  
  private updateAnimations(_delta: number): void {
    // 更新动画
  }
}
```

### 关键 API 速查

```typescript
// ─── 继承自 GameScene 基类 ───────────────────────────────────

// 屏幕适配参数（initAdapt() 自动计算）
this.screenW      // 屏幕宽度
this.screenH      // 屏幕高度
this.cellSize     // 格子像素大小
this.offsetX      // 游戏区域 X 偏移
this.offsetY      // 游戏区域 Y 偏移
this.gridCols     // 网格列数（来自难度配置）
this.gridRows     // 网格行数（来自难度配置）

// 坐标转换
this.gridToPixel(col, row)       // → { x, y }  左上角
this.gridToPixelCenter(col, row) // → { x, y }  中心

// 分数（自动应用难度倍率，并触发 'score' 事件）
this.addScore(10)

// 游戏结束（触发 Vue 流程）
this.handleGameOver()

// 暂停/恢复
this.pauseGame()
this.resumeGame()

// ─── Phaser 标准 API ─────────────────────────────────────────
this.add.image(x, y, 'key')
this.add.rectangle(x, y, w, h, color)
this.add.text(x, y, 'Hello', { fontSize: '16px' })
this.physics.add.sprite(x, y, 'key')
this.time.delayedCall(500, callback)
this.tweens.add({ targets, ... })
this.sound.play('key')
```

---

## 第四步：修改 UI 界面

### 4.1 开始界面 (StartView.vue)

```vue
<template>
  <div class="start-view">
    <h1>拼图游戏 🧩</h1>
    <GameButton text="开始游戏" size="large" @click="$emit('start')" />
  </div>
</template>
```

### 4.2 游戏结束界面 (GameOverView.vue)

`GameOverView.vue` 已内置分数展示，通常只需修改标题文字和样式。

---

## 第五步：添加资源文件

将图片放到 `public/images/my-puzzle/`，音频放到 `public/audio/my-puzzle/`：

```
public/
├── images/
│   └── my-puzzle/
│       ├── tile.png
│       └── bg.png
└── audio/
    └── my-puzzle/
        ├── bgm.mp3
        └── match.mp3
```

---

## 第六步：注册游戏到数据库

编辑 `register-game.sql`（占位符已被初始化脚本自动替换），检查内容后执行：

```bash
mysql -u root -p kids_game < register-game.sql
```

---

## 第七步：开发与调试

```bash
# 启动开发服务器
npm run dev
# 访问 http://localhost:5173

# 类型检查
npx tsc --noEmit

# 构建
npm run build
```

---

## 常见问题

### Q: Phaser 场景事件不触发？

确认 `GameScene.ts` 中调用了 `this.game.events.emit('ready')`，且 `PhaserGame.vue` 监听了正确的事件名。

### Q: 图片不显示？

1. 检查图片是否在 `public/` 目录
2. 检查 GTRS.json 的 `src` 路径（不含 `/public/` 前缀，从 `/` 开始）
3. 确认 `preload()` 中调用了 `this.load.image()`

### Q: 分数不更新？

`GameScene.addScore()` 会触发 `this.game.events.emit('score', this.score)`，`PhaserGame.vue` 会调用 `gameStore.setScore()`。确认 `GameView.vue` 使用 `gameStore.score` 而不是本地变量。

### Q: 屏幕适配不正确？

确认：
1. `index.html` 有 `viewport-fit=cover`
2. `App.vue` 的 `.game-app` 是 `width: 100vw; height: 100vh; overflow: hidden`
3. Phaser 使用 `Scale.RESIZE` 模式
4. 在 `create()` 中调用了 `super.create()`

### Q: 暂停弹窗不出现？

`GameView.vue` 监听 `PhaserGame.vue` 的 `@paused` 事件，`PhaserGame.vue` 监听 `phaserGame.events.on('paused')`，`GameScene.pauseGame()` 触发 `this.game.events.emit('paused')`。确认事件链完整。

---

## 下一步

- 查看 [GTRS_GUIDE.md](./GTRS_GUIDE.md) 了解资源配置规范
- 查看 [CHECKLIST.md](./CHECKLIST.md) 进行发布前检查
- 参考贪吃蛇源码：`kids-game-house/games/snake/src/scenes/ComponentGameScene.ts`
