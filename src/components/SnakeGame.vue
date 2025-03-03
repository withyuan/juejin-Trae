<template>
  <div class="snake-container">
    <div class="game-area">
      <div class="game-board" ref="gameBoard">
        <div v-for="(row, rowIndex) in gameState" :key="rowIndex" class="row">
          <div v-for="(cell, colIndex) in row" :key="colIndex" 
               :class="['cell', getCellClass(cell)]">
          </div>
        </div>
      </div>
      <div class="side-panel">
        <div class="score-section">
          <h3>分数</h3>
          <p class="score">{{ score }}</p>
        </div>
        <div class="difficulty-section">
          <h3>难度</h3>
          <select v-model="difficulty" @change="changeDifficulty" :disabled="isPlaying">
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div class="controls-info">
          <h3>操作说明</h3>
          <ul>
            <li>← → ↑ ↓ : 移动方向</li>
            <li>空格 : 暂停</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="game-controls">
      <button @click="startGame" v-if="!isPlaying">开始游戏</button>
      <button @click="pauseGame" v-else>{{ isPaused ? '继续' : '暂停' }}</button>
    </div>
  </div>
</template>

<script>
const BOARD_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 3;

export default {
  name: 'SnakeGame',
  data() {
    return {
      gameState: [],
      snake: [],
      direction: 'right',
      nextDirection: 'right',
      food: null,
      specialFood: null,
      score: 0,
      isPlaying: false,
      isPaused: false,
      gameInterval: null,
      difficulty: 'medium',
      gameSpeed: 150,
      specialFoodTimeout: null
    }
  },
  methods: {
    initGame() {
      // 重置游戏状态
      this.gameState = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
      this.snake = [];
      
      // 初始化蛇的位置在游戏区域的中心
      const startX = Math.floor(BOARD_SIZE / 2);
      const startY = Math.floor(BOARD_SIZE / 2);
      
      // 从右到左初始化蛇的身体，确保蛇头在最右边
      for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        const segment = { x: startX - i, y: startY };
        this.snake.push(segment);
        this.gameState[startY][startX - i] = 1;
      }
      
      this.generateFood();
      this.score = 0;
      this.direction = 'right';
      this.nextDirection = 'right';
    },
    
    startGame() {
      if (this.isPlaying) return;
      this.initGame();
      this.isPlaying = true;
      this.isPaused = false;
      window.addEventListener('keydown', this.handleKeyPress);
      this.gameInterval = setInterval(this.gameLoop, this.gameSpeed);
    },
    
    pauseGame() {
      if (!this.isPlaying) return;
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        clearInterval(this.gameInterval);
      } else {
        this.gameInterval = setInterval(this.gameLoop, this.gameSpeed);
      }
    },
    
    gameLoop() {
      if (this.isPaused) return;
      
      this.direction = this.nextDirection;
      const head = { ...this.snake[0] };
      
      // 根据方向移动蛇头
      switch(this.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }
      
      // 检查碰撞
      if (this.checkCollision(head)) {
        this.gameOver();
        return;
      }
      
      // 移动蛇
      this.snake.unshift(head);
      this.gameState[head.y][head.x] = 1;
      
      // 检查是否吃到食物
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score += 10;
        this.generateFood();
      } else if (this.specialFood && head.x === this.specialFood.x && head.y === this.specialFood.y) {
        this.handleSpecialFood();
      } else {
        const tail = this.snake.pop();
        this.gameState[tail.y][tail.x] = 0;
      }
    },
    
    checkCollision(position) {
      // 检查是否撞墙
      if (position.x < 0 || position.x >= BOARD_SIZE || 
          position.y < 0 || position.y >= BOARD_SIZE) {
        return true;
      }
      
      // 检查是否撞到自己（只检查蛇身，不包括蛇头）
      return this.snake.slice(1).some(segment => 
        segment.x === position.x && segment.y === position.y
      );
    },
    
    generateFood() {
      do {
        this.food = {
          x: Math.floor(Math.random() * BOARD_SIZE),
          y: Math.floor(Math.random() * BOARD_SIZE)
        }
      } while (this.snake.some(segment => 
        segment.x === this.food.x && segment.y === this.food.y
      ));
      
      this.gameState[this.food.y][this.food.x] = 2;
      
      // 随机生成特殊食物
      if (Math.random() < 0.2) { // 20%的概率生成特殊食物
        this.generateSpecialFood();
      }
    },
    
    generateSpecialFood() {
      if (this.specialFoodTimeout) {
        clearTimeout(this.specialFoodTimeout);
      }
      
      do {
        this.specialFood = {
          x: Math.floor(Math.random() * BOARD_SIZE),
          y: Math.floor(Math.random() * BOARD_SIZE),
          type: Math.floor(Math.random() * 3) + 3 // 3-5的特殊食物类型
        }
      } while (this.snake.some(segment => 
        segment.x === this.specialFood.x && segment.y === this.specialFood.y
      ) || (this.food.x === this.specialFood.x && this.food.y === this.specialFood.y));
      
      this.gameState[this.specialFood.y][this.specialFood.x] = this.specialFood.type;
      
      // 特殊食物5秒后消失
      this.specialFoodTimeout = setTimeout(() => {
        if (this.specialFood) {
          this.gameState[this.specialFood.y][this.specialFood.x] = 0;
          this.specialFood = null;
        }
      }, 5000);
    },
    
    handleSpecialFood() {
      switch(this.specialFood.type) {
        case 3: // 加速
          this.score += 20;
          clearInterval(this.gameInterval);
          this.gameSpeed = Math.max(50, this.gameSpeed - 20);
          this.gameInterval = setInterval(this.gameLoop, this.gameSpeed);
          break;
        case 4: // 减速
          this.score += 15;
          clearInterval(this.gameInterval);
          this.gameSpeed = Math.min(300, this.gameSpeed + 20);
          this.gameInterval = setInterval(this.gameLoop, this.gameSpeed);
          break;
        case 5: // 双倍积分
          this.score += 30;
          break;
      }
      
      this.gameState[this.specialFood.y][this.specialFood.x] = 0;
      this.specialFood = null;
      if (this.specialFoodTimeout) {
        clearTimeout(this.specialFoodTimeout);
      }
    },
    
    handleKeyPress(event) {
      if (!this.isPlaying || this.isPaused) return;
      
      switch(event.key) {
        case 'ArrowUp':
          if (this.direction !== 'down') this.nextDirection = 'up';
          break;
        case 'ArrowDown':
          if (this.direction !== 'up') this.nextDirection = 'down';
          break;
        case 'ArrowLeft':
          if (this.direction !== 'right') this.nextDirection = 'left';
          break;
        case 'ArrowRight':
          if (this.direction !== 'left') this.nextDirection = 'right';
          break;
        case ' ':
          this.pauseGame();
          break;
      }
    },
    
    changeDifficulty() {
      switch(this.difficulty) {
        case 'easy':
          this.gameSpeed = 200;
          break;
        case 'medium':
          this.gameSpeed = 150;
          break;
        case 'hard':
          this.gameSpeed = 100;
          break;
      }
    },
    
    getCellClass(cell) {
      if (cell === 0) return '';
      if (cell === 1) return 'snake';
      if (cell === 2) return 'food';
      return `special-food-${cell}`;
    },
    
    gameOver() {
      clearInterval(this.gameInterval);
      this.isPlaying = false;
      window.removeEventListener('keydown', this.handleKeyPress);
      alert(`游戏结束！得分：${this.score}`);
    }
  },
  
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
    clearInterval(this.gameInterval);
    if (this.specialFoodTimeout) {
      clearTimeout(this.specialFoodTimeout);
    }
  }
}
</script>

<style scoped>
.snake-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.game-area {
  display: flex;
  gap: 20px;
}

.game-board {
  display: grid;
  grid-template-rows: repeat(20, 20px);
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.row {
  display: grid;
  grid-template-columns: repeat(20, 20px);
  gap: 1px;
}

.cell {
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.cell.snake {
  background: #4CAF50;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.cell.food {
  background: #FF9800;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.cell.special-food-3 {
  background: #F44336;
  animation: pulse 1s infinite;
}

.cell.special-food-4 {
  background: #2196F3;
  animation: pulse 1s infinite;
}

.cell.special-food-5 {
  background: #9C27B0;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 10px;
  min-width: 200px;
}

.score-section, .difficulty-section, .controls-info {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
}

.score {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
  text-align: center;
  margin: 10px 0;
}

.difficulty-section select {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.controls-info ul {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}

.controls-info li {
  margin: 5px 0;
  font-size: 14px;
  color: #ccc;
}

.game-controls button {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  border: none;
  border-radius: 25px;
  cursor: pointer;
}
</style>