import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: { __API_URL__: JSON.stringify(loadEnv(mode, process.cwd(), "").VITE_API_URL || "/graphql") },
  server: { proxy: { "/graphql": "http://localhost:4000", "/events": "http://localhost:4000", "/auth": "http://localhost:4000", "/api": "http://localhost:4000" } },
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
}))
