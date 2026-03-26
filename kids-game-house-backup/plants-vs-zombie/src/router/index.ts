import { createRouter, createWebHistory } from 'vue-router'
import StartView from '@/views/StartView.vue'
import DifficultyView from '@/views/DifficultyView.vue'
import PvzGame from '@/components/game/PvzGame.vue'
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
      component: PvzGame
    },
    {
      path: '/gameover',
      name: 'gameover',
      component: GameOverView
    }
  ]
})

export default router
