import { createRouter, createWebHistory } from 'vue-router'
import StartView from '@/views/StartView.vue'
import DifficultyView from '@/views/DifficultyView.vue'
import SnakeGame from '@/components/game/SnakeGame.vue'
import GameOverView from '@/views/GameOverView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView
    },
    {
      path: '/difficulty',
      name: 'difficulty',
      component: DifficultyView
    },
    {
      path: '/game',
      name: 'game',
      component: SnakeGame
    },
    {
      path: '/gameover',
      name: 'gameover',
      component: GameOverView
    }
  ]
})

// 全局路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  // 获取 token
  const token = localStorage.getItem('token')
  
  // 如果没有 token，说明未登录
  if (!token) {
    console.log('🔒 用户未登录，跳转到登录页')
    // 跳转到主系统的登录页
    // 保存当前路径，登录后可以返回
    const currentPath = window.location.href
    const loginUrl = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
    window.location.href = loginUrl
    return
  }
  
  // 已登录，继续导航
  next()
})

export default router
