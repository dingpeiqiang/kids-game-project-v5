# 游戏注册与壳层

## 统一容器

- 入口：`App.vue` → `#game-layer` / `#game-shell`
- 挂载：`gameSession.startGame` → `mountGameShell`
- 退出：`exitGame` → `unmountGameShell`

## 新游戏 checklist

1. 在 `gameRegistry.ts` 注册 `GAME_REGISTRY` 条目
2. 在 `gameLayout.ts` 的 `LAYOUT_OVERRIDES` 或注册表 `layout` 声明分辨率与横竖屏
3. 内容只挂 `#gameCanvas`（或壳层创建的 `#mainGameCanvas`）
4. 主循环使用 `engine.canTick()` / `!engine.isPaused()`
5. 自绘 HUD 时设置 `hidePlatformScore: true`

详见 `.cursor/rules/game-shell.mdc`。

## 暂停约定

- 2D：`!engine.canTick()` 时只 `draw()` / `render()`。
- 3D Babylon：`engine.isPaused()` 时 `onBeforeRender` 直接 return（画面由引擎最后一帧保持）。
- 结束：`engine.setScore` → `setVictory` / `setGameStats` → `endGame()` → `onEnd()`（参考 `plantsVsZombies`）。)