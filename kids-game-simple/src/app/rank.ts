import type { PlatformContext } from './types'
import { GAMES, MOCK_RANK_DATA } from '../games/gameRegistry'
import { isGameVisible } from '../games/gameRegistry'
import { storageService } from '../services/storage'
import { userService } from '../services/userService'
import { getTopList, type LeaderboardEntry } from '../services/leaderboardService'

// ==================== 排行榜显示 ====================

export function showRank(ctx: PlatformContext) {
  ctx.currentPage = 'rank'
  initRankGameSelector(ctx)

  const bestScores = userService.isLoggedIn
    ? (userService.current?.bestScores || {})
    : storageService.get().bestScores
  const gamesWithScores = Object.entries(bestScores)
    .filter(([_, score]) => score > 0)
    .map(([gameId]) => gameId)

  if (gamesWithScores.length > 0) {
    const select = document.getElementById('rankGameSelect') as HTMLSelectElement
    select.value = gamesWithScores[0]
    renderRank(ctx, 'global', gamesWithScores[0])
  } else {
    renderRank(ctx, 'global', '')
  }
}

export function showRankForGame(ctx: PlatformContext, gameId: string) {
  ctx.currentPage = 'rank'
  initRankGameSelector(ctx)

  const select = document.getElementById('rankGameSelect') as HTMLSelectElement
  select.value = gameId

  renderRank(ctx, 'global', gameId)
}

export function closeRank() {
  // 页面模式不需要操作，由页面切换控制
}

export function initRankGameSelector(ctx: PlatformContext) {
  const select = document.getElementById('rankGameSelect') as HTMLSelectElement
  if (!select) return

  select.innerHTML = '<option value="">-- 选择游戏 --</option>'

  GAMES.filter(g => isGameVisible(g.id)).forEach(game => {
    const option = document.createElement('option')
    option.value = game.id
    option.textContent = game.name
    select.appendChild(option)
  })

  select.onchange = () => {
    const activeTab = document.querySelector('.rank-tab.active')
    const tabType = activeTab?.getAttribute('data-tab') || 'global'
    renderRank(ctx, tabType, select.value)
  }
}

export async function renderRank(ctx: PlatformContext, type: string, gameId?: string) {
  const list = document.getElementById('rankList')!

  console.log('[App] renderRank 被调用', { type, gameId, isLoggedIn: userService.isLoggedIn })

  list.innerHTML = '<div style="text-align:center;padding:40px;color:#aaa;">加载中...</div>'

  let items: { name: string; score: number }[] = []

  if (gameId && userService.isLoggedIn) {
    try {
      const numericGameId = convertGameIdToNumber(gameId)
      console.log('[App] 转换后的 gameId:', numericGameId)

      let rankType: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' = 'ALL'
      if (type === 'daily') rankType = 'DAILY'
      else if (type === 'monthly') rankType = 'MONTHLY'
      else if (type === 'yearly') rankType = 'YEARLY'

      const cacheKey = `${gameId}_${rankType}`
      console.log('[App] 缓存 key:', cacheKey, '缓存存在:', ctx.rankCache.has(cacheKey))

      let leaderboardData: LeaderboardEntry[]
      if (ctx.rankCache.has(cacheKey)) {
        leaderboardData = ctx.rankCache.get(cacheKey)!
        console.log('[App] 使用缓存的排行榜数据:', cacheKey, '条数:', leaderboardData.length)
      } else {
        console.log('[App] 从后端获取排行榜...', { gameId: numericGameId, rankType })
        const result = await getTopList(numericGameId, rankType, 50)
        leaderboardData = result.list
        ctx.rankCache.set(cacheKey, leaderboardData)
        setTimeout(() => ctx.rankCache.delete(cacheKey), 30000)
        console.log('[App] 从后端获取排行榜数据成功:', cacheKey, leaderboardData.length, '条')
      }

      items = leaderboardData.map(entry => ({
        name: entry.nickname || entry.username,
        score: entry.score
      }))
      console.log('[App] 排行榜数据转换完成，共', items.length, '条')
    } catch (e) {
      console.error('[App] 获取排行榜失败:', e)
      items = MOCK_RANK_DATA.slice()
    }
  } else {
    console.log('[App] 使用模拟数据', { hasGameId: !!gameId, isLoggedIn: userService.isLoggedIn })
    items = MOCK_RANK_DATA.slice()
  }

  if (type === 'daily' && items.length > 0) {
    items = items.map(x => ({ ...x, score: Math.round(x.score * 0.7 + Math.random() * 500) }))
  }
  if (type === 'friend') {
    items = items.slice(0, 8)
  }

  const bestScores = userService.isLoggedIn
    ? (userService.current?.bestScores || {})
    : storageService.get().bestScores
  const myName = userService.isLoggedIn ? (userService.current?.username || '玩家') : '玩家'

  const myBest = gameId ? (bestScores[gameId] || 0) : 0

  const myRankCard = document.getElementById('myRankCard')!
  const myRankPosition = document.getElementById('myRankPosition')!
  const myRankScore = document.getElementById('myRankScore')!

  if (myBest > 0 && type === 'global') {
    const meIdx = items.findIndex(i => i.name === myName)
    if (meIdx >= 0) {
      items[meIdx].score = myBest
    } else {
      items.push({ name: myName, score: myBest })
    }

    myRankCard.style.display = 'flex'
    myRankScore.textContent = myBest.toLocaleString()
  } else {
    myRankCard.style.display = 'none'
  }

  items.sort((a, b) => b.score - a.score)

  if (myBest > 0 && type === 'global') {
    const myRank = items.findIndex(i => i.name === myName) + 1
    myRankPosition.textContent = myRank > 0 ? `#${myRank}` : '-'
  }

  list.innerHTML = items.map((item, i) => {
    const num = i + 1
    let cls = '', topIcon = ''
    if (num === 1) { cls = 'gold'; topIcon = '🥇' }
    else if (num === 2) { cls = 'silver'; topIcon = '🥈' }
    else if (num === 3) { cls = 'bronze'; topIcon = '🥉' }

    const isMe = item.name === myName
    const meClass = isMe ? ' rank-me' : ''
    const meBadge = isMe ? '<span class="me-badge">我</span>' : ''

    return `
        <div class="rank-item${meClass}" id="${isMe ? 'myRankItem' : ''}">
          <div class="rank-num ${cls} top3">${topIcon || num}</div>
          <div class="rank-avatar">${item.name[0]}</div>
          <div class="rank-name">
            ${item.name}
            ${meBadge}
          </div>
          <div class="rank-score">${item.score.toLocaleString()}</div>
        </div>
      `
  }).join('')
}

// ==================== 排名计算（本地） ====================

export function calculateRank(ctx: PlatformContext, score: number): { rank: number; badge: string; text: string } | null {
  if (!ctx.currentGame || score <= 0) return null

  let items = MOCK_RANK_DATA.slice()
  const myName = userService.isLoggedIn ? (userService.current?.username || '玩家') : '玩家'

  const playerEntry = { name: myName, score: score }
  items.push(playerEntry)

  items.sort((a, b) => b.score - a.score)

  const rank = items.findIndex(item => item.name === myName) + 1

  if (rank <= 0) return null

  let badge = ''
  let text = ''

  if (rank === 1) {
    badge = '🥇'
    text = '<strong style="color:#FFD700;font-size:18px">第 1 名</strong><br><span style="font-size:12px;color:#999">太厉害了！全球第一！</span>'
  } else if (rank === 2) {
    badge = '🥈'
    text = '<strong style="color:#C0C0C0;font-size:18px">第 2 名</strong><br><span style="font-size:12px;color:#999">非常棒！仅次于冠军！</span>'
  } else if (rank === 3) {
    badge = '🥉'
    text = '<strong style="color:#CD7F32;font-size:18px">第 3 名</strong><br><span style="font-size:12px;color:#999">优秀！登上领奖台！</span>'
  } else if (rank <= 10) {
    badge = '🏅'
    text = `<strong style="font-size:16px">第 ${rank} 名</strong><br><span style="font-size:12px;color:#999">进入前10，继续保持！</span>`
  } else if (rank <= 50) {
    badge = '🎖️'
    text = `<strong style="font-size:16px">第 ${rank} 名</strong><br><span style="font-size:12px;color:#999">前50名，表现不错！</span>`
  } else {
    badge = '📊'
    text = `<strong style="font-size:16px">第 ${rank} 名</strong><br><span style="font-size:12px;color:#999">继续加油，挑战更高排名！</span>`
  }

  return { rank, badge, text }
}

// ==================== 工具函数 ====================

export function convertGameIdToNumber(gameId: string): number {
  let hash = 0
  for (let i = 0; i < gameId.length; i++) {
    const char = gameId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % 10000 + 1
}

export function clearRankCache(ctx: PlatformContext, gameId: string) {
  console.log('[App] 清除排行榜缓存:', gameId)
  const types = ['ALL', 'DAILY', 'MONTHLY', 'YEARLY']
  types.forEach(type => {
    const cacheKey = `${gameId}_${type}`
    const had = ctx.rankCache.has(cacheKey)
    ctx.rankCache.delete(cacheKey)
    if (had) {
      console.log('[App] 已清除缓存:', cacheKey)
    }
  })
}