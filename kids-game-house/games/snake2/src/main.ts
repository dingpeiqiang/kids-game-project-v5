import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

/**
 * 从 URL 参数中提取 token 和用户信息，存储到 localStorage
 * 这样游戏可以像独立应用一样验证用户身份
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
      // 判断用户类型并存储到对应的位置
      if (user.userType === 1 || user.parentId) {
        localStorage.setItem('parentInfo', userInfo)
        console.log('✅ 已从 URL 参数保存家长信息')
      } else {
        localStorage.setItem('userInfo', userInfo)
        console.log('✅ 已从 URL 参数保存儿童信息')
      }
    } catch (e) {
      console.warn('⚠️ 解析用户信息失败:', e)
    }
  }
  
  // 提取游戏 ID
  const gameId = urlParams.get('game_id')
  if (gameId) {
    // 存储到 localStorage，稍后在 themeStore 初始化时读取
    localStorage.setItem('currentGameId', gameId)
    console.log('✅ 已从 URL 参数保存游戏 ID:', gameId)
  }
  
  // 提取 sessionToken（独立部署模式必需）
  const sessionToken = urlParams.get('session_token')
  if (sessionToken) {
    localStorage.setItem('sessionToken', sessionToken)
    console.log('✅ 已从 URL 参数保存 sessionToken')
  }
  
  // 提取 platformUrl（可选，用于独立部署时指定平台地址）
  const platformUrl = urlParams.get('platform_url')
  if (platformUrl) {
    localStorage.setItem('platformUrl', platformUrl)
    console.log('✅ 已从 URL 参数保存 platformUrl:', platformUrl)
  }
}

// 在应用初始化前，先提取 URL 参数中的认证信息
extractAuthFromUrl()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化主题
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

// 等待主题初始化完成后再挂载应用
themeStore.init().catch(error => {
  console.error('❌ 主题初始化失败（后端不可用）:', error)
  // 不再提供降级配置，由用户在页面上看到错误提示
}).finally(() => {
  app.mount('#app')
})
