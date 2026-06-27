/**
 * 游戏模块调用壳层能力（道具栏等），路由玩法页无需注册 PlatformContext。
 */
import { removePowerupBar as removeBar, setupCustomPowerupBar as setupBar } from '../app/powerup'

export const app = {
  setupCustomPowerupBar(
    gameId: string,
    powerups: Array<{ id: string; icon: string; name: string }>,
    inventory: string[],
    onUse: (powerupId: string) => void,
  ): void {
    setupBar(gameId, powerups, inventory, onUse)
  },
  removePowerupBar(): void {
    removeBar()
  },
}