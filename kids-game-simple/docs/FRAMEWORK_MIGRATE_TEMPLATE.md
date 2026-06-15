# 竖屏 2D 游戏迁移到 GameLifecycle（模板）

## 1. 新建 `yourGame.lifecycle.ts`

**方式 A — `hostCanvas2D`（已有 draw/update 时最快）**

```ts
import { gameActions } from '../platform/gameBridge'
import type { GameLifecycleContext } from '../platform/GameLifecycle'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { hostCanvas2D } from '../platform/hostCanvas2D'
import { requireMainGameCanvas } from '../platform/canvasHost'

export function startYourGameLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const canvas = ctx.canvas ?? requireMainGameCanvas()
  const engine = ctx.engine
  return hostCanvas2D(ctx, {
    onInit() { /* 输入 */ },
    onUpdate(_dt) { /* 逻辑；结束 → gameActions.gameOver({ victory, score: engine.getScore() }) */ },
    onRender() { /* draw */ },
    onDestroy() { /* unbind */ },
  })
}
```

**方式 B — `runCanvasLifecycle`（与 A 等价，见 `bouncePath.lifecycle.ts`）**

## 2. 入口 `yourGame.ts`

```ts
import { createLifecycleContext } from '../platform/frameworkSession'
import { startYourGameLifecycle } from './yourGame.lifecycle'

let activeHost: GameLifecycle | null = null
export function destroyYourGame() { activeHost?.destroy(); activeHost = null }
export function initYourGame(engine, onEnd) {
  destroyYourGame()
  const ctx = createLifecycleContext('yourGameId', engine, onEnd)
  if (!ctx) return onEnd()
  activeHost = startYourGameLifecycle(ctx)
}
```

## 3. `gameRegistry.ts`

```ts
destroy: () => void import('./yourGame').then(m => m.destroyYourGame()),
```

## 4. 禁止 / 推荐

| 避免 | 推荐 |
|------|------|
| 自写 `requestAnimationFrame` | `runCanvasLifecycle` |
| `engine.addScore` 在玩法里 | `gameActions.addScore` |
| `engine.endGame(); onEnd()` | `gameActions.gameOver`（由 `gameSession` 桥接 `endGame`） |
| 局内自绘「总分」大字 | 壳层顶栏 + canvas 只画关卡/倒计时 |

## 5. `gameSession` 已全局启用

`startGame` → `installGameEventBridge` + `setGameEndHandler`  
`exitGame` → `uninstallGameEventBridge` + `inputManager.stop()`