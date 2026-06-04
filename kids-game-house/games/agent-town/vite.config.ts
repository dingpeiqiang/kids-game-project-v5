import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy WebSocket connections to the gateway
      '/api/gateway': {
        target: process.env.GATEWAY_URL || 'ws://127.0.0.1:18789/',
        ws: true,
        changeOrigin: true,
      },
      // Proxy other API requests if needed
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'process.env.GATEWAY_URL': JSON.stringify(process.env.GATEWAY_URL || 'ws://127.0.0.1:18789/'),
    'process.env.AGENT_PROVIDER': JSON.stringify(process.env.AGENT_PROVIDER || 'openclaw'),
    'process.env.PORT': JSON.stringify(process.env.PORT || '3000'),
  }
});