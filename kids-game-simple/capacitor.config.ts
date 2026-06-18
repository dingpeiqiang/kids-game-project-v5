import { CapacitorConfig } from '@capacitor/cli';

/** 生产 Android 同源：设置 CAPACITOR_REMOTE_SERVER_URL 后 cap sync（见 cap:sync:android:remote） */
const remoteUrl = process.env.CAPACITOR_REMOTE_SERVER_URL?.replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'com.kidsgame.simple',
  appName: '儿童游戏乐园',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: remoteUrl
    ? {
        url: remoteUrl,
        cleartext: false,
        allowNavigation: ['http://*', 'https://*'],
        cleartextTrafficPermitted: true,
      }
    : {
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