import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
  preview: {
    // Railway (and similar PaaS) proxy through a generated domain the
    // preview server doesn't know about by default; Vite's preview host
    // allowlist would otherwise reject those requests.
    allowedHosts: true,
  },
})
