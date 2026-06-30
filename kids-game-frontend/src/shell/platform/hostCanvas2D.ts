import type { GameLifecycleContext } from './GameLifecycle'
import { runCanvasLifecycle, type GameLifecycle } from './GameLifecycle'

/**
 * 将已有 draw/update 竖屏 2D 游戏接入托管循环（无需自写 RAF）
 */
export function hostCanvas2D(
  ctx: GameLifecycleContext,
  impl: {
    onInit?: () => void
    onUpdate: (dt: number) => void
    onRender: () => void
    onDestroy?: () => void
  },
): GameLifecycle {
  return runCanvasLifecycle(ctx, {
    async onInit() {
      await impl.onInit?.()
    },
    onUpdate(dt) {
      impl.onUpdate(dt)
    },
    onRender() {
      impl.onRender()
    },
    onDestroy() {
      impl.onDestroy?.()
    },
  })
}