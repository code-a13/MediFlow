import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// vite.config.js
export default defineConfig({
  plugins: [react()],
  define: {
    // This is needed for some older libraries like react-chrono to work in Vite
    global: 'window', 
  },
})