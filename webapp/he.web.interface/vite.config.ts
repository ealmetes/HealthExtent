import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Proxy enabled for production API - avoids CORS issues during development
    proxy: {
      '/api': {
        target: 'http://he-api-dev-eus2.eastus2.azurecontainer.io:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
