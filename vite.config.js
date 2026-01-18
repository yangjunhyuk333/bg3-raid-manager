import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE_URL = process.env.NODE_ENV === 'production' ? '/bg3-raid-manager/' : '/';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'app-icon.png'],
      manifest: {
        name: '발더스게이트 원정대',
        short_name: '발더스 원정대',
        description: '발더스 게이트 3 멀티플레이 파티 관리',
        start_url: BASE_URL,
        scope: BASE_URL,
        theme_color: '#0a0a10',
        background_color: '#0a0a10',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'app-icon.png', // Relative path is safer with base
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: BASE_URL,
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
