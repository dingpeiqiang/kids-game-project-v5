<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { initUIParams } from '@/utils/uiResponsive'

const router = useRouter()

// ⭐ 全局路由守卫：每次路由切换时统一初始化 UI 参数
router.beforeEach((to, from, next) => {
  // 使用 window 尺寸确保统一
  initUIParams(window.innerWidth, window.innerHeight)
  next()
})

// 应用首次加载时也初始化 UI 参数
onMounted(() => {
  // 初始化 UI 参数
  initUIParams(window.innerWidth, window.innerHeight)
  
  // 监听窗口 resize，实时更新 UI 参数
  const handleResize = () => {
    initUIParams(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', handleResize)
  
  // 组件卸载时移除监听
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 安全区域适配 */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* 确保内容在安全区域内 */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 确保所有视图容器正确居中（必须 flex-direction: column 避免子元素横排） */
.app-container > * {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
