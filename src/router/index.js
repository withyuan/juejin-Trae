import { createRouter, createWebHistory } from 'vue-router'

import SnakeGame from '../components/SnakeGame.vue'
import Game2048 from '../components/Game2048.vue'
import BreakoutGame from '../components/BreakoutGame.vue'

const routes = [
  {
    path: '/',
    name: 'GameHome',
    component: () => import('../views/GameHome.vue')
  },
  {
    path: '/tank',
    name: 'TankGame',
    component: () => import('../components/TankGame.vue')
  },
  {
    path: '/tetris',
    name: 'TetrisGame',
    component: () => import('../components/TetrisGame.vue')
  },
  {
    path: '/racing',
    name: 'RacingGame',
    component: () => import('../components/RacingGame.vue')
  },
  {
    path: '/snake',
    name: 'SnakeGame',
    component: SnakeGame
  },
  {
    path: '/2048',
    name: 'Game2048',
    component: Game2048
  },
  {
    path: '/breakout',
    name: 'BreakoutGame',
    component: BreakoutGame
  },
  {
    path: '/contra',
    name: 'ContraGame',
    component: () => import('../components/ContraGame.vue')
  },
  {
    path: '/airplane',
    name: 'AirplaneGame',
    component: () => import('../components/AirplaneGame.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router