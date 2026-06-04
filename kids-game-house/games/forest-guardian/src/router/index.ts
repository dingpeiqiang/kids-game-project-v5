import { createRouter, createWebHistory } from 'vue-router'
import LoadingView from '@/views/LoadingView.vue'
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
      name: 'home',  // ✅ 使用不同的 name
      component: LoadingView,
    },
    {
      path: '/loading',
      name: 'loading',
      component: LoadingView,
    },
    {
      path: '/start',
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

// 全局路由守卫：UI 参数同步
router.beforeEach((to: any, from: any, next: any) => {
  // ⭐ 每次路由切换时统一初始化 UI 参数
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('🔀 路由切换:', from.path, '→', to.path)

  // ✅ 如果访问根路径，自动重定向到 loading（带查询参数时保持参数）
  if (to.path === '/' && !to.name) {
    next({ name: 'home', query: to.query })
    return
  }

  next()
})

export default router
