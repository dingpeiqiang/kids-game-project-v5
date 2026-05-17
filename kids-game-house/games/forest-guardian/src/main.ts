/**
 * 游戏主入口
 *
 * 初始化 Vue 应用、路由、状态管理
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

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
