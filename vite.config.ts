import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this repo at /Gym-App/ rather than the domain root.
const base = process.env.GH_PAGES ? '/Gym-App/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nutrition + Lifting Tracker',
        short_name: 'Tracker',
        description: 'Personal pantry-based nutrition and gym progress tracker.',
        theme_color: '#0d9488',
        background_color: '#0d9488',
        display: 'standalone',
        orientation: 'portrait',
        // start_url/scope default to `base` when omitted, which is correct both
        // at the domain root (local/dev) and under /Gym-App/ (GitHub Pages).
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Nutrition/lift data lives in IndexedDB; the app shell is what we cache for offline installs.
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
