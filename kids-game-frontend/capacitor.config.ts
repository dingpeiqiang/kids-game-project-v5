import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kidsgame.platform',
  appName: '儿童游戏平台',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    allowNavigation: ['http://*', 'https://*'],
    cleartextTrafficPermitted: true,
  },
  android: {
    minSdkVersion: 21,
    targetSdkVersion: 34,
    compileSdkVersion: 34,
    allowMixedContent: true,
    packageName: 'com.kidsgame.platform',
  },
};

export default config;