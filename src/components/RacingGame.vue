<template>
  <div class="racing-game-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" ref="gameContainer">
    <canvas ref="gameCanvas" :width="800" :height="600"></canvas>
    <div class="game-overlay" v-if="!isGameStarted">
      <button class="start-button" @click="startGame">开始游戏</button>
    </div>
    <div class="game-stats">
      <div class="score">得分：{{ score }}</div>
      <div class="speed">速度：{{ Math.floor(speed) }} km/h</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 游戏状态
const isGameStarted = ref(false)
const score = ref(0)
const speed = ref(0)
const maxSpeed = 200
const minSpeed = 50
const acceleration = 5
const deceleration = 3

// 游戏元素
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 赛道参数
const roadWidth = 800
const roadHeight = 600
const stripeWidth = 20
const stripeHeight = 30
const stripeGap = 50
let roadOffset = 0

// 玩家车辆
const player = ref({
  x: 400,
  y: 500,
  width: 50,
  height: 80,
  speed: 0,
  angle: 0,
  isAccelerating: false,
  isBraking: false
})

// 障碍物数组
const obstacles = ref([])

// 按键状态
const keys = ref({
  up: false,
  down: false,
  left: false,
  right: false,
  space: false,
  shift: false
})

// 游戏循环
let gameLoop = null

// 开始游戏
const startGame = () => {
  isGameStarted.value = true
  gameContainer.value.focus()
  initGame()
  gameLoop = requestAnimationFrame(updateGame)
}

// 初始化游戏
const initGame = () => {
  ctx = gameCanvas.value.getContext('2d')
  score.value = 0
  speed.value = minSpeed
  spawnObstacles()
}

// 生成障碍物
const spawnObstacles = () => {
  const obstacleCount = 5
  obstacles.value = []
  
  for (let i = 0; i < obstacleCount; i++) {
    obstacles.value.push({
      x: Math.random() * (roadWidth - 30),
      y: -100 - (i * 150),
      width: 30,
      height: 30,
      speed: 2
    })
  }
}

// 更新游戏状态
const updateGame = () => {
  if (!isGameStarted.value) return

  // 清空画布
  ctx.clearRect(0, 0, roadWidth, roadHeight)

  // 更新玩家状态
  updatePlayer()

  // 更新赛道
  updateRoad()

  // 更新障碍物
  updateObstacles()

  // 绘制游戏元素
  drawGame()

  // 检测碰撞
  checkCollisions()

  // 更新分数
  score.value += Math.floor(speed.value / 50)

  gameLoop = requestAnimationFrame(updateGame)
}

// 更新玩家状态
const updatePlayer = () => {
  // 处理加速和减速
  if (keys.value.shift && speed.value < maxSpeed) {
    speed.value += acceleration
    player.value.isAccelerating = true
  } else if (keys.value.space && speed.value > minSpeed) {
    speed.value -= deceleration
    player.value.isBraking = true
  } else {
    player.value.isAccelerating = false
    player.value.isBraking = false
    if (speed.value > minSpeed) speed.value -= 1
  }

  // 处理转向
  if (keys.value.left && player.value.x > 100) {
    player.value.x -= 5 * (speed.value / maxSpeed + 0.5)
    player.value.angle = -0.2
  } else if (keys.value.right && player.value.x < roadWidth - 100 - player.value.width) {
    player.value.x += 5 * (speed.value / maxSpeed + 0.5)
    player.value.angle = 0.2
  } else {
    player.value.angle = 0
  }
}

// 更新赛道
const updateRoad = () => {
  roadOffset += speed.value / 30
  if (roadOffset >= stripeHeight + stripeGap) {
    roadOffset = 0
  }
}

// 更新障碍物
const updateObstacles = () => {
  obstacles.value.forEach((obstacle) => {
    obstacle.y += speed.value / 30

    if (obstacle.y > roadHeight) {
      obstacle.y = -100
      obstacle.x = Math.random() * (roadWidth - obstacle.width)
    }
  })
}

// 绘制游戏元素
const drawGame = () => {
  // 绘制道路和背景
  drawRoad()

  // 绘制玩家车辆
  drawPlayer()

  // 绘制障碍物
  drawObstacles()

  // 绘制加速效果
  if (player.value.isAccelerating) {
    drawSpeedEffect()
  }
}

// 绘制道路
const drawRoad = () => {
  // 绘制道路背景
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, roadWidth, roadHeight)

  // 绘制路肩
  ctx.fillStyle = '#333'
  ctx.fillRect(0, 0, 50, roadHeight)
  ctx.fillRect(roadWidth - 50, 0, 50, roadHeight)

  // 绘制道路标线
  ctx.strokeStyle = '#FFF'
  ctx.setLineDash([stripeWidth, stripeGap])
  
  // 中间虚线
  for (let i = -1; i < roadHeight / (stripeHeight + stripeGap) + 1; i++) {
    const y = i * (stripeHeight + stripeGap) + roadOffset
    ctx.fillStyle = '#FFF'
    ctx.fillRect(roadWidth / 2 - 2, y, 4, stripeHeight)
  }

  // 路边实线
  ctx.strokeStyle = '#FFF'
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(100, 0)
  ctx.lineTo(100, roadHeight)
  ctx.moveTo(roadWidth - 100, 0)
  ctx.lineTo(roadWidth - 100, roadHeight)
  ctx.stroke()
}

// 绘制玩家车辆
const drawPlayer = () => {
  ctx.save()
  ctx.translate(player.value.x + player.value.width / 2, player.value.y + player.value.height / 2)
  ctx.rotate(player.value.angle)

  // 车身
  const gradient = ctx.createLinearGradient(-player.value.width/2, 0, player.value.width/2, 0)
  gradient.addColorStop(0, '#ff3333')
  gradient.addColorStop(0.5, '#ff0000')
  gradient.addColorStop(1, '#cc0000')
  ctx.fillStyle = gradient
  ctx.fillRect(-player.value.width/2, -player.value.height/2, player.value.width, player.value.height)

  // 车窗
  ctx.fillStyle = '#333'
  ctx.fillRect(-player.value.width/4, -player.value.height/3, player.value.width/2, player.value.height/4)

  // 车轮
  ctx.fillStyle = '#000'
  ctx.fillRect(-player.value.width/2 - 5, -player.value.height/2, 10, player.value.height/4) // 左前轮
  ctx.fillRect(player.value.width/2 - 5, -player.value.height/2, 10, player.value.height/4) // 右前轮
  ctx.fillRect(-player.value.width/2 - 5, player.value.height/4, 10, player.value.height/4) // 左后轮
  ctx.fillRect(player.value.width/2 - 5, player.value.height/4, 10, player.value.height/4) // 右后轮

  ctx.restore()
}

// 绘制障碍物
const drawObstacles = () => {
  obstacles.value.forEach(obstacle => {
    ctx.fillStyle = '#666'
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
  })
}

// 绘制加速效果
const drawSpeedEffect = () => {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.setLineDash([5, 15])
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(player.value.x + i * 10, player.value.y + player.value.height)
    ctx.lineTo(player.value.x + i * 10, player.value.y + player.value.height + 20)
    ctx.stroke()
  }
}

// 检测碰撞
const checkCollisions = () => {
  obstacles.value.forEach(obstacle => {
    if (isColliding(player.value, obstacle)) {
      gameOver()
    }
  })
}

// 碰撞检测
const isColliding = (rect1, rect2) => {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y
}

// 游戏结束
const gameOver = () => {
  isGameStarted.value = false
  cancelAnimationFrame(gameLoop)
  alert(`游戏结束！最终得分：${score.value}`)
}

// 键盘事件处理
const handleKeyDown = (e) => {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      keys.value.up = true
      break
    case 's':
    case 'arrowdown':
      keys.value.down = true
      break
    case 'a':
    case 'arrowleft':
      keys.value.left = true
      break
    case 'd':
    case 'arrowright':
      keys.value.right = true
      break
    case ' ':
      keys.value.space = true
      e.preventDefault()
      break
    case 'shift':
      keys.value.shift = true
      break
  }
}

const handleKeyUp = (e) => {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      keys.value.up = false
      break
    case 's':
    case 'arrowdown':
      keys.value.down = false
      break
    case 'a':
    case 'arrowleft':
      keys.value.left = false
      break
    case 'd':
    case 'arrowright':
      keys.value.right = false
      break
    case ' ':
      keys.value.space = false
      break
    case 'shift':
      keys.value.shift = false
      break
  }
}

// 组件挂载和卸载
onMounted(() => {
  gameContainer.value.focus()
})

onUnmounted(() => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
})
</script>

<style scoped>
.racing-game-container {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  outline: none;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}

.start-button {
  padding: 15px 40px;
  font-size: 20px;
  color: white;
  background: linear-gradient(45deg, #FF0D72, #F538FF);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 5px 15px rgba(255, 13, 114, 0.4);
}

.start-button:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(255, 13, 114, 0.6);
}

.game-stats {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  font-size: 18px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.score, .speed {
  margin: 10px 0;
}
</style>