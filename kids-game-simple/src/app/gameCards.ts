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
/** 进行中的 game-records 请求，避免首页重复区块并发打同一接口 */
let playRecordsInflight: Promise<{ gameId: string; playedAt: string }[]> | null = null
let playRecordsCacheUserKey = ''

function playRecordsUserKey(): string {
  return userService.isLoggedIn ? `u:${tokenStore.getUserId() || ''}` : 'guest'
}

export function clearPlayRecordsCache() {
  playRecordsCache = null
  playRecordsInflight = null
  playRecordsCacheUserKey = ''
}

export function invalidatePlayRecordsCache() {
  playRecordsCache = null
  playRecordsInflight = null
  playRecordsCacheUserKey = ''
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

async function fetchPlayRecordsOnce(): Promise<{ gameId: string; playedAt: string }[]> {
  const localRecords = userService.isLoggedIn && userService.current
    ? userService.current.gameRecords.map((r: GameRecord) => ({
        gameId: r.gameId,
        playedAt: r.playedAt,
      }))
    : storageService.getPlayHistory()

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

        const recordMap = new Map<string, { gameId: string; playedAt: string }>()
        for (const r of serverRecords) {
          recordMap.set(r.gameId + r.playedAt, r)
        }
        for (const r of localRecords) {
          recordMap.set(r.gameId + r.playedAt, r)
        }

        return Array.from(recordMap.values())
          .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      }
    } catch (e) {
      console.warn('[GameCards] 从后端获取游戏记录失败，使用本地数据', e)
    }
  }

  return localRecords
}

async function getPlayRecords(): Promise<{ gameId: string; playedAt: string }[]> {
  const userKey = playRecordsUserKey()
  if (playRecordsCache && playRecordsCacheUserKey === userKey) {
    return playRecordsCache
  }

  if (!playRecordsInflight) {
    playRecordsInflight = fetchPlayRecordsOnce()
      .then(records => {
        playRecordsCache = records
        playRecordsCacheUserKey = userKey
        return records
      })
      .finally(() => {
        playRecordsInflight = null
      })
  }

  return playRecordsInflight
}

async function getRecentlyPlayedGames(
  max: number,
  records?: { gameId: string; playedAt: string }[],
): Promise<Game[]> {
  const list = records ?? (await getPlayRecords())
  const seen = new Set<string>()
  const result: Game[] = []
  for (const r of list) {
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

async function getFrequentlyPlayedGames(
  max: number,
  records?: { gameId: string; playedAt: string }[],
): Promise<Game[]> {
  const list = records ?? (await getPlayRecords())
  const countMap = new Map<string, number>()
  for (const r of list) {
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

let renderGameCardsInflight: Promise<void> | null = null
let renderGameCardsQueued = false
const previewTimeoutIds = new Map<string, ReturnType<typeof setTimeout>>()

type PreviewTarget = { game: Game; canvas: HTMLCanvasElement }

function getPreviewCanvasFromCard(card: HTMLElement): HTMLCanvasElement | null {
  return card.querySelector('canvas.card-preview-canvas') as HTMLCanvasElement | null
}

function scheduleCardPreviews(ctx: PlatformContext, targets: PreviewTarget[], staggerMs = 20) {
  if (targets.length === 0) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      targets.forEach(({ game, canvas }, i) => {
        setTimeout(() => renderPreview(ctx, game, 0, canvas), i * staggerMs)
      })
    })
  })
}

/** 同 id 游戏可能出现在多个区块，优先在指定根节点内查找 canvas */
function resolvePreviewCanvas(game: Game, hint?: HTMLCanvasElement | null): HTMLCanvasElement | null {
  if (hint?.isConnected) return hint
  const scoped =
    document.querySelector(`#categorySections .game-card[data-game-id="${game.id}"] canvas.card-preview-canvas`) as
      | HTMLCanvasElement
      | null
  if (scoped?.isConnected) return scoped
  const searchScoped = document.querySelector(
    `#searchGameList .game-card[data-game-id="${game.id}"] canvas.card-preview-canvas`,
  ) as HTMLCanvasElement | null
  if (searchScoped?.isConnected) return searchScoped
  const favScoped = document.querySelector(
    `#favoritesGameList .game-card[data-game-id="${game.id}"] canvas.card-preview-canvas`,
  ) as HTMLCanvasElement | null
  if (favScoped?.isConnected) return favScoped
  const byId = document.getElementById('preview_' + game.id) as HTMLCanvasElement | null
  return byId?.isConnected ? byId : null
}

export async function renderGameCards(ctx: PlatformContext) {
  if (renderGameCardsInflight) {
    renderGameCardsQueued = true
    return renderGameCardsInflight
  }

  const run = async () => {
  const container = document.getElementById('categorySections')!

  // 停止所有预览动画 + 断开旧 Observer
  ctx.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
  ctx.previewAnimFrames.clear()
  if (ctx.previewObserver) {
    ctx.previewObserver.disconnect()
    ctx.previewObserver = null
  }

  // 取消所有待处理的预览渲染重试
  previewTimeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
  previewTimeoutIds.clear()

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

  const playRecordsForHome = userService.isLoggedIn ? await getPlayRecords() : null

  // ── 常用游戏（最近游玩） ─────────────────────────────
  const recentlyPlayed = await getRecentlyPlayedGames(6, playRecordsForHome ?? undefined)
  if (recentlyPlayed.length > 0) {
    const sec = document.createElement('div')
    sec.className = 'section-quick'
    sec.innerHTML = `<div class="section-title"><span class="cat-label" style="--cat-color:#667eea">🕐 最近游玩</span></div>`
    const grid = document.createElement('div')
    grid.className = 'game-grid'
    const toPreview: PreviewTarget[] = []
    recentlyPlayed.forEach(game => {
      const best = bestScores[game.id] || 0
      const card = createGameCard(ctx, game, best)
      grid.appendChild(card)
      const canvas = getPreviewCanvasFromCard(card)
      if (canvas) toPreview.push({ game, canvas })
    })
    sec.appendChild(grid)
    container.appendChild(sec)
    scheduleCardPreviews(ctx, toPreview)
  }

  // ── 常玩游戏（按游玩次数） ──────────────────────────
  const frequentGames = await getFrequentlyPlayedGames(6, playRecordsForHome ?? undefined)
  if (frequentGames.length > 0 && frequentGames.length !== recentlyPlayed.length) {
    const sec = document.createElement('div')
    sec.className = 'section-quick'
    sec.innerHTML = `<div class="section-title"><span class="cat-label" style="--cat-color:#f093fb">🔥 常玩游戏</span></div>`
    const grid = document.createElement('div')
    grid.className = 'game-grid'
    const toPreview: PreviewTarget[] = []
    frequentGames.forEach(game => {
      const best = bestScores[game.id] || 0
      const card = createGameCard(ctx, game, best)
      grid.appendChild(card)
      const canvas = getPreviewCanvasFromCard(card)
      if (canvas) toPreview.push({ game, canvas })
    })
    sec.appendChild(grid)
    container.appendChild(sec)
    scheduleCardPreviews(ctx, toPreview)
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
    const gamesToPreview: PreviewTarget[] = []
    gamesInCat.forEach((game) => {
      const best = bestScores[game.id] || 0
      const card = createGameCard(ctx, game, best)
      grid.appendChild(card)
      const canvas = getPreviewCanvasFromCard(card)
      if (canvas) gamesToPreview.push({ game, canvas })
    })
    container.appendChild(grid)
    scheduleCardPreviews(ctx, gamesToPreview)
  })
  }

  renderGameCardsInflight = run().finally(() => {
    renderGameCardsInflight = null
    if (renderGameCardsQueued) {
      renderGameCardsQueued = false
      void renderGameCards(ctx)
    }
  })
  return renderGameCardsInflight
}

/** 用户切换或需要强制刷新游玩记录时调用（会触发一次 game-records 请求） */
export function renderGameCardsFresh(ctx: PlatformContext) {
  clearPlayRecordsCache()
  return renderGameCards(ctx)
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
        <canvas class="card-preview-canvas" id="preview_${game.id}" width="320" height="200"></canvas>
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

  const animKey = canvas.id || game.id
  let frame = 0
  const animate = () => {
    if (!canvas.isConnected) {
      ctx.previewAnimFrames.delete(animKey)
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
    ctx.previewAnimFrames.set(animKey, requestAnimationFrame(animate))
  }
  const rafId = requestAnimationFrame(animate)
  ctx.previewAnimFrames.set(animKey, rafId)
}

function previewRetryKey(game: Game, canvas?: HTMLCanvasElement) {
  return canvas ? `${game.id}:${canvas.id}` : game.id
}

export function renderPreview(
  ctx: PlatformContext,
  game: Game,
  retryCount = 0,
  canvasHint?: HTMLCanvasElement,
) {
  const retryKey = previewRetryKey(game, canvasHint)
  const existingTimeout = previewTimeoutIds.get(retryKey)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
    previewTimeoutIds.delete(retryKey)
  }

  const canvas = resolvePreviewCanvas(game, canvasHint)
  if (!canvas) {
    if (retryCount < 15) {
      const timeoutId = setTimeout(() => {
        previewTimeoutIds.delete(retryKey)
        renderPreview(ctx, game, retryCount + 1, canvasHint)
      }, 50 * (retryCount + 1))
      previewTimeoutIds.set(retryKey, timeoutId)
    } else {
      console.warn('[App] renderPreview: Canvas not found after 15 retries for game', game.id)
    }
    return
  }

  if (!canvas.isConnected) {
    if (retryCount < 15) {
      const timeoutId = setTimeout(() => {
        previewTimeoutIds.delete(retryKey)
        renderPreview(ctx, game, retryCount + 1, canvasHint)
      }, 50 * (retryCount + 1))
      previewTimeoutIds.set(retryKey, timeoutId)
    } else {
      console.warn('[App] renderPreview: Canvas not in DOM after 15 retries for game', game.id)
    }
    return
  }

  const rect = canvas.getBoundingClientRect()

  if (rect.width === 0 || rect.height === 0) {
    if (retryCount < 15) {
      const timeoutId = setTimeout(() => {
        previewTimeoutIds.delete(retryKey)
        renderPreview(ctx, game, retryCount + 1, canvasHint)
      }, 50 * (retryCount + 1))
      previewTimeoutIds.set(retryKey, timeoutId)
    } else {
      console.error('[App] renderPreview: Canvas still has 0 size after 15 retries for game', game.id)
    }
    return
  }

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

  const animKey = canvas.id || game.id
  if (!ctx.previewAnimFrames.has(animKey)) {
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

/** 学习中心首页（与游戏中心 /home 分离） */
export function switchToLearning(ctx: PlatformContext) {
  closeAllOverlays()
  hideAllPageContainers()

  const learningContent = document.getElementById('learningContent')
  if (learningContent) learningContent.style.display = 'block'

  ctx.currentPage = 'learning'
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
  const ids = [
    'homeContent',
    'learningContent',
    'searchResults',
    'favoritesContent',
    'rankContent',
    'taskContent',
    'shopContent',
    'meContent',
  ]
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

  // 取消所有待处理的预览渲染重试
  previewTimeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
  previewTimeoutIds.clear()

  searchResults.style.display = 'block'
  void searchResults.offsetHeight

  if (searchCount) {
    searchCount.textContent = `找到 ${results.length} 个游戏`
  }

  if (searchGameList) {
    searchGameList.innerHTML = ''
    if (results.length > 0) {
      const gamesToPreview: PreviewTarget[] = []
      results.forEach((game, index) => {
        const best = ctx.store.bestScores[game.id] || 0
        const card = createGameCard(ctx, game, best)
        card.style.animationDelay = `${index * 55}ms`
        searchGameList.appendChild(card)
        const canvas = getPreviewCanvasFromCard(card)
        if (canvas) gamesToPreview.push({ game, canvas })
      })
      // 移除隐藏首页的旧 canvas 避免 ID 冲突
      document.querySelectorAll('#homeContent canvas[id^="preview_"]')
        .forEach(el => el.remove())
      if (noResults) noResults.style.display = 'none'
      scheduleCardPreviews(ctx, gamesToPreview, 30)
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

  // 取消所有待处理的预览渲染重试
  previewTimeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
  previewTimeoutIds.clear()

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
      const gamesToPreview: PreviewTarget[] = []
      favoriteGames.forEach((game) => {
        const best = ctx.store.bestScores[game.id] || 0
        const card = createGameCard(ctx, game, best)
        favoritesGameList.appendChild(card)
        const canvas = getPreviewCanvasFromCard(card)
        if (canvas) gamesToPreview.push({ game, canvas })
      })
      if (noFavorites) noFavorites.style.display = 'none'

      scheduleCardPreviews(ctx, gamesToPreview)

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