/**
 * 平台 API 调用工具
 * 用于独立部署的游戏向平台提交成绩
 */

import axios, { AxiosError } from 'axios'

// 平台 API 基础 URL（从 URL 参数或配置获取）
function getPlatformBaseUrl(): string {
  // 优先使用 URL 参数中的 platformUrl
  const urlParams = new URLSearchParams(window.location.search)
  const platformUrl = urlParams.get('platform_url')
  if (platformUrl) {
    return platformUrl
  }
  
  // 从 localStorage 获取
  const stored = localStorage.getItem('platformUrl')
  if (stored) {
    return stored
  }
  
  // 默认值（开发环境）
  return 'http://localhost:8080'
}

// 获取 sessionToken
export function getSessionToken(): string | null {
  // 优先从 URL 参数获取
  const urlParams = new URLSearchParams(window.location.search)
  const sessionToken = urlParams.get('session_token')
  if (sessionToken) {
    return sessionToken
  }
  
  // 从 localStorage 获取
  return localStorage.getItem('sessionToken')
}

// 获取 gameId
export function getGameId(): number | null {
  const urlParams = new URLSearchParams(window.location.search)
  const gameId = urlParams.get('game_id')
  if (gameId) {
    return parseInt(gameId, 10)
  }
  
  const stored = localStorage.getItem('currentGameId')
  if (stored) {
    return parseInt(stored, 10)
  }
  
  return null
}

// 验证会话有效性
export async function verifySession(): Promise<{
  valid: boolean
  sessionId?: number
  userId?: number
  gameId?: number
  message?: string
}> {
  const sessionToken = getSessionToken()
  if (!sessionToken) {
    return { valid: false, message: '无 sessionToken' }
  }
  
  try {
    const response = await axios.get(`${getPlatformBaseUrl()}/api/game/verify`, {
      params: { sessionToken },
      timeout: 5000
    })
    
    if (response.data.code === 0) {
      const data = response.data.data
      return {
        valid: true,
        sessionId: data.sessionId,
        userId: data.userId,
        gameId: data.gameId
      }
    } else {
      return { valid: false, message: response.data.message }
    }
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('验证会话失败:', axiosError.message)
    return { valid: false, message: '验证会话失败' }
  }
}

// 游戏成绩上报请求体
export interface GameReportRequest {
  sessionToken: string
  score: number
  duration: number  // 游戏时长（秒）
  level?: number
  isWin?: boolean
  details?: Record<string, any>
}

// 游戏成绩上报响应
export interface GameReportResponse {
  code: number
  message: string
  data?: {
    consumePoints: number
    sessionId: number
    userId: number
    gameId: number
  }
}

/**
 * 上报游戏成绩到平台
 * @param request 成绩数据
 * @returns 上报结果
 */
export async function reportGameResult(request: GameReportRequest): Promise<{
  success: boolean
  message: string
  consumePoints?: number
}> {
  const { sessionToken, score, duration, level, isWin, details } = request
  
  if (!sessionToken) {
    return { success: false, message: '无 sessionToken，无法上报成绩' }
  }
  
  try {
    const response = await axios.post<GameReportResponse>(
      `${getPlatformBaseUrl()}/api/game/report`,
      {
        sessionToken,
        score,
        duration,
        level,
        isWin,
        details
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.data.code === 0) {
      console.log('✅ 成绩上报成功:', response.data.data)
      return {
        success: true,
        message: '成绩上报成功',
        consumePoints: response.data.data?.consumePoints
      }
    } else {
      console.error('成绩上报失败:', response.data.message)
      return { success: false, message: response.data.message }
    }
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('成绩上报失败:', axiosError.message)
    
    // 如果是网络错误，给出更友好的提示
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
      return { success: false, message: '无法连接到平台服务器' }
    }
    
    return { 
      success: false, 
      message: axiosError.response?.data 
        ? (axiosError.response.data as any).message 
        : '成绩上报失败' 
    }
  }
}

/**
 * 检查是否运行在独立部署模式
 * 即是否有 sessionToken 参数
 */
export function isStandaloneMode(): boolean {
  return !!getSessionToken()
}

export default {
  getSessionToken,
  getGameId,
  verifySession,
  reportGameResult,
  isStandaloneMode,
  getPlatformBaseUrl
}
