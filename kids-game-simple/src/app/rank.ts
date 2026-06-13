import type { PlatformContext } from './types'
import { GAMES } from '../games/gameRegistry'
import { isGameVisible } from '../games/gameRegistry'
import { storageService } from '../services/storage'
import { userService } from '../services/userService'
import { apiSessionLeaderboard } from '../services/apiClient'

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

  if (gameId) {
    try {
      const numericId = convertGameIdToNumber(gameId)
      const cacheKey = `session_${numericId}`
      let listData: Array<{ rank: number; nickname?: string; username?: string; score: number }>
      if (ctx.rankCache.has(cacheKey)) {
        listData = ctx.rankCache.get(cacheKey)!
      } else {
        const result = await apiSessionLeaderboard(numericId, 100)
        listData = result.ok ? result.list : []
        ctx.rankCache.set(cacheKey, listData)
        setTimeout(() => ctx.rankCache.delete(cacheKey), 30000)
      }
      items = listData.map(entry => ({
        name: entry.nickname || entry.username || '玩家',
        score: entry.score,
      }))
    } catch (e) {
      console.error('[App] 获取单局排行榜失败:', e)
    }
  }

  if (items.length === 0) {
    const msg = userService.isLoggedIn
      ? '<div style="text-align:center;padding:40px;color:#999;">暂无排行数据<br><span style="font-size:12px">快去玩游戏上榜吧！</span></div>'
      : '<div style="text-align:center;padding:40px;color:#999;">登录后可查看排行</div>'
    list.innerHTML = msg
    const myRankCard = document.getElementById('myRankCard')!
    myRankCard.style.display = 'none'
    return
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

  let rank: number
  let badge: string
  let text: string

  if (score >= 9000) {
    rank = 1
    badge = '🥇'
    text = '<strong style="color:#FFD700;font-size:18px">第 1 名</strong><br><span style="font-size:12px;color:#999">太厉害了！全球第一！</span>'
  } else if (score >= 7000) {
    rank = 2
    badge = '🥈'
    text = '<strong style="color:#C0C0C0;font-size:18px">第 2 名</strong><br><span style="font-size:12px;color:#999">非常棒！仅次于冠军！</span>'
  } else if (score >= 5000) {
    rank = 3
    badge = '🥉'
    text = '<strong style="color:#CD7F32;font-size:18px">第 3 名</strong><br><span style="font-size:12px;color:#999">优秀！登上领奖台！</span>'
  } else if (score >= 3000) {
    rank = 8
    badge = '🏅'
    text = '<strong style="font-size:16px">进入前10</strong><br><span style="font-size:12px;color:#999">进入前10，继续保持！</span>'
  } else if (score >= 1000) {
    rank = 30
    badge = '🎖️'
    text = '<strong style="font-size:16px">进入前50</strong><br><span style="font-size:12px;color:#999">前50名，表现不错！</span>'
  } else {
    rank = 100
    badge = '📊'
    text = '<strong style="font-size:16px">继续加油</strong><br><span style="font-size:12px;color:#999">挑战更高排名！</span>'
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