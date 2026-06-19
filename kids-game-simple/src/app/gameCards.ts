import type { PlatformContext } from './types'
import type { Game, PlayRecord } from '../types'
import type { GameRecord } from '../types/user'
import { GAMES, GAME_CATEGORIES } from '../games/gameRegistry'
import { isGameVisible, getGameDisplayConfig } from '../games/gameRegistry'
import { storageService } from '../services/storage'
import { userService } from '../services/userService'
import { apiGetBatchUserRank, tokenStore, apiAddFavorite, apiRemoveFavorite, apiGetGameRecords } from '../services/apiClient'
import { getUserRank } from '../services/leaderboardService'
import { showToast } from '../services/userUI'
import { closeTaskCenter, closeShop, renderTaskList as renderTaskListFn, renderShopProducts as renderShopProductsFn } from './economyUI'

// ==================== 游玩历史辅助 ====================

let playRecordsCache: { gameId: string; playedAt: string }[] | null = null

export function clearPlayRecordsCache() { 
  playRecordsCache = null 
}

export function invalidatePlayRecordsCache() {
  playRecordsCache = null
}

function buildNumericGameIdMap(): Map<number, string> {
  const map = new Map<number, string>()
  for (const g of GAMES) {
    const numId = convertGameIdToNumberSimple(g.id)
    if (numId !== -1) map.set(numId, g.id)
  }
  return map
}

function convertGameIdToNumberSimple(gameId: string): number {
  let hash = 0
  for (let i = 0; i < gameId.length; i++) {
    hash = ((hash << 5) - hash) + gameId.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 10000 + 1
}

async function getPlayRecords(): Promise<{ gameId: string; playedAt: string }[]> {
  if (playRecordsCache) return playRecordsCache

  // 先获取本地数据（包含最新记录）
  const localRecords = userService.isLoggedIn && userService.current
    ? userService.current.gameRecords.map((r: GameRecord) => ({
        gameId: r.gameId,
        playedAt: r.playedAt,
      }))
    : storageService.getPlayHistory()

  // 已登录用户从后台获取数据，并与本地数据合并
  if (userService.isLoggedIn) {
    try {
      const res = await apiGetGameRecords()
      if (res.ok && res.data && res.data.length > 0) {
        const numToId = buildNumericGameIdMap()
        const serverRecords = res.data
          .map(r => ({
            gameId: numToId.get(r.gameId) || String(r.gameId),
            playedAt: r.playedAt,
          }))
          .filter(r => !!r.gameId)
        
        // 合并服务器数据和本地数据，本地数据优先（更新更及时）
        const recordMap = new Map<string, { gameId: string; playedAt: string }>()
        
        // 先添加服务器数据
        for (const r of serverRecords) {
          recordMap.set(r.gameId + r.playedAt, r)
        }
        
        // 添加本地数据（可能包含服务器还未同步的最新记录）
        for (const r of localRecords) {
          recordMap.set(r.gameId + r.playedAt, r)
        }
        
        // 按时间排序
        playRecordsCache = Array.from(recordMap.values())
          .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
        return playRecordsCache
      }
    } catch (e) { 
      console.warn('[GameCards] 从后端获取游戏记录失败，使用本地数据', e)
    }
  }

  // 降级：仅使用本地数据
  playRecordsCache = localRecords
  return localRecords
}

async function getRecentlyPlayedGames(max: number): Promise<Game[]> {
  const records = await getPlayRecords()
  const seen = new Set<string>()
  const result: Game[] = []
  for (const r of records) {
    if (seen.has(r.gameId)) continue
    seen.add(r.gameId)
    const game = GAMES.find(g => g.id === r.gameId && isGameVisible(g.id))
    if (game) {
      result.push(game)
      if (result.length >= max) break
    }
  }
  return result
}

async function getFrequentlyPlayedGames(max: number): Promise<Game[]> {
  const records = await getPlayRecords()
  const countMap = new Map<string, number>()
  for (const r of records) {
    countMap.set(r.gameId, (countMap.get(r.gameId) || 0) + 1)
  }
  const sorted = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
  const result: Game[] = []
  for (const [gameId] of sorted) {
    const game = GAMES.find(g => g.id === gameId && isGameVisible(g.id))
    if (game) {
      result.push(game)
      if (result.length >= max) break
    }
  }
  return result
}

// ==================== 游戏卡片渲染 ====================

export async function renderGameCards(ctx: PlatformContext) {
  clearPlayRecordsCache()
  const container = document.getElementById('categorySections')!

  // 停止所有预览动画 + 断开旧 Observer
  ctx.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
  ctx.previewAnimFrames.clear()
  if (ctx.previewObserver) {
    ctx.previewObserver.disconnect()
    ctx.previewObserver = null
  }

  // 移除其他隐藏页面中的旧 canvas，避免 ID 冲突
  document.querySelectorAll('#searchResults canvas[id^="preview_"], #favoritesContent canvas[id^="preview_"]')
    .forEach(el => el.remove())
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

  // ── 常用游戏（最近游玩） ─────────────────────────────
  const recentlyPlayed = await getRecentlyPlayedGames(6)
  if (recentlyPlayed.length > 0) {
    const sec = document.createElement('div')
    sec.className = 'section-quick'
    sec.innerHTML = `<div class="section-title"><span class="cat-label" style="--cat-color:#667eea">🕐 最近游玩</span></div>`
    const grid = document.createElement('div')
    grid.className = 'game-grid'
    const toPreview: Game[] = []
    recentlyPlayed.forEach(game => {
      const best = bestScores[game.id] || 0
      grid.appendChild(createGameCard(ctx, game, best))
      toPreview.push(game)
    })
    sec.appendChild(grid)
    container.appendChild(sec)
    setTimeout(() => toPreview.forEach(game => ctx.renderPreview(game)), 50)
  }

  // ── 常玩游戏（按游玩次数） ──────────────────────────
  const frequentGames = await getFrequentlyPlayedGames(6)
  if (frequentGames.length > 0 && frequentGames.length !== recentlyPlayed.length) {
    const sec = document.createElement('div')
    sec.className = 'section-quick'
    sec.innerHTML = `<div class="section-title"><span class="cat-label" style="--cat-color:#f093fb">🔥 常玩游戏</span></div>`
    const grid = document.createElement('div')
    grid.className = 'game-grid'
    const toPreview: Game[] = []
    frequentGames.forEach(game => {
      const best = bestScores[game.id] || 0
      grid.appendChild(createGameCard(ctx, game, best))
      toPreview.push(game)
    })
    sec.appendChild(grid)
    container.appendChild(sec)
    setTimeout(() => toPreview.forEach(game => ctx.renderPreview(game)), 50)
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
      const card = createGameCard(ctx, game, best)
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

export function createGameCard(ctx: PlatformContext, game: Game, best: number) {
  const card = document.createElement('div')
  card.className = 'game-card'
  card.dataset.gameId = game.id

  // 检查是否已登录和是否已收藏
  const isLoggedIn = userService.isLoggedIn
  const favorites = isLoggedIn ? (userService.current?.favorites || []) : []
  const isFavorited = favorites.includes(game.id)

  // 只有登录用户才显示收藏按钮
  const favoriteBtnHtml = isLoggedIn ? `
        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-game-id="${game.id}" title="${isFavorited ? '取消收藏' : '加入收藏'}">
          ${isFavorited ? '❤️' : '🤍'}
        </button>
      ` : ''

  card.innerHTML = `
      <div class="card-cover">
        <canvas id="preview_${game.id}" width="320" height="200"></canvas>
        <div class="card-tag">${game.tag}</div>
        ${getGameDisplayConfig(game.id).badge ? `<div class="card-badge">${getGameDisplayConfig(game.id).badge}</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-name">${game.name}</div>
        <div class="card-desc">${game.desc}</div>
      </div>
      <div class="card-footer">
        <span class="card-players">👥 ${game.players}</span>
        <div class="card-meta-right">
          ${favoriteBtnHtml}
          <span class="card-best" data-game-id="${game.id}" title="点击查看${game.name}排行榜">
            🏆 ${best > 0 ? best.toLocaleString() : '-'}
          </span>
        </div>
      </div>
    `

  // 绑定收藏按钮事件（仅登录用户）
  if (isLoggedIn) {
    const favBtn = card.querySelector('.favorite-btn')
    favBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      ctx.toggleFavorite(game.id)
    })
  }

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
    return [...(u.favorites || [])]
  }
  const data = storageService.get()
  return [...(data.favorites || [])]
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

  // 优先使用 isLoggedIn 判断，同时检查 userService.current
  const isUserLoggedIn = userService.isLoggedIn && userService.current
  if (isUserLoggedIn) {
    // 已登录用户，同步到后端 API
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
    // 同步更新本地 userService.current 的 favorites
    userService.current!.favorites = favorites
    userService.saveUser(userService.current!)
  } else {
    // 未登录用户，保存到本地存储
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
  closeAllOverlays()
  hideAllPageContainers()

  const homeContent = document.getElementById('homeContent')
  if (homeContent) homeContent.style.display = 'block'

  ctx.currentPage = 'home'
  renderGameCards(ctx)
}

export function switchToRank(ctx: PlatformContext) {
  closeAllOverlays()
  hideAllPageContainers()

  const rankContent = document.getElementById('rankContent')
  if (rankContent) rankContent.style.display = 'block'

  ctx.currentPage = 'rank'
  ctx.showRank()
}

function closeAllOverlays() {
  closeTaskCenter()
  closeShop()
}

function hideAllPageContainers() {
  const ids = ['homeContent','searchResults','favoritesContent','rankContent','taskContent','shopContent','meContent']
  ids.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
  })
}

export function switchToTask(ctx: PlatformContext) {
  closeAllOverlays()
  hideAllPageContainers()

  const taskContent = document.getElementById('taskContent')
  if (!taskContent) return
  taskContent.style.display = 'block'

  ctx.currentPage = 'task'
  void renderTaskListFn('taskPageList')
}

export function switchToShop(ctx: PlatformContext) {
  closeAllOverlays()
  hideAllPageContainers()

  const shopContent = document.getElementById('shopContent')
  if (!shopContent) return
  shopContent.style.display = 'block'

  ctx.currentPage = 'shop'
  void renderShopProductsFn('shopPageList')
}

export function switchToMe(ctx: PlatformContext) {
  closeAllOverlays()
  hideAllPageContainers()

  const meContent = document.getElementById('meContent')
  if (!meContent) return
  meContent.style.display = 'block'

  ctx.currentPage = 'me'
  ctx.mePanel.renderInto('meContent')

  // Override close button to navigate home in page mode
  const closeBtn = document.getElementById('btnCloseMe2')
  if (closeBtn) {
    const parent = closeBtn.parentElement
    if (parent) {
      const btn = document.createElement('button')
      btn.className = 'ugp-me-close-btn'
      btn.id = 'btnCloseMe2'
      btn.textContent = '返回首页'
      parent.replaceChild(btn, closeBtn)
      btn.addEventListener('click', () => ctx.switchToHome())
    }
  }
}

export function showSearchResults(ctx: PlatformContext, results: Game[]) {
  const searchResults = document.getElementById('searchResults')
  const searchCount = document.getElementById('searchCount')
  const searchGameList = document.getElementById('searchGameList')
  const noResults = document.getElementById('noResults')

  if (!searchResults) return

  hideAllPageContainers()

  // 停止所有预览动画 + 断开旧 Observer
  ctx.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
  ctx.previewAnimFrames.clear()
  if (ctx.previewObserver) {
    ctx.previewObserver.disconnect()
    ctx.previewObserver = null
  }

  searchResults.style.display = 'block'
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
        const card = createGameCard(ctx, game, best)
        card.style.animationDelay = `${index * 55}ms`
        searchGameList.appendChild(card)
        gamesToPreview.push(game)
      })
      // 移除隐藏首页的旧 canvas 避免 ID 冲突
      document.querySelectorAll('#homeContent canvas[id^="preview_"]')
        .forEach(el => el.remove())
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

  // 收藏页面需要登录才能访问
  if (!userService.isLoggedIn) {
    showToast('请先登录后再查看收藏')
    switchToHome(ctx)
    return
  }

  const favoritesContent = document.getElementById('favoritesContent')
  const favoritesCount = document.getElementById('favoritesCount')
  const favoritesGameList = document.getElementById('favoritesGameList')
  const noFavorites = document.getElementById('noFavorites')

  if (!favoritesContent) return

  hideAllPageContainers()

  favoritesContent.style.display = 'block'
  void favoritesContent.offsetHeight

  ctx.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
  ctx.previewAnimFrames.clear()
  if (ctx.previewObserver) {
    ctx.previewObserver.disconnect()
    ctx.previewObserver = null
  }
  // 移除隐藏页面中的旧 canvas，避免与收藏页面的 canvas ID 冲突
  document.querySelectorAll('canvas[id^="preview_"]')
    .forEach(el => el.remove())
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
        const card = createGameCard(ctx, game, best)
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