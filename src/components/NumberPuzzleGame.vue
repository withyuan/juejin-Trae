<template>
  <div class="puzzle-container" tabindex="0" @keydown="handleKeyDown" ref="puzzleContainer">
    <div class="game-header">
      <div class="game-info">
        <div class="timer">时间：{{ formatTime(time) }}</div>
        <div class="moves">步数：{{ moves }}</div>
      </div>
      <div class="controls">
        <el-select v-model="gridSize" :disabled="isPlaying">
          <el-option label="3 x 3" :value="3" />
          <el-option label="4 x 4" :value="4" />
          <el-option label="5 x 5" :value="5" />
        </el-select>
        <el-button type="primary" @click="startGame">{{ isPlaying ? '重新开始' : '开始游戏' }}</el-button>
      </div>
    </div>

    <div class="puzzle-board" :style="{ '--grid-size': gridSize }">
      <div
        v-for="(number, index) in board"
        :key="index"
        :class="['puzzle-tile', { 'empty': number === 0 }]"
        :style="getTileStyle(index)"
      >
        {{ number || '' }}
      </div>
    </div>

    <div class="best-records" v-if="bestRecords.length > 0">
      <h3>最佳记录</h3>
      <ul>
        <li v-for="(record, index) in bestRecords" :key="index">
          {{ record.gridSize }}x{{ record.gridSize }} - {{ formatTime(record.time) }} - {{ record.moves }}步
        </li>
      </ul>
    </div>

    <el-dialog
      title="恭喜!"
      v-model="showWinDialog"
      width="300px"
      :show-close="false"
      :close-on-click-modal="false"
    >
      <div class="win-content">
        <p>你完成了 {{ gridSize }}x{{ gridSize }} 的拼图！</p>
        <p>用时：{{ formatTime(time) }}</p>
        <p>步数：{{ moves }}</p>
        <el-button type="primary" @click="startNewGame">再来一局</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 游戏状态
const gridSize = ref(3)
const board = ref([])
const isPlaying = ref(false)
const time = ref(0)
const moves = ref(0)
const showWinDialog = ref(false)
const bestRecords = ref([])

// 监听gridSize变化
watch(gridSize, (newSize) => {
  isPlaying.value = false
  clearInterval(timer)
  board.value = []
  time.value = 0
  moves.value = 0
  showWinDialog.value = false
})

// 计时器
let timer = null

// DOM引用
const puzzleContainer = ref(null)

// 初始化游戏板
const initBoard = () => {
  const size = gridSize.value
  const newBoard = Array.from({ length: size * size }, (_, i) => i)
  // 打乱数组
  for (let i = newBoard.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newBoard[i], newBoard[j]] = [newBoard[j], newBoard[i]]
  }
  // 确保可解
  if (!isSolvable(newBoard)) {
    if (newBoard[0] !== 0 && newBoard[1] !== 0) {
      [newBoard[0], newBoard[1]] = [newBoard[1], newBoard[0]]
    } else {
      [newBoard[newBoard.length - 2], newBoard[newBoard.length - 1]] = 
      [newBoard[newBoard.length - 1], newBoard[newBoard.length - 2]]
    }
  }
  board.value = newBoard
}

// 检查是否可解
const isSolvable = (puzzle) => {
  const size = gridSize.value
  let inversions = 0
  let emptyRow = 0

  // 计算逆序数
  for (let i = 0; i < puzzle.length - 1; i++) {
    if (puzzle[i] === 0) {
      emptyRow = Math.floor(i / size)
      continue
    }
    for (let j = i + 1; j < puzzle.length; j++) {
      if (puzzle[j] !== 0 && puzzle[i] > puzzle[j]) {
        inversions++
      }
    }
  }

  if (size % 2 === 1) {
    return inversions % 2 === 0
  } else {
    return ((size - emptyRow) % 2 === 0) === (inversions % 2 === 0)
  }
}

// 开始新游戏
const startNewGame = () => {
  showWinDialog.value = false
  startGame()
}

// 开始游戏
const startGame = () => {
  initBoard()
  isPlaying.value = true
  time.value = 0
  moves.value = 0
  clearInterval(timer)
  timer = setInterval(() => {
    time.value++
  }, 1000)
  puzzleContainer.value.focus()
}

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 获取方块样式
const getTileStyle = (index) => {
  if (board.value[index] === 0) return {}
  return {
    cursor: canMove(index) ? 'pointer' : 'default'
  }
}

// 检查是否可以移动
const canMove = (index) => {
  if (!isPlaying.value) return false
  const size = gridSize.value
  const emptyIndex = board.value.indexOf(0)
  const row = Math.floor(index / size)
  const col = index % size
  const emptyRow = Math.floor(emptyIndex / size)
  const emptyCol = emptyIndex % size

  return (
    (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
    (Math.abs(col - emptyCol) === 1 && row === emptyRow)
  )
}

// 移动方块
const moveTile = (index) => {
  if (!canMove(index)) return
  const emptyIndex = board.value.indexOf(0)
  board.value = board.value.map((num, i) => {
    if (i === index) return 0
    if (i === emptyIndex) return board.value[index]
    return num
  })
  moves.value++
  checkWin()
}

// 检查是否胜利
const checkWin = () => {
  const isWin = board.value.every((num, index) => {
    if (index === board.value.length - 1) return num === 0
    return num === index + 1
  })

  if (isWin) {
    clearInterval(timer)
    showWinDialog.value = true
    isPlaying.value = false
    updateBestRecord()
  }
}

// 更新最佳记录
const updateBestRecord = () => {
  const currentRecord = {
    gridSize: gridSize.value,
    time: time.value,
    moves: moves.value
  }

  const records = [...bestRecords.value]
  const sizeRecordIndex = records.findIndex(r => r.gridSize === gridSize.value)

  if (sizeRecordIndex === -1) {
    records.push(currentRecord)
  } else if (records[sizeRecordIndex].moves > moves.value || 
            (records[sizeRecordIndex].moves === moves.value && 
             records[sizeRecordIndex].time > time.value)) {
    records[sizeRecordIndex] = currentRecord
  }

  bestRecords.value = records.sort((a, b) => a.gridSize - b.gridSize)
  localStorage.setItem('puzzleBestRecords', JSON.stringify(records))
}

// 键盘控制
const handleKeyDown = (e) => {
  if (!isPlaying.value) return

  const size = gridSize.value
  const emptyIndex = board.value.indexOf(0)
  const row = Math.floor(emptyIndex / size)
  const col = emptyIndex % size

  let targetIndex = -1

  switch (e.key) {
    case 'ArrowUp':
      if (row < size - 1) targetIndex = emptyIndex + size
      break
    case 'ArrowDown':
      if (row > 0) targetIndex = emptyIndex - size
      break
    case 'ArrowLeft':
      if (col < size - 1) targetIndex = emptyIndex + 1
      break
    case 'ArrowRight':
      if (col > 0) targetIndex = emptyIndex - 1
      break
  }

  if (targetIndex !== -1) {
    moveTile(targetIndex)
  }
}

// 加载最佳记录
onMounted(() => {
  const savedRecords = localStorage.getItem('puzzleBestRecords')
  if (savedRecords) {
    bestRecords.value = JSON.parse(savedRecords)
  }
})

// 清理定时器
onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.puzzle-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  outline: none;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.game-info {
  display: flex;
  gap: 20px;
  font-size: 1.2em;
}

.controls {
  display: flex;
  gap: 10px;
}

.puzzle-board {
  display: grid;
  grid-template-columns: repeat(var(--grid-size), 1fr);
  gap: 5px;
  background-color: #2c3e50;
  padding: 5px;
  border-radius: 8px;
  margin: 20px 0;
  aspect-ratio: 1;
}

.puzzle-tile {
  background-color: #3498db;
  color: white;
  font-size: 2em;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
  aspect-ratio: 1;
}

.puzzle-tile:not(.empty):hover {
  transform: scale(0.98);
}

.puzzle-tile.empty {
  background-color: transparent;
}

.best-records {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.best-records h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.best-records ul {
  list-style: none;
  padding: 0;
}

.best-records li {
  padding: 5px 0;
  color: #666;
}

.win-content {
  text-align: center;
}

.win-content p {
  margin: 10px 0;
  font-size: 1.1em;
}
</style>