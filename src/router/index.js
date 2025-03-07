import { createRouter, createWebHistory } from 'vue-router'

import AdventureGame from '../components/AdventureGame.vue'
import SnakeGame from '../components/SnakeGame.vue'
import Game2048 from '../components/Game2048.vue'
import BreakoutGame from '../components/BreakoutGame.vue'
import NumberPuzzleGame from '../components/NumberPuzzleGame.vue'
import PingPongGame from '../components/PingPongGame.vue'

const routes = [
  {
    path: '/kids-exercise',
    name: 'KidsExercise',
    component: () => import('../components/KidsExerciseGame.vue')
  },
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
  },
  {
    path: '/number-puzzle',
    name: 'NumberPuzzle',
    component: NumberPuzzleGame
  },
  {
    path: '/ping-pong',
    name: 'PingPong',
    component: PingPongGame
  },
  {
    path: '/adventure',
    name: 'AdventureGame',
    component: AdventureGame
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router