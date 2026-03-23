import request from '@/utils/request'

export interface UserStats {
  totalUsers: number
  kidCount: number
  parentCount: number
  adminCount: number
  onlineCount: number
}

export interface UserTrendData {
  date: string
  loginCount: number
  gameCount: number
  answerCount: number
}

export interface FatigueStats {
  sufficient: number    // 疲劳点充足
  insufficient: number  // 疲劳点不足
  exhausted: number     // 疲劳点已耗尽
}

export interface GameTimeRank {
  userId: number
  nickname: string
  totalTime: number
}

/**
 * 获取用户统计数据
 */
export function getUserStats() {
  return request<UserStats>({
    url: '/api/user-stats/overview',
    method: 'get'
  })
}

/**
 * 获取用户活跃度趋势（近 7 天）
 */
export function getUserActivityTrend(days: number = 7) {
  return request<UserTrendData[]>({
    url: '/api/user-stats/activity-trend',
    method: 'get',
    params: { days }
  })
}

/**
 * 获取疲劳点统计
 */
export function getFatigueStats() {
  return request<FatigueStats[]>({
    url: '/api/user-stats/fatigue',
    method: 'get'
  })
}

/**
 * 获取游戏时长排行榜 TOP10
 */
export function getGameTimeTop10() {
  return request<GameTimeRank[]>({
    url: '/api/user-stats/game-time-top10',
    method: 'get'
  })
}

/**
 * 获取用户类型分布
 */
export function getUserTypeDistribution() {
  return request<any>({
    url: '/api/user-stats/type-distribution',
    method: 'get'
  })
}

/**
 * 获取用户状态分布
 */
export function getUserStatusDistribution() {
  return request<any>({
    url: '/api/user-stats/status-distribution',
    method: 'get'
  })
}
