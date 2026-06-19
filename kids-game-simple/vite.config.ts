import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import viteCompression from 'vite-plugin-compression';

/** 与 kids-game-frontend 共用业务源码，终端包仅独立入口与路由 */
const frontendSrc = resolve(__dirname, '../kids-game-frontend/src');

/** 重型游戏单独 chunk，避免首屏与其它玩法互相拖累 */
const HEAVY_GAME_CHUNKS: Record<string, string> = {
  dragonShooter: 'game-dragon-shooter',
  voxelRealm: 'game-voxel-realm',
  plantZombieDefense: 'game-plant-zombie-3d',
  plantZombieDefense2d: 'game-plant-zombie-2d',
  cloudBallRush3d: 'game-cloud-ball-3d',
  happyDefense: 'game-happy-defense',
  dnfRpg: 'game-dnf-rpg',
  skyFrenzy: 'game-sky-frenzy',
  skyRush3d: 'game-sky-rush-3d',
  rpgShooterTowerDefense: 'game-rpg-shooter-td',
};

function manualChunkId(id: string): string | undefined {
  if (id.includes('node_modules')) {
    if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor-vue';
    if (id.includes('axios')) return 'vendor-axios';
    return 'vendor';
  }
  const gameMatch = id.replace(/\\/g, '/').match(/\/src\/games\/([^/]+)\//);
  if (gameMatch) {
    const folder = gameMatch[1];
    if (HEAVY_GAME_CHUNKS[folder]) return HEAVY_GAME_CHUNKS[folder];
    return `game-${folder}`;
  }
  if (id.replace(/\\/g, '/').includes('/kids-game-frontend/src/modules/')) {
    return 'shell-frontend-modules';
  }
  return undefined;
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_SHELL': JSON.stringify('simple'),
  },
  plugins: [
    vue(),
    viteCompression({
      algorithm: 'gzip',
      threshold: 1024,
      minRatio: 0.8,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 1024,
      minRatio: 0.8,
      ext: '.br',
    }),
  ],
  publicDir: resolve(__dirname, 'public'),
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  resolve: {
    alias: {
      '@': frontendSrc,
      '@simple': resolve(__dirname, 'src'),
      '@root': resolve(__dirname, '..'),
    },
  },
  optimizeDeps: {
    exclude: ['phaser'],
    include: ['vue', 'pinia', 'vue-router', 'axios'],
  },
  server: {
    port: 3001,
    headers: { 'Cache-Control': 'no-store' },
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true },
      '/public': { target: 'http://localhost:3005', changeOrigin: true },
      '/files': {
        target: 'http://106.54.7.205',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/public/, ''),
      },
    },
    fs: { allow: ['..'] },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      external: ['phaser', /^@babylonjs\//],
      output: {
        globals: { phaser: 'Phaser' },
        manualChunks: manualChunkId,
      },
    },
  },
});