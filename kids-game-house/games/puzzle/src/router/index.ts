import { createRouter, createWebHistory } from 'vue-router'
import StartView from '@/views/StartView.vue'
import DifficultyView from '@/views/DifficultyView.vue'
import GameView from '@/views/GameView.vue'
import GameOverView from '@/views/GameOverView.vue'
import { initUIParams } from '@/utils/uiResponsive'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView,
    },
    {
      path: '/difficulty',
      name: 'difficulty',
      component: DifficultyView,
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
    },
    {
      path: '/gameover',
      name: 'gameover',
      component: GameOverView,
    },
  ],
})

// 全局路由守卫：UI 参数同步 + 登录检测
router.beforeEach((to, from, next) => {
  // ⭐ 每次路由切换时统一初始化 UI 参数
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('🔀 路由切换:', from.path, '→', to.path)

  // 获取 token
  const token = localStorage.getItem('token')

  if (!token) {
    console.log('🔒 用户未登录，跳转到登录页')
    const currentPath = window.location.href
    const loginUrl = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
    window.location.href = loginUrl
    return
  }

  next()
})

export default router
