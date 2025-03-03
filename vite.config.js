import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  }
})