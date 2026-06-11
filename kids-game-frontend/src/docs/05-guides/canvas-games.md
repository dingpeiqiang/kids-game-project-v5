# 终端 Canvas 游戏（kids-game-simple）

## 职责划分

| 层级 | 路径 | 作用 |
|------|------|------|
| **路由 / 壳页面** | `kids-game-frontend/src/modules/game/` | `GameModeSelect`、`LocalBattleLogin`、`index.vue`（iframe 外链游戏） |
| **内置 Canvas 游戏** | `kids-game-simple/src/games/` | 注册表 + 各游戏实现（`initXxx(engine, onEnd)`） |
| **游戏引擎封装** | `kids-game-simple/src/services/gameEngine.ts` | 画布、分数、生命周期 |
| **主题桥接** | `kids-game-simple/src/games/gameThemeBridge.ts` | 按 `gameId` 加载 GTRS |

终端路由 `@/modules/game/*` 走 **前端共用模块**。`/game/:code/play` 由 `@simple/views/GamePlayHost.vue` 分流：

- `gameRegistry` 有注册 → `CanvasGamePlay.vue`
- 否则 → `@/modules/game/index.vue`（iframe）

访问 `/game/:code` 时，若 code 为内置游戏，路由 `beforeEnter` 会直接跳到 `/play`。

## 注册与启动

- **唯一注册表**：`kids-game-simple/src/games/gameRegistry.ts`
  - `GAME_REGISTRY`：元数据、`guide`、`init` 动态 import
  - `initGame(gameId, engine, onEnd)`：主题准备 + `registration.init`
- **展示列表**：`GAMES`、`GAME_DISPLAY_CONFIG`、`GAME_CATEGORIES`
- **勿在** `kids-game-frontend/src/modules/game/` 下再放 `gameRegistry`（已废弃的空文件应删除）

## 新增一款 Canvas 游戏

1. 在 `kids-game-simple/src/games/<gameId>/` 或 `<gameId>.ts` 实现 `export function initXxx(engine, onEnd)`。
2. 在 `gameRegistry.ts` 的 `GAME_REGISTRY` 增加条目（建议 `init` 内 `import()` 懒加载）。
3. 在 `GAME_DISPLAY_CONFIG` 配置 `visible` / `order` / `badge`。
4. 后端游戏库 `gameCode` 与注册表 `id` 保持一致，便于列表与深链。
5. 可选：`public/themes/<themeId>/gtrs.json` + `gameThemeBridge` 配色。

## 子目录游戏

复杂游戏可独立目录，例如：

- `superMario/`：`index.ts`、`game.ts`、`physics.ts`
- `dragonShooter/`：多文件拆分
- `rpgShooterTowerDefense/init.ts`：子包入口

保持对外只导出 `init*` / `destroy*` 供注册表调用。

## 与 kids-game-house 的关系

- **house**：独立 Vite/Phaser 工程，可单独端口开发。
- **simple/games**：平台内嵌、统一 `GameEngine` 与 GTRS 桥接。
- 同一 `gameCode` 可同时存在 house 构建产物（iframe）与 simple 内置版；产品侧二选一或分环境配置。