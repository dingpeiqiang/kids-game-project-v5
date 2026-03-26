/**
 * 平台 API 调用工具
 * 通用版本，支持所有游戏
 */

import axios, { AxiosError } from 'axios'

// 获取平台基础 URL
function getPlatformBaseUrl(): string {
  const urlParams = new URLSearchParams(window.location.search)
  const platformUrl = urlParams.get('platform_url')
  if (platformUrl) {
    return platformUrl
  }
  
  const stored = localStorage.getItem('platformUrl')
  if (stored) {
    return stored
  }
  
  return 'http://localhost:8080'
}

// 获取 sessionToken
export function getSessionToken(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  const sessionToken = urlParams.get('session_token')
  if (sessionToken) {
    return sessionToken
  }
  
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

// 验证会话
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
    console.error('验证会话失败:', (error as AxiosError).message)
    return { valid: false, message: '验证会话失败' }
  }
}

// 成绩上报请求体
export interface GameReportRequest {
  sessionToken: string
  score: number
  duration: number
  level?: number
  isWin?: boolean
  details?: Record<string, any>
}

// 成绩上报响应
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
 * 上报游戏成绩
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
      return { 
        success: false, 
        message: response.data.message || `成绩上报失败 (code: ${response.data.code})` 
      }
    }
  } catch (error) {
    const axiosError = error as AxiosError
    
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
      console.warn('⚠️ 无法连接到平台服务器，请检查后端是否启动')
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

// 检查是否为独立部署模式
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
