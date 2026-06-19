import type { PlatformContext } from './types'
import type { Game } from '../types'
import { getGameRegistration, initGame, destroyGame } from '../games/gameRegistry'
import { hasGameGuide, loadGameGuide } from '../platform/gameGuide'
import { userService } from '../services/userService'
import { audioService } from '../services/audio'
import { gameEngine } from '../services/gameEngine'
import { showToast } from '../services/userUI'
import { apiSubmitComment, apiGetComments } from '../services/apiClient'
import { storageService } from '../services/storage'
import { OrientationManager } from '../utils/orientation'
import { setPlatformContextForGames } from '../services/appBridge'
import { removePowerupBar } from './powerup'
import { mountGameShell, unmountGameShell, dismissGamePauseOverlay } from './gameShell'
import { getGameLayoutConfig, isLandscapeLayout } from '../games/gameLayout'
import { calculateRank } from './rank'
import { refreshBestScores } from './gameCards'
import {
  installGameEventBridge,
  uninstallGameEventBridge,
  setGameEndHandler,
  clearAllPools,
  inputManager,
} from '../platform'
import type { GameLifecycle } from '../platform/GameLifecycle'

let activeLifecycleHost: GameLifecycle | null = null

// ==================== 游戏启动 ====================

export function launchGame(ctx: PlatformContext, game: Game) {
  // 强制检查登录状态
  if (!userService.isLoggedIn) {
    showToast('请先登录后再玩游戏')
    ctx.authModal.open(() => ctx.onUserChange())
    ctx.authModal.requireLogin = true
    return
  }

  ctx.currentGame = game

  audioService.click()

  const guideSkipped = userService.current?.guideSkipped?.[game.id] ?? false

  if (!guideSkipped) {
    void showGameGuide(ctx, game)
  } else {
    ctx.startGame()
  }
}

export async function showGameGuide(ctx: PlatformContext, game: Game) {
  if (!hasGameGuide(game.id)) {
    ctx.startGame()
    return
  }
  const guide = await loadGameGuide(game.id)
  if (!guide) {
    ctx.startGame()
    return
  }

  setText('guideIcon', guide.icon)
  setText('guideName', guide.name)
  setText('guideDesc', guide.desc)

  const opsEl = document.getElementById('guideOps')
  if (opsEl) {
    opsEl.innerHTML = guide.ops.map(op => `
        <div class="guide-op">
          <div class="guide-op-icon" style="background:${game.color.split(',')[0]}20">${op.icon}</div>
          <div class="guide-op-text">${op.text}</div>
        </div>
      `).join('')
  }

  const tipsEl = document.getElementById('guideTips')
  if (tipsEl) {
    tipsEl.innerHTML = `
        <div class="guide-tips-title">${guide.tipsTitle}</div>
        <div class="guide-tips-text">${guide.tips}</div>
      `
  }

  const skipCheckEl = document.getElementById('guideSkipCheck') as HTMLInputElement | null
  if (skipCheckEl) skipCheckEl.checked = false

  // 初始化评论区
  ctx.setRating(0)
  ctx.renderComments()

  document.getElementById('guide-overlay')?.classList.add('show')

  const overlay = document.getElementById('guide-overlay')
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === overlay) {
      cancelGuide(ctx, overlay as HTMLElement, handleOverlayClick)
    }
  }

  overlay.addEventListener('click', handleOverlayClick)
}

export function closeGuide(ctx: PlatformContext) {
  const skipCheckEl = document.getElementById('guideSkipCheck') as HTMLInputElement | null
  const skipCheck = skipCheckEl?.checked ?? false
  if (skipCheck && ctx.currentGame) {
    userService.skipGuide(ctx.currentGame.id)
  }
  document.getElementById('guide-overlay')?.classList.remove('show')
  setTimeout(() => ctx.startGame(), 300)
}

export function cancelGuide(ctx: PlatformContext, overlay: HTMLElement | null, handler: (e: MouseEvent) => void) {
  overlay?.removeEventListener('click', handler)
  document.getElementById('guide-overlay')?.classList.remove('show')
  ctx.currentGame = null
}

// ==================== 游戏开始/结束 ====================

let portraitCanvasResizeHandler: (() => void) | null = null
let landscapeCanvasResizeHandler: (() => void) | null = null

function clearCanvasViewportResizeListeners() {
  if (portraitCanvasResizeHandler) {
    window.removeEventListener('resize', portraitCanvasResizeHandler)
    window.visualViewport?.removeEventListener('resize', portraitCanvasResizeHandler)
    portraitCanvasResizeHandler = null
  }
  if (landscapeCanvasResizeHandler) {
    window.removeEventListener('resize', landscapeCanvasResizeHandler)
    window.visualViewport?.removeEventListener('resize', landscapeCanvasResizeHandler)
    landscapeCanvasResizeHandler = null
  }
}

export async function startGame(ctx: PlatformContext) {
  if (!ctx.currentGame) return

  const registration = getGameRegistration(ctx.currentGame.id)
  if (!registration) {
    console.error(`[App] Game registration not found: ${ctx.currentGame.id}`)
    return
  }

  setPlatformContextForGames(ctx)
  clearCanvasViewportResizeListeners()
  gameEngine.start()

  if (isLandscapeLayout(getGameLayoutConfig(ctx.currentGame.id, registration.layout))) {
    if (!ctx.orientationManager) {
      ctx.orientationManager = new OrientationManager()
    }
  }

  const { layout, portraitResizeHandler, landscapeResizeHandler } = mountGameShell({
    game: ctx.currentGame,
    registration,
    orientationManager: ctx.orientationManager,
    onExit: () => exitGame(ctx),
  })

  if (portraitResizeHandler) {
    portraitCanvasResizeHandler = portraitResizeHandler
    window.addEventListener('resize', portraitCanvasResizeHandler)
    window.visualViewport?.addEventListener('resize', portraitCanvasResizeHandler)
  }

  if (landscapeResizeHandler) {
    landscapeCanvasResizeHandler = landscapeResizeHandler
    window.addEventListener('resize', landscapeCanvasResizeHandler)
    window.visualViewport?.addEventListener('resize', landscapeCanvasResizeHandler)
  }

  if (layout.externalCanvas) {
    console.log(`[App] ${ctx.currentGame.id} 使用外部画布容器（Phaser/自管 DOM）`)
  }

  installGameEventBridge()
  setGameEndHandler(() => {
    if (ctx.currentGame) destroyGame(ctx.currentGame.id)
    activeLifecycleHost = null
    void endGame(ctx)
  })

  await initGame(ctx.currentGame.id, gameEngine, () => endGame(ctx))
}

export async function endGame(ctx: PlatformContext) {
  gameEngine.stop()
  gameEngine.endGame()

  clearCanvasViewportResizeListeners()
  setPlatformContextForGames(null)
  removePowerupBar()

  if (!ctx.currentGame) return

  dismissGamePauseOverlay()

  const gameId = ctx.currentGame.id

  const score = gameEngine.getScore()
  const prevBest = userService.current?.bestScores[gameId] ?? 0

  showResult(ctx, gameId, score, prevBest)
  syncScoreAsync(ctx, gameId, score, prevBest)
}

// ==================== 结算弹窗 ====================

function setText(id: string, text: string) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

export function showResult(ctx: PlatformContext, gameId: string, score: number, prevBest: number) {
  const overlay = document.getElementById('result-overlay')
  if (!overlay) {
    console.warn('[App] showResult: #result-overlay 未找到，跳过结算 UI')
    return
  }

  const gameStats = gameEngine.getGameStats()

  const dispCoins = userService.current?.coins ?? 0
  const dispGames = userService.current?.todayGames ?? 0
  setText('coinCount', String(dispCoins))
  setText('todayGames', String(dispGames))

  const pct = prevBest > 0 ? Math.round(score / prevBest * 100) : 100
  const isVictory = gameEngine.isVictory()
  let tier = 'basic', icon = '🎮', title = '继续加油'
  if (isVictory) {
    tier = 'best'; icon = '🎉'; title = '恭喜通关!'
    audioService.win()
  } else if (score > prevBest && score > 0) {
    tier = 'best'; icon = '🏆'; title = '新纪录!'
    audioService.win()
  } else if (pct >= 60) {
    tier = 'good'; icon = '⭐'; title = '很棒!'
  }

  const resultIcon = document.getElementById('resultIcon')
  if (resultIcon) {
    resultIcon.className = 'result-icon ' + tier
    resultIcon.textContent = icon
  }
  setText('resultTitle', title)
  setText('resultScore', String(score))
  setText('resultBest', '历史最高: ' + (prevBest || 0))

  const statsEl = document.getElementById('resultStats')
  if (statsEl && gameStats) {
    statsEl.style.display = 'block'
    let statsHtml = ''
    if (gameStats.maxCombo > 0) {
      statsHtml += `<div class="stat-item">🔥 最大连击: <b>${gameStats.maxCombo}</b></div>`
    }
    if (gameStats.totalKills > 0) {
      statsHtml += `<div class="stat-item">💀 总击杀: <b>${gameStats.totalKills}</b></div>`
    }
    if (gameStats.gameTime > 0) {
      const minutes = Math.floor(gameStats.gameTime / 60)
      const seconds = gameStats.gameTime % 60
      statsHtml += `<div class="stat-item">⏱️ 游戏时长: <b>${minutes}:${seconds.toString().padStart(2, '0')}</b></div>`
    }
    if (gameStats.level > 0) {
      statsHtml += `<div class="stat-item">📊 等级: <b>${gameStats.level}</b></div>`
    }
    if (gameStats.won) {
      statsHtml += `<div class="stat-item" style="color:#FFD700">🎉 通关成功!</div>`
    }
    statsEl.innerHTML = statsHtml
  } else if (statsEl) {
    statsEl.style.display = 'none'
  }

  // 显示本地排名（后端同步后会被 syncScoreAsync 更新）
  const rankInfo = calculateRank(ctx, score)
  const rankEl = document.getElementById('resultRank')
  const rankBadgeEl = document.getElementById('rankBadge')
  const rankTextEl = document.getElementById('rankText')

  if (rankEl && rankBadgeEl && rankTextEl && rankInfo) {
    rankEl.style.display = 'block'
    rankBadgeEl.textContent = rankInfo.badge
    rankTextEl.innerHTML = rankInfo.text

    if (rankInfo.rank <= 3) {
      rankBadgeEl.style.color = rankInfo.rank === 1 ? '#FFD700' : rankInfo.rank === 2 ? '#C0C0C0' : '#CD7F32'
    } else {
      rankBadgeEl.style.color = '#5b9bd5'
    }
  } else if (rankEl) {
    rankEl.style.display = 'none'
  }

  const buffsEl = document.getElementById('resultBuffs')
  if (buffsEl) {
    buffsEl.innerHTML = ''
    if (gameEngine.getCrits() > 0) {
      buffsEl.innerHTML += `<span class="buff-tag crit">⚡暴击 x${gameEngine.getCrits()}</span>`
    }
    if (gameEngine.getCombo() >= 10) {
      buffsEl.innerHTML += `<span class="buff-tag">🔥连击 x${gameEngine.getCombo()}</span>`
    }
  }

  overlay.classList.add('show')
}

export async function syncScoreAsync(ctx: PlatformContext, gameId: string, score: number, prevBest: number) {
  console.log('[App] syncScoreAsync - 开始同步分数', { gameId, score })
  try {
    const gameStats = gameEngine.getGameStats()

    console.log('[App] 调用 userService.recordGameResult...')
    const result = await userService.recordGameResult(gameId, score, gameStats)
    console.log('[App] recordGameResult 返回结果:', result)
    
    const dispCoins = userService.current?.coins ?? 0
    setText('coinCount', String(dispCoins))
    setText('todayGames', String(userService.current?.todayGames ?? 0))
    
    const earnedEl = document.getElementById('resultScore')
    if (earnedEl && result.synced) {
      const cur = earnedEl.textContent || ''
      if (!cur.includes('金币')) earnedEl.textContent = score + ' (已同步奖励)'
    }
    
    if (result.synced && result.rank) {
      const rankEl = document.getElementById('resultRank')
      const rankBadgeEl = document.getElementById('rankBadge')
      const rankTextEl = document.getElementById('rankText')
      if (rankEl && rankBadgeEl && rankTextEl) {
        rankEl.style.display = 'block'
        const badge = result.rank <= 3 ? ['🥇', '🥈', '🥉'][result.rank - 1] : `#${result.rank}`
        rankBadgeEl.textContent = badge
        rankTextEl.innerHTML = `当前排名 <b>${result.rank}</b> 位`
        rankBadgeEl.style.color = result.rank === 1 ? '#FFD700' : result.rank === 2 ? '#C0C0C0' : result.rank === 3 ? '#CD7F32' : '#5b9bd5'
      }
    }

    ctx.clearRankCache(gameId)
  } catch (e) {
    console.warn('[App] 分数同步失败:', e)
  }
}

export function closeResult(ctx: PlatformContext) {
  document.getElementById('result-overlay')?.classList.remove('show')
  exitGame(ctx)
}

export function replayGame(ctx: PlatformContext) {
  document.getElementById('result-overlay')?.classList.remove('show')
  dismissGamePauseOverlay()
  const gameToReplay = ctx.currentGame
  if (gameToReplay) destroyGame(gameToReplay.id)
  document.getElementById('phaser-space-shooter')?.remove()
  document.getElementById('dragon-shooter-wrapper')?.remove()
  document.getElementById('rpg-game-wrapper')?.remove()
  ;(window as unknown as { _rpgTowerDefenseResizeHandler?: () => void })._rpgTowerDefenseResizeHandler?.()
  unmountGameShell(ctx.orientationManager)
  ctx.currentGame = gameToReplay
  ctx.startGame()
}

export function exitGame(ctx: PlatformContext) {
  if (ctx.currentGame) destroyGame(ctx.currentGame.id)
  activeLifecycleHost = null
  uninstallGameEventBridge()
  setGameEndHandler(null)
  clearAllPools()
  inputManager.stop()

  clearCanvasViewportResizeListeners()
  setPlatformContextForGames(null)
  removePowerupBar()

  document.getElementById('phaser-space-shooter')?.remove()
  document.getElementById('dragon-shooter-wrapper')?.remove()
  document.getElementById('rpg-game-wrapper')?.remove()
  ;(window as unknown as { _rpgTowerDefenseResizeHandler?: () => void })._rpgTowerDefenseResizeHandler?.()

  unmountGameShell(ctx.orientationManager)
  ctx.currentGame = null

  ctx.switchToHome()
}

// ==================== 评论区 ====================

export function setRating(ctx: PlatformContext, rating: number) {
  ctx.selectedRating = rating
  document.querySelectorAll('.rating-stars .star').forEach((star, index) => {
    if (index < rating) {
      star.classList.add('selected')
    } else {
      star.classList.remove('selected')
    }
  })
}

export async function submitComment(ctx: PlatformContext) {
  if (!ctx.currentGame) return

  const input = document.getElementById('commentInput') as HTMLTextAreaElement
  const content = input.value.trim()

  if (!content) {
    showToast('请输入评论内容')
    return
  }

  if (ctx.selectedRating === 0) {
    showToast('请先选择评分')
    return
  }

  if (!userService.isLoggedIn) {
    showToast('请先登录或注册后才能发表评论')
    ctx.authModal.open(() => ctx.onUserChange())
    return
  }

  const playerName = userService.current?.username || '玩家'

  const submitBtn = document.getElementById('btnSubmitComment') as HTMLButtonElement
  submitBtn.disabled = true
  submitBtn.textContent = '发布中...'

  try {
    const numericGameId = ctx.convertGameIdToNumber(ctx.currentGame.id)
    console.log('[App] 准备提交评论到后端', {
      gameId: numericGameId,
      originalGameId: ctx.currentGame.id,
      content: content.substring(0, 20) + '...',
      score: ctx.selectedRating,
      userId: userService.current?.id
    })

    const result = await apiSubmitComment(numericGameId, content, ctx.selectedRating)
    console.log('[App] 后端评论提交结果:', result)

    if (result.ok) {
      console.log('[App] 评论成功提交到后端')
      storageService.addComment(ctx.currentGame.id, content, ctx.selectedRating, playerName)
    } else {
      console.warn('[App] 后端评论提交失败，使用本地存储:', result.msg)
      storageService.addComment(ctx.currentGame.id, content, ctx.selectedRating, playerName)
    }

    input.value = ''
    setRating(ctx, 0)

    await renderComments(ctx)

    showToast('评论发布成功！')
  } catch (error) {
    console.error('[App] 提交评论失败:', error)
    showToast('发布失败，请稍后重试')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = '发布评论'
  }
}

export async function renderComments(ctx: PlatformContext) {
  if (!ctx.currentGame) return

  const listEl = document.getElementById('commentList')!

  listEl.innerHTML = '<div class="loading-comments">加载评论中...</div>'

  let comments: Array<{ id: string; playerName: string; content: string; score: number; createdAt: number }> = []

  try {
    if (userService.isLoggedIn) {
      const numericGameId = ctx.convertGameIdToNumber(ctx.currentGame.id)
      const result = await apiGetComments(numericGameId, 0, 20)

      if (result.ok && result.data && result.data.length > 0) {
        comments = result.data.map(c => ({
          id: c.id,
          playerName: c.nickname || c.username,
          content: c.content,
          score: c.score,
          createdAt: c.createdAt
        }))
      } else {
        comments = storageService.getComments(ctx.currentGame.id)
      }
    } else {
      comments = storageService.getComments(ctx.currentGame.id)
    }
  } catch (error) {
    console.error('[App] 获取评论失败:', error)
    comments = storageService.getComments(ctx.currentGame.id)
  }

  if (comments.length === 0) {
    listEl.innerHTML = '<div class="no-comments" id="noComments">暂无评论，快来发表第一条吧！</div>'
  } else {
    listEl.innerHTML = comments.map(comment => `
        <div class="comment-item">
          <div class="comment-header">
            <div class="comment-avatar">${comment.playerName[0]}</div>
            <div class="comment-info">
              <div class="comment-name">${comment.playerName}</div>
              <div class="comment-time">${formatTime(comment.createdAt)}</div>
            </div>
            <div class="comment-rating">
              ${'★'.repeat(comment.score)}${'☆'.repeat(5 - comment.score)}
            </div>
          </div>
          <div class="comment-content">${comment.content}</div>
        </div>
      `).join('')
  }

  updateCommentStats(ctx, comments.length > 0 ? comments : undefined)
}

export function updateCommentStats(ctx: PlatformContext, comments?: Array<{ score: number }>) {
  if (!ctx.currentGame) return

  const statsEl = document.getElementById('commentStats')!

  let total: number, avgScore: number

  if (comments && comments.length > 0) {
    total = comments.length
    avgScore = Math.round(comments.reduce((sum, c) => sum + c.score, 0) / total * 10) / 10
  } else {
    total = storageService.getTotalComments(ctx.currentGame.id)
    avgScore = storageService.getAverageScore(ctx.currentGame.id)
  }

  statsEl.innerHTML = `
      <span>${total} 条评论</span>
      <span class="avg-score">${avgScore > 0 ? avgScore.toFixed(1) : '-'} 分</span>
    `
}

export function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  } else {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}