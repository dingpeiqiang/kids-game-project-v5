# Canvas 游戏统一壳层规范（kids-game-simple）

## 目标

各 Canvas 游戏**玩法可以不同**，但**进入 → 引导 → 对局 → 结束 → 再来一局**的流程与**外围 UI** 必须一致。

## 统一流程

```
路由 /game/:type/play
  → GamePlayHost → CanvasGamePlay
  → [guide] GameGuideOverlay（可跳过）
  → [loading] 加载文案
  → [playing] 顶栏 HUD + Canvas 玩法区
  → [paused] 暂停遮罩（可选）
  → [ended] GamePlayResultPanel
  → 返回 / 再来一局
```

游戏结束**必须**调用注册时的 `onEnd()` 回调（由 `initGame` 注入），**不要**在 Canvas 内自绘「游戏结束」全屏页。

## 统一 UI 分区

| 区域 | 组件 | 游戏内禁止重复 |
|------|------|----------------|
| 顶栏 | `GamePlayShellHeader` | 不要再画「得分 ★xxx」顶栏 |
| 玩法 | `#mainGameCanvas` | 仅局内信息：倒计时、关卡、Buff 等 |
| 引导 | `GameGuideOverlay` | 使用 `gameRegistry` 的 `guide` |
| 结算 | `GamePlayResultPanel` | 不要 Canvas 内结算弹窗 |
| 暂停 | `GamePlayPauseOverlay` | 壳层暂停时 Canvas 应 `pointer-events: none` |

## 引擎约定

- 得分：只用 `GameEngine.addScore` / `setScore`，顶栏轮询 `getScore()`。
- 连击：通过 `engine.setCallbacks({ onComboShow, onComboBreak })`，由壳层展示。
- 胜负：结束前 `engine.setVictory(true|false)`（可选），结算展示「挑战成功 / 再接再厉」。

## 新游戏接入清单

1. 在 `gameRegistry.ts` 注册 `game`、`guide`、`init(engine, onEnd)`。
2. `init` 内获取 `#mainGameCanvas`，**不要**改壳层 DOM。
3. 局内 HUD 不绘制与顶栏重复的分数；计时/关卡可保留在 Canvas 顶部窄条。
4. 结束时调用 `onEnd()`，并 `engine.endGame()`（壳层会读最终分）。

## 参考实现

- 壳层：`src/components/CanvasGamePlay.vue`
- 常量：`src/constants/gamePlayShell.ts`
- 会话状态：`src/composables/useCanvasGameSession.ts`
- HUD 迁移示例：`src/games/whackMole/index.ts` 的 `drawHUD`