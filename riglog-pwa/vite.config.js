import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'RigLog — Hardware Inventory & Catalog System',
        short_name: 'RigLog',
        description:
          'Sistem inventaris terintegrasi untuk pencatatan, pemantauan stok, dan pengelolaan katalog komponen komputer pada toko hardware.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0b0f19',
        theme_color: '#0ea5e9',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
