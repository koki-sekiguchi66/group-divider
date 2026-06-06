import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'グループ分けツール',
        short_name: '班分け',
        theme_color: '#059669',
        background_color: '#f3f4f6',
        display: 'standalone', // 全画面表示（URLバー非表示）
        icons: [
          // ※本番環境へデプロイする際は、publicフォルダに192x192と512x512のアイコン画像(pwa-192x192.png等)を配置します
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})