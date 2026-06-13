# 游戏开发完整指南

基于贪吃蛇游戏克隆新游戏的详细步骤。

## 环境准备

```bash
# 安装依赖
cd kids-game-house/games/snake
npm install

# 启动开发服务器
npm run dev
```

## 第一步：复制参考游戏

```bash
# 从 snake 游戏复制
cp -r kids-game-house/games/snake kids-game-house/games/my-game

# 进入目录
cd kids-game-house/games/my-game
```

## 第二步：重命名项目

### 2.1 修改 package.json

```json
{
  "name": "@kids-game/my-game",
  "version": "1.0.0",
  "displayName": "我的游戏",
  "description": "这是一个新游戏"
}
```

### 2.2 修改 TypeScript 文件中的类名

需要重命名的类（使用 IDE 全局重命名）：
- `PhaserGame` → `MyGame`
- `ComponentGameScene` → `MyGameScene`

### 2.3 修改 Vue 组件名

- `SnakeStartView.vue` → `MyGameStartView.vue`
- `SnakeGameView.vue` → `MyGameGameView.vue`
- `SnakeDifficultyView.vue` → `MyGameDifficultyView.vue`
- `SnakeGameOverView.vue` → `MyGameGameOverView.vue`

## 第三步：修改 GTRS 配置

编辑 `src/config/GTRS.json`：

```json
{
  "specMeta": {
    "gameId": "my-game",
    "gameName": "我的游戏",
    "version": "1.0.0",
    "ownerType": "GAME",
    "ownerId": "my-game"
  },
  "themeInfo": {
    "themeName": "默认主题",
    "themeAuthor": "作者名"
  },
  "globalStyle": {
    "primaryColor": "#4CAF50",
    "backgroundColor": "#FFFFFF",
    "textColor": "#333333"
  },
  "resources": {
    "images": {
      "scene": {
        "background": "background.png"
      },
      "items": {}
    },
    "audio": {
      "bgm": {},
      "effect": {}
    }
  }
}
```

## 第四步：实现游戏逻辑

### 4.1 游戏配置 (src/phaser/game.ts)

```typescript
// 修改 GameConfig
export interface GameConfig {
  gridCols: number          // 网格列数
  gridRows: number          // 网格行数
  cellSize: number          // 单元格大小（会自动计算）
  initialSpeed: number      // 初始速度（毫秒）
  speedIncrement: number    // 每吃到食物的速度增量
  initialLives: number      // 初始生命数
}

// 修改 DIFFICULTY_CONFIGS
export const DIFFICULTY_CONFIGS: Record<string, GameConfig> = {
  easy: {
    gridCols: 15,
    gridRows: 12,
    cellSize: 40,
    initialSpeed: 300,
    speedIncrement: 5,
    initialLives: 3
  },
  normal: {
    gridCols: 20,
    gridRows: 15,
    cellSize: 40,
    initialSpeed: 200,
    speedIncrement: 3,
    initialLives: 3
  },
  hard: {
    gridCols: 25,
    gridRows: 18,
    cellSize: 40,
    initialSpeed: 150,
    speedIncrement: 2,
    initialLives: 2
  }
}
```

### 4.2 道具效果 (src/phaser/game.ts)

```typescript
// 在 ItemEffects 接口中添加新效果
export interface ItemEffects {
  speedUp: number      // 加速（毫秒减少）
  speedDown: number     // 减速（毫秒增加）
  shield: boolean       // 护盾
  magnet: boolean       // 磁铁
  // 添加新效果...
}
```

### 4.3 游戏场景 (src/scenes/ComponentGameScene.ts)

主要修改方法：
- `create()`: 初始化游戏对象
- `update()`: 游戏主循环
- `handleCollision()`: 碰撞检测
- `spawnItem()`: 生成道具

## 第五步：修改 UI 界面

### 5.1 开始界面 (src/views/StartView.vue)

```vue
<template>
  <div class="start-view">
    <h1>{{ t('myGame.title') || '我的游戏' }}</h1>
    <GameButton text="开始游戏" @click="handleStart" />
  </div>
</template>
```

### 5.2 游戏界面 (src/views/GameView.vue)

游戏主界面，通常不需要大幅修改，主要调整布局。

### 5.3 难度选择 (src/views/DifficultyView.vue)

```typescript
const difficulties = [
  { id: 'easy', label: '简单', description: '适合新手' },
  { id: 'normal', label: '普通', description: '适中挑战' },
  { id: 'hard', label: '困难', description: '高手专属' }
]
```

## 第六步：注册游戏

### 6.1 修改 register-game.sql

```sql
-- 修改游戏 ID 和名称
SET @GAME_ID = 'my-game';
SET @GAME_NAME = '我的游戏';
SET @GAME_CODE = 'MYGAME';
SET @GAME_EMOJI = '🎮';
```

### 6.2 执行 SQL

```bash
# 在数据库中执行
mysql -u root -p kidgame < register-game.sql
```

## 第七步：生成资源

编辑 `generate-resources.mjs` 中的游戏配置：

```javascript
const GAME_CONFIG = {
  gameId: 'my-game',
  gameName: '我的游戏',
  resources: {
    background: { type: 'color', color: '#87CEEB' },
    food: { type: 'emoji', emoji: '🍎' }
  }
}
```

然后运行：
```bash
node generate-resources.mjs
```

## 第八步：测试

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目文件清单

```
my-game/
├── public/
│   └── index.html
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── components/
│   │   ├── core/
│   │   │   └── IComponent.ts
│   │   ├── game/
│   │   │   └── PhaserGame.ts
│   │   └── ui/
│   │       ├── DifficultySelector.vue
│   │       ├── GameButton.vue
│   │       └── ScoreBoard.vue
│   ├── config/
│   │   ├── GTRS.json
│   │   └── difficulty.json
│   ├── locales/
│   │   ├── en.json
│   │   └── zh.json
│   ├── phaser/
│   │   ├── game.ts
│   │   └── PhaserGame.ts
│   ├── router/
│   │   └── index.ts
│   ├── scenes/
│   │   └── ComponentGameScene.ts
│   ├── stores/
│   │   └── game.ts
│   ├── types/
│   │   └── game.ts
│   ├── utils/
│   │   ├── gtrs-validator.ts
│   │   └── uiResponsive.ts
│   └── views/
│       ├── DifficultyView.vue
│       ├── GameOverView.vue
│       ├── GameView.vue
│       └── StartView.vue
├── register-game.sql
├── generate-resources.mjs
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 常见问题

### Q: 道具不生效？

检查 `ComponentGameScene.ts` 中的碰撞处理是否调用了 `onItemEffect` 回调。

### Q: 屏幕适配不生效？

确认 index.html 有 `viewport-fit=cover`，App.vue 有 `100vw/100vh`，Phaser config 用 `RESIZE` 模式。

### Q: 声音不播放？

确认音频文件在 `public/audio/` 目录，格式为 `.mp3`。

## 下一步

- 参考 [GTRS_GUIDE.md](./GTRS_GUIDE.md) 了解资源配置
- 查看 [贪吃蛇源码](kids-game-house/games/snake/) 获取更多实现细节
