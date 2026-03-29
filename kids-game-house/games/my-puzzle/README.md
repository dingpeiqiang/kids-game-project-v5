# 游戏模板

**重要**：这是游戏项目的模板，复制后游戏完全独立，不依赖任何外部模块。

---

## 复制后需要做的事

### 1. 全局重命名

使用 IDE 的重构工具，将以下内容重命名：

- 目录名：`my-game` → `your-game-name`
- `package.json` 中的 `name`
- `App.vue` 组件名
- `src/config/game-config.json` 中的 `gameId`

### 2. 配置游戏

#### GTRS.json - 主题资源配置

```json
{
  "specMeta": {
    "version": "1.0.0",
    "gameId": "your-game-id"
  },
  "themeInfo": {
    "name": "游戏主题名称",
    "ownerType": "GAME",
    "ownerId": "your-game-id"
  },
  "globalStyle": {
    "backgroundColor": "#1a1a2e",
    "gridColor": "#16213e"
  },
  "resources": {
    "images": {
      "scene": {}
    },
    "audio": {
      "bgm": {},
      "effect": {}
    }
  }
}
```

#### difficulty.json - 难度配置

```json
{
  "levels": {
    "easy": {
      "label": "简单",
      "speed": 2,
      "scoreMultiplier": 1.0
    },
    "medium": {
      "label": "中等",
      "speed": 3,
      "scoreMultiplier": 1.5
    },
    "hard": {
      "label": "困难",
      "speed": 4,
      "scoreMultiplier": 2.0
    }
  },
  "defaultLevel": "medium"
}
```

### 3. 实现游戏逻辑

重写 `src/scenes/GameScene.ts`：

```typescript
export class GameScene extends Phaser.Scene {
  // ============ 生命周期 ============

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 初始化游戏
    this.createGameObjects();
    this.setupInput();
    this.setupUI();
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;
    this.updateGame(time, delta);
  }

  // ============ 需要重写的方法 ============

  /**
   * 创建游戏对象
   * 在这里创建游戏中的所有对象（玩家、敌人、道具等）
   */
  protected createGameObjects(): void {
    // TODO: 实现游戏对象创建
  }

  /**
   * 更新游戏逻辑
   * 每帧调用，处理游戏逻辑
   * @param time 游戏运行时间
   * @param delta 帧间隔（毫秒）
   */
  protected updateGame(time: number, delta: number): void {
    // TODO: 实现游戏逻辑更新
  }

  /**
   * 检测碰撞
   * 处理游戏对象之间的碰撞
   */
  protected checkCollisions(): void {
    // TODO: 实现碰撞检测
  }

  /**
   * 渲染游戏
   * 绘制游戏画面
   */
  protected renderGame(): void {
    // TODO: 实现游戏渲染
  }

  /**
   * 处理游戏结束
   */
  protected handleGameOver(): void {
    // TODO: 实现游戏结束逻辑
  }

  // ============ 可选重写的方法 ============

  /**
   * 设置输入控制
   * 默认支持键盘和触摸，可重写自定义
   */
  protected setupInput(): void {
    // 键盘控制
    // 触摸控制
  }

  /**
   * 设置 UI
   * 创建分数面板、暂停按钮等
   */
  protected setupUI(): void {
    // TODO: 实现 UI 设置
  }

  /**
   * 暂停游戏
   */
  public pauseGame(): void {
    this.isPaused = true;
    // 暂停所有动画和补间
  }

  /**
   * 恢复游戏
   */
  public resumeGame(): void {
    this.isPaused = false;
    // 恢复所有动画和补间
  }
}
```

### 4. 数据库注册

编辑 `register-game.sql`，添加游戏注册信息：

```sql
-- 游戏基本信息
INSERT INTO game (id, name, description, status, ...)
VALUES ('your-game-id', '游戏名称', '游戏描述', 1, ...);

-- 游戏配置
INSERT INTO game_config (game_id, config_key, config_value)
VALUES ('your-game-id', 'difficulty_levels', '{"easy": {...}}');
```

---

## 目录结构

```
src/
├── App.vue                    # 游戏主组件
├── main.ts                    # 入口文件
├── config/
│   ├── GTRS.json             # 主题资源配置
│   ├── difficulty.json       # 难度配置
│   └── game-config.json      # 游戏参数
├── components/
│   ├── game/
│   │   └── PhaserGame.vue    # Phaser 游戏容器
│   ├── ui/                   # UI 组件
│   │   ├── GameButton.vue    # 游戏按钮
│   │   ├── ScorePanel.vue    # 分数面板
│   │   ├── DifficultySelector.vue
│   │   ├── PauseButton.vue
│   │   └── SoundToggle.vue
│   └── control/              # 控制组件
├── scenes/
│   ├── StartScene.ts         # 开始场景
│   ├── GameScene.ts          # ⭐ 游戏主场景（需重写）
│   └── GameOverScene.ts      # 结束场景
├── stores/
│   ├── game.ts              # 游戏状态
│   ├── audio.ts             # 音频管理
│   ├── theme.ts             # 主题管理
│   └── settings.ts          # 设置管理
└── types/
    └── index.ts              # 类型定义
```

---

## 开发规范

### 1. 游戏状态管理

使用 Pinia store 管理游戏状态：

```typescript
// stores/game.ts
export const useGameStore = defineStore('game', () => {
  const score = ref(0);
  const difficulty = ref<'easy' | 'medium' | 'hard'>('medium');
  const gameStatus = ref<'idle' | 'playing' | 'paused' | 'over'>('idle');

  function startGame() {
    score.value = 0;
    gameStatus.value = 'playing';
  }

  function endGame() {
    gameStatus.value = 'over';
  }

  return { score, difficulty, gameStatus, startGame, endGame };
});
```

### 2. 主题资源加载

通过 GTRS.json 配置，使用 theme store 加载：

```typescript
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
await themeStore.loadTheme('your-game-id');

// 加载资源
const bgImage = await this.load.image('bg', themeStore.getImage('background'));
```

### 3. 音频管理

使用 audio store 管理音效和背景音乐：

```typescript
import { useAudioStore } from '@/stores/audio';

const audioStore = useAudioStore();
audioStore.playBgm('bgm-key');
audioStore.playEffect('effect-key');
```

### 4. 屏幕适配

游戏会自动适配屏幕，确保：
- 全屏显示
- 正确的宽高比
- 触摸区域适当放大

---

## 常见问题

### Q: 如何添加新道具？

1. 在 `GTRS.json` 中添加道具资源配置
2. 在 `scenes/GameScene.ts` 中实现道具生成逻辑
3. 在碰撞检测中处理道具效果

### Q: 如何添加新关卡？

1. 在 `difficulty.json` 中添加新难度
2. 在 `DifficultySelector.vue` 中添加选择项
3. 在游戏逻辑中根据难度调整参数

### Q: 如何添加排行榜？

参考 `kids-game-house/games/snake/` 的实现，调用后端 API 保存和获取分数。

---

## 参考实现

- **贪吃蛇** `kids-game-house/games/snake/`：成熟完整的贪吃蛇实现
- **坦克大战** `kids-game-house/games/tank-battle/`：多人对战实现

---

## 框架升级

框架会随更多游戏不断升级：
- 新增通用 UI 组件
- 优化现有组件
- 提供更多配置选项

**已有游戏不受影响**，因为每个游戏都有独立副本。
