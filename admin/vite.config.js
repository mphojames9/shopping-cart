import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Render serves `vite preview` on its own *.onrender.com host name
  preview: { allowedHosts: true }
})
