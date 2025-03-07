<template>
  <div class="adventure-game-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" ref="gameContainer">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <div class="game-overlay" v-if="!isGameStarted">
      <div class="game-title">冒险闯关</div>
      <el-button type="primary" size="large" @click="startGame">开始游戏</el-button>
      <div class="game-instructions">
        <p>操作说明：</p>
        <ul>
          <li>← →：左右移动</li>
          <li>↑：跳跃</li>
          <li>Z：普通攻击</li>
          <li>X：特殊技能</li>
          <li>C：使用道具</li>
        </ul>
      </div>
    </div>

    <div class="game-stats" v-if="isGameStarted">
      <div class="level">关卡：{{ currentLevel }}</div>
      <div class="score">得分：{{ score }}</div>
      <div class="health">生命值：{{ playerHealth }}/{{ maxPlayerHealth }}</div>
      <div class="power">能量值：{{ playerPower }}/{{ maxPlayerPower }}</div>
      <div class="items">道具：{{ currentItem }}</div>
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
const currentLevel = ref(1)
const playerHealth = ref(100)
const maxPlayerHealth = 100
const playerPower = ref(100)
const maxPlayerPower = 100
const currentItem = ref('无')

// DOM引用
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 玩家角色
const player = ref({
  x: 100,
  y: canvasHeight - 100,
  width: 50,
  height: 50,
  speed: 5,
  jumpForce: 15,
  gravity: 0.8,
  velocityY: 0,
  isJumping: false,
  isAttacking: false,
  direction: 'right',
  attackCooldown: 0,
  specialAttackCooldown: 0
})

// 敌人数组
const enemies = ref([])

// 道具数组
const items = ref([])

// 按键状态
const keys = ref({
  left: false,
  right: false,
  up: false,
  z: false,
  x: false,
  c: false
})

// 游戏循环
let gameLoop = null

// 开始游戏
const startGame = () => {
  isGameStarted.value = true
  resetGame()
  generateLevel(currentLevel.value)
  generateItems()
  gameContainer.value.focus()
  startGameLoop()
}

// 重置游戏状态
const resetGame = () => {
  score.value = 0
  currentLevel.value = 1
  playerHealth.value = maxPlayerHealth
  playerPower.value = maxPlayerPower
  currentItem.value = '无'
  player.value.x = 100
  player.value.y = canvasHeight - 100
  enemies.value = []
  items.value = []
}

// 处理键盘按下事件
const handleKeyDown = (e) => {
  if (!isGameStarted.value) return
  switch (e.key.toLowerCase()) {
    case 'arrowleft':
    case 'a':
      keys.value.left = true
      break
    case 'arrowright':
    case 'd':
      keys.value.right = true
      break
    case 'arrowup':
    case 'w':
    case ' ':
      keys.value.up = true
      if (!player.value.isJumping) {
        player.value.velocityY = -player.value.jumpForce
        player.value.isJumping = true
      }
      break
    case 'z':
      keys.value.z = true
      if (player.value.attackCooldown <= 0) {
        attack()
      }
      break
    case 'x':
      keys.value.x = true
      if (player.value.specialAttackCooldown <= 0 && playerPower.value >= 30) {
        specialAttack()
      }
      break
    case 'c':
      keys.value.c = true
      useItem()
      break
  }
}

// 处理键盘释放事件
const handleKeyUp = (e) => {
  if (!isGameStarted.value) return
  switch (e.key.toLowerCase()) {
    case 'arrowleft':
    case 'a':
      keys.value.left = false
      break
    case 'arrowright':
    case 'd':
      keys.value.right = false
      break
    case 'arrowup':
    case 'w':
    case ' ':
      keys.value.up = false
      break
    case 'z':
      keys.value.z = false
      break
    case 'x':
      keys.value.x = false
      break
    case 'c':
      keys.value.c = false
      break
  }
}

// 普通攻击
const attack = () => {
  player.value.isAttacking = true
  player.value.attackCooldown = 20
  // 实现攻击逻辑
}

// 特殊攻击
const specialAttack = () => {
  playerPower.value -= 30
  player.value.specialAttackCooldown = 60
  // 实现特殊攻击逻辑
}

// 使用道具
const useItem = () => {
  if (currentItem.value !== '无') {
    // 实现道具使用逻辑
    currentItem.value = '无'
  }
}

// 更新游戏状态
const updateGame = () => {
  // 更新玩家位置
  if (keys.value.left) {
    player.value.x -= player.value.speed
    player.value.direction = 'left'
  }
  if (keys.value.right) {
    player.value.x += player.value.speed
    player.value.direction = 'right'
  }

  // 应用重力
  player.value.velocityY += player.value.gravity
  player.value.y += player.value.velocityY

  // 地面碰撞检测
  if (player.value.y > canvasHeight - player.value.height) {
    player.value.y = canvasHeight - player.value.height
    player.value.velocityY = 0
    player.value.isJumping = false
  }

  // 更新冷却时间
  if (player.value.attackCooldown > 0) player.value.attackCooldown--
  if (player.value.specialAttackCooldown > 0) player.value.specialAttackCooldown--

  // 更新敌人
  updateEnemies()

  // 更新道具
  updateItems()

  // 检查关卡完成情况
  checkLevelComplete()
}

// 敌人类型定义
const enemyTypes = {
  'slime': {
    width: 40,
    height: 30,
    speed: 2,
    health: 3,
    damage: 1,
    score: 100,
    color: '#4A90E2'
  },
  'bat': {
    width: 30,
    height: 30,
    speed: 3,
    health: 2,
    damage: 1,
    score: 150,
    color: '#9B59B6'
  },
  'skeleton': {
    width: 40,
    height: 60,
    speed: 1,
    health: 5,
    damage: 2,
    score: 200,
    color: '#95A5A6'
  }
}

// 生成关卡
const generateLevel = (level) => {
  const enemyCount = Math.min(3 + level, 10)
  const types = Object.keys(enemyTypes)
  
  for (let i = 0; i < enemyCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const enemyConfig = enemyTypes[type]
    
    enemies.value.push({
      ...enemyConfig,
      type,
      x: canvasWidth + (i * 200),
      y: canvasHeight - enemyConfig.height - 20,
      velocityX: -enemyConfig.speed,
      velocityY: 0,
      currentHealth: enemyConfig.health
    })
  }
}

// 更新敌人状态
const updateEnemies = () => {
  enemies.value.forEach((enemy, index) => {
    // 移动敌人
    enemy.x += enemy.velocityX
    enemy.y += enemy.velocityY
    
    // 应用重力
    enemy.velocityY += player.value.gravity
    if (enemy.y > canvasHeight - enemy.height - 20) {
      enemy.y = canvasHeight - enemy.height - 20
      enemy.velocityY = 0
    }
    
    // 检测与玩家的碰撞
    if (checkCollision(player.value, enemy)) {
      playerHealth.value -= enemy.damage
      // 击退效果
      if (player.value.x < enemy.x) {
        player.value.x -= 30
      } else {
        player.value.x += 30
      }
    }
    
    // 检测攻击判定
    if (player.value.isAttacking && checkCollision(getAttackBox(), enemy)) {
      enemy.currentHealth--
      if (enemy.currentHealth <= 0) {
        enemies.value.splice(index, 1)
        score.value += enemy.score
      }
    }
    
    // 移除超出屏幕的敌人
    if (enemy.x < -enemy.width) {
      enemies.value.splice(index, 1)
    }
  })
}

// 获取攻击判定区域
const getAttackBox = () => {
  const attackRange = 60
  return {
    x: player.value.direction === 'right' ? 
      player.value.x + player.value.width : 
      player.value.x - attackRange,
    y: player.value.y,
    width: attackRange,
    height: player.value.height
  }
}

// 碰撞检测
const checkCollision = (rect1, rect2) => {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y
}

// 场景元素
const background = ref({
  x: 0,
  speed: 0.5
})

const midground = ref({
  x: 0,
  speed: 1
})

// 道具类型定义
const itemTypes = {
  'healthPotion': {
    width: 30,
    height: 30,
    effect: () => {
      playerHealth.value = Math.min(playerHealth.value + 30, maxPlayerHealth)
    },
    color: '#FF6B6B',
    name: '生命药水'
  },
  'powerPotion': {
    width: 30,
    height: 30,
    effect: () => {
      playerPower.value = Math.min(playerPower.value + 50, maxPlayerPower)
    },
    color: '#4ECDC4',
    name: '能量药水'
  },
  'strengthBoost': {
    width: 30,
    height: 30,
    effect: () => {
      player.value.attackBoost = 2
      setTimeout(() => {
        player.value.attackBoost = 1
      }, 10000)
    },
    color: '#FFE66D',
    name: '力量提升'
  }
}

// 生成道具
const generateItems = () => {
  const itemCount = Math.floor(Math.random() * 3) + 1
  const types = Object.keys(itemTypes)
  
  for (let i = 0; i < itemCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const itemConfig = itemTypes[type]
    
    items.value.push({
      ...itemConfig,
      type,
      x: canvasWidth + (Math.random() * 500),
      y: canvasHeight - itemConfig.height - 40
    })
  }
}

// 更新道具状态
const updateItems = () => {
  items.value.forEach((item, index) => {
    // 移动道具
    item.x -= midground.value.speed
    
    // 检测与玩家的碰撞
    if (checkCollision(player.value, item)) {
      item.effect()
      currentItem.value = item.name
      items.value.splice(index, 1)
    }
    
    // 移除超出屏幕的道具
    if (item.x < -item.width) {
      items.value.splice(index, 1)
    }
  })
}

// 更新场景
const updateScene = () => {
  if (keys.value.right && player.value.x >= canvasWidth / 2) {
    // 移动场景而不是玩家
    background.value.x -= background.value.speed
    midground.value.x -= midground.value.speed
    player.value.x = canvasWidth / 2
    
    // 移动敌人和道具
    enemies.value.forEach(enemy => {
      enemy.x -= midground.value.speed
    })
    
    items.value.forEach(item => {
      item.x -= midground.value.speed
    })
  }
}



// 渲染游戏画面
const render = () => {
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制玩家
  ctx.fillStyle = '#2ecc71'
  ctx.fillRect(player.value.x, player.value.y, player.value.width, player.value.height)

  // 绘制敌人
  enemies.value.forEach(enemy => {
    ctx.fillStyle = enemy.color
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
  })

  // 绘制道具
  items.value.forEach(item => {
    ctx.fillStyle = item.color
    ctx.fillRect(item.x, item.y, item.width, item.height)
  })

  // 绘制攻击范围（仅在攻击时显示）
  if (player.value.isAttacking) {
    const attackBox = getAttackBox()
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height)
  }
}



// 游戏主循环
const startGameLoop = () => {
  if (!ctx) {
    ctx = gameCanvas.value.getContext('2d')
  }

  gameLoop = requestAnimationFrame(function loop() {
    updateGame()
    updateScene()
    render()
    if (isGameStarted.value) {
      gameLoop = requestAnimationFrame(loop)
    }
  })
}

// 组件挂载时初始化
onMounted(() => {
  ctx = gameCanvas.value.getContext('2d')
  render()
})

// 组件卸载时清理
onUnmounted(() => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
})
</script>

<style scoped>
.adventure-game-container {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background-color: #000;
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
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
}

.game-title {
  font-size: 3em;
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.game-instructions {
  margin-top: 20px;
  text-align: center;
}

.game-instructions ul {
  list-style: none;
  padding: 0;
}

.game-instructions li {
  margin: 5px 0;
}

.game-stats {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  color: #fff;
}

.game-stats > div {
  margin: 5px 0;
}
</style>