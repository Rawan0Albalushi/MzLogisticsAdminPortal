import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      exceljs: fileURLToPath(new URL('./node_modules/exceljs/dist/exceljs.min.js', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['exceljs'],
  },
})
