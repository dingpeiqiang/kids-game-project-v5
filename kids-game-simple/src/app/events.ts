import type { PlatformContext } from './types'
import type { Game } from '../types'
import { GAMES } from '../games/gameRegistry'
import { userService } from '../services/userService'
import { renderRank } from './rank'
import { showToast } from '../services/userUI'

/**
 * 大厅 DOM 事件（搜索、排行榜、签到等）
 */
export function bindEvents(ctx: PlatformContext) {
  document.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.game-card')
    if (card) {
      const gameId = (card as HTMLElement & { dataset: { gameId?: string } }).dataset.gameId
      if (!gameId) return
      const game = GAMES.find((g: Game) => g.id === gameId)
      if (game) {
        e.preventDefault()
        void ctx.launchGame(game)
      }
    }
  })

  const searchInput = document.getElementById('searchInput') as HTMLInputElement
  const searchBtn = document.getElementById('searchBtn')

  searchBtn?.addEventListener('click', () => {
    if (searchInput) ctx.performSearch(searchInput.value)
  })

  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput) ctx.performSearch(searchInput.value)
  })

  document.getElementById('btnCloseSearch')?.addEventListener('click', () => {
    ctx.switchToHome()
    if (searchInput) searchInput.value = ''
  })

  document.getElementById('rankClose')?.addEventListener('click', () => ctx.closeRank())
  document.querySelectorAll('.rank-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rank-tab').forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      const select = document.getElementById('rankGameSelect') as HTMLSelectElement
      const gameId = select?.value || ''
      renderRank(ctx, tab.getAttribute('data-tab') || 'global', gameId)
    })
  })

  document.getElementById('btnScrollToMyRank')?.addEventListener('click', () => {
    const myRankItem = document.getElementById('myRankItem')
    if (myRankItem) {
      myRankItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      myRankItem.classList.add('highlight-me')
      setTimeout(() => myRankItem.classList.remove('highlight-me'), 2000)
    }
  })

  document.getElementById('btnClaimDaily')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnClaimDaily') as HTMLButtonElement | null
    if (btn) btn.disabled = true

    const res = await userService.collectDailyReward()
    if (res.ok) {
      showToast(res.msg || '签到成功', 'success')
      ctx.closeDailyPop()
      window.dispatchEvent(new CustomEvent('ugp:tasksRefresh'))
      window.dispatchEvent(new CustomEvent('ugp:userChange'))
    } else {
      showToast(res.msg || '签到失败', 'info')
      if (res.msg?.includes('已')) ctx.closeDailyPop()
    }

    if (btn) btn.disabled = false
  })
}

/**
 * 遗留 DOM 游戏壳按钮（PlatformShell 内 #game-layer / #guide-overlay 等）。
 * 内置 Canvas 游戏已迁至 GamePlayHost + CanvasGamePlay，此处仅保留空绑定以免重复注册。
 */
export function bindGameCallbacks() {
  // Intentionally no-op: game UI is handled by vue routes (/game/:type/play).
}