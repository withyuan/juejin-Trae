<template>
  <div class="game-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" ref="gameContainer">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    <div class="game-info">
      <div class="score">分数: {{ score }}</div>
      <div class="lives">生命值: {{ lives }}</div>
    </div>
    <div v-if="!isGameStarted" class="game-menu">
      <h2>飞机大战</h2>
      <button @click="startGame">开始游戏</button>
      <div class="game-instructions">
        <p>操作说明：</p>
        <p>← →：左右移动</p>
        <p>空格键：发射子弹</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 画布尺寸
const canvasWidth = 800
const canvasHeight = 600

// 游戏状态
const isGameStarted = ref(false)
const score = ref(0)
const lives = ref(3)

// DOM引用
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 玩家飞机
const player = ref({
  x: canvasWidth / 2 - 25,
  y: canvasHeight - 60,
  width: 50,
  height: 40,
  speed: 5,
  bullets: [],
  weaponLevel: 1 // 武器等级
})

// 敌机数组
const enemies = ref([])

// 道具数组
const powerups = ref([])

// 按键状态
const keys = ref({
  left: false,
  right: false,
  space: false
})

// 游戏循环
let gameLoop = null

// 开始游戏
const startGame = () => {
  isGameStarted.value = true
  score.value = 0
  lives.value = 3
  gameContainer.value.focus()
  initGame()
  gameLoop = requestAnimationFrame(updateGame)
}

// 初始化游戏
const initGame = () => {
  ctx = gameCanvas.value.getContext('2d')
  // 设置初始背景
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  player.value.x = canvasWidth / 2 - 25
  player.value.bullets = []
  enemies.value = []
  spawnEnemies()
}

// 生成敌机
const spawnEnemies = () => {
  if (enemies.value.length < 5) {
    enemies.value.push({
      x: Math.random() * (canvasWidth - 40),
      y: -50,
      width: 40,
      height: 40,
      speed: 2,
      bullets: []
    })
  }
}

// 更新游戏状态
const updateGame = () => {
  if (!isGameStarted.value) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 设置背景色
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 更新玩家位置
  updatePlayerPosition()

  // 更新子弹位置
  updateBullets()

  // 更新敌机位置
  updateEnemies()

  // 更新道具位置
  updatePowerups()

  // 检测碰撞
  checkCollisions()

  // 绘制游戏对象
  drawGame()

  // 生成新的敌机
  if (Math.random() < 0.02) spawnEnemies()

  // 生成新的道具（降低生成频率）
  if (Math.random() < 0.002) spawnPowerup()

  gameLoop = requestAnimationFrame(updateGame)
}

// 更新玩家位置
const updatePlayerPosition = () => {
  if (keys.value.left && player.value.x > 0) {
    player.value.x -= player.value.speed
  }
  if (keys.value.right && player.value.x < canvasWidth - player.value.width) {
    player.value.x += player.value.speed
  }
}

// 发射子弹
const shoot = () => {
  const weaponLevel = player.value.weaponLevel
  
  // 根据武器等级发射不同数量的子弹
  if (weaponLevel === 1) {
    // 单发子弹
    player.value.bullets.push({
      x: player.value.x + player.value.width / 2 - 2,
      y: player.value.y,
      width: 4,
      height: 10,
      speed: 7
    })
  } else if (weaponLevel === 2) {
    // 双发子弹
    player.value.bullets.push(
      {
        x: player.value.x + player.value.width / 4 - 2,
        y: player.value.y,
        width: 4,
        height: 10,
        speed: 7
      },
      {
        x: player.value.x + (player.value.width * 3) / 4 - 2,
        y: player.value.y,
        width: 4,
        height: 10,
        speed: 7
      }
    )
  } else {
    // 三发子弹
    player.value.bullets.push(
      {
        x: player.value.x + player.value.width / 2 - 2,
        y: player.value.y,
        width: 4,
        height: 10,
        speed: 7
      },
      {
        x: player.value.x + 5,
        y: player.value.y + 5,
        width: 4,
        height: 10,
        speed: 7
      },
      {
        x: player.value.x + player.value.width - 9,
        y: player.value.y + 5,
        width: 4,
        height: 10,
        speed: 7
      }
    )
  }
}

// 更新子弹位置
const updateBullets = () => {
  // 更新玩家子弹
  player.value.bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed
    if (bullet.y < 0) {
      player.value.bullets.splice(index, 1)
    }
  })

  // 更新敌机子弹
  enemies.value.forEach(enemy => {
    enemy.bullets.forEach((bullet, index) => {
      bullet.y += bullet.speed
      if (bullet.y > canvasHeight) {
        enemy.bullets.splice(index, 1)
      }
    })
  })
}

// 更新敌机位置
const updateEnemies = () => {
  enemies.value.forEach((enemy, index) => {
    enemy.y += enemy.speed

    // 随机发射子弹
    if (Math.random() < 0.01) {
      enemy.bullets.push({
        x: enemy.x + enemy.width / 2 - 2,
        y: enemy.y + enemy.height,
        width: 4,
        height: 10,
        speed: 5
      })
    }

    // 移除超出屏幕的敌机
    if (enemy.y > canvasHeight) {
      enemies.value.splice(index, 1)
    }
  })
}

// 生成道具
const spawnPowerup = () => {
  powerups.value.push({
    x: Math.random() * (canvasWidth - 20),
    y: -20,
    width: 20,
    height: 20,
    speed: 2,
    type: 'weapon'
  })
}

// 更新道具位置
const updatePowerups = () => {
  powerups.value.forEach((powerup, index) => {
    powerup.y += powerup.speed
    if (powerup.y > canvasHeight) {
      powerups.value.splice(index, 1)
    }
  })
}

// 检测碰撞
const checkCollisions = () => {
  // 检测玩家子弹与敌机的碰撞
  player.value.bullets.forEach((bullet, bulletIndex) => {
    enemies.value.forEach((enemy, enemyIndex) => {
      if (isColliding(bullet, enemy)) {
        player.value.bullets.splice(bulletIndex, 1)
        enemies.value.splice(enemyIndex, 1)
        score.value += 100
      }
    })
  })

  // 检测敌机子弹与玩家的碰撞
  enemies.value.forEach(enemy => {
    enemy.bullets.forEach((bullet, bulletIndex) => {
      if (isColliding(bullet, player.value)) {
        enemy.bullets.splice(bulletIndex, 1)
        lives.value--
        // 受到伤害时降低武器等级
        if (player.value.weaponLevel > 1) {
          player.value.weaponLevel--
        }
        if (lives.value <= 0) {
          gameOver()
        }
      }
    })
  })

  // 检测玩家与敌机的碰撞
  enemies.value.forEach((enemy, index) => {
    if (isColliding(enemy, player.value)) {
      enemies.value.splice(index, 1)
      lives.value--
      // 与敌机碰撞时降低武器等级
      if (player.value.weaponLevel > 1) {
        player.value.weaponLevel--
      }
      if (lives.value <= 0) {
        gameOver()
      }
    }
  })

  // 检测玩家与道具的碰撞
  powerups.value.forEach((powerup, index) => {
    if (isColliding(powerup, player.value)) {
      if (powerup.type === 'weapon' && player.value.weaponLevel < 3) {
        player.value.weaponLevel++
      }
      powerups.value.splice(index, 1)
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

// 绘制游戏对象
const drawGame = () => {
  // 绘制玩家
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(player.value.x, player.value.y, player.value.width, player.value.height)

  // 绘制玩家子弹
  ctx.fillStyle = '#fff'
  player.value.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
  })

  // 绘制敌机
  ctx.fillStyle = '#ff0000'
  enemies.value.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)

    // 绘制敌机子弹
    ctx.fillStyle = '#ffff00'
    enemy.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    })
  })

  // 绘制道具
  ctx.fillStyle = '#00ffff'
  powerups.value.forEach(powerup => {
    ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height)
  })
}

// 游戏结束
const gameOver = () => {
  isGameStarted.value = false
  cancelAnimationFrame(gameLoop)
  alert(`游戏结束！最终得分：${score.value}`)
}

// 键盘事件处理
const handleKeyDown = (e) => {
  switch(e.key) {
    case 'ArrowLeft':
      keys.value.left = true
      break
    case 'ArrowRight':
      keys.value.right = true
      break
    case ' ':
      if (!isGameStarted.value) {
        startGame()
      } else {
        if (!keys.value.space) {
          keys.value.space = true
          shoot()
        }
      }
      break
  }
  e.preventDefault()
}

const handleKeyUp = (e) => {
  switch(e.key) {
    case 'ArrowLeft':
      keys.value.left = false
      break
    case 'ArrowRight':
      keys.value.right = false
      break
    case ' ':
      keys.value.space = false
      break
  }
  e.preventDefault()
}

// 组件挂载时初始化画布
onMounted(() => {
  if (gameCanvas.value) {
    try {
      ctx = gameCanvas.value.getContext('2d');
      
      if (!ctx) {
        console.error('无法获取canvas上下文');
        return;
      }
      
      // 确保设置正确的画布尺寸
      gameCanvas.value.width = canvasWidth;
      gameCanvas.value.height = canvasHeight;
      
      // 重置游戏状态
      isGameStarted.value = false;
      score.value = 0;
      lives.value = 3;
      
      // 设置初始背景
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // 绘制初始游戏菜单
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('飞机大战', canvasWidth / 2, canvasHeight / 2 - 50);
      
      // 绘制开始游戏提示
      ctx.font = '24px Arial';
      ctx.fillText('按空格键开始游戏', canvasWidth / 2, canvasHeight / 2 + 20);
      
      // 设置焦点
      gameContainer.value.focus();
    } catch (error) {
      console.error('初始化游戏画布时出错:', error);
    }
  } else {
    console.error('找不到canvas元素');
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background-color: #000;
  outline: none;
}

.game-info {
  position: absolute;
  top: 10px;
  left: 10px;
  color: #fff;
  font-size: 18px;
}

.game-menu {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
}

.game-menu button {
  padding: 10px 20px;
  font-size: 18px;
  margin: 20px 0;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
}

.game-menu button:hover {
  background-color: #45a049;
}

.game-instructions {
  margin-top: 20px;
  font-size: 16px;
}
</style>