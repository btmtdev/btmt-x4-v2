import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/core': { target: 'http://localhost:4000', rewrite: p => p.replace(/^\/api\/core/, '') },
      '/api/shipping': { target: 'http://localhost:4001', rewrite: p => p.replace(/^\/api\/shipping/, '') },
      '/api/warehouse': { target: 'http://localhost:4002', rewrite: p => p.replace(/^\/api\/warehouse/, '') },
      '/api/quality': { target: 'http://localhost:4003', rewrite: p => p.replace(/^\/api\/quality/, '') },
      '/api/tsg-shipment': { target: 'http://localhost:4004', rewrite: p => p.replace(/^\/api\/tsg-shipment/, '') },
    }
  },
})
