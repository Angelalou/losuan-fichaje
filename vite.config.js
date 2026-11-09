import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Publicada en GitHub Pages: https://angelalou.github.io/losuan-fichaje/
export default defineConfig({
  base: './',
  plugins: [react()],
})
