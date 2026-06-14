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
- **不等同于** BaseGame：多数游戏仍是 `init(engine, onEnd)` 自管循环

## Game Framework（迁移中）

- **入口**：`gameSession` 内 `installGameEventBridge` + `setGameEndHandler` → `initXxx`
- **玩法写法**：`runCanvasLifecycle(ctx, { onInit, onUpdate, onRender, onDestroy })`
- **计分推荐**：`gameActions.addScore` / `gameActions.gameOver`（不直接 `engine.addScore`）
- **试点**：`bouncePath`（`bouncePath.lifecycle.ts`）

## 迁移清单（建议顺序）

| 阶段 | 游戏类型 | 动作 |
|------|----------|------|
| P0 | 竖屏 2D 简单 | `runCanvasLifecycle` + `gameActions` |
| P1 | 竖屏 2D 复杂 | 抽 `update`/`draw`，输入迁 `inputManager` 或壳层 pointer |
| P2 | 横屏 2D | 同 P1 + `gameLayout` landscape |
| P3 | Phaser / Babylon | **Adapter**：生命周期与 pause/score 走 bridge，渲染仍各自引擎 |

## 相关文件

- [GameLifecycle.ts](../src/platform/GameLifecycle.ts)
- [gameBridge.ts](../src/platform/gameBridge.ts)
- [canvas-game-shell-spec.md](./canvas-game-shell-spec.md)
- [GAME_SHELL_QA.md](./GAME_SHELL_QA.md)
- [.cursor/rules/game-shell.mdc](../.cursor/rules/game-shell.mdc)