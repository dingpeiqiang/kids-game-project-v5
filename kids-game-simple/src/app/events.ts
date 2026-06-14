import type { PlatformContext } from './types'
import type { Game } from '../types'
import { GAMES } from '../games/gameRegistry'
import { gameEngine } from '../services/gameEngine'
import { userService } from '../services/userService'
import { storageService } from '../services/storage'
import { renderRank } from './rank'
import { showScoreFly } from './gameCards'
import { showToast } from '../services/userUI'

/**
 * 绑定所有 UI 事件监听器
 */
export function bindEvents(ctx: PlatformContext) {
  // 游戏卡片点击
  document.addEventListener('click', e => {
    const card = (e.target as HTMLElement).closest('.game-card')
    if (card) {
      const gameId = (card as HTMLElement & { dataset: { gameId?: string } }).dataset.gameId
      if (!gameId) return
      const game = GAMES.find((g: Game) => g.id === gameId)
      if (game) {
        e.preventDefault()
        ctx.launchGame(game)
      }
    }
  })

  // 导航
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page')
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
      item.classList.add('active')

      if (page === 'task') {
        ctx.switchToTask()
        return
      }
      if (page === 'shop') {
        ctx.switchToShop()
        return
      }
      if (page === 'rank') {
        ctx.switchToRank()
      } else if (page === 'favorites') {
        ctx.currentPage = 'favorites'
        ctx.renderFavoritesPage()
      } else if (page === 'me') {
        ctx.switchToMe()
      } else {
        ctx.closeRank()
        ctx.switchToHome()
      }
    })
  })

  // 搜索功能
  const searchInput = document.getElementById('searchInput') as HTMLInputElement
  const searchBtn = document.getElementById('searchBtn')

  searchBtn?.addEventListener('click', () => {
    if (searchInput) {
      ctx.performSearch(searchInput.value)
    }
  })

  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      ctx.performSearch(searchInput.value)
    }
  })

  // 关闭搜索结果
  document.getElementById('btnCloseSearch')?.addEventListener('click', () => {
    ctx.switchToHome()
    if (searchInput) searchInput.value = ''
  })

  // 结果弹窗
  document.getElementById('btnBack')?.addEventListener('click', () => ctx.closeResult())
  document.getElementById('btnReplay')?.addEventListener('click', () => ctx.replayGame())
  document.getElementById('btnResetGuide')?.addEventListener('click', e => {
    e.preventDefault()
    if (ctx.currentGame) {
      if (userService.isLoggedIn) userService.resetGuide(ctx.currentGame.id)
      else storageService.resetGuide(ctx.currentGame.id)
    }
    ctx.closeResult()
  })

  // 排行榜
  document.getElementById('rankClose')?.addEventListener('click', () => ctx.closeRank())
  document.querySelectorAll('.rank-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')

      const select = document.getElementById('rankGameSelect') as HTMLSelectElement
      const gameId = select?.value || ''

      renderRank(ctx, tab.getAttribute('data-tab') || 'global', gameId)
    })
  })

  // 定位到我的排名
  document.getElementById('btnScrollToMyRank')?.addEventListener('click', () => {
    const myRankItem = document.getElementById('myRankItem')
    if (myRankItem) {
      myRankItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      myRankItem.classList.add('highlight-me')
      setTimeout(() => {
        myRankItem.classList.remove('highlight-me')
      }, 2000)
    }
  })

  // 每日签到
  document.getElementById('btnClaimDaily')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnClaimDaily') as HTMLButtonElement | null
    if (btn) btn.disabled = true
    if (userService.isLoggedIn) {
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
    } else {
      const res = await userService.collectDailyReward()
      if (res.ok) {
        showToast(res.msg || '签到成功', 'success')
        ctx.closeDailyPop()
      } else {
        showToast('请先登录后签到', 'info')
        ctx.authModal.open(() => ctx.onUserChange())
      }
    }
    if (btn) btn.disabled = false
  })

  // 玩法引导
  document.getElementById('btnStartGame')?.addEventListener('click', () => ctx.closeGuide())

  // 评论区评分星星点击
  document.querySelectorAll('.rating-stars .star').forEach(star => {
    star.addEventListener('click', (e) => {
      const rating = parseInt((e.target as HTMLElement).getAttribute('data-rating') || '0')
      ctx.setRating(rating)
    })
  })

  // 发布评论按钮
  document.getElementById('btnSubmitComment')?.addEventListener('click', () => {
    ctx.submitComment()
  })

  // 评论输入框回车提交
  document.getElementById('commentInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ctx.submitComment()
    }
  })
}

/**
 * 绑定游戏引擎回调（分数飘字、Buff、连击等）
 */
export function bindGameCallbacks() {
  gameEngine.setCallbacks({
    onScoreFly: (score, x, y, isCrit, isCombo) => {
      showScoreFly(score, x, y, isCrit, isCombo)
    },
    onCritFlash: () => {
      const el = document.getElementById('critFlash')!
      el.classList.add('show')
      setTimeout(() => el.classList.remove('show'), 600)
    },
    onBuffPopup: (buff) => {
      const popup = document.getElementById('buffPopup')!
      document.getElementById('buffIcon')!.textContent = buff.icon
      document.getElementById('buffText')!.textContent = buff.text
      document.getElementById('buffTime')!.textContent = buff.dur > 0 ? Math.round(buff.dur / 1000) + 's' : ''
      popup.classList.add('show')

      if (buff.dur > 0) {
        let remaining = buff.dur
        const timer = setInterval(() => {
          remaining -= 500
          if (remaining <= 0) {
            clearInterval(timer)
            popup.classList.remove('show')
          } else {
            document.getElementById('buffTime')!.textContent = Math.round(remaining / 1000) + 's'
          }
        }, 500)
      }
    },
    onComboShow: (combo) => {
      const ring = document.getElementById('comboRing')!
      document.getElementById('comboNum')!.textContent = String(combo)
      ring.classList.add('show')
      setTimeout(() => ring.classList.remove('show'), 1500)
    },
    onComboBreak: () => {
      // handled in gameEngine
    }
  })
}