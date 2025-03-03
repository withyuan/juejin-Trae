<template>
  <div class="tetris-container">
    <div class="game-area">
      <div class="game-board" ref="gameBoard">
        <div v-for="(row, rowIndex) in gameState" :key="rowIndex" class="row">
          <div v-for="(cell, colIndex) in row" :key="colIndex" 
               :class="['cell', { 
                 filled: cell !== 0 || (currentPiece && isCurrentPieceCell(rowIndex, colIndex)), 
                 [`color-${cell || (isCurrentPieceCell(rowIndex, colIndex) ? currentPiece.color : 0)}`]: cell !== 0 || isCurrentPieceCell(rowIndex, colIndex) 
               }]">
          </div>
        </div>
      </div>
      <div class="side-panel">
        <div class="score-section">
          <h3>分数</h3>
          <p class="score">{{ score }}</p>
        </div>
        <div class="next-piece">
          <h3>下一个</h3>
          <div class="next-piece-preview">
            <div v-for="(row, rowIndex) in nextPieceDisplay" :key="rowIndex" class="preview-row">
              <div v-for="(cell, colIndex) in row" :key="colIndex"
                   :class="['preview-cell', { filled: cell !== 0, [`color-${cell}`]: cell !== 0 }]">
              </div>
            </div>
          </div>
        </div>
        <div class="controls-info">
          <h3>操作说明</h3>
          <ul>
            <li>← → : 左右移动</li>
            <li>↑ : 旋转</li>
            <li>↓ : 加速下落</li>
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
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const SHAPES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 1
  },
  L: {
    shape: [[2, 0], [2, 0], [2, 2]],
    color: 2
  },
  J: {
    shape: [[0, 3], [0, 3], [3, 3]],
    color: 3
  },
  O: {
    shape: [[4, 4], [4, 4]],
    color: 4
  },
  Z: {
    shape: [[5, 5, 0], [0, 5, 5]],
    color: 5
  },
  S: {
    shape: [[0, 6, 6], [6, 6, 0]],
    color: 6
  },
  T: {
    shape: [[0, 7, 0], [7, 7, 7]],
    color: 7
  }
};

export default {
  name: 'TetrisGame',
  data() {
    return {
      gameState: [],
      currentPiece: null,
      currentPiecePosition: { x: 0, y: 0 },
      nextPiece: null,
      score: 0,
      isPlaying: false,
      isPaused: false,
      gameInterval: null,
      gameSpeed: 1000,
    }
  },
  computed: {
    nextPieceDisplay() {
      // 如果没有下一个方块，返回空数组
      if (!this.nextPiece) return Array(4).fill().map(() => Array(4).fill(0));
      
      // 创建4x4的显示数组
      const display = Array(4).fill().map(() => Array(4).fill(0));
      const shape = this.nextPiece.shape;
      
      // 计算居中偏移
      const offsetY = Math.floor((4 - shape.length) / 2);
      const offsetX = Math.floor((4 - shape[0].length) / 2);
      
      // 将形状数据复制到显示数组中
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const displayY = y + offsetY;
            const displayX = x + offsetX;
            if (displayY >= 0 && displayY < 4 && displayX >= 0 && displayX < 4) {
              display[displayY][displayX] = this.nextPiece.color;
            }
          }
        }
      }
      
      return display;
    }
  },
  methods: {
    isCurrentPieceCell(rowIndex, colIndex) {
      if (!this.currentPiece || !this.isPlaying) return false;
      const shape = this.currentPiece.shape;
      const pos = this.currentPiecePosition;
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0 && 
              rowIndex === pos.y + y && 
              colIndex === pos.x + x) {
            return true;
          }
        }
      }
      return false;
    },
    initBoard() {
      this.gameState = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    },
    startGame() {
      this.initBoard();
      this.score = 0;
      this.isPlaying = true;
      this.isPaused = false;
      this.generateNewPiece();
      this.startGameLoop();
      window.addEventListener('keydown', this.handleKeyPress);
    },
    pauseGame() {
      if (this.isPaused) {
        this.startGameLoop();
      } else {
        clearInterval(this.gameInterval);
      }
      this.isPaused = !this.isPaused;
    },
    generateNewPiece() {
      const pieces = Object.keys(SHAPES);
      const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
      if (!this.currentPiece) {
        this.currentPiece = SHAPES[randomPiece];
        this.nextPiece = SHAPES[pieces[Math.floor(Math.random() * pieces.length)]];
      } else {
        this.currentPiece = this.nextPiece;
        this.nextPiece = SHAPES[pieces[Math.floor(Math.random() * pieces.length)]];
      }
      this.currentPiecePosition = {
        x: Math.floor((BOARD_WIDTH - this.currentPiece.shape[0].length) / 2),
        y: 0
      };
      if (this.checkCollision()) {
        this.gameOver();
      }
    },
    startGameLoop() {
      this.gameInterval = setInterval(() => {
        if (!this.isPaused) {
          this.moveDown();
        }
      }, this.gameSpeed);
    },
    checkCollision(offsetX = 0, offsetY = 0, rotatedPiece = null) {
      const piece = rotatedPiece || this.currentPiece.shape;
      const pos = this.currentPiecePosition;
      
      for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
          if (piece[y][x] !== 0) {
            const newX = pos.x + x + offsetX;
            const newY = pos.y + y + offsetY;
            
            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
            if (newY >= 0 && this.gameState[newY][newX] !== 0) return true;
          }
        }
      }
      return false;
    },
    rotatePiece() {
      if (this.isPaused) return;
      const rotated = this.currentPiece.shape[0].map((_, i) =>
        this.currentPiece.shape.map(row => row[row.length - 1 - i]).filter(x => x !== undefined)
      );
      if (!this.checkCollision(0, 0, rotated)) {
        this.currentPiece.shape = rotated;
      }
    },
    moveDown() {
      if (this.checkCollision(0, 1)) {
        this.placePiece();
        this.clearLines();
        this.generateNewPiece();
      } else {
        this.currentPiecePosition.y++;
      }
    },
    moveLeft() {
      if (!this.checkCollision(-1, 0)) {
        this.currentPiecePosition.x--;
      }
    },
    moveRight() {
      if (!this.checkCollision(1, 0)) {
        this.currentPiecePosition.x++;
      }
    },
    placePiece() {
      this.currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const boardY = y + this.currentPiecePosition.y;
            const boardX = x + this.currentPiecePosition.x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT) {
              this.gameState[boardY][boardX] = this.currentPiece.color;
            }
          }
        });
      });
    },
    clearLines() {
      let linesCleared = 0;
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (this.gameState[y].every(cell => cell !== 0)) {
          this.gameState.splice(y, 1);
          this.gameState.unshift(Array(BOARD_WIDTH).fill(0));
          linesCleared++;
          y++;
        }
      }
      if (linesCleared > 0) {
        this.score += linesCleared * 100 * linesCleared; // 连消奖励
      }
    },
    handleKeyPress(event) {
      if (!this.isPlaying || this.isPaused) return;
      
      switch(event.key) {
        case 'ArrowLeft':
          this.moveLeft();
          break;
        case 'ArrowRight':
          this.moveRight();
          break;
        case 'ArrowUp':
          this.rotatePiece();
          break;
        case 'ArrowDown':
          this.moveDown();
          break;
        case ' ':
          this.pauseGame();
          break;
      }
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
  }
}
</script>

<style scoped>
.tetris-container {
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
  grid-template-rows: repeat(20, 30px);
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.row {
  display: grid;
  grid-template-columns: repeat(10, 30px);
  gap: 1px;
}

.cell {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.cell.filled {
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.color-1 { background: #FF0D72; }
.color-2 { background: #0DC2FF; }
.color-3 { background: #0DFF72; }
.color-4 { background: #F538FF; }
.color-5 { background: #FF8E0D; }
.color-6 { background: #FFE138; }
.color-7 { background: #3877FF; }

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

.score-section, .next-piece, .controls-info {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
}

.score {
  font-size: 24px;
  font-weight: bold;
  color: #FFE138;
  text-align: center;
  margin: 10px 0;
}

.next-piece-preview {
  display: grid;
  grid-template-rows: repeat(4, 20px);
  gap: 1px;
  margin-top: 10px;
}

.preview-row {
  display: grid;
  grid-template-columns: repeat(4, 20px);
  gap: 1px;
}

.preview-cell {
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
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
  background: linear-gradient(45deg, #FF0D72, #F538FF);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 15px rgba(255, 13, 114, 0.3);
}

.game-controls button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 13, 114, 0.4);
}

.game-controls button:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 13, 114, 0.3);
}
</style>