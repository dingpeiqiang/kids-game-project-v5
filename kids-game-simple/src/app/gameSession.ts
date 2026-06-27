import type { PlatformContext } from './types'
import type { Game } from '../types'
import { userService } from '../services/userService'
import { audioService } from '../services/audio'
import { showToast } from '../services/userUI'
import { navigateToPlayGame } from '../router/navigation'

/** 大厅选游戏：统一走 vue-router（内置 Canvas → /game/:id/play） */
export async function launchGame(ctx: PlatformContext, game: Game) {
  const ok = await userService.ensurePlayableSession()
  if (!ok) {
    showToast('请先登录后再玩游戏')
    const currentPath = window.location.pathname + window.location.search
    window.location.href = '/login?redirect=' + encodeURIComponent(currentPath)
    return
  }

  audioService.click()
  navigateToPlayGame(game.id)
}