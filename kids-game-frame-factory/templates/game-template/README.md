# 游戏模板

> **⚠️ 这是框架模板，不要在这里直接修改。**  
> 创建新游戏请用初始化脚本：
> ```powershell
> # Windows
> .\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-game -GameName 我的游戏
> ```

---

## 模板结构

```
game-template/
├── index.html               # 入口 HTML（含移动端适配 meta、safe-area）
├── package.json             # 依赖（Vue3、Phaser3、Element Plus、TailwindCSS）
├── vite.config.ts           # Vite 配置（@ 别名）
├── tsconfig.json            # TypeScript 配置
├── register-game.sql        # 数据库注册脚本（对齐 t_game 真实表结构）
├── AI_INSTRUCTIONS.md       # ⭐ AI 开发入口文档（开发新游戏必读）
│
└── src/
    ├── App.vue              # 游戏主应用（路由流程控制）
    ├── main.ts              # 入口文件（Pinia、Router、ElementPlus 初始化）
    │
    ├── config/
    │   ├── game.config.ts   # 游戏 ID/名称/API 地址  ⭐ 需修改
    │   ├── GTRS.json        # 主题资源配置           ⭐ 需修改
    │   ├── difficulty.json  # 难度参数               ⭐ 需修改
    │   └── game-config.json # 游戏参数               ⭐ 按需修改
    │
    ├── scenes/
    │   ├── GameScene.ts     # 框架基类（禁止修改）
    │   └── MyGameScene.ts   # ⭐ 游戏逻辑（唯一必须重写的文件）
    │
    ├── views/               # 页面（框架提供，无需修改）
    │   ├── StartView.vue    # 首页（游戏名/最高分/开始按钮）
    │   ├── DifficultyView.vue  # 难度选择 + 主题皮肤
    │   ├── GameView.vue     # 游戏界面（HUD/暂停/加载遮罩）
    │   └── GameOverView.vue # 游戏结束界面
    │
    ├── components/
    │   ├── game/
    │   │   └── PhaserGame.vue       # Phaser 容器（框架，禁止修改）
    │   └── ui/
    │       ├── GameButton.vue       # 游戏按钮（响应式缩放）
    │       ├── LevelTransitionOverlay.vue  # 关卡过渡动画
    │       ├── PauseButton.vue      # 暂停/继续按钮
    │       ├── ScorePanel.vue       # 分数面板
    │       ├── SoundToggle.vue      # 音效开关
    │       ├── DifficultySelector.vue
    │       └── ThemeSelector.vue
    │
    ├── stores/
    │   ├── game.ts      # 游戏状态（分数/关卡/难度/最高分）
    │   ├── audio.ts     # WebAudio 音效（无需外部文件）
    │   ├── theme.ts     # 主题/GTRS 管理
    │   └── settings.ts  # 用户设置（音效开关等）
    │
    ├── composables/
    │   └── useResponsiveUI.ts   # 响应式 UI 缩放（设计基准 375×667）
    │
    ├── utils/
    │   ├── uiResponsive.ts      # UI 响应式工具（720×1280 基准）
    │   └── gtrs-validator.ts    # GTRS 配置校验
    │
    ├── types/
    │   └── level.ts     # 关卡配置类型（20 关渐进式参数）
    │
    └── router/
        └── index.ts     # 路由（Start → Difficulty → Game → GameOver）
```

---

## 开发者须知

### 框架提供的功能（不需要写）

| 功能 | 文件 |
|------|------|
| 首页展示 | `StartView.vue` |
| 难度选择 + 主题皮肤 | `DifficultyView.vue` |
| 资源加载遮罩（4步进度）| `GameView.vue` + `PhaserGame.vue` |
| HUD（分数/关卡/暂停按钮）| `GameView.vue` |
| 暂停弹窗 | `GameView.vue` |
| 20 关渐进式关卡系统 | `stores/game.ts` + `types/level.ts` |
| 关卡过渡动画 | `LevelTransitionOverlay.vue` |
| 游戏结束界面 | `GameOverView.vue` |
| WebAudio 合成音效 | `stores/audio.ts` |
| 主题皮肤系统 | `stores/theme.ts` |
| 响应式屏幕适配 | `utils/uiResponsive.ts` |

### 开发者只需要写 MyGameScene.ts

```typescript
// src/scenes/MyGameScene.ts
import GameScene from './GameScene'

export default class MyGameScene extends GameScene {
  // 必须实现的 3 个抽象方法：

  preload(): void {
    // 加载图片、音频资源
    this.load.image('bg', '/images/my-game/bg.png')
  }

  createGameObjects(): void {
    // 初始化游戏对象（玩家、地图、敌人等）
    this.initAdapt()  // 读取难度配置，初始化坐标系
  }

  gameLoop(time: number, delta: number): void {
    // 每帧逻辑：移动 / 碰撞 / 得分
    this.addScore(10)  // 自动同步 HUD + 检测升关 + 触发动画
  }
}
```

### 游戏结束

```typescript
this.handleGameOver()  // 触发结束流程，跳转 GameOverView
```

---

## 参考实现

- **贪吃蛇** `kids-game-house/games/snake/`：成熟完整的参考实现
- 详细开发指南：`AI_INSTRUCTIONS.md`（本目录）
- 数据库注册：`register-game.sql`（本目录，对齐 `t_game` 真实表结构）
