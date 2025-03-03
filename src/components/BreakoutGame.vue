<template>
  <div class="breakout-container" tabindex="0" @mousemove="handleMouseMove" @keydown="handleKeyDown" @keyup="handleKeyUp" ref="gameContainer">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <div class="game-overlay" v-if="!isGameStarted">
      <div class="game-title">打砖块</div>
      <div class="game-instructions">
        <p>操作说明：</p>
        <ul>
          <li>鼠标移动：控制挡板</li>
          <li>←/→：左右移动挡板</li>
          <li>空格：发射小球/暂停游戏</li>
        </ul>
      </div>
      <el-button type="primary" size="large" @click="startGame">开始游戏</el-button>
    </div>

    <div class="game-stats-overlay">
      <div class="score">得分：{{ score }}</div>
      <div class="lives">生命：{{ lives }}</div>
      <div class="level">关卡：{{ level }}</div>
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
const score = ref(0)
const lives = ref(3)
const level = ref(1)

// DOM引用
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 游戏对象
const paddle = {
  width: 100,
  height: 15,
  x: canvasWidth / 2 - 50,
  y: canvasHeight - 30,
  speed: 10, // 调整为更合理的速度值
  color: '#4CAF50'
}

const ball = {
  x: canvasWidth / 2,
  y: canvasHeight - 45,
  radius: 8,
  speed: 7,
  dx: 0,
  dy: 0,
  color: '#FFF'
}

// 砖块配置
const brickConfig = {
  rows: 5,
  cols: 8,
  width: 80,
  height: 20,
  padding: 10,
  offsetTop: 60,
  offsetLeft: 60
}

// 砖块数组
let bricks = []

// 道具类型
const powerUps = {
  EXPAND: 'expand',
  SHRINK: 'shrink',
  SPEED_UP: 'speedUp',
  SPEED_DOWN: 'speedDown',
  MULTI_BALL: 'multiBall',
  LASER: 'laser'
}

// 初始化砖块
function initBricks() {
  bricks = []
  for (let i = 0; i < brickConfig.rows; i++) {
    bricks[i] = []
    for (let j = 0; j < brickConfig.cols; j++) {
      const powerUpChance = Math.random()
      let powerUp = null
      if (powerUpChance > 0.8) {
        const powerUpTypes = Object.values(powerUps)
        powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
      }
      
      bricks[i][j] = {
        x: j * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft,
        y: i * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop,
        status: 1,
        color: getRandomBrickColor(),
        powerUp,
        hits: Math.random() > 0.7 ? 2 : 1 // 部分砖块需要击打两次
      }
    }
  }
}

// 随机砖块颜色
function getRandomBrickColor() {
  const colors = ['#FF4081', '#7C4DFF', '#00BCD4', '#FFC107', '#8BC34A']
  return colors[Math.floor(Math.random() * colors.length)]
}

// 绘制游戏对象
function draw() {
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制挡板
  ctx.beginPath()
  ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height)
  ctx.fillStyle = paddle.color
  ctx.fill()
  ctx.closePath()

  // 绘制小球
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fillStyle = ball.color
  ctx.fill()
  ctx.closePath()

  // 绘制砖块
  drawBricks()
}

// 绘制砖块
function drawBricks() {
  for (let i = 0; i < brickConfig.rows; i++) {
    for (let j = 0; j < brickConfig.cols; j++) {
      const brick = bricks[i][j]
      if (brick.status > 0) {
        ctx.beginPath()
        ctx.rect(brick.x, brick.y, brickConfig.width, brickConfig.height)
        ctx.fillStyle = brick.color
        ctx.fill()
        ctx.closePath()

        // 绘制砖块强度指示器
        if (brick.hits > 1) {
          ctx.beginPath()
          ctx.arc(brick.x + brickConfig.width - 10, brick.y + 10, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#FFF'
          ctx.fill()
          ctx.closePath()
        }

        // 绘制道具标识
        if (brick.powerUp) {
          ctx.beginPath()
          ctx.moveTo(brick.x + 5, brick.y + brickConfig.height - 5)
          ctx.lineTo(brick.x + 15, brick.y + brickConfig.height - 5)
          ctx.strokeStyle = '#FFF'
          ctx.stroke()
          ctx.closePath()
        }
      }
    }
  }
}

// 碰撞检测
function collisionDetection() {
  // 小球与砖块的碰撞
  for (let i = 0; i < brickConfig.rows; i++) {
    for (let j = 0; j < brickConfig.cols; j++) {
      const brick = bricks[i][j]
      if (brick.status > 0) {
        // 改进的碰撞检测，考虑小球半径
        const ballLeft = ball.x - ball.radius;
        const ballRight = ball.x + ball.radius;
        const ballTop = ball.y - ball.radius;
        const ballBottom = ball.y + ball.radius;

        if (ballRight > brick.x && ballLeft < brick.x + brickConfig.width &&
            ballBottom > brick.y && ballTop < brick.y + brickConfig.height) {
          // 确定碰撞方向并反弹
          const fromBottom = ballTop < brick.y + brickConfig.height && ball.dy < 0;
          const fromTop = ballBottom > brick.y && ball.dy > 0;

          if (fromTop || fromBottom) {
            ball.dy = -ball.dy;
          } else {
            ball.dx = -ball.dx;
          }

          brick.hits--;
          if (brick.hits <= 0) {
            brick.status = 0;
            score.value += 10; // 更新得分
            if (brick.powerUp) {
              activatePowerUp(brick.powerUp);
            }
          }
          return; // 每次只处理一个碰撞
        }
      }
    }
  }

  // 小球与挡板的碰撞
  if (ball.y + ball.radius > paddle.y &&
      ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
    ball.dy = -ball.speed;
    // 根据击球位置调整反弹角度
    const hitPoint = (ball.x - paddle.x) / paddle.width;
    ball.dx = 8 * (hitPoint - 0.5);
  }

  // 检查小球是否落地
  if (ball.y + ball.radius > canvasHeight) {
    lives.value = lives.value - 1; // 使用显式赋值确保响应式更新
    if (lives.value <= 0) {
      gameOver();
      return;
    }
    resetBall();
  }
}

// 激活道具
function activatePowerUp(type) {
  switch (type) {
    case powerUps.EXPAND:
      paddle.width = Math.min(paddle.width * 1.5, 150)
      setTimeout(() => paddle.width = 100, 10000)
      break
    case powerUps.SHRINK:
      paddle.width = Math.max(paddle.width * 0.7, 60)
      setTimeout(() => paddle.width = 100, 10000)
      break
    case powerUps.SPEED_UP:
      ball.speed *= 1.2
      setTimeout(() => ball.speed /= 1.2, 10000)
      break
    case powerUps.SPEED_DOWN:
      ball.speed *= 0.8
      setTimeout(() => ball.speed /= 0.8, 10000)
      break
  }
}



// 重置小球位置
function resetBall() {
  ball.x = paddle.x + paddle.width / 2
  ball.y = canvasHeight - 45
  ball.dx = 0
  ball.dy = 0
}

// 开始游戏
function startGame() {
  isGameStarted.value = true
  score.value = 0
  lives.value = 3
  level.value = 1
  gameContainer.value.focus()
  
  initBricks()
  resetBall()
  ball.dx = 2
  ball.dy = -ball.speed
  
  // 启动游戏主循环
  requestAnimationFrame(gameLoop)
}

// 游戏结束
function gameOver() {
  isGameStarted.value = false
  alert(`游戏结束！得分：${score.value}`)
}

// 鼠标控制
function handleMouseMove(e) {
  if (!isGameStarted.value) return
  const relativeX = e.clientX - gameContainer.value.offsetLeft
  if (relativeX > 0 && relativeX < canvasWidth) {
    paddle.x = relativeX - paddle.width / 2
  }
}

// 按键状态
const keys = {
  left: false,
  right: false
}

// 键盘控制
function handleKeyDown(e) {
  if (!isGameStarted.value) return
  
  switch(e.key) {
    case 'ArrowLeft':
      keys.left = true
      break
    case 'ArrowRight':
      keys.right = true
      break
    case ' ':
      if (ball.dx === 0 && ball.dy === 0) {
        ball.dx = 2
        ball.dy = -ball.speed
      }
      break
  }
}

function handleKeyUp(e) {
  switch(e.key) {
    case 'ArrowLeft':
      keys.left = false
      break
    case 'ArrowRight':
      keys.right = false
      break
  }
}

// 更新挡板位置
function updatePaddlePosition() {
  if (keys.left) {
    paddle.x = Math.max(0, paddle.x - paddle.speed)
  }
  if (keys.right) {
    paddle.x = Math.min(canvasWidth - paddle.width, paddle.x + paddle.speed)
  }
}

// 游戏主循环
function gameLoop() {
  if (!isGameStarted.value) return

  // 更新小球位置
  ball.x += ball.dx
  ball.y += ball.dy

  // 边界碰撞检测
  if (ball.x + ball.radius > canvasWidth || ball.x - ball.radius < 0) {
    ball.dx = -ball.dx
  }
  if (ball.y - ball.radius < 0) {
    ball.dy = -ball.dy
  }
  // 检查是否完成当前关卡
  let remainingBricks = 0;
  for (let i = 0; i < brickConfig.rows; i++) {
    for (let j = 0; j < brickConfig.cols; j++) {
      if (bricks[i][j].status > 0) {
        remainingBricks++;
      }
    }
  }

  if (remainingBricks === 0) {
    // 进入下一关
    level.value++;
    ball.speed += 1; // 增加球速
    brickConfig.rows = Math.min(brickConfig.rows + 1, 8); // 增加砖块行数，最多8行
    
    // 重置游戏状态
    resetBall();
    initBricks();
    
    // 开始新的一关
    ball.dx = 2;
    ball.dy = -ball.speed;
  }
  if (ball.y + ball.radius > canvasHeight) {
    lives.value--
    if (lives.value <= 0) {
      gameOver()
      return
    }
    resetBall()
  }

  // 更新挡板位置
  updatePaddlePosition()

  // 碰撞检测
  collisionDetection()

  // 绘制游戏画面
  draw()

  // 继续游戏循环
  requestAnimationFrame(gameLoop)
}



// 组件挂载
onMounted(() => {
  ctx = gameCanvas.value.getContext('2d')
  draw()
})

// 组件卸载
onUnmounted(() => {
  isGameStarted.value = false
})
</script>

<style scoped>
.breakout-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  outline: none;
}

canvas {
  background: #000;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.game-overlay {
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
  text-align: left;
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 15px;
  min-width: 250px;
  backdrop-filter: blur(8px);
  z-index: 1000;
}

.game-title {
  font-size: 2em;
  margin-bottom: 15px;
  color: #4CAF50;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.el-button {
  margin-top: 15px;
  width: 100%;
}
.game-instructions {
  margin: 15px 0;
  text-align: left;
  background: rgba(0, 0, 0, 0.6);
  padding: 15px;
  border-radius: 10px;
}

.game-instructions p {
  margin: 0 0 10px 0;
  font-size: 1.2em;
  color: #4CAF50;
}

.game-instructions ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.game-instructions li {
  margin: 5px 0;
  color: #ccc;
  font-size: 1em;
}

.game-stats-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  color: #fff;
  font-size: 1.5em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 10px;
  backdrop-filter: blur(8px);
  z-index: 1000;
}

.game-stats-overlay > div {
  margin: 8px 0;
  display: flex;
  align-items: center;
}

.score {
  color: #4CAF50;
  font-weight: bold;
}

.lives {
  color: #f44336;
}

.level {
  color: #2196F3;
}
</style>