import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiOrigin = 'https://api.hblab.rw'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(apiOrigin),
  },

  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiOrigin,
        changeOrigin: true,
        secure: true,
        ws: true,
      },
      '/uploads': {
        target: apiOrigin,
        changeOrigin: true,
        secure: true,
      }
    }
  },
})
