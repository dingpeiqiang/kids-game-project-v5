/**
 * 平台 API 调用工具
 * 通用版本，支持所有游戏
 */

import type { GameReportRequest, GameReportResponse } from '../types/game.types'

// ============================================================================
// 🔧 工具函数
// ============================================================================

/**
 * 获取平台基础 URL
 */
export function getPlatformBaseUrl(): string {
  const urlParams = new URLSearchParams(window.location.search)
  const platformUrl = urlParams.get('platform_url')
  if (platformUrl) return platformUrl

  const stored = localStorage.getItem('platformUrl')
  if (stored) return stored

  return 'http://localhost:8080'
}

/**
 * 获取 sessionToken（优先从 URL 参数获取）
 */
export function getSessionToken(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  const sessionToken = urlParams.get('session_token')
  if (sessionToken) return sessionToken
  return localStorage.getItem('sessionToken')
}

/**
 * 获取游戏 ID（优先从 URL 参数获取）
 */
export function getGameId(): number | null {
  const urlParams = new URLSearchParams(window.location.search)
  const gameId = urlParams.get('game_id')
  if (gameId) return parseInt(gameId, 10)

  const stored = localStorage.getItem('currentGameId')
  if (stored) return parseInt(stored, 10)

  return null
}

/**
 * 检查是否为独立部署模式（通过 sessionToken 判断）
 */
export function isStandaloneMode(): boolean {
  return !!getSessionToken()
}

/**
 * 从 URL 参数提取并保存认证信息到 localStorage
 * 供各游戏的 main.ts 调用
 */
export function extractAuthFromUrl(): void {
  const urlParams = new URLSearchParams(window.location.search)

  const token = urlParams.get('token')
  if (token) {
    localStorage.setItem('token', token)
    console.log('✅ 已从 URL 参数保存 token')
  }

  const userInfo = urlParams.get('user_info')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      if (user.userType === 1 || user.parentId) {
        localStorage.setItem('parentInfo', userInfo)
        console.log('✅ 已保存家长信息')
      } else {
        localStorage.setItem('userInfo', userInfo)
        console.log('✅ 已保存儿童信息')
      }
    } catch (e) {
      console.warn('⚠️ 解析用户信息失败:', e)
    }
  }

  const gameId = urlParams.get('game_id')
  if (gameId) {
    localStorage.setItem('currentGameId', gameId)
    console.log('🎮 已设置游戏 ID:', gameId)
  }

  const sessionToken = urlParams.get('session_token')
  if (sessionToken) {
    localStorage.setItem('sessionToken', sessionToken)
    console.log('✅ 已保存 sessionToken')
  }

  const platformUrl = urlParams.get('platform_url')
  if (platformUrl) {
    localStorage.setItem('platformUrl', platformUrl)
    console.log('✅ 已保存 platformUrl:', platformUrl)
  }
}

// ============================================================================
// 🌐 API 请求
// ============================================================================

/**
 * 验证会话有效性
 */
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
    const response = await fetch(
      `${getPlatformBaseUrl()}/api/game/verify?sessionToken=${encodeURIComponent(sessionToken)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await response.json()

    if (data.code === 0) {
      return {
        valid: true,
        sessionId: data.data.sessionId,
        userId: data.data.userId,
        gameId: data.data.gameId
      }
    }
    return { valid: false, message: data.message }
  } catch (error) {
    console.error('验证会话失败:', error)
    return { valid: false, message: '验证会话失败' }
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
    const response = await fetch(`${getPlatformBaseUrl()}/api/game/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, score, duration, level, isWin, details }),
      signal: AbortSignal.timeout(10000)
    })

    const result: GameReportResponse = await response.json()

    if (result.code === 0) {
      console.log('✅ 成绩上报成功:', result.data)
      return {
        success: true,
        message: '成绩上报成功',
        consumePoints: result.data?.consumePoints
      }
    }
    return {
      success: false,
      message: result.message || `成绩上报失败 (code: ${result.code})`
    }
  } catch (error: any) {
    const message = error?.message || '未知错误'
    if (message.includes('ECONNREFUSED') || message.includes('network')) {
      console.warn('⚠️ 无法连接到平台服务器，请检查后端是否启动')
      return { success: false, message: '无法连接到平台服务器' }
    }
    return { success: false, message: `成绩上报失败：${message}` }
  }
}

export default {
  getPlatformBaseUrl,
  getSessionToken,
  getGameId,
  isStandaloneMode,
  extractAuthFromUrl,
  verifySession,
  reportGameResult
}
