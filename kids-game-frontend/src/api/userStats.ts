import { apiClient } from '@/services/api-client.service'

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
  sufficient: number
  insufficient: number
  exhausted: number
}

export interface GameTimeRank {
  userId: number
  nickname: string
  totalTime: number
}

export function getUserStats() {
  return apiClient.get<UserStats>('/api/user-stats/overview')
}

export function getUserActivityTrend(days: number = 7) {
  return apiClient.get<UserTrendData[]>('/api/user-stats/activity-trend', {
    params: { days },
  } as never)
}

export function getFatigueStats() {
  return apiClient.get<FatigueStats[]>('/api/user-stats/fatigue')
}

export function getGameTimeTop10() {
  return apiClient.get<GameTimeRank[]>('/api/user-stats/game-time-top10')
}

export function getUserTypeDistribution() {
  return apiClient.get<unknown>('/api/user-stats/type-distribution')
}