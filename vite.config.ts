import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

function readDevProxyTarget() {
  try {
    const config = JSON.parse(readFileSync(new URL('./public/app-config.json', import.meta.url), 'utf-8')) as { devProxyTarget?: string }
    return config.devProxyTarget || 'http://localhost:8099'
  } catch {
    return 'http://localhost:8099'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'OPTIMIZER',
        short_name: 'OPTIMIZER',
        description: 'OPTIMIZER',
        lang: 'ro',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7c3aed',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // runtime config + JSON data: always try network first so changes apply immediately
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'json-data', networkTimeoutSeconds: 5 },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    proxy: {
      '/api': readDevProxyTarget(),
    },
  },
})
