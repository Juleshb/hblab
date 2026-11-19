import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const frontendRoot = dirname(fileURLToPath(import.meta.url))

function publicFiles() {
  const files = {
    '/sitemap.xml': ['sitemap.xml', 'application/xml; charset=utf-8'],
    '/robots.txt': ['robots.txt', 'text/plain; charset=utf-8'],
  }
  return {
    name: 'public-seo-files',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const file = files[request.url]
        if (!file) return next()
        response.setHeader('Content-Type', file[1])
        response.end(readFileSync(join(frontendRoot, 'public', file[0])))
      })
    },
  }
}

const productionApi = 'https://api.hblab.rw'

function studioDocument() {
  return {
    name: 'studio-document',
    transformIndexHtml(html) {
      if (String(process.env.VITE_SITE || '').toLowerCase() !== 'studio') return html
      return html
        .replaceAll('HBLab | Training center in Rubavu', 'HB Studio | Photography, video, and podcasts')
        .replaceAll(
          'HBLab is a training center in Rubavu, Gisenyi. Professional courses in software, networking, multimedia, electronics, accounting, and electrical technology, plus internships and HB Studio.',
          'Film, photography, podcasts, and live coverage from HB Studio, a product of HBLab.'
        )
        .replaceAll('https://hblab.rw/', 'https://studio.hblab.rw/')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const apiOrigin = command === 'serve' ? 'http://127.0.0.1:3000' : productionApi
  return {
  plugins: [publicFiles(), react(), tailwindcss(), studioDocument()],
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
        secure: apiOrigin.startsWith('https'),
        ws: true,
      },
      '/uploads': {
        target: apiOrigin,
        changeOrigin: true,
        secure: apiOrigin.startsWith('https'),
      }
    }
  },
  }
})
