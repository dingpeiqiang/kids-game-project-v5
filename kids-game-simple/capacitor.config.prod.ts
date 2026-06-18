import type { CapacitorConfig } from '@capacitor/cli';

/**
 * 生产 Android：WebView 从与 API 相同的 HTTPS 源加载（默认 3443），
 * 避免 file/capacitor://localhost 跨域访问 kidsgame.dingpq.cn 时 WebView SSL 握手失败。
 * 与手机 Chrome 打开 https://kidsgame.dingpq.cn:3443/ 行为一致（你方 Nginx 已验证 /api 可达）。
 *
 * 使用：CAPACITOR_REMOTE_SERVER_URL=https://kidsgame.dingpq.cn:3443 pnpm exec cap sync android
 * 或：pnpm run cap:sync:android:remote
 */
const remoteUrl =
  process.env.CAPACITOR_REMOTE_SERVER_URL?.replace(/\/$/, '') ||
  'https://kidsgame.dingpq.cn:3443';

const config: CapacitorConfig = {
  appId: 'com.kidsgame.simple',
  appName: '儿童游戏乐园',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: remoteUrl,
    cleartext: false,
    allowNavigation: ['http://*', 'https://*'],
    cleartextTrafficPermitted: true,
  },
  android: {
    minSdkVersion: 21,
    targetSdkVersion: 34,
    compileSdkVersion: 34,
    allowMixedContent: true,
    packageName: 'com.kidsgame.simple',
  },
};

export default config;