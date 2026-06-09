import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kidsgame.simple',
  appName: '儿童游戏乐园',
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
    packageName: 'com.kidsgame.simple',
  },
};

export default config;