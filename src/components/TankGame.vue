<template>
  <div class="tank-game-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" ref="gameContainer">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <div class="game-overlay" v-if="!isGameStarted">
      <div class="game-title">坦克大战</div>
      <el-button type="primary" size="large" @click="startGame">开始游戏</el-button>
      <div class="game-instructions">
        <p>操作说明：</p>
        <ul>
          <li>W/↑：向上移动</li>
          <li>S/↓：向下移动</li>
          <li>A/←：向左移动</li>
          <li>D/→：向右移动</li>
          <li>空格：发射炮弹</li>
        </ul>
      </div>
    </div>

    <div class="game-stats" v-if="isGameStarted">
      <div class="score">得分：{{ score }}</div>
      <div class="health">生命值：{{ playerHealth }}</div>
      <div class="level">关卡：{{ currentLevel }}</div>
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
const playerHealth = ref(100)
const currentLevel = ref(1)

// DOM引用
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 游戏对象
const player = ref({
  x: canvasWidth / 2,
  y: canvasHeight - 50,
  width: 40,
  height: 40,
  speed: 5,
  direction: 'up',
  color: '#4CAF50'
})

// 按键状态
const keys = ref({
  up: false,
  down: false,
  left: false,
  right: false,
  space: false
})

// 炮弹数组
const bullets = ref([])

// 敌人数组
const enemies = ref([])

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
  spawnEnemies()
}

// 生成敌人
const spawnEnemies = () => {
  for (let i = 0; i < 5; i++) {
    enemies.value.push({
      x: Math.random() * (canvasWidth - 40),
      y: 50 + Math.random() * 200,
      width: 40,
      height: 40,
      speed: 2,
      direction: 'down',
      color: '#F44336'
    })
  }
}

// 更新游戏状态
const updateGame = () => {
  if (!isGameStarted.value) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 更新玩家位置
  updatePlayerPosition()

  // 更新炮弹位置
  updateBullets()

  // 更新敌人位置
  updateEnemies()

  // 绘制游戏对象
  drawGame()

  // 检测碰撞
  checkCollisions()

  gameLoop = requestAnimationFrame(updateGame)
}

// 更新玩家位置
const updatePlayerPosition = () => {
  if (keys.value.up && player.value.y > 0) {
    player.value.y -= player.value.speed
    player.value.direction = 'up'
  }
  if (keys.value.down && player.value.y < canvasHeight - player.value.height) {
    player.value.y += player.value.speed
    player.value.direction = 'down'
  }
  if (keys.value.left && player.value.x > 0) {
    player.value.x -= player.value.speed
    player.value.direction = 'left'
  }
  if (keys.value.right && player.value.x < canvasWidth - player.value.width) {
    player.value.x += player.value.speed
    player.value.direction = 'right'
  }
}

// 更新炮弹位置
const updateBullets = () => {
  bullets.value.forEach((bullet, index) => {
    switch (bullet.direction) {
      case 'up':
        bullet.y -= bullet.speed
        break
      case 'down':
        bullet.y += bullet.speed
        break
      case 'left':
        bullet.x -= bullet.speed
        break
      case 'right':
        bullet.x += bullet.speed
        break
    }

    // 移除超出边界的炮弹
    if (bullet.x < 0 || bullet.x > canvasWidth || bullet.y < 0 || bullet.y > canvasHeight) {
      bullets.value.splice(index, 1)
    }
  })
}

// 更新敌人位置
const updateEnemies = () => {
  enemies.value.forEach(enemy => {
    // 简单的AI逻辑：随机移动
    if (Math.random() < 0.02) {
      enemy.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)]
    }

    switch (enemy.direction) {
      case 'up':
        if (enemy.y > 0) enemy.y -= enemy.speed
        break
      case 'down':
        if (enemy.y < canvasHeight - enemy.height) enemy.y += enemy.speed
        break
      case 'left':
        if (enemy.x > 0) enemy.x -= enemy.speed
        break
      case 'right':
        if (enemy.x < canvasWidth - enemy.width) enemy.x += enemy.speed
        break
    }

    // 敌人随机发射炮弹
    if (Math.random() < 0.01) {
      fireBullet(enemy, true)
    }
  })
}

// 绘制游戏对象
const drawGame = () => {
  // 绘制玩家坦克
  drawTank(player.value)

  // 绘制敌人坦克
  enemies.value.forEach(enemy => drawTank(enemy))

  // 绘制炮弹
  bullets.value.forEach(bullet => {
    ctx.fillStyle = bullet.isEnemy ? '#FF0000' : '#FFD700'
    ctx.beginPath()
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

// 绘制坦克
const drawTank = (tank) => {
  ctx.save()
  ctx.translate(tank.x + tank.width / 2, tank.y + tank.height / 2)

  // 根据方向旋转坦克
  switch (tank.direction) {
    case 'up':
      ctx.rotate(0)
      break
    case 'down':
      ctx.rotate(Math.PI)
      break
    case 'left':
      ctx.rotate(-Math.PI / 2)
      break
    case 'right':
      ctx.rotate(Math.PI / 2)
      break
  }

  // 绘制坦克主体
  ctx.fillStyle = tank.color
  ctx.fillRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height)

  // 绘制炮管
  ctx.fillStyle = '#333'
  ctx.fillRect(-2, -tank.height / 2 - 10, 4, 20)

  ctx.restore()
}

// 发射炮弹
const fireBullet = (source, isEnemy = false) => {
  const bulletSpeed = 8
  const bullet = {
    x: source.x + source.width / 2,
    y: source.y + source.height / 2,
    speed: bulletSpeed,
    direction: source.direction,
    isEnemy
  }

  // 根据方向调整炮弹初始位置
  switch (source.direction) {
    case 'up':
      bullet.y -= source.height / 2
      break
    case 'down':
      bullet.y += source.height / 2
      break
    case 'left':
      bullet.x -= source.width / 2
      break
    case 'right':
      bullet.x += source.width / 2
      break
  }

  bullets.value.push(bullet)
}

// 检测碰撞
const checkCollisions = () => {
  // 检测玩家炮弹与敌人的碰撞
  bullets.value.forEach((bullet, bulletIndex) => {
    if (!bullet.isEnemy) {
      enemies.value.forEach((enemy, enemyIndex) => {
        if (isColliding(bullet, enemy)) {
          // 击中敌人
          enemies.value.splice(enemyIndex, 1)
          bullets.value.splice(bulletIndex, 1)
          score.value += 100

          // 所有敌人被消灭后，进入下一关
          if (enemies.value.length === 0) {
            nextLevel()
          }
        }
      })
    } else {
      // 检测敌人炮弹与玩家的碰撞
      if (isColliding(bullet, player.value)) {
        bullets.value.splice(bulletIndex, 1)
        playerHealth.value -= 10

        if (playerHealth.value <= 0) {
          gameOver()
        }
      }
    }
  })
}

// 碰撞检测函数
const isColliding = (obj1, obj2) => {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + 6 > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + 6 > obj2.y
}

// 进入下一关
const nextLevel = () => {
  currentLevel.value++
  spawnEnemies()
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
      if (isGameStarted.value) {
        fireBullet(player.value)
      }
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
.tank-game-container {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  outline: none;
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
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.game-title {
  font-size: 48px;
  margin-bottom: 30px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.game-instructions {
  margin-top: 30px;
  text-align: center;
}

.game-instructions ul {
  list-style: none;
  padding: 0;
}

.game-instructions li {
  margin: 10px 0;
}

.game-stats {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  font-size: 16px;
}
</style>