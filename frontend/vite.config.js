import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/sanctum': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      target: 'es2018',
      // increase warning limit to reduce noisy warnings; adjust if needed
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Basic manual chunking to keep vendor code separate and split pages/components
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            if (id.includes('src/pages')) {
              const match = id.split('src/pages/')[1];
              if (match) {
                const name = match.split('/')[0];
                return `page-${name}`;
              }
            }
            if (id.includes('src/components')) {
              return 'components';
            }
          },
        },
      },
    },
  }
})
