import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// js-dos 使用 Web Worker (SharedArrayBuffer)，需要 COOP/COEP 安全头。
// Firefox 等浏览器要求页面设置这些头才允许使用 SharedArrayBuffer。
function crossOriginIsolation(): Plugin {
  return {
    name: 'cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), crossOriginIsolation()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/files': 'http://localhost:5000',
      '/static': 'http://localhost:5000',
    },
  },
})
