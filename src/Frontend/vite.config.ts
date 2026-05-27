import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Emitir build directo a wwwroot del backend para servir en una sola URL
    outDir: '../Backend/Veterinaria.Web/wwwroot',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5132', // ← Puerto HTTP del backend local
        changeOrigin: true,
        secure: false, // necesario si el backend usara HTTPS con certificado local
      }
    }
  }
})

