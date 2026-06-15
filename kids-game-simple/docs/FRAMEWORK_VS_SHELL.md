# 统一游戏框架 vs 游戏壳层（现状与路线）

## 目标架构（你方方案）

```
├─ 底层公共层（全局唯一）
│  ├─ Canvas 画布管理器（单例）
│  ├─ HUD 全局 UI（分数、生命、提示、按钮）
│  ├─ 全局暂停控制器
│  └─ 统一计分数据中心
├─ 游戏抽象基类 BaseGame
│  生命周期：Init / Update / Render / Pause / Resume / GameOver
└─ 各具体游戏（仅玩法）
```

## 当前仓库对应关系

| 目标模块 | 代码位置 | 状态 |
|----------|----------|------|
| Canvas 管理器 | `platform/canvasHost.ts` + `app/gameShell.ts` 创建 `#mainGameCanvas` | **部分**：壳层创建画布；3D/Phaser 仍 external |
| HUD 全局 UI | `App.vue` `#game-shell` + 飘字/Buff 全局层 | **部分**：顶栏/道具槽；玩法 HUD 仍多在 canvas 内 |
| 暂停控制器 | `services/gameEngine.ts` + `app/gameShell.ts` | **协议统一**；循环需 `canTick()` 或由 `GameLifecycle` 托管 |
| 计分数据中心 | `services/gameEngine.ts` + `platform/gameBridge.ts` | **桥接可选**：`gameActions` → eventBus → engine |
| BaseGame | `platform/GameLifecycle.ts` | **已实现**；试点游戏用 `runCanvasLifecycle` |
| 生命周期 | `onInit` / `onUpdate` / `onRender` / `finishGame` | **托管 RAF + 暂停只 Render** |

## Game Shell（已全站使用）

- **入口**：`gameSession.startGame` → `mountGameShell` → `initGame(registry)`
- **作用**：大厅隐藏、顶栏、暂停蒙层、布局元数据（`gameLayout.ts`）
- **不等同于** BaseGame：玩法仍通过 `init(engine, onEnd)` 挂载；**大厅内 39 款**已标 `frameworkLifecycle`（见下）

### 道具栏不属于框架层

| 归属 | 内容 |
|------|------|
| **壳层（框架）** | 返回、标题、（可选）平台得分/连击、暂停/退出 |
| **游戏（玩法）** | 道具种类、库存、效果、展示方式 |

壳层 **默认不显示底部道具区域**（`game-shell-footer` 隐藏）。仅当某游戏仍使用遗留 HTML 道具栏并调用 `app.setupCustomPowerupBar` 时，才会展开 `#gameShellPowerupSlot` 作为**可选挂载点**（`powerup.ts` 为平台工具，非统一道具系统）。

**推荐**：新游戏在 **canvas / 游戏内 HUD** 自绘道具，或 3D 游戏用自带 UI；不要依赖壳层底栏。长期可把 `setupCustomPowerupBar` 迁入各游戏目录或删除。

## Game Framework（大厅游戏已全覆盖）

- **入口**：`gameSession` 内 `installGameEventBridge` + `setGameEndHandler` → `initXxx`
- **2D 托管**：`hostCanvas2D` / `runCanvasLifecycle`（`onInit` / `onUpdate` / `onRender` / `onDestroy`）
- **Adapter**（Phaser / Babylon / 自管 RAF）：`destroyXxx` + `gameActions` + `engine.canTick()` / `isPaused()`，画布在 `#gameCanvas` 或 `#mainGameCanvas`
- **计分**：`gameActions.addScore` / `gameActions.gameOver`（经 `gameBridge` → `gameEngine`）
- **权威列表**：`FRAMEWORK_LIFECYCLE_GAME_IDS`（39 个 id，与 `GAME_REGISTRY` 一一对应）
- **退出/重开**：`destroyGame(gameId)` → 各注册项 `destroy`（若存在）

### 接入方式分类

| 类型 | 代表游戏 |
|------|----------|
| `hostCanvas2D` | eliminate、tetris、match3、superMario、towerDefense、beatDragon、kingBaby、plantsVsZombies、plantZombieDefense2d、cuteTankBattle… |
| Phaser / 外部 DOM | spaceShooter |
| Canvas 自管循环 + destroy | dragonShooter、rpgShooter、contraRpg、wangzheRpg、dnfRpg |
| Babylon 3D + HUD | happyDefense、plantZombieDefense、skyFrenzy、cloudBallRush3d、voxelRealm |

## 迁移清单（建议顺序）

| 阶段 | 游戏类型 | 动作 |
|------|----------|------|
| P0 | 竖屏 2D 简单 | `runCanvasLifecycle` + `gameActions` |
| P1 | 竖屏 2D 复杂 | 抽 `update`/`draw`，输入迁 `inputManager` 或壳层 pointer |
| P2 | 横屏 2D | 同 P1 + `gameLayout` landscape |
| P3 | Phaser / Babylon | **Adapter**：生命周期与 pause/score 走 bridge，渲染仍各自引擎 |

## GTRS 主题（与壳层并行）

- 进游戏时 `initGame` → `prepareGameTheme`（全游戏 L0）
- 玩法读主题见 [GTRS_MIGRATE_TEMPLATE.md](./GTRS_MIGRATE_TEMPLATE.md)、进度 `registerGtrsCanvasGames.ts`

## 相关文件

- [FRAMEWORK_MIGRATE_TEMPLATE.md](./FRAMEWORK_MIGRATE_TEMPLATE.md)
- [GTRS_MIGRATE_TEMPLATE.md](./GTRS_MIGRATE_TEMPLATE.md)
- [GameLifecycle.ts](../src/platform/GameLifecycle.ts)
- [gameBridge.ts](../src/platform/gameBridge.ts)
- [canvas-game-shell-spec.md](./canvas-game-shell-spec.md)
- [GAME_SHELL_QA.md](./GAME_SHELL_QA.md)
- [.cursor/rules/game-shell.mdc](../.cursor/rules/game-shell.mdc)