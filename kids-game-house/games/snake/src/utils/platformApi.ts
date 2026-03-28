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
    
    // ⭐ 支持多种成功状态码：0（传统）或 200（HTTP 标准）
    if (response.data.code === 0 || response.data.code === 200) {
      console.log('✅ 成绩上报成功:', response.data.data)
      return {
        success: true,
        message: '成绩上报成功',
        consumePoints: response.data.data?.consumePoints
      }
    } else {
      // ⭐ 后端返回错误（如 500），给出友好提示
      const errMsg = response.data.message || `成绩上报失败 (code: ${response.data.code})`
      console.info('ℹ️ 成绩上报未成功（后端响应）:', errMsg)
      return { success: false, message: errMsg }
    }
  } catch (error) {
    const axiosError = error as AxiosError
    
    // ⭐ 网络错误或后端不可用时，给出友好提示
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
      console.warn('⚠️ 无法连接到平台服务器，请检查后端是否启动')
      return { success: false, message: '无法连接到平台服务器' }
    }
    
    // ⭐ 其他错误，记录日志但不影响游戏
    console.info('ℹ️ 成绩上报请求异常:', axiosError.message)
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
