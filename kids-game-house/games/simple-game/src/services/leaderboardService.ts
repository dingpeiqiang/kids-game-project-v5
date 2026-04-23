/**
 * leaderboardService.ts — 排行榜服务（对接后端 API）
 *
 * API 端点：
 *   GET  /api/leaderboard/top          — 获取排行榜 TOP N（公开）
 *   GET  /api/leaderboard/user-rank    — 获取用户排名（需 token）
 *   POST /api/leaderboard/submit       — 提交分数（需 token）
 *   GET  /api/leaderboard/my-ranks     — 批量获取我的排名（需 token）
 */
import { apiClient, tokenStore } from './apiClient'

// ─────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────

/** 排行榜条目 */
export interface LeaderboardEntry {
  rank: number       // 排名
  userId: number      // 用户ID
  username: string    // 用户名
  nickname: string    // 昵称
  avatar: string      // 头像
  score: number       // 分数
  extraData?: any     // 额外数据
}

/** 排行榜响应 */
export interface LeaderboardResponse {
  rankType: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY'
  list: LeaderboardEntry[]
}

/** 用户排名信息 */
export interface UserRankInfo {
  rank: number | null   // 排名，null 表示无记录
  score: number          // 分数
  hasRecord: boolean     // 是否有记录
}

/** 分数提交请求 */
export interface SubmitScoreRequest {
  gameId: number
  score: number
}

/** 分数提交响应 */
export interface SubmitScoreResponse {
  success: boolean
  rank: number | null   // 当前排名
  bestScore: number     // 最佳分数
  msg: string
}

// ─────────────────────────────────────────
// API 函数
// ─────────────────────────────────────────

/**
 * 获取排行榜 TOP N
 * @param gameId 游戏ID
 * @param type   排行类型：ALL/DAILY/MONTHLY/YEARLY
 * @param limit  返回数量，默认 20
 */
export async function getTopList(
  gameId: number,
  type: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' = 'ALL',
  limit = 20
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({
    gameId: String(gameId),
    type,
    limit: String(limit)
  })

  const res = await fetch(`${apiClient.baseUrl}/leaderboard/top?${params}`, {
    headers: apiClient.getHeaders()
  })

  if (!res.ok) throw new Error(`获取排行榜失败: ${res.status}`)
  const data = await res.json()

  if (data.code !== 200) throw new Error(data.msg || '获取排行榜失败')

  // 转换字段名（后端驼峰转前端）
  return {
    rankType: data.data.rankType,
    list: (data.data.list || []).map((item: any) => ({
      rank: item.rank,
      userId: item.userId,
      username: item.username,
      nickname: item.nickname,
      avatar: item.avatar,
      score: item.score,
      extraData: item.extraData
    }))
  }
}

/**
 * 获取用户在指定游戏中的排名
 * @param gameId 游戏ID
 * @param accessToken 访问令牌
 */
export async function getUserRank(
  gameId: number,
  accessToken: string
): Promise<UserRankInfo> {
  const params = new URLSearchParams({
    gameId: String(gameId),
    accessToken
  })

  const res = await fetch(`${apiClient.baseUrl}/leaderboard/user-rank?${params}`, {
    headers: apiClient.getHeaders()
  })

  if (!res.ok) throw new Error(`获取排名失败: ${res.status}`)
  const data = await res.json()

  if (data.code !== 200) throw new Error(data.msg || '获取排名失败')

  return {
    rank: data.data.rank,
    score: data.data.score,
    hasRecord: data.data.hasRecord
  }
}

/**
 * 提交游戏分数
 * @param gameId 游戏ID
 * @param score  分数
 * @param accessToken 访问令牌
 */
export async function submitScore(
  gameId: number,
  score: number,
  accessToken: string
): Promise<SubmitScoreResponse> {
  const url = `${apiClient.baseUrl}/leaderboard/submit`
  console.log('[leaderboardService] submitScore 被调用', { url, gameId, score })
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...apiClient.getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      gameId,
      score,
      accessToken
    })
  })

  console.log('[leaderboardService] fetch 响应状态:', res.status)

  if (!res.ok) throw new Error(`提交分数失败: ${res.status}`)
  const data = await res.json()
  console.log('[leaderboardService] 响应数据:', data)

  if (data.code !== 200) throw new Error(data.msg || '提交分数失败')

  return {
    success: data.data.success,
    rank: data.data.rank,
    bestScore: data.data.bestScore,
    msg: data.data.msg
  }
}

/**
 * 批量获取用户在多个游戏中的排名
 * @param gameIds 游戏ID列表
 * @param userId  用户ID
 */
export async function getBatchUserRank(
  gameIds: number[],
  userId: number
): Promise<Record<number, UserRankInfo>> {
  const res = await fetch(`${apiClient.baseUrl}/leaderboard/batch-user-rank`, {
    method: 'POST',
    headers: {
      ...apiClient.getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      gameIds
    })
  })

  if (!res.ok) throw new Error(`批量获取排名失败: ${res.status}`)
  const data = await res.json()

  if (data.code !== 200) throw new Error(data.msg || '批量获取排名失败')

  // 转换结果
  const result: Record<number, UserRankInfo> = {}
  for (const [gameId, info] of Object.entries(data.data)) {
    const item = info as any
    result[Number(gameId)] = {
      rank: item.rank,
      score: item.score,
      hasRecord: item.hasRecord
    }
  }
  return result
}

/**
 * 获取当前用户的所有游戏排名
 * @param gameIds 游戏ID列表
 */
export async function getMyRanks(
  gameIds: number[]
): Promise<Record<number, UserRankInfo>> {
  const accessToken = tokenStore.getAccess()
  if (!accessToken) throw new Error('请先登录')

  const params = new URLSearchParams({
    accessToken,
    gameIds: gameIds.join(',')
  })

  const res = await fetch(`${apiClient.baseUrl}/leaderboard/my-ranks?${params}`, {
    headers: apiClient.getHeaders()
  })

  if (!res.ok) throw new Error(`获取我的排名失败: ${res.status}`)
  const data = await res.json()

  if (data.code !== 200) throw new Error(data.msg || '获取我的排名失败')

  // 转换结果
  const result: Record<number, UserRankInfo> = {}
  for (const [gameId, info] of Object.entries(data.data)) {
    const item = info as any
    result[Number(gameId)] = {
      rank: item.rank,
      score: item.score,
      hasRecord: item.hasRecord
    }
  }
  return result
}

// ─────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────

/** 格式化排名显示 */
export function formatRank(rank: number | null): string {
  if (rank === null || rank === 0) return '--'
  if (rank === 1) return '🥇 1'
  if (rank === 2) return '🥈 2'
  if (rank === 3) return '🥉 3'
  return String(rank)
}

/** 格式化分数显示 */
export function formatScore(score: number): string {
  if (score >= 10000) {
    return (score / 10000).toFixed(1) + 'w'
  }
  if (score >= 1000) {
    return (score / 1000).toFixed(1) + 'k'
  }
  return String(score)
}
