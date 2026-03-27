import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@framework': resolve(__dirname, './src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KidsGameFramework',
      fileName: (format) => `kids-game-framework.${format}.js`
    },
    rollupOptions: {
      // 不打包 peer dependencies
      external: ['vue', 'pinia', 'axios', 'phaser'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          axios: 'Axios',
          phaser: 'Phaser'
        }
      }
    }
  }
})
