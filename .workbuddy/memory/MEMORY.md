# 项目长期记忆

## 项目结构概览

| 子工程 | 说明 |
|--------|------|
| `kids-game-house/` | 游戏实现（snake、puzzle、tank-battle、simple-game 等）|
| `kids-game-frontend/` | 平台前端（Vue3 + Element Plus）|
| `kids-game-backend/` | 平台后端（Spring Boot）|
| `kids-game-frame-factory/` | 游戏开发框架（模板驱动，给 AI 使用）|

---

## 游戏开发框架（v5.1）

**定位**：框架给 AI 使用，约束 AI 在规范下开发新游戏。

**核心原则**：
- ✅ 新方式：`init-game.ps1` 初始化 → 读 `AI_INSTRUCTIONS.md` → 只改 `MyGameScene.ts`
- ❌ 废弃：复制 snake 代码 / game-dev Skill

**框架文档入口**：
- `kids-game-frame-factory/templates/game-template/AI_INSTRUCTIONS.md` — ⭐ AI 开发唯一入口

### AI 可修改的文件（白名单）

| 文件 | 说明 |
|------|------|
| `src/scenes/MyGameScene.ts` | ⭐ 唯一必须重写的文件 |
| `src/config/GTRS.json` | 资源路径配置 |
| `src/config/difficulty.json` | 难度参数 |
| `src/config/game-config.json` | 游戏基础参数 |
| `src/config/game.config.ts` | 游戏 ID、名称 |

### 开发流程

1. `.\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-game -GameName 游戏名`
2. 编写 `GAME_DESIGN_DOCUMENT.md`（GDD）
3. 生成资源：Sharp PNG + Node.js WAV（**必须**，禁用 theme-resource-generator）
4. 复制 `GTRS.json` 到 `src/config/GTRS.json`
5. 重写 `src/scenes/MyGameScene.ts`（实现 3 个抽象方法）
6. 修改 `PhaserGame.vue` 引用新场景类
7. 生成并执行 `register-game-filled.sql`

### GameScene.ts 三个必须实现的抽象方法

```typescript
protected abstract createGameObjects(): void
protected abstract gameLoop(time, delta): void
protected abstract handleGameOver(): void
```

### 框架内置能力

```typescript
this.addScore(10)              // 加分（自动同步 HUD + 升关）
this.gridToPixelCenter(col, row) // 格子→像素坐标
this.pauseGame() / this.resumeGame()
this.game.events.emit('gameover', score) // 游戏结束
```

### Phaser CDN 规范（全工程统一）

- **CDN**：`https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`（index.html 引入）
- **vite.config.ts**：`external: ['phaser']` + `globals: { phaser: 'Phaser' }`
- **package.json**：不添加 phaser npm 依赖
- **代码**：不写 `import Phaser`，直接用全局 `Phaser`

### 资源生成规范

- ✅ Sharp 程序化生成 PNG + Node.js WAV → MP3
- ❌ 禁止 theme-resource-generator（只生成灰色矩形占位符）
- 路径：`/themes/{game_code}_default/assets/scene/*.png`（不含 `/public/`）

---

## GTRS 规范（v1.0.0）

**4 个顶级字段**：`specMeta` / `themeInfo` / `globalStyle` / `resources`

**资源分类**：`resources.images.{scene/ui/icon/effect}` / `resources.audio.{bgm/effect/voice}`

**规则**：
- `src` 全空 → `assertGTRS()` 直接 throw
- 路径不含 `/public/` 前缀；`normalizeSrcPaths()` 自动兼容旧格式
- `applicableScope` 废弃，统一用 `ownerType=GAME` + `ownerId`

**三层资源对齐**：GDD key = GTRS.json 字段名 = 代码中 Phaser key

---

## 数据库注册规范

- **游戏表**：`t_game`，时间字段 `UNIX_TIMESTAMP(NOW()) * 1000`
- **主题表**：`t_theme_info`，`created_at`/`updated_at` 是 DATETIME（`NOW()`）
- **主题归属**：`owner_type='GAME'` + `owner_id`（废弃 `theme_game_relation`）
- SQL 文件必须 UTF-8 with BOM 编码（避免中文乱码）

---

## 认证安全策略

- **公开接口**：`/api/auth/*`、`/api/parent/login`、`/api/game/list`、`/api/game/code/*`、`/api/game/config/**`
- **其余接口**：需登录

---

## tank-battle 架构（2026-04-04）

**核心：单一入口原则（PlayerController）**

- `PlayerController`（~830行）← 唯一外部入口
- 子模块（纯职责）：PlayerStateManager / PlayerCombatManager / PlayerMovementManager / PowerUpEffectApplier / CollisionManager

**禁止**：直接 `player.setAlpha/setVisible/setActive` / 直接 `gameStore.loseLife/addLife`

**资源加载严格化**（2026-04-01）：
- GTRS/资源缺失直接 throw，禁止兜底方案
- 统一在 preload 阶段完成（符合 Phaser 生命周期）

---

## snake2 架构迁移（进行中）

`kids-game-house/games/snake2`：ECS 风格 `components/logic/` + EventBus 取代 `stores/game.ts`（1107行）

- EventBus：`on/off`（不是 subscribe/unsubscribe）
- 路由 `/game` → 新架构，`/game-legacy` → 旧架构

---

## simple-game 后端迁移（2026-04-21）

**已完成**：将 `simple-game` 从本地 Express server 迁移到 `kids-game-backend`（Spring Boot）。

**迁移内容**：
- `userService.ts`：HTTP session 认证，`credentials: 'include'`，调用 `/api/parent/login|register|current`
- `scoreService.ts`：游戏结果上报 `POST /api/game/result`
- `dailyRewardService.ts`：调用 `GET /api/game/daily/available` + `POST /api/game/daily/claim`
- `App.ts`：异步 `restoreSession()` + 1.2s 延迟检查登录状态
- `.env`：`VITE_API_BASE_URL=http://localhost:8080`
- **删除**：`simple-game/server/` 目录（Express server 已废弃）

---

## 框架工具链（2026-03-31）

`kids-game-frame-factory` 工具链：
- `game-wizard.bat` / `GameWizard.ps1`：交互式游戏创建向导
- `enhance-dev-tools.js`：CLI `check/create/validate/analyze/upgrade/version`
- `resource-generator.js`：图像+音频占位符生成、GTRS 配置更新
- `DebugPanel.ts`：实时 FPS/内存/事件日志，F12 切换
- npm 命令：`create|wizard|validate|analyze|resource:*|test:tools`

**GTRS+关卡系统整合**：
- `LevelGTRSManager.ts` + `GTRSLevelIntegration.ts`
- 接口：`ILevelConfig`（含 gtrsResourceMapping、loadStrategy）
- 编辑器：`level-editor-prototype.html`（拖拽式）

---

## 技术规范

- **IDE 沙箱**：禁止 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **类型检查**：`npx tsc --noEmit`（非 vue-tsc）
- **UI 缩放**：`useResponsiveUI()`（基准 720×1280）
- **贪吃蛇道具**：碰撞坐标 `col * cellSize + cellSize/2`；`onItemEffect` 回调注入（Pinia 不能在 Phaser class 内调用）

---

## 硬编码审计（2026-03-22）

- `BCryptGenerator.java`：改命令行参数
- `ThemeStorePage.vue`：用户 ID 从 `userStore.currentUser?.id` 动态获取
- 前端：`api.types.ts`（GAME_STATUS、THEME_STATUS、USER_TYPE 枚举）
- 后端：`UserRelation.java`（PERMISSION_*、STATUS_* 常量）
- `UnifiedGameManager.ts`：使用 `envConfig.resourceBaseUrl`
