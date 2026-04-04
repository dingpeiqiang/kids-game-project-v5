import { createRouter, createWebHistory } from 'vue-router'
import StartView from '@/views/StartView.vue'
import DifficultyView from '@/views/DifficultyView.vue'
import GameView from '@/views/GameView.vue'
import GameOverView from '@/views/GameOverView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ⭐ 根路径直接跳转到游戏页（GameView 内部显示加载 UI）
    {
      path: '/',
      redirect: '/game',
    },
    {
      path: '/loading',
      redirect: '/game',
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
    // ⭐ 游戏页面（包含真实的 Phaser 加载进度 UI）
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

export default router
