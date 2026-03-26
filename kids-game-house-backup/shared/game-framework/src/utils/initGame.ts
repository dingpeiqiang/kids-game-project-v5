/**
 * 通用游戏主入口模板
 * 所有游戏共享的初始化逻辑
 */

import { createApp, type App } from 'vue'

/**
 * 从 URL 参数提取认证信息
 */
function extractAuthFromUrl() {
  const urlParams = new URLSearchParams(window.location.search)
  
  // 提取 token
  const token = urlParams.get('token')
  if (token) {
    localStorage.setItem('token', token)
    console.log('✅ 已从 URL 参数保存 token')
  }
  
  // 提取用户信息
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
  
  // 提取游戏 ID
  const gameId = urlParams.get('game_id')
  if (gameId) {
    localStorage.setItem('currentGameId', gameId)
    console.log('🎮 已设置游戏 ID:', gameId)
  }
  
  // 提取 sessionToken
  const sessionToken = urlParams.get('session_token')
  if (sessionToken) {
    localStorage.setItem('sessionToken', sessionToken)
    console.log('✅ 已保存 sessionToken')
  }
  
  // 提取 platformUrl
  const platformUrl = urlParams.get('platform_url')
  if (platformUrl) {
    localStorage.setItem('platformUrl', platformUrl)
    console.log('✅ 已保存 platformUrl:', platformUrl)
  }
}

/**
 * 初始化应用
 * @param rootComponent 根组件
 * @param onBeforeMount 挂载前回调（用于游戏特定初始化）
 * @returns Vue 应用实例
 */
export function initGame(
  rootComponent: any,
  onBeforeMount?: (app: App) => void
): App {
  // 提取 URL 参数中的认证信息
  extractAuthFromUrl()
  
  // 创建应用
  const app = createApp(rootComponent)
  
  // 执行游戏特定的初始化
  if (onBeforeMount) {
    onBeforeMount(app)
  }
  
  return app
}

export default initGame
