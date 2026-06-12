import type { PlatformContext } from './types'
import type { Game } from '../types'
import { GAMES, GAME_CATEGORIES } from '../games/gameRegistry'
import { isGameVisible, getGameDisplayConfig } from '../games/gameRegistry'
import { storageService } from '../services/storage'
import { userService } from '../services/userService'
import { apiGetBatchUserRank, tokenStore, apiAddFavorite, apiRemoveFavorite } from '../services/apiClient'
import { getUserRank } from '../services/leaderboardService'
import { showToast } from '../services/userUI'

// ==================== 游戏卡片渲染 ====================

export async function renderGameCards(ctx: PlatformContext) {
  const container = document.getElementById('categorySections')!

  // 停止所有预览动画 + 断开旧 Observer
  ctx.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
  ctx.previewAnimFrames.clear()
  if (ctx.previewObserver) {
    ctx.previewObserver.disconnect()
    ctx.previewObserver = null
  }

  // 清空现有内容，避免重复渲染
  container.innerHTML = ''

  const bestScores = userService.isLoggedIn
    ? (userService.current?.bestScores || {})
    : storageService.get().bestScores

  // 如果已登录,批量获取排名数据
  let rankMap: Record<string, number | null> = {}
  if (userService.isLoggedIn && userService.current) {
    try {
      const visibleGames = GAMES.filter(g => isGameVisible(g.id))
      const gameIds = visibleGames.map(g => ctx.convertGameIdToNumber(g.id))
      const userIdStr = tokenStore.getUserId()
      const userId = userIdStr ? parseInt(userIdStr) : null

      console.log('[App] 获取批量排名', { userId, userIdStr, gameCount: gameIds.length })

      if (gameIds.length > 0 && userId) {
        const res = await apiGetBatchUserRank(userId, gameIds)
        if (res.ok && res.data) {
          console.log('[App] 批量排名返回:', Object.keys(res.data).length, '个游戏')
          console.log('[App] 原始数据:', res.data)
          visibleGames.forEach(game => {
            const numericId = ctx.convertGameIdToNumber(game.id)
            if (res.data![numericId]) {
              const rankData = res.data![numericId]
              rankMap[game.id] = rankData.hasRecord ? rankData.rank : null
              if (rankData.hasRecord) {
                console.log(`[App] ${game.id} (ID:${numericId}) 排名:`, rankData.rank, '分数:', rankData.score)
              }
            } else {
              rankMap[game.id] = null
            }
          })
        }
      }
    } catch (e) {
      console.error('[App] 获取排名失败:', e)
    }
  }

  GAME_CATEGORIES.forEach(cat => {
    const gamesInCat = GAMES
      .filter(g => g.category === cat.id && isGameVisible(g.id))
      .sort((a, b) => getGameDisplayConfig(a.id).order - getGameDisplayConfig(b.id).order)
    if (gamesInCat.length === 0) return

    // 分类标题
    const titleEl = document.createElement('div')
    titleEl.className = 'section-title'
    titleEl.innerHTML = `<span class="cat-label" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span><span class="cat-count">${gamesInCat.length}款</span>`
    container.appendChild(titleEl)

    // 游戏网格
    const grid = document.createElement('div')
    grid.className = 'game-grid'
    const gamesToPreview: Game[] = []
    gamesInCat.forEach((game) => {
      const best = bestScores[game.id] || 0
      const rank = rankMap[game.id] !== undefined ? rankMap[game.id] : null
      const card = createGameCard(ctx, game, best, rank)
      grid.appendChild(card)
      gamesToPreview.push(game)
    })
    container.appendChild(grid)
    // 使用 setTimeout 确保 DOM 已挂载并完成布局后再启动预览
    setTimeout(() => {
      gamesToPreview.forEach(game => ctx.renderPreview(game))
    }, 50)
  })
}

export function createGameCard(ctx: PlatformContext, game: Game, best: number, rank: number | null) {
  const card = document.createElement('div')
  card.className = 'game-card'
  card.dataset.gameId = game.id

  // 检查是否已收藏
  const favorites = ctx.getFavorites()
  const isFavorited = favorites.includes(game.id)

  // 排名显示
  let rankDisplay = ''
  if (rank !== null) {
    let rankIcon = '🏅'
    let rankClass = ''
    if (rank === 1) { rankIcon = '🥇'; rankClass = 'rank-gold' }
    else if (rank === 2) { rankIcon = '🥈'; rankClass = 'rank-silver' }
    else if (rank === 3) { rankIcon = '🥉'; rankClass = 'rank-bronze' }

    rankDisplay = `
        <div class="card-rank ${rankClass}" title="你的排名">
          ${rankIcon} 第${rank}名
        </div>
      `
  } else {
    rankDisplay = `
        <div class="card-rank card-rank-empty" title="尚未游玩">
          📝 无记录
        </div>
      `
  }

  card.innerHTML = `
      <div class="card-cover">
        <canvas id="preview_${game.id}" width="320" height="200"></canvas>
        <div class="card-tag">${game.tag}</div>
        ${getGameDisplayConfig(game.id).badge ? `<div class="card-badge">${getGameDisplayConfig(game.id).badge}</div>` : ''}
        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-game-id="${game.id}" title="${isFavorited ? '取消收藏' : '加入收藏'}">
          ${isFavorited ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-info">
        <div class="card-name">${game.name}</div>
        <div class="card-desc">${game.desc}</div>
        <div class="card-meta">
          <span class="card-players">👥 ${game.players}</span>
          <span class="card-best" data-game-id="${game.id}" title="点击查看${game.name}排行榜">
            ★ ${best > 0 ? best.toLocaleString() : '-'}
          </span>
        </div>
        ${rankDisplay}
      </div>
    `

  // 绑定收藏按钮事件
  const favBtn = card.querySelector('.favorite-btn')
  favBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    ctx.toggleFavorite(game.id)
  })

  // 绑定排名点击事件
  const bestEl = card.querySelector('.card-best')
  bestEl?.addEventListener('click', (e) => {
    e.stopPropagation()
    ctx.showRankForGame(game.id)
  })

  return card
}

// ==================== 预览动画 ====================

export function initPreviewObserver(ctx: PlatformContext) {
  if (ctx.previewObserver) return
  ctx.previewObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const canvas = entry.target as HTMLCanvasElement
      const gameId = canvas.id.replace('preview_', '')
      if (entry.isIntersecting) {
        if (!ctx.previewAnimFrames.has(gameId)) {
          const game = GAMES.find(g => g.id === gameId)
          if (game) startPreviewAnimation(ctx, game, canvas)
        }
      } else {
        stopPreviewAnimation(ctx, gameId)
      }
    })
  }, { rootMargin: '100px' })
}

export function stopPreviewAnimation(ctx: PlatformContext, gameId: string) {
  const rafId = ctx.previewAnimFrames.get(gameId)
  if (rafId) {
    cancelAnimationFrame(rafId)
    ctx.previewAnimFrames.delete(gameId)
  }
}

export function startPreviewAnimation(ctx: PlatformContext, game: Game, canvas: HTMLCanvasElement) {
  const ctx2d = canvas.getContext('2d')!
  const [c1, c2] = game.color.split(',')
  const grad = ctx2d.createLinearGradient(0, 0, 320, 200)
  grad.addColorStop(0, c1)
  grad.addColorStop(1, c2)

  const items = Array.from({ length: 6 }, (_, i) => ({
    x: 40 + i * 42,
    y: 80 + Math.sin(i) * 30,
    r: 14,
    vx: (Math.random() - 0.5) * 0.5,
  }))

  let frame = 0
  const animate = () => {
    if (!document.getElementById('preview_' + game.id)) {
      ctx.previewAnimFrames.delete(game.id)
      return
    }
    ctx2d.fillStyle = grad
    ctx2d.fillRect(0, 0, 320, 200)
    items.forEach((it, i) => {
      it.x += it.vx
      if (it.x < 20 || it.x > 300) it.vx *= -1
      ctx2d.globalAlpha = 0.8
      ctx2d.fillStyle = '#fff'
      ctx2d.beginPath()
      ctx2d.arc(it.x, it.y + Math.sin(frame * 0.05 + i) * 6, it.r, 0, Math.PI * 2)
      ctx2d.fill()
    })
    ctx2d.globalAlpha = 0.9
    ctx2d.fillStyle = '#fff'
    ctx2d.font = 'bold 18px sans-serif'
    ctx2d.textAlign = 'center'
    ctx2d.fillText('▶', 160, 110)
    frame++
    ctx.previewAnimFrames.set(game.id, requestAnimationFrame(animate))
  }
  const rafId = requestAnimationFrame(animate)
  ctx.previewAnimFrames.set(game.id, rafId)
}

export function renderPreview(ctx: PlatformContext, game: Game, retryCount = 0) {
  const canvas = document.getElementById('preview_' + game.id) as HTMLCanvasElement
  if (!canvas) {
    console.warn('[App] renderPreview: Canvas not found for game', game.id)
    return
  }

  const rect = canvas.getBoundingClientRect()

  if (rect.width === 0 || rect.height === 0) {
    if (retryCount < 5) {
      console.log(`[App] renderPreview: Canvas size is 0 (${rect.width.toFixed(1)}x${rect.height.toFixed(1)}), retry ${retryCount + 1}/5 for game`, game.id)
      setTimeout(() => {
        renderPreview(ctx, game, retryCount + 1)
      }, 100 * (retryCount + 1))
    } else {
      console.error('[App] renderPreview: Canvas still has 0 size after 5 retries for game', game.id)
      const parent = canvas.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        const parentStyle = window.getComputedStyle(parent)
        console.error('[App] renderPreview: Parent element -', parent.className,
                     'rect:', `w:${parentRect.width.toFixed(1)} h:${parentRect.height.toFixed(1)}`,
                     'display:', parentStyle.display,
                     'visibility:', parentStyle.visibility)
      }
    }
    return
  }

  console.log(`[App] renderPreview: Canvas size OK (${rect.width.toFixed(1)}x${rect.height.toFixed(1)}) for game`, game.id)
  doRenderPreview(ctx, game, canvas)
}

export function doRenderPreview(ctx: PlatformContext, game: Game, canvas: HTMLCanvasElement) {
  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) {
    console.error('[App] renderPreview: Failed to get 2D context for canvas', game.id)
    return
  }

  try {
    const [c1, c2] = game.color.split(',')

    const grad = ctx2d.createLinearGradient(0, 0, 320, 200)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx2d.fillStyle = grad
    ctx2d.fillRect(0, 0, 320, 200)
    ctx2d.globalAlpha = 0.9
    ctx2d.fillStyle = '#fff'
    ctx2d.font = 'bold 18px sans-serif'
    ctx2d.textAlign = 'center'
    ctx2d.fillText('▶', 160, 110)
    ctx2d.globalAlpha = 1
  } catch (error) {
    console.error('[App] renderPreview: Error drawing static frame for', game.id, error)
    return
  }

  if (!ctx.previewAnimFrames.has(game.id)) {
    startPreviewAnimation(ctx, game, canvas)
  }
}

// ==================== 收藏功能 ====================

export function getFavorites(ctx: PlatformContext): string[] {
  const u = userService.current
  if (u) {
    return u.favorites || []
  }
  const data = storageService.get()
  return data.favorites || []
}

export async function toggleFavorite(ctx: PlatformContext, gameId: string) {
  const favorites = getFavorites(ctx)
  const index = favorites.indexOf(gameId)
  const isAdding = index === -1

  if (isAdding) {
    favorites.push(gameId)
    showToast('已加入收藏 ❤️')
  } else {
    favorites.splice(index, 1)
    showToast('已取消收藏')
  }

  const u = userService.current
  if (u) {
    // 同步到后端 API
    const numericGameId = ctx.convertGameIdToNumber(gameId)
    try {
      if (isAdding) {
        await apiAddFavorite(numericGameId)
      } else {
        await apiRemoveFavorite(numericGameId)
      }
    } catch (e) {
      console.error('[App] 同步收藏到后端失败:', e)
    }
  } else {
    const data = storageService.get()
    data.favorites = favorites
    storageService.save(data)
  }

  ctx.refreshCurrentPage()
}

export function refreshCurrentPage(ctx: PlatformContext) {
  if (ctx.currentPage === 'home') {
    renderGameCards(ctx)
  } else if (ctx.currentPage === 'favorites') {
    renderFavoritesPage(ctx)
  }
}

// ==================== 搜索功能 ====================

export function performSearch(ctx: PlatformContext, keyword: string) {
  ctx.searchKeyword = keyword.trim().toLowerCase()

  if (!ctx.searchKeyword) {
    switchToHome(ctx)
    return
  }

  const results = GAMES.filter(game =>
    game.name.toLowerCase().includes(ctx.searchKeyword) ||
    game.desc.toLowerCase().includes(ctx.searchKeyword) ||
    game.tag.toLowerCase().includes(ctx.searchKeyword)
  )

  showSearchResults(ctx, results)
}

export function switchToHome(ctx: PlatformContext) {
  const homeContent = document.getElementById('homeContent')
  const searchResults = document.getElementById('searchResults')
  const favoritesContent = document.getElementById('favoritesContent')
  const rankContent = document.getElementById('rankContent')

  if (homeContent) homeContent.style.display = 'block'
  if (searchResults) searchResults.style.display = 'none'
  if (favoritesContent) favoritesContent.style.display = 'none'
  if (rankContent) rankContent.style.display = 'none'

  ctx.currentPage = 'home'
  renderGameCards(ctx)
}

export function switchToRank(ctx: PlatformContext) {
  // 隐藏其它页面
  const homeContent = document.getElementById('homeContent')
  const searchResults = document.getElementById('searchResults')
  const favoritesContent = document.getElementById('favoritesContent')
  const rankContent = document.getElementById('rankContent')

  if (homeContent) homeContent.style.display = 'none'
  if (searchResults) searchResults.style.display = 'none'
  if (favoritesContent) favoritesContent.style.display = 'none'
  if (rankContent) rankContent.style.display = 'block'

  ctx.currentPage = 'rank'
  // 初始化并渲染排行榜
  ctx.showRank()
}

export function showSearchResults(ctx: PlatformContext, results: Game[]) {
  const homeContent = document.getElementById('homeContent')
  const searchResults = document.getElementById('searchResults')
  const searchCount = document.getElementById('searchCount')
  const searchGameList = document.getElementById('searchGameList')
  const noResults = document.getElementById('noResults')
  const rankContent = document.getElementById('rankContent')

  if (!homeContent || !searchResults) return

  // 停止所有预览动画 + 断开旧 Observer
  ctx.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
  ctx.previewAnimFrames.clear()
  if (ctx.previewObserver) {
    ctx.previewObserver.disconnect()
    ctx.previewObserver = null
  }

  homeContent.style.display = 'none'
  searchResults.style.display = 'block'
  if (rankContent) rankContent.style.display = 'none'
  void searchResults.offsetHeight

  if (searchCount) {
    searchCount.textContent = `找到 ${results.length} 个游戏`
  }

  if (searchGameList) {
    searchGameList.innerHTML = ''
    if (results.length > 0) {
      const gamesToPreview: Game[] = []
      results.forEach((game, index) => {
        const best = ctx.store.bestScores[game.id] || 0
        const card = createGameCard(ctx, game, best, null)
        card.style.animationDelay = `${index * 55}ms`
        searchGameList.appendChild(card)
        gamesToPreview.push(game)
      })
      console.log('[App] showSearchResults: Created', gamesToPreview.length, 'cards, starting previews')
      if (noResults) noResults.style.display = 'none'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gamesToPreview.forEach((game, i) => {
            setTimeout(() => renderPreview(ctx, game), i * 30)
          })
        })
      })
    } else {
      console.log('[App] showSearchResults: No results to display')
      if (noResults) noResults.style.display = 'flex'
    }
  }
}

// ==================== 收藏页面 ====================

export function renderFavoritesPage(ctx: PlatformContext) {
  console.log('[App] renderFavoritesPage: Starting to render favorites page')
  const homeContent = document.getElementById('homeContent')
  const favoritesContent = document.getElementById('favoritesContent')
  const favoritesCount = document.getElementById('favoritesCount')
  const favoritesGameList = document.getElementById('favoritesGameList')
  const noFavorites = document.getElementById('noFavorites')

  if (!homeContent || !favoritesContent) return

  homeContent.style.display = 'none'
  favoritesContent.style.display = 'block'
  const rankContent = document.getElementById('rankContent')
  if (rankContent) rankContent.style.display = 'none'
  void favoritesContent.offsetHeight

  ctx.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
  ctx.previewAnimFrames.clear()
  if (ctx.previewObserver) {
    ctx.previewObserver.disconnect()
    ctx.previewObserver = null
  }
  console.log('[App] renderFavoritesPage: Cleared all animations and observer')

  const favoriteIds = getFavorites(ctx)
  const favoriteGames = GAMES.filter(game => favoriteIds.includes(game.id))
  console.log('[App] renderFavoritesPage: Found', favoriteGames.length, 'favorite games')

  if (favoritesCount) {
    favoritesCount.textContent = `共 ${favoriteGames.length} 个收藏`
  }

  if (favoritesGameList) {
    favoritesGameList.innerHTML = ''
    if (favoriteGames.length > 0) {
      // 立即渲染卡片（与首页保持一致，先显示再更新排名）
      const gamesToPreview: Game[] = []
      favoriteGames.forEach((game) => {
        const best = ctx.store.bestScores[game.id] || 0
        const card = createGameCard(ctx, game, best, null)
        favoritesGameList.appendChild(card)
        gamesToPreview.push(game)
      })
      if (noFavorites) noFavorites.style.display = 'none'

      // 预览动画（与首页保持一致，统一延迟50ms）
      setTimeout(() => {
        gamesToPreview.forEach(game => ctx.renderPreview(game))
      }, 50)

      // 异步获取排名并更新卡片显示（后台更新，不阻塞UI）
      if (userService.isLoggedIn && userService.current) {
        const uid = String(userService.current.id)
        Promise.all(favoriteGames.map(async game => {
          try {
            const rankInfo = await getUserRank(game.id, uid)
            if (rankInfo && rankInfo.rank !== null) {
              const card = favoritesGameList.querySelector(`[data-game-id="${game.id}"]`)
              if (card) {
                const rankEl = card.querySelector('.card-rank')
                if (rankEl) {
                  rankEl.innerHTML = getRankIcon(rankInfo.rank) + ' 第' + rankInfo.rank + '名'
                  rankEl.className = 'card-rank ' + getRankClass(rankInfo.rank)
                }
              }
            }
          } catch (e) {
            // ignore
          }
        }))
      }
    } else {
      console.log('[App] renderFavoritesPage: No favorite games to display')
      if (noFavorites) noFavorites.style.display = 'flex'
    }
  }
}

// 辅助函数：获取排名图标
function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return '🏅'
}

// 辅助函数：获取排名样式类
function getRankClass(rank: number): string {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return ''
}

// ==================== 分数刷新 ====================

export function refreshBestScores() {
  const bestScores = userService.isLoggedIn
    ? (userService.current?.bestScores || {})
    : storageService.get().bestScores
  document.querySelectorAll('.game-card').forEach(card => {
    const gameId = card.getAttribute('data-gameId')
    if (gameId) {
      const bestEl = card.querySelector('.card-best')
      if (bestEl) {
        const best = bestScores[gameId] || 0
        bestEl.textContent = '★ ' + (best > 0 ? best : '-')
      }
    }
  })
}

export function showScoreFly(score: number, x: number, y: number, isCrit: boolean, isCombo: boolean) {
  const el = document.createElement('div')
  el.className = 'score-fly'
  el.textContent = '+' + score
  el.style.left = x + 'px'
  el.style.top = y + 'px'
  if (isCrit) {
    el.style.color = '#ff7043'
    el.style.fontSize = '26px'
    el.textContent += ' ⚡'
  } else if (isCombo) {
    el.style.color = '#5b9bd5'
    el.style.fontSize = '22px'
  }
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1000)
}