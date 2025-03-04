<template>
  <div class="captcha-container">
    <canvas ref="captchaCanvas" :width="width" :height="height" @click="generateCaptcha"></canvas>
    <input
      v-model="userInput"
      type="text"
      class="captcha-input"
      placeholder="请输入验证码"
      maxlength="4"
    />
  </div>
</template>

<script>
export default {
  name: 'CaptchaService',
  props: {
    width: {
      type: Number,
      default: 120
    },
    height: {
      type: Number,
      default: 40
    }
  },
  data() {
    return {
      captchaText: '',
      userInput: ''
    }
  },
  watch: {
    userInput(newVal) {
      if (newVal.length === 4) {
        this.validateCaptcha()
      }
    }
  },
  mounted() {
    this.generateCaptcha()
  },
  methods: {
    generateCaptcha() {
      const canvas = this.$refs.captchaCanvas
      const ctx = canvas.getContext('2d')
      
      // 清空画布
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, this.width, this.height)
      
      // 生成随机验证码
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
      this.captchaText = ''
      for (let i = 0; i < 4; i++) {
        this.captchaText += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      
      // 绘制文字
      ctx.font = '24px Arial'
      ctx.textBaseline = 'middle'
      
      // 随机颜色和位置绘制每个字符
      for (let i = 0; i < this.captchaText.length; i++) {
        ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`
        ctx.translate(30 * i + 15, 20)
        ctx.rotate((Math.random() - 0.5) * 0.4)
        ctx.fillText(this.captchaText[i], 0, 0)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
      
      // 添加干扰线
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`
        ctx.beginPath()
        ctx.moveTo(Math.random() * this.width, Math.random() * this.height)
        ctx.lineTo(Math.random() * this.width, Math.random() * this.height)
        ctx.stroke()
      }
      
      // 添加噪点
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`
        ctx.fillRect(
          Math.random() * this.width,
          Math.random() * this.height,
          2,
          2
        )
      }
      
      // 重置用户输入
      this.userInput = ''
    },
    
    validateCaptcha() {
      const isValid = this.userInput.toLowerCase() === this.captchaText.toLowerCase()
      this.$emit('captcha-result', isValid)
      if (!isValid) {
        this.generateCaptcha()
      }
    }
  }
}
</script>

<style scoped>
.captcha-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  width: 80px;
  text-align: center;
}

canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
</style>