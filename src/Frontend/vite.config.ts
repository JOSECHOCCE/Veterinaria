import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    // Si se especifica BUILD_OUT_DIR se usa, de lo contrario dist por defecto
    outDir: process.env.BUILD_OUT_DIR || 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5132', // ← Puerto HTTP del backend local
        changeOrigin: true,
        secure: false, // necesario si el backend usara HTTPS con certificado local
      },
      '/notificacionHub': {
        target: 'http://localhost:5132',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

