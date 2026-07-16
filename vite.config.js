import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/admins': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
