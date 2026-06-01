import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3030,
    proxy: {
      // Backend routes with /api prefix
      '/api/courses': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
      '/api/dashboard': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
      '/api/reminders': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
      '/api/notifications': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
      // Backend routes without /api prefix
      '/api/goals': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/goals/, '/goals')
      },
      '/api/admin': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/auth': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/account': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/announcements': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/coach': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coach/, '/coach')
      },
      // Non-api fallback proxies for coach and admin
      '/coach': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        bypass: () => '/index.html'
      },
      '/admin': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        bypass: () => '/index.html'
      }
    }
  }
})
