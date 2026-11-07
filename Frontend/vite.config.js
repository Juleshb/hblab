import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiOrigin = 'https://api.hblab.rw'

function studioDocument() {
  return {
    name: 'studio-document',
    transformIndexHtml(html) {
      if (String(process.env.VITE_SITE || '').toLowerCase() !== 'studio') return html
      return html
        .replaceAll('HB-Lab', 'HB Studio')
        .replaceAll(
          'Empowering the Next Generation of Tech Professionals with HB Lab.',
          'Film, photography, podcasts, and live coverage from HB Studio, a product of HBLab.'
        )
        .replaceAll('https://hblab.rw/', 'https://studio.hblab.rw/')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), studioDocument()],
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
