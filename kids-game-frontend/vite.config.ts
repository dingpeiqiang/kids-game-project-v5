import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'path';
import viteCompression from 'vite-plugin-compression';

const require = createRequire(import.meta.url);

function resolveDep(pkg: string): string {
  try {
    return require.resolve(pkg);
  } catch {
    return pkg;
  }
}

/** Package root directory — use for aliases so subpaths like `pkg/dist/*.css` resolve. */
function resolveDepDir(pkg: string): string {
  try {
    return dirname(require.resolve(`${pkg}/package.json`));
  } catch {
    return pkg;
  }
}

function resolveAxiosBrowser(): string {
  try {
    return require.resolve('axios/dist/browser/axios.cjs');
  } catch {
    return resolveDep('axios');
  }
}

const CLIENT_CORE_DEPS = ['jsencrypt', 'compressorjs', 'marked'] as const;

function clientCoreDepAliases(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pkg of CLIENT_CORE_DEPS) {
    out[pkg] = resolveDep(pkg);
  }
  return out;
}

const frontendRoot = __dirname;
const appSrc = resolve(frontendRoot, 'src');
const shellSrc = resolve(frontendRoot, 'src/shell');
const sharedSrc = resolve(frontendRoot, 'src/shared');

const TS_EXT = ['.ts', '.tsx', '.js', '.mjs', '.vue'];

function clientCoreShellBridgePlugin(): Plugin {
  function tryResolveAt(root: string, subpath: string): string | undefined {
    const base = resolve(root, subpath);
    for (const ext of TS_EXT) {
      const file = base.endsWith(ext) ? base : `${base}${ext}`;
      if (existsSync(file)) return file;
    }
    if (existsSync(`${base}/index.ts`)) return `${base}/index.ts`;
    return undefined;
  }

  const SHELL_FOLDERS = ['platform', 'services', 'engine3d', 'composables'] as const;

  return {
    name: 'client-core-shell-bridge',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer) return null;
      const imp = importer.replace(/\\/g, '/');
      if (!imp.includes('/src/games/')) return null;

      const m = source.match(
        /^(?:\.\.\/)+(?:platform|services|utils|engine3d|composables)\/(.+)$/,
      );
      if (!m) return null;

      const tail = m[1].replace(/\/$/, '');
      let folder: (typeof SHELL_FOLDERS)[number] | 'utils' = 'utils';
      if (source.includes('/utils/')) folder = 'utils';
      else if (source.includes('/platform/')) folder = 'platform';
      else if (source.includes('/services/')) folder = 'services';
      else if (source.includes('/engine3d/')) folder = 'engine3d';
      else if (source.includes('/composables/')) folder = 'composables';

      const rel = `${folder}/${tail}`;

      if (folder === 'utils') {
        return tryResolveAt(appSrc, rel) ?? tryResolveAt(shellSrc, rel) ?? null;
      }

      return tryResolveAt(shellSrc, rel) ?? null;
    },
  };
}

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
    if (id.includes('element-plus') || id.includes('echarts')) return 'vendor-admin';
    return 'vendor';
  }
  const norm = id.replace(/\\/g, '/');
  const gameMatch = norm.match(/\/src\/games\/([^/]+)\//);
  if (gameMatch) {
    const folder = gameMatch[1];
    if (HEAVY_GAME_CHUNKS[folder]) return HEAVY_GAME_CHUNKS[folder];
    return `game-${folder}`;
  }
  if (norm.includes('/src/modules/')) {
    return 'shell-frontend-modules';
  }
  return undefined;
}

/** 单一前端：终端壳（simple）+ 同包管理/家长路由 */
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_SHELL': JSON.stringify('simple'),
  },
  plugins: [
    clientCoreShellBridgePlugin(),
    vue(),
    viteCompression({ algorithm: 'gzip', threshold: 1024, minRatio: 0.8 }),
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 1024,
      minRatio: 0.8,
      ext: '.br',
    }),
  ],
  publicDir: 'public',
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  resolve: {
    dedupe: ['vue', 'vue-router', 'pinia'],
    alias: {
      vue: resolveDep('vue'),
      'vue-router': resolveDep('vue-router'),
      pinia: resolveDep('pinia'),
      axios: resolveAxiosBrowser(),
      'element-plus': resolveDepDir('element-plus'),
      echarts: resolveDep('echarts'),
      ...clientCoreDepAliases(),
      '@': appSrc,
      '@shell': shellSrc,
      '@root': frontendRoot,
      '@kids-game/shared': resolve(sharedSrc, 'index.ts'),
      '@kids-game/shared/auth': resolve(sharedSrc, 'auth.ts'),
      '@kids-game/shared/roles': resolve(sharedSrc, 'roles.ts'),
      '@kids-game/shared/api-types': resolve(sharedSrc, 'api-types.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['phaser'],
    include: ['vue', 'pinia', 'vue-router', 'axios', 'element-plus', 'echarts'],
  },
  server: {
    port: 3000,
    headers: { 'Cache-Control': 'no-store' },
    hmr: { overlay: true },
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/*.png',
        '**/*.jpg',
        '**/*.md',
        '**/docs/**',
      ],
    },
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
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      external: ['phaser', /^@babylonjs\//],
      output: {
        globals: { phaser: 'Phaser' },
        entryFileNames: 'assets/[name]-[hash:10].js',
        chunkFileNames: 'assets/[name]-[hash:10].js',
        assetFileNames: 'assets/[name]-[hash:10].[ext]',
        manualChunks: manualChunkId,
      },
    },
  },
});