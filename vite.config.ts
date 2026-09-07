import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
        'icons.svg',
      ],

      manifest: {
        name: 'Florbonacci Social',
        short_name: 'Florbonacci',

        description:
          'Uma rede social de descobertas, curiosidade e conexão.',

        theme_color: '#315d3b',
        background_color: '#f7f5ee',

        display: 'standalone',

        start_url: '/',
        scope: '/',

        orientation: 'portrait',

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp}',
        ],

        navigateFallback: '/index.html',
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
})