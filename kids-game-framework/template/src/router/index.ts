import { createRouter, createWebHistory } from 'vue-router'
import StartView from '@/views/StartView.vue'
import GameView from '@/views/GameView.vue'
import GameOverView from '@/views/GameOverView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView
    },
    {
      path: '/game',
      name: 'game',
      component: GameView
    },
    {
      path: '/gameover',
      name: 'gameover',
      component: GameOverView
    }
  ]
})
