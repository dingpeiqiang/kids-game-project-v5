/**
 * 游戏模块调用壳层能力（道具栏等），避免依赖 legacy App 或 Vue 根组件。
 */
import type { PlatformContext } from '../app/types'
import { setupCustomPowerupBar as setupBar } from '../app/powerup'

let ctxRef: PlatformContext | null = null

export function setPlatformContextForGames(ctx: PlatformContext | null): void {
  ctxRef = ctx
}

export const app = {
  setupCustomPowerupBar(
    gameId: string,
    powerups: Array<{ id: string; icon: string; name: string }>,
    inventory: string[],
    onUse: (powerupId: string) => void,
  ): void {
    if (!ctxRef) {
      console.warn('[appBridge] PlatformContext 未注册，道具栏不可用')
      return
    }
    setupBar(ctxRef, gameId, powerups, inventory, onUse)
  },
}