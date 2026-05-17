import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    root: '.',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    server: {
      port: parseInt(env.VITE_PORT || '3006'),
      open: env.VITE_OPEN === 'true'
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  }
})