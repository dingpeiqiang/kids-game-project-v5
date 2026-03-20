<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Config } from '@/core/config';
import { wsClient } from '@/core/network/ws';
import { useUserStore } from '@/core/store/user.store';

onMounted(() => {
  console.log('[App] 正在初始化应用...');

  // 初始化配置
  try {
    Config.init();
  } catch (error) {
    console.error('[App] 初始化配置失败:', error);
  }

  // 恢复用户登录状态
  const userStore = useUserStore();
  userStore.restoreFromStorage();
  console.log('[App] 用户状态已恢复');

  // WebSocket 连接延迟到用户登录后由各个页面自行管理
  // 这样避免未登录用户也建立连接
  console.log('[App] 应用已就绪');
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}
</style>
