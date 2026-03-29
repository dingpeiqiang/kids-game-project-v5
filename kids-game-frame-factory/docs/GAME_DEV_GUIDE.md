# 游戏开发完整指南

基于 frame-factory 模板创建新游戏的完整步骤。

## 环境准备

```bash
# 克隆或进入项目目录
cd kids-game-project-v5
```

## 第一步：从模板初始化

```bash
# 复制游戏模板
cp -r kids-game-frame-factory/templates/game-template games/my-game

# 进入目录
cd games/my-game

# 安装依赖
npm install
```

## 第二步：全局重命名

使用 IDE 重构工具，将以下内容重命名：

### 2.1 修改 package.json

```json
{
  "name": "@kids-game/my-game",
  "version": "1.0.0",
  "displayName": "我的游戏",
  "description": "这是一个新游戏"
}
```

### 2.2 修改类名（IDE 全局重命名）

- `PhaserGame` → `MyGame`
- `GameScene` → `MyGameScene`

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

### 4.1 修改难度配置

编辑 `src/config/difficulty.json`：

```json
{
  "difficulties": [
    { "id": "easy", "label": "简单", "gridCols": 15, "gridRows": 12, "speed": 300 },
    { "id": "normal", "label": "普通", "gridCols": 20, "gridRows": 15, "speed": 200 },
    { "id": "hard", "label": "困难", "gridCols": 25, "gridRows": 18, "speed": 150 }
  ]
}
```

### 4.2 实现游戏场景

编辑 `src/scenes/GameScene.ts`，重写以下方法：

```typescript
export class GameScene extends Phaser.Scene {
  // ⚠️ 必须重写

  /**
   * 创建游戏对象
   * 在这里创建玩家、敌人、道具等
   */
  protected createGameObjects(): void {
    // TODO: 实现
  }

  /**
   * 更新游戏逻辑
   * 每帧调用，处理游戏逻辑
   */
  protected updateGame(time: number, delta: number): void {
    // TODO: 实现
  }

  /**
   * 检测碰撞
   */
  protected checkCollisions(): void {
    // TODO: 实现
  }

  /**
   * 处理游戏结束
   */
  protected handleGameOver(): void {
    // TODO: 实现
  }
}
```

### 4.3 参考实现

参考 `kids-game-house/games/snake/` 的实现方式：

- `src/scenes/ComponentGameScene.ts` - 游戏场景实现
- `src/components/logic/` - 游戏逻辑组件
- `src/components/rendering/` - 游戏渲染组件

**注意**：参考不等于复制！阅读理解后用自己的代码实现。

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
mysql -u root -p kids_game < register-game.sql
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
├── src/
│   ├── App.vue              # 游戏主应用
│   ├── main.ts             # 入口文件
│   ├── config/
│   │   ├── GTRS.json       # 主题资源配置
│   │   ├── difficulty.json # 难度配置
│   │   └── game-config.json # 游戏参数
│   ├── views/
│   │   ├── StartView.vue      # 开始界面
│   │   ├── DifficultyView.vue # 难度选择
│   │   ├── GameView.vue       # 游戏界面
│   │   └── GameOverView.vue   # 结束界面
│   ├── components/
│   │   ├── game/
│   │   │   └── PhaserGame.vue # 游戏容器
│   │   └── ui/
│   │       ├── GameButton.vue
│   │       ├── ScorePanel.vue
│   │       ├── DifficultySelector.vue
│   │       └── PauseButton.vue
│   ├── scenes/
│   │   └── GameScene.ts       # 游戏场景 ⚠️ 需重写
│   └── stores/
│       ├── game.ts            # 游戏状态
│       ├── audio.ts          # 音频管理
│       ├── theme.ts          # 主题管理
│       └── settings.ts       # 设置管理
├── register-game.sql
├── generate-resources.mjs
├── package.json
└── vite.config.ts
```

## 常见问题

### Q: 道具不生效？

检查 `GameScene.ts` 中的碰撞处理是否调用了道具效果回调。

### Q: 屏幕适配不生效？

确认 index.html 有 `viewport-fit=cover`，App.vue 有 `100vw/100vh`，Phaser config 用 `RESIZE` 模式。

### Q: 声音不播放？

确认音频文件在 `public/audio/` 目录，格式为 `.mp3`。

## 不再从 snake 复制

**⚠️ 重要**：不再使用 `cp -r kids-game-house/games/snake` 的方式创建新游戏！

原因：
1. 复制 snake 会导致 snake 特定的逻辑残留
2. 需要大量重命名工作，容易出错
3. 新游戏会继承 snake 的"味道"，不纯净

新方式：
- 从 `game-template` 模板初始化
- 游戏逻辑从零开始编写（或参考 snake）
- 保证新游戏代码纯净

## 下一步

- 参考 [GTRS_GUIDE.md](./GTRS_GUIDE.md) 了解资源配置
- 参考 [CHECKLIST.md](./CHECKLIST.md) 进行开发检查
- 查看 [贪吃蛇源码](../kids-game-house/games/snake/) 获取更多实现细节
