import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The Google Maps key is documented as GOOGLE_MAPS_API_KEY, and that is the
// name the client code reads. Vite only auto-exposes VITE_-prefixed variables
// to the browser, so this config — which runs in Node, not the browser — reads
// the variable itself and injects it explicitly. One name, one place to set it.
export default defineConfig(({ mode }) => {
  // An empty prefix loads every variable from .env files, not only VITE_ ones.
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const read = (name, fallback = '') => process.env[name] ?? fileEnv[name] ?? fallback

  return {
    plugins: [react()],
    server: { port: 5173 },
    define: {
      GOOGLE_MAPS_API_KEY: JSON.stringify(read('GOOGLE_MAPS_API_KEY')),
      API_BASE_URL: JSON.stringify(read('API_BASE_URL', 'http://127.0.0.1:8000')),
    },
  }
})
