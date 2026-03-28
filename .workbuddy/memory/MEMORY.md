# 项目长期记忆

## 项目结构概览

| 子工程 | 说明 |
|--------|------|
| `kids-game-framework/` | **独立游戏框架 npm 包** `@kids-game/framework`（2026-03-27 新增）|
| `kids-game-house/` | 各个游戏实现（snake 等），引用 framework |
| `kids-game-frontend/` | 平台前端（Vue3 + Element Plus）|
| `kids-game-backend/` | 平台后端（Spring Boot）|
| `kids-game-auto-test/` | 自动化测试工具 |

---

## 脚手架（2026-03-27 更新）

**核心思路**：贪吃蛇全套代码即为模板，只参数化游戏特定部分（`{{GAME_*}}` 变量）。

### 使用方式
```bash
cd kids-game-framework
node bin/create-game.js my-game --output ../games
# 或交互式输入
node bin/create-game.js
cd ../games/my-game
npm install && npm run dev
```

### 模板参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `{{GAME_ID}}` | 游戏 ID（localStorage key 前缀） | `test-game` |
| `{{GAME_NAME}}` | 游戏中文名 | `接金币` |
| `{{GAME_NAME_EN}}` | 英文标识（目录名） | `coin-collector` |
| `{{GAME_CODE}}` | 大写游戏代码 | `COIN_COLLECTOR` |
| `{{GAME_EMOJI}}` | 游戏 emoji | `🪙` |
| `{{GAME_SUBTITLE}}` | 副标题 | `开始你的冒险吧！` |
| `{{GAME_HINTS}}` | 操作提示 JSON 数组 | `["点击屏幕开始","滑动收集金币"]` |
| `{{GAME_PHASER_CLASS}}` | PhaserGame 类名 | `CoinCollectorPhaserGame` |

### 零改动直接复用的文件
- `uiResponsive.ts` — 纯缩放工具（720×1280 设计基准）
- `GameButton.vue` / `ThemeSelector.vue` / `ScorePanel.vue` / `PauseButton.vue` / `DifficultySelector.vue` — 通用 UI
- `SoundToggle.vue` — inject `phaserGame`，需游戏 provide

### ⚠️ 不再使用 @kids-game/framework 导入组件
新游戏从模板生成后，UI 组件全部用 `@/components/ui/` 本地导入，不依赖框架包。
框架包（`@kids-game/framework`）保留为可选的工具库（GameEngine、GTRSLoader 等）。

### 框架屏幕适配（2026-03-27 更新，参考贪吃蛇方案）

**全屏适配需要 4 层配合**（缺一不可）：

1. **index.html**: `viewport-fit=cover` + `env(safe-area-inset-*)` body padding
2. **App.vue**: `100vw × 100vh` + `overflow: hidden` + 安全区域 padding
3. **GameView.vue**: `h-screen w-full overflow-hidden` + `touch-action: none`
4. **Phaser config**: `mode: RESIZE` + `width: '100%', height: '100%'` + `autoCenter: CENTER_BOTH`

**两种使用方式**：

1. **函数模式**（模板 `game/index.ts`）— 脚手架生成即用：
   - `SCALE_CONFIG.mode` 默认 `RESIZE`（全屏填满）
   - 游戏逻辑中用 `scene.scale.width/height` 获取实时画布尺寸

2. **继承模式**（`GameEngine` 类）— 复杂游戏：
   - `GameEngineConfig.scaleMode` 默认 `RESIZE`
   - `canvasWidth/canvasHeight` 默认 `'100%'`

**关键区别**：`RESIZE`（画布跟随容器，全屏）vs `FIT`（固定画布等比缩放，不撑满）

### ⚠️ Phaser API 注意点
- `physics.add.existing()` 对 `Rectangle`/`Arc` 可能不生效
- `physics.add.rectangle`/`physics.add.circle` **不存在**
- 简单游戏推荐纯手动位置更新（delta 计算），不依赖 Arcade Physics

### 测试游戏 Demo
- `games/test-game/` — 接金币游戏，用于验证脚手架
- 使用手动位置更新（无 Arcade Physics），Scale.RESIZE 全屏适配

---

## kids-game-framework 子工程提取（2026-03-27）

将 `kids-game-house/shared/game-framework` 重构为独立顶层子工程 `kids-game-framework/`。

**包名**：`@kids-game/framework`，支持子路径导入（`/core`、`/components`、`/stores`、`/types`、`/utils`）。

**关键设计**：
- 移除所有 `@/` 路径别名，改为相对路径（框架作为独立包发布必须用相对路径）
- 外部依赖（vue、pinia、phaser、axios）设为 peerDependencies 或 devDependencies，不打进包里
- `tsconfig.json` 路径别名 `@framework/*` 仅供内部开发时用
- TypeScript 编译零错误验证通过（`npx tsc --noEmit`）

**主要文件**：
- `src/core/GameEngine.ts` - 核心引擎基类，所有游戏继承
- `src/components/ScreenAdapter.ts` - 屏幕适配
- `src/components/AudioManager.ts` - 音频管理
- `src/components/GTRSLoader.ts` - GTRS 主题加载
- `src/components/ItemManager.ts` / `ItemSystem.ts` - 道具系统
- `src/stores/game.store.ts` - 游戏状态 Pinia store
- `src/stores/theme.store.ts` - 主题状态 Pinia store
- `src/types/` - 完整 TS 类型定义
- `src/utils/gtrs-validator.ts` - GTRS 格式校验

**游戏使用方式**（在游戏的 package.json 中）：
```json
"dependencies": {
  "@kids-game/framework": "file:../../kids-game-framework"
}
```

---

## GTRS 规范（Game Theme Resource Specification v1.0.0）

**4个顶级字段**：`specMeta` / `themeInfo` / `globalStyle` / `resources`  
**资源结构**：`resources.images.scene`（场景图）、`resources.audio.bgm`（背景乐）、`resources.audio.effect`（音效）  
**key 命名**：英文小写+下划线，如 `snake_head`、`food_apple`、`scene_bg_main`、`effect_eat`

**设计决策**：
- `GTRS.json` 是纯结构定义（key 枚举），src 全空，不作运行兜底
- 无主题必须报错（`assertGTRS()` 直接 throw，不静默降级）
- 资源路径不含 `/public/` 前缀；`normalizeSrcPaths()` 自动兼容旧格式
- Phaser key = GTRS scene key，完全对应无映射
- 前后端各有一份独立 Schema（`gtrs-schema.json`），修改时必须同步

**主题上传链路（ownerId = gameId）**：
- DIY 流程：已有主题 → DIY → 路由携带 `themeId` + `gameId` → 编辑器加载 → 发布时用路由中的 `gameId` 作 `ownerId`
- `applicableScope` 字段已废弃，统一用 `ownerType=GAME` + `ownerId`

**关键接口**：
- `GET /api/theme/download?id=xxx` - 下载主题（需登录）
- `GET /api/theme/editor-data?id=xxx` - 编辑器专用，返回结构化数据（config 已解析为对象）
- `POST /api/theme/approve?themeId=xxx&approved=true/false` - 审批主题

**关键文件（前端）**：
- `kids-game-frontend/src/utils/gtrs-validator.ts` - GTRS Schema 校验（Ajv）
- `kids-game-frontend/src/schemas/gtrs-schema.json` - GTRS JSON Schema

---

## 贪吃蛇游戏（kids-game-house/games/snake/）

### 项目路径
`kids-game-house/games/snake/`（注意：旧路径 `snake-vue3/` 已迁移）

### 道具系统 Bug 修复（2026-03-26）

**第一轮（碰撞检测/道具不消失）**：
1. `PhaserGame.update()` 传入空数组 → 改为传入 `currentSnake`
2. 坐标系不一致：道具左上角 vs 蛇中心点 → 统一为 `col * cellSize + cellSize/2`
3. `ItemSystem.render()` offsetY 未含 safeTop → 接受 adaptParams 参数修正
4. `ItemSystem.update()` 重复调用 applyItemEffect → 删除重复

**第二轮（数据孤岛问题）**：
- `game.ts` 新增 `itemEffects` 状态 + `applyItemEffect()` + `resetItemEffects()`
- `moveSnake()` 使用 `effectiveSpeed = currentConfig.speed * itemEffects.speedMultiplier`
- `addScore()` 用 `Math.round(points * itemEffects.scoreMultiplier)`
- `PhaserGame` 新增 `onItemEffect` 回调 + `setItemEffectCallback()`，由 `SnakeGame.vue` 注入（不在 Phaser class 内调用 useGameStore）
- `resetItemEffects()` 改为逐字段重置，避免路由过渡时 template 访问 undefined

### ⚠️ 关键约束：Pinia useGameStore() 必须在 Vue 组件 setup 上下文中调用，不能在 Phaser class 内部调用（用回调注入模式替代）

### 关键文件
- `src/stores/game.ts` - 道具效果状态中心；⭐ 新增 `customConfig` + `setCustomConfig()`（2026-03-28）
- `src/components/game/PhaserGame.ts` - 收集回调委托给 store
- `src/components/game/SnakeGame.vue` - 道具效果 UI 显示

### 自定义配置系统（2026-03-28）

**设计**：`CustomGameConfig` 存在 `gameStore.customConfig`，`DifficultyView.vue` 在进入游戏前写入，游戏核心读取时优先使用。

**生效的参数**：`speed`（移动速度）、`initialLength`（初始蛇长）、`cellSize`（格子大小）、`normalFoodScore/bonusFoodScore/specialFoodScore`（分数）、`enableDynamicDifficulty/enableParticles/autoPauseOnBlur/bgmVolume/sfxVolume/muted`

**优先级规则（每个参数）**：`customConfig > DIFFICULTY_CONFIGS[difficulty]`

**关键设计决策**：
- 废弃 sessionStorage 中转方案，改为 Pinia store 直接传递（实时响应式，无序列化开销）
- `startGameWithInit(cellSize)` 替代 `resetGame + startGame + generateFood` 三步调用
- `selectedDifficulty` 初始值从 `gameStore.difficulty` 同步（防止每次进入难度页面都重置）

### 框架 UI 对齐（2026-03-27）

将游戏 UI 组件导入改为使用框架版本：

**修改的文件**：
- `src/views/StartView.vue` - GameButton, SoundToggle, ThemeSelector
- `src/views/GameOverView.vue` - GameButton
- `src/views/LoadingView.vue` - GameButton
- `src/views/DifficultyView.vue` - DifficultySelector, GameButton
- `src/components/game/SnakeGame.vue` - ScorePanel, PauseButton, SoundToggle, GameButton

**导入方式**：
```typescript
import { GameButton, SoundToggle, ThemeSelector, ScorePanel, PauseButton, DifficultySelector } from '@kids-game/framework'
```

**说明**：保留游戏特定的难度配置（DIFFICULTY_CONFIGS），因为它包含游戏特定的参数。

---

## 认证安全策略

**严格认证模式**：所有主题相关 API 必须登录。
- JWT 拦截器拦截所有 `/api/**`，ThemeController 类加 `@RequireLogin`
- **公开接口**：`/api/auth/*`、`/api/kid/login`、`/api/parent/login`、`/api/game/list`、`/api/game/code/*`、`/api/game/config/**`、`/api/question/random`
- **需认证**：所有 `/api/theme/**`

---

## 硬编码审计与修复（2026-03-22）

**P0 修复**：
- BCryptGenerator.java：移除硬编码密码，改为命令行参数传入
- export-ddl.ps1：改为从环境变量 `DB_PASSWORD` 读取
- home/index.vue：verifyParent 改为调用 `parentApi.verifyPassword()` API
- ThemeStorePage.vue：用户ID改为从 `userStore.currentUser?.id` 或 `parentUser?.parentId` 动态获取

**P1 常量提取**：
- 前端：`src/services/api.types.ts` 新增 `GAME_STATUS`、`THEME_STATUS`、`USER_TYPE` 枚举
- 后端：`UserRelation.java` 新增 `PERMISSION_*`、`STATUS_*` 常量

**P2 路径配置化**：`UnifiedGameManager.ts` 使用 `envConfig.resourceBaseUrl` 替代硬编码路径

---

## Framework 重构（2026-03-27）

### 问题背景
原有的 `kids-game-framework` 包含大量贪吃蛇特定代码（如 `Food`, `FOOD_TYPES`, `snake` 相关逻辑），导致框架不可复用。

### 重构内容

**阶段1：优化 snake 游戏结构**
1. `stores/game.ts` - 添加清晰的结构注释，标记通用/游戏特定部分
2. `PhaserGame.ts` - 清理冗长的注释标注，统一命名
3. `types/game-base.types.ts` - 新建通用接口定义文件
4. `types/game.ts` - 添加注释，区分通用/贪吃蛇特定

**阶段2：重建 framework**
1. `types/game.types.ts` - 移除贪吃蛇特定类型（`Food`, `FOOD_TYPES`），保留通用类型
2. `stores/game.store.ts` - 重写为通用游戏状态 store，移除贪吃蛇特定逻辑
3. `index.ts` - 更新导出，反映新的干净结构
4. TypeScript 编译验证通过

### 新框架结构
```
kids-game-framework/src/
├── index.ts              # 主入口
├── core/                 # 核心引擎
├── components/           # 可复用组件
│   ├── ScreenAdapter.ts
│   ├── AudioManager.ts
│   ├── GTRSLoader.ts
│   └── ItemSystem.ts
├── stores/               # Pinia Stores
│   ├── game.store.ts     # 通用游戏状态
│   └── theme.store.ts
├── types/                # 类型定义
│   ├── game.types.ts     # 通用游戏类型
│   └── gtrs.types.ts     # GTRS 规范类型
├── utils/                # 工具函数
└── config/               # 配置常量
```

---

## 技术规范与注意点

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`/`prompt()`，必须用 Element Plus（`ElMessageBox`、`ElMessage`）
- **音频格式**：统一使用 `.mp3`（同时存在 .wav 时优先用 mp3）
- **前后端 Schema 同步**：`kids-game-frontend/src/schemas/gtrs-schema.json` 与 `kids-game-backend/.../gtrs-schema.json` 必须同步修改
- **vue-tsc 兼容**：使用 `npx tsc --noEmit` 而非 `vue-tsc` 进行类型检查（vue-tsc 有版本兼容问题）
- **UI 组件来源**：新游戏用 `@/components/ui/` 本地导入，不从 `@kids-game/framework` 导入
- **UI 缩放**：统一用 `useResponsiveUI()` 的 `getFontSize()`/`getPadding()`/`getGap()` 等方法（设计基准 720×1280）
  - ⭐ **响应式方案（2026-03-28 更新）**：`uiScaleRef` 是 Vue `computed ref`，在组件 `computed` 内调用工具函数会自动建立响应式依赖，resize 后自动重新计算
  - `ui.uiScale` 现在是 `ComputedRef<number>`，读取用 `ui.uiScale.value`
  - 全局 resize 监听由 `_ensureResizeListener()` 统一注册（只注册一次），**各视图不再需要手动 addEventListener/removeEventListener**
  - `GameButton` 的 `fontSize`/`paddingLeft` 等 props 期望**原始设计尺寸数字**（如 `:fontSize="26"`），内部自行缩放，**不要传 `ui.getFontSize()` 的返回值**
