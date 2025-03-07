<template>
  <div class="game-home-container" v-loading="loading">
    <el-backtop :right="100" :bottom="100" />
    <h1 class="title">游戏中心</h1>
    <div class="search-box">
      <el-input
        v-model="searchQuery"
        placeholder="搜索游戏..."
        prefix-icon="el-icon-search"
        clearable
        @input="filterGames"
      />
    </div>
    <div v-if="filteredGames.length === 0" class="no-results">
      <el-empty description="没有找到相关游戏" />
    </div>
    <div class="game-cards" v-else>
      <el-card v-for="game in filteredGames" :key="game.route" class="game-card" @click="$router.push(game.route)">
        <el-image
          class="game-preview"
          :src="game.preview"
          :preview-src-list="[game.preview]"
          lazy
          :alt="`${game.name}预览`"
        ></el-image>
        <div class="game-info">
          <h2>{{ game.name }}</h2>
          <p>{{ game.description }}</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import tetrisPreview from '../assets/tetris-preview.png'
import tankPreview from '../assets/tank-preview.png'
import racingPreview from '../assets/racing-preview.png'
import snakePreview from '../assets/snake-preview.png'
import game2048Preview from '../assets/2048-preview.png'
import contraPreview from '../assets/contra-preview.png'
import breakoutPreview from '../assets/breakout-preview.png'
import adventurePreview from '../assets/adventure-preview.png'
import kidsExercisePreview from '../assets/kids-exercise-preview.png'
import numberPuzzlePreview from '../assets/number-puzzle-preview.png'
import pingPongPreview from '../assets/ping-pong-preview.png'
import airplanePreview from '../assets/airplane-preview.png'

const router = useRouter()
const loading = ref(true)
const searchQuery = ref('')

// 游戏数据
const games = [
  { name: '俄罗斯方块', description: '经典的俄罗斯方块游戏，考验你的空间思维和反应能力！', route: '/tetris', preview: tetrisPreview },
  { name: '坦克大战', description: '经典的坦克大战游戏，击败敌人，保护基地！', route: '/tank', preview: tankPreview },
  { name: '赛车游戏', description: '刺激的赛车游戏，躲避障碍物，挑战最高分！', route: '/racing', preview: racingPreview },
  { name: '贪吃蛇', description: '经典的贪吃蛇游戏，收集食物，成长变强！', route: '/snake', preview: snakePreview },
  { name: '2048', description: '益智数字游戏，合并方块，挑战2048！', route: '/2048', preview: game2048Preview },
  { name: '魂斗罗', description: '经典的横版射击游戏，击败敌人，拯救战友！', route: '/contra', preview: contraPreview },
  { name: '打砖块', description: '经典的打砖块游戏，收集道具，突破关卡！', route: '/breakout', preview: breakoutPreview },
  { name: '冒险闯关', description: '经典的横版闯关游戏，击败敌人，收集道具，通关冒险！', route: '/adventure', preview: adventurePreview },
  { name: '飞机大战', description: '经典的射击游戏，躲避敌机，收集道具，挑战高分！', route: '/airplane', preview: airplanePreview },
  { name: '快乐运动', description: '跟着小兔子一起运动，让孩子快乐成长！', route: '/kids-exercise', preview: kidsExercisePreview },
  { name: '数字华容道', description: '经典的数字拼图游戏，考验你的思维能力！', route: '/number-puzzle', preview: numberPuzzlePreview },
  { name: '乒乓球对战', description: '经典的乒乓球游戏，支持单人和双人对战模式！', route: '/ping-pong', preview: pingPongPreview }
]

// 过滤后的游戏列表
const filteredGames = computed(() => {
  if (!searchQuery.value) return games
  const query = searchQuery.value.toLowerCase().split(/\s+/).filter(Boolean)
  return games.filter(game => {
    const gameName = game.name.toLowerCase()
    const gameDesc = game.description.toLowerCase()
    return query.every(keyword => 
      gameName.includes(keyword) || gameDesc.includes(keyword)
    )
  })
})

onMounted(() => {
  // 模拟加载过程
  setTimeout(() => {
    loading.value = false
  }, 500)
})

// 路由跳转前添加加载状态
router.beforeEach((to, from, next) => {
  loading.value = true
  if (from.name !== 'GameHome') {
    document.body.style.overflow = 'auto'
  }
  next()
})

router.afterEach(() => {
  loading.value = false
  if (document.body.style.overflow === 'hidden') {
    document.body.style.overflow = 'auto'
  }
})
</script>

<style scoped>
.game-home-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  text-align: center;
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 20px;
}

.search-box {
  max-width: 500px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

.search-box :deep(.el-input__inner) {
  border-radius: 20px;
  height: 40px;
  font-size: 16px;
}

.game-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  padding: 20px;
}

.game-card {
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-in;
  background: #fff !important;
}

.game-card :deep(.el-card__body) {
  padding: 0;
  background: #fff;
  backdrop-filter: none !important;
}

.game-card:hover {
  transform: translateY(-5px);
}

.game-preview {
  width: 100%;
  height: 180px;
  object-fit: contain;
  border-radius: 8px;
  background-color: #f5f7fa;
  padding: 10px;
}

.game-info {
  padding: 15px;
}

.game-info h2 {
  font-size: 1.5em;
  margin-bottom: 10px;
  color: #2c3e50;
}

.game-info p {
  color: #666;
  line-height: 1.4;
}

.no-results {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  margin: 20px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>