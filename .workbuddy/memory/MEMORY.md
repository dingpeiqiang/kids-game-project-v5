# 项目长期记忆

## 项目结构概览

| 子工程 | 说明 |
|--------|------|
| `kids-game-house/` | 游戏实现（snake 贪吃蛇、puzzle 拼图等）|
| `kids-game-frontend/` | 平台前端（Vue3 + Element Plus）|
| `kids-game-backend/` | 平台后端（Spring Boot）|
| `kids-game-auto-test/` | 自动化测试工具 |
| `kids-game-frame-factory/` | 游戏开发框架（模板驱动，给 AI 使用）|

---

## 游戏开发框架（v5.0）

**定位**：框架给 AI 使用，约束 AI 在规范下开发新游戏。

**核心原则**：
- ❌ 废弃：复制 snake 代码 / game-dev Skill（已废弃，指向 AI_INSTRUCTIONS.md）
- ✅ 新方式：`init-game.ps1` 初始化 → 读 `AI_INSTRUCTIONS.md` → 只改 `MyGameScene.ts`

**框架文档入口**：
- `kids-game-frame-factory/README.md` — 框架总览
- `kids-game-frame-factory/templates/game-template/AI_INSTRUCTIONS.md` — ⭐ AI 开发唯一入口

### AI 可修改的文件（白名单）

| 文件 | 说明 |
|------|------|
| `src/scenes/MyGameScene.ts` | ⭐ 唯一必须重写的文件 |
| `src/config/GTRS.json` | 资源路径配置 |
| `src/config/difficulty.json` | 难度参数 |
| `src/config/game-config.json` | 游戏基础参数 |
| `src/config/game.config.ts` | 游戏 ID、名称 |

### 开发流程（v5.1）

1. 初始化：`.\kids-game-frame-factory\scripts\init-game.ps1 -GameId my-puzzle -GameName 拼图游戏`
2. 编写 `GAME_DESIGN_DOCUMENT.md`（GDD）
3. 生成资源：Sharp + Node.js WAV（**必须**，禁用 theme-resource-generator）
4. 复制 `GTRS.json` 到 `src/config/GTRS.json`
5. 重写 `src/scenes/MyGameScene.ts`（实现 3 个抽象方法）
6. 修改 `PhaserGame.vue` 引用新场景类
7. 生成并执行 `register-game-filled.sql`

### 三层资源对齐规则

GDD 资源名称(key) = GTRS.json 字段名 = 代码中 Phaser key

`preloadFromGTRS()` 自动对齐第一层和第三层；需手动保证第一层 = 第二层（文件存在）。

### GameScene.ts 三个必须实现的抽象方法

```typescript
protected abstract createGameObjects(): void   // 创建游戏对象
protected abstract gameLoop(time, delta): void  // 游戏主循环
protected abstract handleGameOver(): void       // 游戏结束处理
```

### 框架内置能力（开箱即用）

```typescript
this.addScore(10)              // 加分（自动同步 HUD + 升关）
this.cellSize                   // 格子像素大小
this.gridCols / this.gridRows  // 格子数
this.offsetX / this.offsetY    // 游戏区域偏移
this.gridToPixelCenter(col, row) // 格子→像素坐标
this.pauseGame() / this.resumeGame()
this.game.events.emit('gameover', score) // 游戏结束
```

### 资源生成规范（2026-03-29 更新）

- ✅ **必须**：Sharp 程序化生成 PNG + Node.js WAV → MP3
- ❌ **禁止**：theme-resource-generator（只生成灰色矩形占位符）
- 资源路径：`/themes/{game_code}_default/assets/scene/*.png`（不含 `/public/`）
- 默认主题命名：`{game_code}_default`

### Phaser CDN 规范（2026-03-30 更新）

**所有子工程统一通过 CDN 加载 Phaser，不打包进 bundle**

- **CDN 地址**：`https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`（index.html 中引入）
- **vite.config.ts**：`build.rollupOptions.external: ['phaser']` + `globals: { phaser: 'Phaser' }` + `optimizeDeps.exclude: ['phaser']`
- **package.json**：不添加 `phaser` npm 依赖（CDN 提供，不需要 npm install）
- **TypeScript 类型**：在 `src/global.d.ts` 中 `declare const Phaser: typeof import('phaser').default`
- **代码中**：不写 `import Phaser from 'phaser'`，直接用全局变量 `Phaser`

已统一的子工程：puzzle / game-template / snake / plane-shooter / kids-game-frontend / kids-game-frame-factory/src

### 框架屏幕适配（4 层）

1. `index.html`: `viewport-fit=cover` + `safe-area-inset` padding
2. `App.vue`: `100vw × 100vh` + `overflow: hidden`
3. `GameView.vue`: `h-screen w-full overflow-hidden` + `touch-action: none`
4. Phaser: `Scale.RESIZE`（自适应容器）

---

## GTRS 规范（v1.0.0）

**4 个顶级字段**：`specMeta` / `themeInfo` / `globalStyle` / `resources`

**资源分类**：`resources.images.{scene/ui/icon/effect}` / `resources.audio.{bgm/effect/voice}`

**规则**：
- `src` 全空（结构定义），无主题 → `assertGTRS()` 直接 throw
- 路径不含 `/public/` 前缀；`normalizeSrcPaths()` 自动兼容旧格式
- `applicableScope` 废弃，统一用 `ownerType=GAME` + `ownerId`

---

## 数据库注册规范

- **游戏表**：`t_game`，时间字段为毫秒时间戳 (`UNIX_TIMESTAMP(NOW()) * 1000`)
- **主题表**：`t_theme_info`（有 `t_` 前缀），`created_at`/`updated_at` 是 DATETIME 类型（`NOW()`）
- **主题归属**：`owner_type='GAME'` + `owner_id`（废弃 `theme_game_relation`）
- **注册流程**：生成 `register-game-filled.sql`（替换占位符）→ 执行 → 测试后 `UPDATE status=2`
- SQL 文件必须 UTF-8 with BOM 编码（避免中文乱码）

---

## 认证安全策略

- **严格模式**：所有 `/api/theme/**` 需登录
- **公开接口**：`/api/auth/*`、`/api/kid/login`、`/api/parent/login`、`/api/game/list`、`/api/game/code/*`、`/api/game/config/**`、`/api/question/random`

---

## 硬编码审计（2026-03-22）

- BCryptGenerator.java：改命令行参数
- ThemeStorePage.vue：用户 ID 从 `userStore.currentUser?.id` 动态获取
- 前端：`api.types.ts`（GAME_STATUS、THEME_STATUS、USER_TYPE 枚举）
- 后端：`UserRelation.java`（PERMISSION_*、STATUS_* 常量）
- `UnifiedGameManager.ts`：使用 `envConfig.resourceBaseUrl`

---

## 贪吃蛇（snake）道具系统（2026-03-26）

- 碰撞坐标统一为 `col * cellSize + cellSize/2`
- `game.ts` 新增 `itemEffects` + `applyItemEffect()` + `resetItemEffects()`
- `PhaserGame` 用 `onItemEffect` 回调注入（⚠️ Pinia store 不能在 Phaser class 内调用）

---

## 技术规范

- **IDE 沙箱**：禁止 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **类型检查**：`npx tsc --noEmit`（非 vue-tsc）
- **UI 缩放**：`useResponsiveUI()` 工具函数（设计基准 720×1280）
- `GameButton` props 传原始设计尺寸数字，内部自行缩放

---

## 文档整理（2026-03-29）

整理了 `kids-game-frame-factory` 下的 MD 文档，目标是让 AI 能主导快速开发游戏：

- 重写 `README.md`：框架总览 + 快速入口
- 重写 `AI_INSTRUCTIONS.md`（game-template）：精简为 AI 主导开发的完整指南，去掉矛盾内容
- 删除 `AI_INSTRUCTIONS_UPDATE_SUMMARY.md`（冗余更新说明）
- `docs/GAME_DEV_GUIDE.md` 标记为旧版（已被 AI_INSTRUCTIONS.md 替代）
