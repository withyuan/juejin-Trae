<template>
  <div class="game-home-container">
    <h1 class="title">游戏中心</h1>
    <div class="game-cards">
      <el-card class="game-card" @click="$router.push('/tetris')">
        <img src="../assets/tetris-preview.png" class="game-preview" alt="俄罗斯方块预览">
        <div class="game-info">
          <h2>俄罗斯方块</h2>
          <p>经典的俄罗斯方块游戏，考验你的空间思维和反应能力！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/tank')">
        <img src="../assets/tank-preview.png" class="game-preview" alt="坦克大战预览">
        <div class="game-info">
          <h2>坦克大战</h2>
          <p>经典的坦克大战游戏，击败敌人，保护基地！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/racing')">
        <img src="../assets/racing-preview.png" class="game-preview" alt="赛车游戏预览">
        <div class="game-info">
          <h2>赛车游戏</h2>
          <p>刺激的赛车游戏，躲避障碍物，挑战最高分！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/snake')">
        <img src="../assets/snake-preview.png" class="game-preview" alt="贪吃蛇游戏预览">
        <div class="game-info">
          <h2>贪吃蛇</h2>
          <p>经典的贪吃蛇游戏，收集食物，成长变强！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/2048')">
        <img src="../assets/2048-preview.png" class="game-preview" alt="2048游戏预览">
        <div class="game-info">
          <h2>2048</h2>
          <p>益智数字游戏，合并方块，挑战2048！</p>
        </div>
      </el-card>

      <el-card class="game-card" @click="$router.push('/breakout')">
        <img src="../assets/breakout-preview.png" class="game-preview" alt="打砖块游戏预览">
        <div class="game-info">
          <h2>打砖块</h2>
          <p>经典的打砖块游戏，收集道具，突破关卡！</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
// 组件逻辑
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
  transition: transform 0.3s ease;
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
</style>