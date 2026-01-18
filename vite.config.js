import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Ensure injection
      includeAssets: ['favicon.ico', 'app-icon.jpg'], // Include the jpg
      manifest: {
        name: '발더스게이트 원정대',
        short_name: '발더스 원정대',
        description: '발더스 게이트 3 멀티플레이 파티 관리',
        start_url: '/',
        scope: '/',
        theme_color: '#0a0a10',
        background_color: '#0a0a10',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/app-icon.jpg', // Absolute path often safer for root PWA
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/app-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: '/app-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable' // Attempt to satisfy maskable requirement
          }
        ]
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/bg3-raid-manager/' : '/',
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  esbuild: {
    logLevel: 'silent'
  }
})
