// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com'],   // 터널 주소가 바뀌어도 통과
    proxy: {
      '/api': 'http://localhost:8000',      // 백엔드 포트에 맞게 수정
    },
  },
})
