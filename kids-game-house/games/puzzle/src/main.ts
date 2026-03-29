/**
 * 游戏主入口
 *
 * 初始化 Vue 应用、路由、状态管理
 * 从 URL 参数中提取 token/用户信息/主题 ID，支持平台嵌入式启动
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

/**
 * 从 URL 参数中提取认证信息，存储到 localStorage
 * 允许游戏像独立应用一样验证用户身份
 */
function extractAuthFromUrl() {
  const params = new URLSearchParams(window.location.search)

  const token = params.get('token')
  if (token) {
    localStorage.setItem('token', token)
    console.log('✅ 已从 URL 参数保存 token')
  }

  const userInfo = params.get('user_info')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      if (user.userType === 1 || user.parentId) {
        localStorage.setItem('parentInfo', userInfo)
      } else {
        localStorage.setItem('userInfo', userInfo)
      }
      console.log('✅ 已从 URL 参数保存用户信息')
    } catch (e) {
      console.warn('⚠️ 解析用户信息失败:', e)
    }
  }

  const gameId = params.get('game_id')
  if (gameId) {
    localStorage.setItem('currentGameId', gameId)
    console.log('✅ 已从 URL 参数保存游戏 ID:', gameId)
  }

  const sessionToken = params.get('session_token')
  if (sessionToken) {
    localStorage.setItem('sessionToken', sessionToken)
    console.log('✅ 已从 URL 参数保存 sessionToken')
  }

  const platformUrl = params.get('platform_url')
  if (platformUrl) {
    localStorage.setItem('platformUrl', platformUrl)
    console.log('✅ 已从 URL 参数保存 platformUrl:', platformUrl)
  }
}

// 应用初始化前先提取 URL 认证信息
extractAuthFromUrl()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化主题 store
import { useThemeStore } from './stores/theme'
const themeStore = useThemeStore(pinia)

// 从 localStorage 读取游戏 ID 并设置
const savedGameId = localStorage.getItem('currentGameId')
if (savedGameId) {
  const gameId = parseInt(savedGameId, 10)
  if (!isNaN(gameId)) {
    themeStore.setGameId(gameId)
    console.log('🎮 已设置游戏 ID:', gameId)
  }
}

// 主题初始化完成后挂载应用
themeStore.init().catch(error => {
  console.error('❌ 主题初始化失败（后端不可用）:', error)
}).finally(() => {
  app.mount('#app')
})
