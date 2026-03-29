# 项目长期记忆

## 项目结构概览

| 子工程 | 说明 |
|--------|------|
| `kids-game-house/` | 游戏实现（snake 贪吃蛇、tank-battle 坦克大战）|
| `kids-game-frontend/` | 平台前端（Vue3 + Element Plus）|
| `kids-game-backend/` | 平台后端（Spring Boot）|
| `kids-game-auto-test/` | 自动化测试工具 |
| `kids-game-frame-factory/` | 游戏开发框架（模板驱动）|

---

## 游戏开发策略（2026-03-29 v5.0）

**理念**：纯净框架 + 模板驱动 + snake作为最佳实践

**框架定位**：**给 AI 使用**，通过框架约束 AI 在框架下开发新游戏。

**核心变化**：
- ❌ 废弃：复制 snake 代码创建新游戏（会导致snake残留）
- ❌ 废弃：game-dev Skill（已标记废弃，指向 AI_INSTRUCTIONS.md）
- ✅ 新方式：从 frame-factory 模板初始化，AI 读 AI_INSTRUCTIONS.md 开发

**AI 约束机制**：
- `GameScene.ts` 是抽象基类，3个方法是 abstract，不实现 = TypeScript 编译报错
- AI 只能修改：`MyGameScene.ts` + 4个 config 文件（白名单）
- 其余所有框架文件顶部有"框架文件，AI 请勿修改"注释（黑名单）
- `AI_INSTRUCTIONS.md` 是 AI 开发的唯一入口文档

**三层架构**：
```
┌─────────────────────────────────────────────────────────────┐
│  【框架层】kids-game-frame-factory/src/                    │
│  ├── engine/BaseGameEngine.ts    # 游戏引擎基类            │
│  ├── types/                      # 通用类型定义            │
│  └── utils/                       # 工具函数               │
├─────────────────────────────────────────────────────────────┤
│  【模板层】kids-game-frame-factory/templates/game-template/ │
│  ⭐ v5.0 完整功能（完整复刻贪吃蛇游戏流程）                 │
│  ├── src/router/index.ts         # Vue Router（4路由+守卫） │
│  ├── src/utils/uiResponsive.ts   # 响应式UI（720×1280基准） │
│  ├── src/types/level.ts          # 20关关卡系统             │
│  ├── src/stores/game.ts          # 游戏状态+关卡+事件      │
│  ├── src/stores/audio.ts         # WebAudio音效（无需外部文件）│
│  ├── src/stores/theme.ts         # GTRS主题（Composition API）│
│  ├── src/config/game.config.ts   # 游戏常量（GAME_CODE等）  │
│  ├── src/utils/gtrs-validator.ts # GTRS校验工具（内联版）   │
│  ├── src/views/StartView.vue     # 首页（4步检测流程）      │
│  ├── src/views/DifficultyView.vue# 难度选择（主题+折叠设置）│
│  ├── src/views/GameView.vue      # 游戏界面（HUD+关卡显示） │
│  ├── src/views/GameOverView.vue  # 结束界面（3按钮）        │
│  └── src/components/ui/          # LevelTransitionOverlay等 │
├─────────────────────────────────────────────────────────────┤
│  【最佳实践】kids-game-house/games/snake/                  │
│  └── 验证框架可行性，参考实现，不用于复制                    │
└─────────────────────────────────────────────────────────────┘
```

**创建新游戏（v5.0）**：
```powershell
# Windows（推荐）
.\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-puzzle -GameName 拼图游戏
```

**开发步骤**：
1. 修改 `src/config/GTRS.json`（资源）
2. 修改 `src/config/difficulty.json`（难度）
3. **重写 `src/scenes/GameScene.ts`（游戏逻辑）← 唯一必须开发的文件**
4. 将资源放入 `public/images/{gameId}/` 和 `public/audio/{gameId}/`
5. 执行 `register-game.sql` 注册

**与snake的关系（v5.0）**：
| 操作 | snake | 模板 |
|------|-------|------|
| 创建新游戏 | ❌ 复制（不推荐） | ✅ 模板初始化 |
| 参考实现 | ✅ 参考 | - |
| 首页/设置/结束 | 参考实现 | ✅ 开箱即用（不需重写）|
| 关卡系统 | 参考实现 | ✅ 内置20关（不需重写）|
| 游戏逻辑 | 参考但不复制 | ⭐ 唯一需要重写的文件 |



---

## 框架屏幕适配（4 层配合）

1. **index.html**: `viewport-fit=cover` + `env(safe-area-inset-*)` body padding
2. **App.vue**: `100vw × 100vh` + `overflow: hidden`
3. **GameView.vue**: `h-screen w-full overflow-hidden` + `touch-action: none`
4. **Phaser config**: `mode: RESIZE` + `width: '100%', height: '100%'`

**关键区别**：`RESIZE`（全屏）vs `FIT`（等比缩放）

---

## GTRS 规范（v1.0.0）

**4个顶级字段**：`specMeta` / `themeInfo` / `globalStyle` / `resources`  
**资源结构**：`resources.images.scene`、`resources.audio.bgm`、`resources.audio.effect`  

**设计规则**：
- `GTRS.json` 纯结构定义，src 全空；无主题必须报错（assertGTRS() 直接 throw）
- 资源路径不含 `/public/` 前缀；`normalizeSrcPaths()` 自动兼容旧格式
- `applicableScope` 废弃，统一用 `ownerType=GAME` + `ownerId`

**关键接口**：
- `GET /api/theme/download?id=xxx`（需登录）
- `GET /api/theme/editor-data?id=xxx`（编辑器专用）
- `POST /api/theme/approve?themeId=xxx&approved=true/false`

---

## 贪吃蛇游戏（kids-game-house/games/snake/）

### 道具系统（2026-03-26 修复）
- 碰撞坐标统一为 `col * cellSize + cellSize/2`
- `game.ts` 新增 `itemEffects` + `applyItemEffect()` + `resetItemEffects()`
- `PhaserGame` 用 `onItemEffect` 回调注入（⚠️ Pinia store 不能在 Phaser class 内调用）
- `resetItemEffects()` 逐字段重置，避免路由过渡时访问 undefined

### 自定义配置系统（2026-03-28）
- `CustomGameConfig` 存在 `gameStore.customConfig`，`DifficultyView.vue` 写入
- 优先级：`customConfig > DIFFICULTY_CONFIGS[difficulty]`
- 废弃 sessionStorage 方案，改 Pinia store 直接传递

---

## 认证安全策略

**严格模式**：所有 `/api/theme/**` 需登录。  
**公开接口**：`/api/auth/*`、`/api/kid/login`、`/api/parent/login`、`/api/game/list`、`/api/game/code/*`、`/api/game/config/**`、`/api/question/random`

---

## 硬编码审计（2026-03-22）

- BCryptGenerator.java：移除硬编码密码，改命令行参数
- ThemeStorePage.vue：用户ID从 `userStore.currentUser?.id` 动态获取
- 前端新增：`api.types.ts`（GAME_STATUS、THEME_STATUS、USER_TYPE 枚举）
- 后端新增：`UserRelation.java`（PERMISSION_*、STATUS_* 常量）
- `UnifiedGameManager.ts` 使用 `envConfig.resourceBaseUrl`

---

## 游戏框架 v4.0 设计（2026-03-29 v4.2）

**核心理念**：零耦合 + 模板驱动 + 一键初始化 + 游戏完全独立

### 整合内容

所有游戏开发相关的资源都纳入 frame-factory 统一管理：

| 资源类型 | 位置 | 说明 |
|----------|------|------|
| 一键初始化脚本 | `scripts/init-game.ps1` (Win) / `init-game.sh` (Unix) | 自动完成复制、替换、安装 |
| 游戏项目模板 | `templates/game-template/` | 完整游戏项目结构 |
| 配置模板 | `templates/*.template.json` | GTRS、难度、i18n 等配置 |
| 开发文档 | `docs/` | 开发指南、GTRS规范、检查清单 |

### 游戏模板关键设计（v4.2）

**GameScene.ts**：继承 `Phaser.Scene`，基类提供：
- `initAdapt()`：根据难度配置计算 `cellSize`/`offsetX`/`offsetY`/`gridCols`/`gridRows`
- `gridToPixel(col, row)` / `gridToPixelCenter(col, row)`：坐标转换
- `addScore(points)`：加分（自动应用难度倍率，触发 Vue 层更新）
- `pauseGame()` / `resumeGame()` / `togglePause()`：暂停管理
- 事件协议：`'ready'` / `'score'` / `'gameover'` / `'paused'` / `'resumed'`

**PhaserGame.vue**：初始化 Phaser，监听场景事件，联动 audio store 和 game store

**GameView.vue**：含完整 HUD（分数显示、暂停按钮）+ 暂停弹窗 + 加载遮罩

**新增组件/工具**：
- `components/ui/PauseButton.vue`（SVG 图标暂停/继续按钮）
- `composables/useResponsiveUI.ts`（响应式 UI 缩放，设计基准 375×667）
- `config/game-config.json`（游戏参数配置模板）

### 创建新游戏流程（v4.2）

```powershell
# Windows（推荐）
.\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-puzzle -GameName 拼图游戏

# 或手动
cp -r kids-game-frame-factory/templates/game-template kids-game-house/games/my-puzzle
```

**开发步骤**：
1. 修改 `src/config/GTRS.json`（资源）
2. 修改 `src/config/difficulty.json`（难度）
3. 重写 `src/scenes/GameScene.ts`（游戏逻辑）
4. 将资源放入 `public/images/{gameId}/` 和 `public/audio/{gameId}/`
5. 执行 `register-game.sql` 注册

### game-dev Skill 路径
`d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\.workbuddy\skills\game-dev\` (ID: 29413162)

## 技术规范

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **前后端 Schema 同步**：`gtrs-schema.json` 两份必须同步
- **类型检查**：用 `npx tsc --noEmit`（非 vue-tsc）
- **UI 缩放**：用 `useResponsiveUI()` 工具函数（设计基准 720×1280）
  - `uiScaleRef` 是 Vue `computed ref`，在组件 computed 内自动响应式
  - `GameButton` props 传原始设计尺寸数字（如 `:fontSize="26"`），内部自行缩放

## 数据库注册规范（2026-03-29）

- **游戏表**：`t_game`（不是 `game`），时间字段为毫秒时间戳
- **已废弃字段**：`total_play_count`/`total_play_duration`/`average_rating` 已移至 `t_game_statistics`，INSERT 时不包含
- **主题表**：`theme_info`（不是 `t_theme_info`），`created_at`/`updated_at` 是 **DATETIME** 类型（填 `NOW()`，不是时间戳）
- **注册流程**：status=0(草稿) → 测试通过 → UPDATE status=2 + publish_time=毫秒时间戳
- **主题绑定**：需同时写 `theme_info` + `theme_game_relation` 两张表
