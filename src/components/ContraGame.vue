<template>
  <div class="contra-game-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" ref="gameContainer">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <div class="game-overlay" v-if="!isGameStarted">
      <div class="game-title">魂斗罗</div>
      <el-button type="primary" size="large" @click="startGame">开始游戏</el-button>
      <div class="game-instructions">
        <p>操作说明：</p>
        <ul>
          <li>← →：左右移动</li>
          <li>↑：跳跃</li>
          <li>↓：趴下</li>
          <li>Z：普通射击</li>
          <li>X：特殊武器</li>
        </ul>
      </div>
    </div>

    <div class="game-stats" v-if="isGameStarted">
      <div class="lives">生命 x {{ lives }}</div>
      <div class="score">得分：{{ score }}</div>
      <div class="weapon">武器：{{ currentWeapon }}</div>
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
const currentWeapon = ref('普通枪')

// DOM引用
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 游戏对象和场景元素
const gameObjects = {
  // 地形数组
  platforms: [
    { x: 0, y: canvasHeight - 40, width: canvasWidth, height: 40 }, // 地面
    { x: 200, y: canvasHeight - 120, width: 200, height: 20 }, // 平台1
    { x: 500, y: canvasHeight - 200, width: 200, height: 20 }, // 平台2
  ],
  // 背景图层
  backgrounds: [
    { color: '#355E3B', x: 0, y: 0, width: canvasWidth, height: canvasHeight }, // 丛林背景
    { color: '#228B22', x: 0, y: canvasHeight - 40, width: canvasWidth, height: 40 }, // 地面
    // 添加装饰性背景元素
    { type: 'tree', x: 50, y: canvasHeight - 200, width: 100, height: 160 },
    { type: 'tree', x: 600, y: canvasHeight - 200, width: 100, height: 160 },
    { type: 'bush', x: 300, y: canvasHeight - 80, width: 60, height: 40 }
  ],
  // 敌人数组
  enemies: []
}

const player = {
  x: 100,
  y: canvasHeight - 100,
  width: 40,
  height: 60,
  speed: 5,
  jumpForce: 15, // 降低跳跃力度
  gravity: 0.8, // 增加重力
  velocityY: 0,
  isJumping: false,
  isCrouching: false,
  direction: 'right',
  bullets: [],
  color: '#ff0000'
}

// 检测子弹是否击中玩家
const checkBulletHit = (bullet, bulletIndex, enemy) => {
  if (bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y) {
    // 玩家受到伤害
    lives.value--
    enemy.bullets.splice(bulletIndex, 1)
    if (lives.value <= 0) {
      // 游戏结束逻辑
      isGameStarted.value = false
      // 清除游戏循环
      if (gameLoop) {
        cancelAnimationFrame(gameLoop)
        gameLoop = null
      }
    }
    return true
  }
  return false
}

// 游戏循环
let gameLoop = null

// 按键状态
const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false
}



// 开始游戏
const startGame = () => {
  if (!ctx && gameCanvas.value) {
    ctx = gameCanvas.value.getContext('2d')
  }
  
  // 清除之前的游戏循环
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
  }
  
  isGameStarted.value = true
  initGame()
  
  // 启动新的游戏循环
  gameLoop = requestAnimationFrame(updateGame)
}

// 初始化游戏
const initGame = () => {
  // 重置游戏对象
  player.x = 100
  player.y = canvasHeight - 100
  player.velocityY = 0
  player.isJumping = false
  player.bullets = []
  
  // 清空敌人数组
  gameObjects.enemies = []
  
  if (!ctx && gameCanvas.value) {
    ctx = gameCanvas.value.getContext('2d')
  }
  
  // 初始绘制背景
  ctx.fillStyle = gameObjects.backgrounds[0].color
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制平台
  gameObjects.platforms.forEach(platform => {
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
  })
  
  gameContainer.value.focus()
}

// 生成敌人
const spawnEnemy = () => {
  const enemy = {
    x: Math.random() < 0.5 ? -30 : canvasWidth + 30,
    y: Math.random() < 0.5 ? 
       Math.random() * (canvasHeight - 300) : // 上层位置
       canvasHeight - 100 - Math.random() * 200, // 下层位置
    width: 40,
    height: 60,
    speed: 2,
    health: 2,
    shootCooldown: 0,
    shootInterval: Math.random() * 2000 + 1000, // 射击间隔1-3秒
    bullets: [],
    color: '#8B0000',
    direction: Math.random() < 0.5 ? 'left' : 'right'
  }
  gameObjects.enemies.push(enemy)
}

// 更新敌人
const updateEnemies = () => {
  gameObjects.enemies.forEach((enemy, index) => {
    // 移动敌人
    if (enemy.direction === 'left') {
      enemy.x -= enemy.speed
    } else {
      enemy.x += enemy.speed
    }

    // 敌人射击逻辑
    enemy.shootCooldown += 16 // 假设60fps，约16ms每帧
    if (enemy.shootCooldown >= enemy.shootInterval) {
      enemy.shootCooldown = 0
      // 创建敌人子弹
      enemy.bullets.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        width: 8,
        height: 8,
        speed: 5,
        damage: 1,
        direction: enemy.direction
      })
    }

    // 更新敌人子弹
    enemy.bullets.forEach((bullet, bulletIndex) => {
      if (bullet.direction === 'left') {
        bullet.x -= bullet.speed
      } else {
        bullet.x += bullet.speed
      }

      // 检测子弹是否击中玩家
      if (bullet.x < player.x + player.width &&
          bullet.x + bullet.width > player.x &&
          bullet.y < player.y + player.height &&
          bullet.y + bullet.height > player.y) {
        // 玩家受到伤害
        lives.value--
        enemy.bullets.splice(bulletIndex, 1)
        if (lives.value <= 0) {
          // 游戏结束逻辑
          isGameStarted.value = false
        }
        return
      }

      // 移除超出屏幕的子弹
      if (bullet.x < -50 || bullet.x > canvasWidth + 50) {
        enemy.bullets.splice(bulletIndex, 1)
      }

      // 绘制敌人子弹
      ctx.fillStyle = '#ff4444'
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    })

    // 检查是否超出屏幕
    if (enemy.x < -50 || enemy.x > canvasWidth + 50) {
      gameObjects.enemies.splice(index, 1)
    }

    // 绘制敌人
    ctx.fillStyle = enemy.color
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
  })
}

// 更新游戏状态
const updateGame = () => {
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制背景
  gameObjects.backgrounds.forEach(bg => {
    if (bg.type === 'tree') {
      // 绘制树
      ctx.fillStyle = '#2E4600'
      ctx.fillRect(bg.x, bg.y, bg.width, bg.height)
      // 树冠
      ctx.beginPath()
      ctx.fillStyle = '#355E3B'
      ctx.arc(bg.x + bg.width/2, bg.y, bg.width/2, 0, Math.PI * 2)
      ctx.fill()
    } else if (bg.type === 'bush') {
      // 绘制灌木
      ctx.fillStyle = '#228B22'
      ctx.beginPath()
      ctx.arc(bg.x + bg.width/2, bg.y + bg.height/2, bg.width/2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = bg.color
      ctx.fillRect(bg.x, bg.y, bg.width, bg.height)
    }
  })

  // 绘制平台
  gameObjects.platforms.forEach(platform => {
    // 平台主体
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    
    // 平台纹理
    ctx.fillStyle = '#654321'
    for (let i = 0; i < platform.width; i += 20) {
      ctx.fillRect(platform.x + i, platform.y, 2, platform.height)
    }
  })

  // 随机生成敌人
  if (Math.random() < 0.02) {
    spawnEnemy()
  }

  // 更新玩家位置
  updatePlayer()

  // 绘制玩家
  drawPlayer()

  // 更新敌人
  updateEnemies()

  // 更新子弹
  updateBullets()

  // 继续游戏循环
  if (isGameStarted.value) {
    gameLoop = requestAnimationFrame(updateGame)
  }
}

// 更新玩家状态
const updatePlayer = () => {
  // 左右移动
  if (keys.left && player.x > 0) {
    player.x -= player.speed
    player.direction = 'left'
  }
  if (keys.right && player.x < canvasWidth - player.width) {
    player.x += player.speed
    player.direction = 'right'
  }

  // 跳跃逻辑
  if (keys.up && !player.isJumping) {
    player.velocityY = -player.jumpForce
    player.isJumping = true
  }

  // 应用重力
  player.velocityY += player.gravity
  player.y += player.velocityY

  // 平台碰撞检测
  let onPlatform = false
  gameObjects.platforms.forEach(platform => {
    if (player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height > platform.y &&
        player.y + player.height < platform.y + platform.height + player.velocityY) {
      player.y = platform.y - player.height
      player.velocityY = 0
      player.isJumping = false
      onPlatform = true
    }
  })

  // 地面碰撞检测
  if (player.y > canvasHeight - player.height && !onPlatform) {
    player.y = canvasHeight - player.height
    player.velocityY = 0
    player.isJumping = false
  }

  // 更新蹲下状态
  player.isCrouching = keys.down && !player.isJumping
}

// 绘制玩家
const drawPlayer = () => {
  ctx.fillStyle = '#ff0000'
  const playerHeight = player.isCrouching ? player.height / 2 : player.height
  const playerY = player.isCrouching ? player.y + player.height / 2 : player.y
  ctx.fillRect(player.x, playerY, player.width, playerHeight)
}

// 武器系统
const weapons = {
  '普通枪': {
    bulletSpeed: 10,
    damage: 1,
    pattern: 'single'
  },
  '散弹枪': {
    bulletSpeed: 8,
    damage: 1,
    pattern: 'spread',
    spreadCount: 3,
    spreadAngle: 30
  },
  '激光枪': {
    bulletSpeed: 15,
    damage: 2,
    pattern: 'laser'
  }
}

// 发射子弹
const shoot = () => {
  const weapon = weapons[currentWeapon.value]
  const bulletSpeed = weapon.bulletSpeed
  
  if (weapon.pattern === 'spread') {
    // 散弹模式
    const angleStep = weapon.spreadAngle / (weapon.spreadCount - 1)
    for (let i = 0; i < weapon.spreadCount; i++) {
      const angle = (i - Math.floor(weapon.spreadCount/2)) * angleStep
      const rad = angle * Math.PI / 180
      const direction = player.direction === 'right' ? 1 : -1
      
      player.bullets.push({
        x: player.x + (player.direction === 'right' ? player.width : 0),
        y: player.y + player.height / 2,
        speedX: bulletSpeed * Math.cos(rad) * direction,
        speedY: bulletSpeed * Math.sin(rad),
        width: 10,
        height: 4,
        damage: weapon.damage
      })
    }
  } else {
    // 普通射击和激光射击
    const bulletDirection = player.direction === 'right' ? 1 : -1
    const isUpward = keys.up
    
    player.bullets.push({
      x: player.x + (player.direction === 'right' ? player.width : 0),
      y: player.y + player.height / 2,
      speedX: isUpward ? 0 : bulletSpeed * bulletDirection,
      speedY: isUpward ? -bulletSpeed : 0,
      width: weapon.pattern === 'laser' ? 15 : 10,
      height: weapon.pattern === 'laser' ? 4 : 4,
      damage: weapon.damage
    })
  }
}

// 更新子弹
const updateBullets = () => {
  player.bullets.forEach((bullet, bulletIndex) => {
    bullet.x += bullet.speedX
    bullet.y += bullet.speedY
    
    // 检测子弹与敌人的碰撞
    gameObjects.enemies.forEach((enemy, enemyIndex) => {
      if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        // 子弹命中敌人
        enemy.health -= bullet.damage
        player.bullets.splice(bulletIndex, 1)
        
        if (enemy.health <= 0) {
          // 敌人被消灭
          gameObjects.enemies.splice(enemyIndex, 1)
          score.value += 100
        }
        return
      }
    })
    
    // 绘制子弹
    ctx.fillStyle = weapons[currentWeapon.value].pattern === 'laser' ? '#00ff00' : '#ffff00'
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    
    // 移除超出屏幕的子弹
    if (bullet.x < 0 || bullet.x > canvasWidth || bullet.y < 0 || bullet.y > canvasHeight) {
      player.bullets.splice(bulletIndex, 1)
    }
  })
}

// 按键处理
const handleKeyDown = (e) => {
  if (!isGameStarted.value) return
  
  switch(e.key) {
    case 'ArrowLeft':
      keys.left = true
      break
    case 'ArrowRight':
      keys.right = true
      break
    case 'ArrowUp':
      keys.up = true
      break
    case 'ArrowDown':
      keys.down = true
      break
    case 'z':
    case 'Z':
      if (!keys.shoot) {
        keys.shoot = true
        shoot()
      }
      break
    case 'x':
    case 'X':
      // 切换武器
      const weaponTypes = Object.keys(weapons)
      const currentIndex = weaponTypes.indexOf(currentWeapon.value)
      currentWeapon.value = weaponTypes[(currentIndex + 1) % weaponTypes.length]
      break
  }
}

const handleKeyUp = (e) => {
  switch(e.key) {
    case 'ArrowLeft':
      keys.left = false
      break
    case 'ArrowRight':
      keys.right = false
      break
    case 'ArrowUp':
      keys.up = false
      break
    case 'ArrowDown':
      keys.down = false
      break
    case 'z':
    case 'Z':
      keys.shoot = false
      break
  }
}

// 生命周期钩子
onMounted(() => {
  // 确保canvas元素已挂载
  if (gameCanvas.value) {
    ctx = gameCanvas.value.getContext('2d')
    gameContainer.value.focus()
    
    // 初始绘制背景
    ctx.fillStyle = gameObjects.backgrounds[0].color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }
})

onUnmounted(() => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
})
</script>

<style scoped>
.contra-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #000;
  outline: none;
}

canvas {
  border: 2px solid #333;
  background-color: #87CEEB;
  margin-top: 20px;
}

.game-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 2rem;
  border-radius: 10px;
  color: white;
}

.game-title {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #ff0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.game-instructions {
  margin-top: 1.5rem;
  text-align: left;
}

.game-instructions ul {
  list-style: none;
  padding: 0;
}

.game-instructions li {
  margin: 0.5rem 0;
}

.game-stats {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  font-size: 1.2rem;
  display: flex;
  gap: 20px;
}

.lives, .score, .weapon {
  background-color: rgba(0, 0, 0, 0.6);
  padding: 5px 10px;
  border-radius: 5px;
}

.game-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 2rem;
  border-radius: 10px;
  color: white;
}
.game-over {
  text-align: center;
  margin-bottom: 1.5rem;
}

.game-over h2 {
  color: #ff0000;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.game-over p {
  font-size: 1.5rem;
  color: #fff;
}
</style>