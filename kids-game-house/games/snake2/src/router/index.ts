import { createRouter, createWebHistory } from 'vue-router'
import StartView from '@/views/StartView.vue'
import DifficultyView from '@/views/DifficultyView.vue'
import ComponentSnakeGame from '@/components/game/ComponentSnakeGame.vue'
import SnakeGame from '@/components/game/SnakeGame.vue'
import GameOverView from '@/views/GameOverView.vue'
import { initUIParams } from '@/utils/uiResponsive'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView
    },
    {
      path: '/games/snake2/test',
      name: 'SnakeGameV2',
      component: () => import('@/views/SnakeGameV2.vue')
    },
    {
      path: '/difficulty',
      name: 'difficulty',
      component: DifficultyView
    },
    {
      // ✅ 新架构入口（ComponentGameSceneV2 + EventBus 驱动 UI）
      path: '/game',
      name: 'game',
      component: () => import('@/views/SnakeGameV2.vue')

    },
    {
      // 🗄️ 旧架构保留（stores/game.ts 驱动），用于对照 / 回滚
      path: '/game-legacy',
      name: 'game-legacy',
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
  // ⭐ 初始化 UI 参数（确保所有页面切换时 UI 缩放一致）
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('🔀 路由切换:', from.path, '→', to.path, '| UI scale:', window.innerWidth, window.innerHeight)
  
  // 🔧 临时禁用登录检查（仅用于测试）
  // 如果要启用登录验证，取消下方注释
  /*
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
  */
  
  // ✅ 已登录或测试模式，继续导航
  next()
})

export default router
