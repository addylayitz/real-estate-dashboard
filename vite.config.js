import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 重要：設置GitHub Pages的base路徑
  base: '/real-estate-dashboard/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})