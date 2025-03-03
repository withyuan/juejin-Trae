<template>
  <div class="game-2048-container">
    <div class="game-area">
      <div class="game-board" ref="gameBoard">
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
          <div v-for="(cell, colIndex) in row" :key="colIndex"
               class="cell"
               :class="[`cell-${cell}`, { 'cell-new': isNewCell(rowIndex, colIndex) }]">
            {{ cell || '' }}
          </div>
        </div>
      </div>
      <div class="side-panel">
        <div class="score-section">
          <h3>当前分数</h3>
          <p class="score">{{ score }}</p>
        </div>
        <div class="best-score-section">
          <h3>最高分</h3>
          <p class="best-score">{{ bestScore }}</p>
        </div>
        <div class="controls">
          <button @click="newGame" class="new-game-btn">新游戏</button>
          <button @click="undo" :disabled="!canUndo" class="undo-btn">撤销</button>
        </div>
        <div class="controls-info">
          <h3>操作说明</h3>
          <ul>
            <li>← → ↑ ↓ : 移动方块</li>
            <li>R : 重新开始</li>
            <li>U : 撤销</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Game2048',
  data() {
    return {
      board: [],
      score: 0,
      bestScore: 0,
      history: [],
      newCells: new Set(),
      BOARD_SIZE: 4,
      WINNING_SCORE: 2048
    }
  },
  computed: {
    canUndo() {
      return this.history.length > 0;
    }
  },
  mounted() {
    this.initGame();
    window.addEventListener('keydown', this.handleKeyPress);
    // 从localStorage加载最高分
    const savedBestScore = localStorage.getItem('2048-best-score');
    if (savedBestScore) {
      this.bestScore = parseInt(savedBestScore);
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  methods: {
    initGame() {
      this.board = Array(this.BOARD_SIZE).fill().map(() => Array(this.BOARD_SIZE).fill(0));
      this.score = 0;
      this.history = [];
      this.newCells.clear();
      this.addNewTile();
      this.addNewTile();
    },

    newGame() {
      this.initGame();
    },

    undo() {
      if (!this.canUndo) return;
      const lastState = this.history.pop();
      this.board = lastState.board.map(row => [...row]);
      this.score = lastState.score;
      this.newCells.clear();
    },

    addNewTile() {
      const emptyCells = [];
      for (let i = 0; i < this.BOARD_SIZE; i++) {
        for (let j = 0; j < this.BOARD_SIZE; j++) {
          if (this.board[i][j] === 0) {
            emptyCells.push({x: i, y: j});
          }
        }
      }
      if (emptyCells.length === 0) return;

      const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[x][y] = Math.random() < 0.9 ? 2 : 4;
      this.newCells.add(`${x}-${y}`);
    },

    isNewCell(row, col) {
      return this.newCells.has(`${row}-${col}`);
    },

    handleKeyPress(event) {
      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const direction = event.key.replace('Arrow', '').toLowerCase();
        this.move(direction);
      } else if (event.key.toLowerCase() === 'r') {
        this.newGame();
      } else if (event.key.toLowerCase() === 'u') {
        this.undo();
      }
    },

    saveState() {
      this.history.push({
        board: this.board.map(row => [...row]),
        score: this.score
      });
    },

    move(direction) {
      this.saveState();
      this.newCells.clear();
      let moved = false;

      const rotate = (matrix) => {
        const N = matrix.length;
        const ret = Array(N).fill().map(() => Array(N).fill(0));
        for (let r = 0; r < N; ++r) {
          for (let c = 0; c < N; ++c) {
            ret[c][N-1-r] = matrix[r][c];
          }
        }
        return ret;
      };

      // 将方向统一为向左处理
      let board = this.board;
      if (direction === 'right') {
        board = board.map(row => row.reverse());
      } else if (direction === 'up') {
        board = rotate(rotate(rotate(board)));
      } else if (direction === 'down') {
        board = rotate(board);
      }

      // 处理移动和合并
      for (let i = 0; i < this.BOARD_SIZE; i++) {
        let row = board[i];
        let newRow = row.filter(cell => cell !== 0);
        
        // 合并相同的数字
        for (let j = 0; j < newRow.length - 1; j++) {
          if (newRow[j] === newRow[j + 1]) {
            newRow[j] *= 2;
            this.score += newRow[j];
            newRow.splice(j + 1, 1);
          }
        }
        
        // 补充0
        while (newRow.length < this.BOARD_SIZE) {
          newRow.push(0);
        }
        
        if (newRow.join(',') !== row.join(',')) {
          moved = true;
        }
        board[i] = newRow;
      }

      // 恢复方向
      if (direction === 'right') {
        board = board.map(row => row.reverse());
      } else if (direction === 'up') {
        board = rotate(board);
      } else if (direction === 'down') {
        board = rotate(rotate(rotate(board)));
      }

      this.board = board;

      if (moved) {
        this.addNewTile();
        // 更新最高分
        if (this.score > this.bestScore) {
          this.bestScore = this.score;
          localStorage.setItem('2048-best-score', this.bestScore);
        }
        // 检查游戏是否结束
        if (this.isGameOver()) {
          setTimeout(() => {
            alert(`游戏结束！得分：${this.score}`);
          }, 300);
        }
      }
    },

    isGameOver() {
      // 检查是否有空格
      for (let i = 0; i < this.BOARD_SIZE; i++) {
        for (let j = 0; j < this.BOARD_SIZE; j++) {
          if (this.board[i][j] === 0) return false;
        }
      }
      
      // 检查是否有相邻的相同数字
      for (let i = 0; i < this.BOARD_SIZE; i++) {
        for (let j = 0; j < this.BOARD_SIZE; j++) {
          const current = this.board[i][j];
          // 检查右边
          if (j < this.BOARD_SIZE - 1 && current === this.board[i][j + 1]) return false;
          // 检查下边
          if (i < this.BOARD_SIZE - 1 && current === this.board[i + 1][j]) return false;
        }
      }
      return true;
    }
  }
}
</script>

<style scoped>
.game-2048-container {
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
  grid-template-rows: repeat(4, 1fr);
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.cell {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.15s ease-in-out;
  color: white;
}

.cell-new {
  animation: pop 0.2s ease-in-out;
}

@keyframes pop {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.cell-2 { background: #eee4da; color: #776e65; }
.cell-4 { background: #ede0c8; color: #776e65; }
.cell-8 { background: #f2b179; }
.cell-16 { background: #f59563; }
.cell-32 { background: #f67c5f; }
.cell-64 { background: #f65e3b; }
.cell-128 { background: #edcf72; font-size: 20px; }
.cell-256 { background: #edcc61; font-size: 20px; }
.cell-512 { background: #edc850; font-size: 20px; }
.cell-1024 { background: #edc53f; font-size: 18px; }
.cell-2048 { background: #edc22e; font-size: 18px; }

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

.score-section, .best-score-section, .controls-info {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
}

.score, .best-score {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
  text-align: center;
  margin: 10px 0;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.new-game-btn, .undo-btn {
  padding: 12px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.undo-btn {
  background: linear-gradient(45deg, #2196F3, #1976D2);
}

.undo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>