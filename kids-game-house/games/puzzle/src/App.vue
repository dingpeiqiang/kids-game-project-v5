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
  initUIParams(window.innerWidth, window.innerHeight)
  next()
})

// 应用首次加载时初始化 UI 参数
onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)

  // 监听窗口 resize，实时更新 UI 参数
  const handleResize = () => {
    initUIParams(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style>
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

/* 确保所有视图容器正确铺满（flex-direction: column 避免横排） */
.app-container > * {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
