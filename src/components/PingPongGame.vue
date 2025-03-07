<template>
  <div class="ping-pong-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" ref="gameContainer">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <div class="game-overlay" v-if="!isGameStarted">
      <div class="game-title">乒乓球对战</div>
      <div class="game-mode-selection">
        <el-button type="primary" size="large" @click="startSinglePlayerGame">单人模式</el-button>
        <el-button type="success" size="large" @click="startMultiPlayerGame">双人对战</el-button>
      </div>
      <div class="game-instructions">
        <h3>游戏说明：</h3>
        <div class="controls">
          <div class="player-one">
            <h4>玩家一：</h4>
            <p>W：上移</p>
            <p>S：下移</p>
          </div>
          <div class="player-two">
            <h4>玩家二：</h4>
            <p>↑：上移</p>
            <p>↓：下移</p>
          </div>
        </div>
      </div>
    </div>

    <div class="game-stats" v-if="isGameStarted">
      <div class="player-one-score">玩家一：{{ playerOneScore }}</div>
      <div class="game-timer" v-if="gameTimer > 0">{{ Math.ceil(gameTimer / 1000) }}s</div>
      <div class="player-two-score">{{ isMultiPlayer ? '玩家二' : 'AI' }}：{{ playerTwoScore }}</div>
    </div>

    <div class="game-over" v-if="isGameOver">
      <h2>游戏结束</h2>
      <p>{{ winner }} 获胜！</p>
      <div class="final-score">最终比分：{{ playerOneScore }} - {{ playerTwoScore }}</div>
      <el-button type="primary" @click="restartGame">再来一局</el-button>
      <el-button @click="backToMenu">返回菜单</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 游戏画布尺寸
const canvasWidth = 800
const canvasHeight = 600

// 游戏状态
const isGameStarted = ref(false)
const isGameOver = ref(false)
const isMultiPlayer = ref(false)
const playerOneScore = ref(0)
const playerTwoScore = ref(0)
const winner = ref('')
const gameTimer = ref(0)

// DOM引用
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 游戏对象
const paddleWidth = 10
const paddleHeight = 100
const ballSize = 10
const paddleSpeed = 8
const initialBallSpeed = 5

const playerOne = ref({
  x: 50,
  y: canvasHeight / 2 - paddleHeight / 2,
  dy: 0,
  score: 0
})

const playerTwo = ref({
  x: canvasWidth - 50 - paddleWidth,
  y: canvasHeight / 2 - paddleHeight / 2,
  dy: 0,
  score: 0
})

const ball = ref({
  x: canvasWidth / 2,
  y: canvasHeight / 2,
  dx: initialBallSpeed,
  dy: 0,
  speed: initialBallSpeed
})

// 按键状态
const keys = ref({
  w: false,
  s: false,
  up: false,
  down: false
})

// 游戏循环
let gameLoop = null
let aiUpdateInterval = null

// 开始单人游戏
const startSinglePlayerGame = () => {
  isMultiPlayer.value = false
  startGame()
  initAI()
}

// 开始双人游戏
const startMultiPlayerGame = () => {
  isMultiPlayer.value = true
  startGame()
}

// 开始游戏
const startGame = () => {
  isGameStarted.value = true
  isGameOver.value = false
  playerOneScore.value = 0
  playerTwoScore.value = 0
  resetBall()
  gameContainer.value.focus()
  gameLoop = requestAnimationFrame(updateGame)
  gameTimer.value = 180000 // 3分钟
  startGameTimer()
}

// 游戏计时器
let timerInterval = null
const startGameTimer = () => {
  timerInterval = setInterval(() => {
    if (gameTimer.value > 0) {
      gameTimer.value -= 1000
      if (gameTimer.value === 0) {
        endGame()
      }
    }
  }, 1000)
}

// 初始化AI
const initAI = () => {
  aiUpdateInterval = setInterval(() => {
    if (!isMultiPlayer.value && isGameStarted.value) {
      const ballY = ball.value.y
      const paddleCenter = playerTwo.value.y + paddleHeight / 2
      
      if (paddleCenter < ballY - 10) {
        playerTwo.value.dy = paddleSpeed * 0.8
      } else if (paddleCenter > ballY + 10) {
        playerTwo.value.dy = -paddleSpeed * 0.8
      } else {
        playerTwo.value.dy = 0
      }
    }
  }, 16)
}

// 重置球的位置
const resetBall = () => {
  ball.value.x = canvasWidth / 2
  ball.value.y = canvasHeight / 2
  ball.value.speed = initialBallSpeed
  const angle = (Math.random() * 60 - 30) * Math.PI / 180
  ball.value.dx = ball.value.speed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1)
  ball.value.dy = ball.value.speed * Math.sin(angle)
}

// 更新游戏状态
const updateGame = () => {
  if (!isGameStarted.value) return

  // 更新球拍位置
  updatePaddles()

  // 更新球的位置
  updateBall()

  // 检查碰撞
  checkCollisions()

  // 渲染游戏画面
  render()

  // 继续游戏循环
  gameLoop = requestAnimationFrame(updateGame)
}

// 更新球拍位置
const updatePaddles = () => {
  // 玩家一
  if (keys.value.w) playerOne.value.dy = -paddleSpeed
  else if (keys.value.s) playerOne.value.dy = paddleSpeed
  else playerOne.value.dy = 0

  // 玩家二（多人模式）
  if (isMultiPlayer.value) {
    if (keys.value.up) playerTwo.value.dy = -paddleSpeed
    else if (keys.value.down) playerTwo.value.dy = paddleSpeed
    else playerTwo.value.dy = 0
  }

  // 更新位置
  playerOne.value.y = Math.max(0, Math.min(canvasHeight - paddleHeight, playerOne.value.y + playerOne.value.dy))
  playerTwo.value.y = Math.max(0, Math.min(canvasHeight - paddleHeight, playerTwo.value.y + playerTwo.value.dy))
}

// 更新球的位置
const updateBall = () => {
  ball.value.x += ball.value.dx
  ball.value.y += ball.value.dy

  // 上下墙壁碰撞
  if (ball.value.y <= 0 || ball.value.y >= canvasHeight) {
    ball.value.dy *= -1
  }

  // 球出界
  if (ball.value.x < 0) {
    playerTwoScore.value++
    if (playerTwoScore.value >= 11) endGame()
    else resetBall()
  } else if (ball.value.x > canvasWidth) {
    playerOneScore.value++
    if (playerOneScore.value >= 11) endGame()
    else resetBall()
  }
}

// 检查碰撞
const checkCollisions = () => {
  // 检查与球拍的碰撞
  const checkPaddleCollision = (paddle) => {
    if (ball.value.x < paddle.x + paddleWidth &&
        ball.value.x + ballSize > paddle.x &&
        ball.value.y < paddle.y + paddleHeight &&
        ball.value.y + ballSize > paddle.y) {
      
      // 计算碰撞点相对于球拍中心的位置
      const relativeIntersectY = (paddle.y + paddleHeight / 2) - ball.value.y
      const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2)
      const bounceAngle = normalizedIntersectY * Math.PI / 3

      // 增加球的速度
      ball.value.speed = Math.min(ball.value.speed + 0.5, 15)

      // 根据碰撞角度改变球的方向
      ball.value.dx = ball.value.speed * Math.cos(bounceAngle) * (paddle === playerOne.value ? 1 : -1)
      ball.value.dy = -ball.value.speed * Math.sin(bounceAngle)

      return true
    }
    return false
  }

  checkPaddleCollision(playerOne.value)
  checkPaddleCollision(playerTwo.value)
}

// 渲染游戏画面
const render = () => {
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制中线
  ctx.setLineDash([5, 15])
  ctx.beginPath()
  ctx.moveTo(canvasWidth / 2, 0)
  ctx.lineTo(canvasWidth / 2, canvasHeight)
  ctx.strokeStyle = '#666'
  ctx.stroke()
  ctx.setLineDash([])

  // 绘制球拍
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(playerOne.value.x, playerOne.value.y, paddleWidth, paddleHeight)
  ctx.fillRect(playerTwo.value.x, playerTwo.value.y, paddleWidth, paddleHeight)

  // 绘制球
  ctx.beginPath()
  ctx.arc(ball.value.x, ball.value.y, ballSize / 2, 0, Math.PI * 2)
  ctx.fillStyle = '#FFF'
  ctx.fill()
}

// 游戏结束
const endGame = () => {
  isGameStarted.value = false
  isGameOver.value = true
  cancelAnimationFrame(gameLoop)
  clearInterval(timerInterval)
  clearInterval(aiUpdateInterval)

  // 确定获胜者
  if (playerOneScore.value > playerTwoScore.value) {
    winner.value = '玩家一'
  } else if (playerTwoScore.value > playerOneScore.value) {
    winner.value = isMultiPlayer.value ? '玩家二' : 'AI'
  } else {
    winner.value = '平局'
  }
}

// 重新开始游戏
const restartGame = () => {
  if (isMultiPlayer.value) {
    startMultiPlayerGame()
  } else {
    startSinglePlayerGame()
  }
}

// 返回菜单
const backToMenu = () => {
  isGameStarted.value = false
  isGameOver.value = false
  cancelAnimationFrame(gameLoop)
  clearInterval(timerInterval)
  clearInterval(aiUpdateInterval)
}

// 键盘事件处理
const handleKeyDown = (e) => {
  if (e.key === 'w' || e.key === 'W') keys.value.w = true
  if (e.key === 's' || e.key === 'S') keys.value.s = true
  if (e.key === 'ArrowUp') keys.value.up = true
  if (e.key === 'ArrowDown') keys.value.down = true
}

const handleKeyUp = (e) => {
  if (e.key === 'w' || e.key === 'W') keys.value.w = false
  if (e.key === 's' || e.key === 'S') keys.value.s = false
  if (e.key === 'ArrowUp') keys.value.up = false
  if (e.key === 'ArrowDown') keys.value.down = false
}

// 组件挂载
onMounted(() => {
  ctx = gameCanvas.value.getContext('2d')
  gameContainer.value.focus()
})

// 组件卸载
onUnmounted(() => {
  cancelAnimationFrame(gameLoop)
  clearInterval(timerInterval)
  clearInterval(aiUpdateInterval)
})
</script>

<style scoped>
.ping-pong-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1a1a1a;
  position: relative;
  outline: none;
}

canvas {
  border: 2px solid #333;
  background-color: #000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  z-index: 10;
}

.game-title {
  font-size: 3em;
  margin-bottom: 30px;
  color: #4CAF50;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.game-mode-selection {
  margin-bottom: 30px;
}

.game-mode-selection .el-button {
  margin: 0 10px;
  min-width: 150px;
}

.game-instructions {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.5);
}

.game-instructions h3 {
  margin-bottom: 15px;
  color: #4CAF50;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.player-one, .player-two {
  text-align: left;
}

.player-one h4, .player-two h4 {
  color: #4CAF50;
  margin-bottom: 10px;
}

.game-stats {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 50px;
  color: #fff;
  font-size: 1.5em;
  z-index: 5;
}

.game-timer {
  color: #4CAF50;
  font-weight: bold;
}

.game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.9);
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  color: #fff;
  z-index: 20;
}

.game-over h2 {
  color: #4CAF50;
  font-size: 2em;
  margin-bottom: 20px;
}

.final-score {
  font-size: 1.5em;
  margin: 20px 0;
}

.game-over .el-button {
  margin: 10px;
  min-width: 120px;
}
</style>