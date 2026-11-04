import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
     host: true,
     proxy: {
       '/api': {
         target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5080',
         changeOrigin: true
       }
     }
   }
})
