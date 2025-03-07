<template>
  <div class="game-container" tabindex="0" ref="gameContainer">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    <div class="game-info">
      <div class="score">得分: {{ score }}</div>
    </div>
    <div v-if="!isGameStarted" class="game-menu">
      <h2>快乐运动</h2>
      <button @click="startGame" class="start-button">开始游戏</button>
      <div class="game-instructions">
        <p>跟着小兔子一起运动吧！</p>
        <p>看小兔子做动作</p>
        <p>它会自动完成指定动作</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import bunnyImage from '../assets/bunny.png'

// 画布尺寸
const canvasWidth = 800
const canvasHeight = 600

// 游戏状态
const isGameStarted = ref(false)
const score = ref(0)

// DOM引用
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null

// 兔子图片
const bunny = new Image()
bunny.src = bunnyImage

// 角色状态
const character = ref({
  x: canvasWidth / 2 - 50,
  y: canvasHeight - 150,
  width: 100,
  height: 100,
  state: 'idle',
  direction: 1,
  jumpHeight: 0,
  maxJumpHeight: 150
})

// 当前动作指示
const currentAction = ref({
  type: '',
  timeLeft: 0
})

// 游戏循环
let gameLoop = null

// 开始游戏
const startGame = () => {
  isGameStarted.value = true
  score.value = 0
  gameContainer.value.focus()
  initGame()
  gameLoop = requestAnimationFrame(updateGame)
  generateNewAction()
}

// 初始化游戏
const initGame = () => {
  ctx = gameCanvas.value.getContext('2d')
  character.value.state = 'idle'
  character.value.y = canvasHeight - 150
}

// 生成新动作
const generateNewAction = () => {
  const actions = ['jump', 'squat', 'stepLeft', 'stepRight']
  const newAction = actions[Math.floor(Math.random() * actions.length)]
  
  currentAction.value = {
    type: newAction,
    timeLeft: 3000
  }
  
  // 自动执行动作
  executeAction(newAction)
}

// 执行动作
const executeAction = (actionType) => {
  switch (actionType) {
    case 'jump':
      character.value.state = 'jump'
      break
    case 'squat':
      character.value.state = 'squat'
      setTimeout(() => {
        if (character.value.state === 'squat') {
          character.value.state = 'idle'
        }
      }, 1000)
      break
    case 'stepLeft':
      character.value.direction = -1
      setTimeout(() => {
        character.value.direction = 1
      }, 1000)
      break
    case 'stepRight':
      character.value.direction = 1
      break
  }
  score.value += 10
}

// 更新游戏状态
const updateGame = () => {
  if (!isGameStarted.value) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制背景
  drawBackground()
  
  // 更新角色状态
  updateCharacter()
  
  // 绘制角色
  drawCharacter()
  
  // 绘制动作指示
  drawActionPrompt()
  
  // 更新动作计时器
  updateActionTimer()
  
  gameLoop = requestAnimationFrame(updateGame)
}

// 绘制背景
const drawBackground = () => {
  ctx.fillStyle = '#87CEEB'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  ctx.fillStyle = '#90EE90'
  ctx.fillRect(0, canvasHeight - 50, canvasWidth, 50)
}

// 更新角色状态
const updateCharacter = () => {
  if (character.value.state === 'jump') {
    if (character.value.jumpHeight < character.value.maxJumpHeight) {
      character.value.y -= 5
      character.value.jumpHeight += 5
    } else {
      character.value.state = 'falling'
    }
  } else if (character.value.state === 'falling') {
    if (character.value.y < canvasHeight - 150) {
      character.value.y += 5
      character.value.jumpHeight -= 5
    } else {
      character.value.state = 'idle'
      character.value.jumpHeight = 0
    }
  }
}

// 绘制角色
const drawCharacter = () => {
  const scale = character.value.state === 'squat' ? 0.8 : 1
  const width = character.value.width * scale
  const height = character.value.height * scale
  
  ctx.save()
  ctx.translate(character.value.x + width / 2, character.value.y + height / 2)
  ctx.scale(character.value.direction, 1)
  ctx.drawImage(bunny, -width / 2, -height / 2, width, height)
  ctx.restore()
}

// 绘制动作指示
const drawActionPrompt = () => {
  ctx.font = '30px Arial'
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  
  let actionText = ''
  switch (currentAction.value.type) {
    case 'jump':
      actionText = '跳跳跳！'
      break
    case 'squat':
      actionText = '蹲下来！'
      break
    case 'stepLeft':
      actionText = '向左踏步！'
      break
    case 'stepRight':
      actionText = '向右踏步！'
      break
  }
  
  ctx.fillText(actionText, canvasWidth / 2, 50)
}

// 更新动作计时器
const updateActionTimer = () => {
  if (currentAction.value.timeLeft > 0) {
    currentAction.value.timeLeft -= 16
  } else {
    generateNewAction()
  }
}

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
  outline: none;
}

.game-info {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  color: #333;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 10px;
}

.game-menu {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.start-button {
  font-size: 24px;
  padding: 15px 40px;
  margin: 20px 0;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.start-button:hover {
  background: #45a049;
}

.game-instructions {
  font-size: 18px;
  color: #666;
  margin-top: 20px;
}

.game-instructions p {
  margin: 10px 0;
}
</style>