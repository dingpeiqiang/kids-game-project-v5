<template>
  <router-view v-slot="{ Component, route }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </router-view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const transitionName = ref('fade')

// 根据路由切换方向选择过渡动画
watch(() => router.currentRoute.value.path, (to, from) => {
  const routes = ['/loading', '/start', '/difficulty', '/game', '/gameover']
  const toIdx = routes.indexOf(to)
  const fromIdx = routes.indexOf(from || '')

  if (toIdx >= 0 && fromIdx >= 0) {
    transitionName.value = toIdx > fromIdx ? 'slide-left' : 'slide-right'
  } else {
    transitionName.value = 'fade'
  }
})
</script>

<style>
/* ── 全局基础 ─────────────────────────────── */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #0f1a12;
  color: #e5e7eb;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 禁止移动端长按弹出菜单 */
img, a, button {
  -webkit-touch-callout: none;
}

button {
  font-family: inherit;
}

/* ── 路由过渡动画 ─────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.28s ease;
}
.slide-left-enter-from  { opacity: 0; transform: translateX(30px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-30px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(30px); }

/* ── 滚动条隐藏 ───────────────────────────── */
::-webkit-scrollbar { display: none; }
</style>
