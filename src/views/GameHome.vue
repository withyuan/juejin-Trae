<template>
  <div class="game-home-container" v-loading="loading">
    <el-backtop :right="100" :bottom="100" />
    <h1 class="title">游戏中心</h1>
    <div class="game-cards">
      <el-card class="game-card" @click="$router.push('/tetris')">
        <el-image
          class="game-preview"
          :src="tetrisPreview"
          :preview-src-list="[tetrisPreview]"
          lazy
          alt="俄罗斯方块预览"
        ></el-image>
        <div class="game-info">
          <h2>俄罗斯方块</h2>
          <p>经典的俄罗斯方块游戏，考验你的空间思维和反应能力！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/tank')">
        <el-image
          class="game-preview"
          :src="tankPreview"
          :preview-src-list="[tankPreview]"
          lazy
          alt="坦克大战预览"
        ></el-image>
        <div class="game-info">
          <h2>坦克大战</h2>
          <p>经典的坦克大战游戏，击败敌人，保护基地！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/racing')">
        <el-image
          class="game-preview"
          :src="racingPreview"
          :preview-src-list="[racingPreview]"
          lazy
          alt="赛车游戏预览"
        ></el-image>
        <div class="game-info">
          <h2>赛车游戏</h2>
          <p>刺激的赛车游戏，躲避障碍物，挑战最高分！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/snake')">
        <el-image
          class="game-preview"
          :src="snakePreview"
          :preview-src-list="[snakePreview]"
          lazy
          alt="贪吃蛇游戏预览"
        ></el-image>
        <div class="game-info">
          <h2>贪吃蛇</h2>
          <p>经典的贪吃蛇游戏，收集食物，成长变强！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/2048')">
        <el-image
          class="game-preview"
          :src="game2048Preview"
          :preview-src-list="[game2048Preview]"
          lazy
          alt="2048游戏预览"
        ></el-image>
        <div class="game-info">
          <h2>2048</h2>
          <p>益智数字游戏，合并方块，挑战2048！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/contra')">
        <el-image
          class="game-preview"
          :src="contraPreview"
          :preview-src-list="[contraPreview]"
          lazy
          alt="魂斗罗游戏预览"
        ></el-image>
        <div class="game-info">
          <h2>魂斗罗</h2>
          <p>经典的横版射击游戏，击败敌人，拯救战友！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/breakout')">
        <el-image
          class="game-preview"
          :src="breakoutPreview"
          :preview-src-list="[breakoutPreview]"
          lazy
          alt="打砖块游戏预览"
        ></el-image>
        <div class="game-info">
          <h2>打砖块</h2>
          <p>经典的打砖块游戏，收集道具，突破关卡！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/airplane')">
        <el-image
          class="game-preview"
          :src="airplanePreview"
          :preview-src-list="[airplanePreview]"
          lazy
          alt="飞机大战预览"
        ></el-image>
        <div class="game-info">
          <h2>飞机大战</h2>
          <p>经典的射击游戏，躲避敌机，收集道具，挑战高分！</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import tetrisPreview from '../assets/tetris-preview.png'
import tankPreview from '../assets/tank-preview.png'
import racingPreview from '../assets/racing-preview.png'
import snakePreview from '../assets/snake-preview.png'
import game2048Preview from '../assets/2048-preview.png'
import contraPreview from '../assets/contra-preview.png'
import breakoutPreview from '../assets/breakout-preview.png'
import airplanePreview from '../assets/airplane-preview.png'

const router = useRouter()
const loading = ref(true)

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  text-align: center;
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 40px;
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
}

.game-card:hover {
  transform: translateY(-5px);
}

.game-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.game-info {
  padding: 15px 0;
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