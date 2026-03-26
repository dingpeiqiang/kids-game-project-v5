<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in overflow-y-auto" :style="containerStyle">
    <h2 class="font-bold text-white text-center" :style="titleStyle">选择难度</h2>

    <DifficultySelector v-model="selectedDifficulty" class="w-full max-w-lg" :uiScale="uiScale" />

    <div class="flex flex-col items-center gap-2 w-full max-w-lg" :style="buttonContainerStyle">
      <GameButton
        variant="secondary"
        @click="goBack"
        class="w-full"
        :fontSize="25.92"
        :paddingLeft="34.56"
        :paddingRight="34.56"
        :paddingTop="17.28"
        :paddingBottom="17.28"
      >
        🔙 返回
      </GameButton>
      <GameButton
        variant="primary"
        @click="startGame"
        class="w-full"
        :fontSize="25.92"
        :paddingLeft="34.56"
        :paddingRight="34.56"
        :paddingTop="17.28"
        :paddingBottom="17.28"
      >
        ▶️ 开始
      </GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import type { Difficulty } from '@/types/game'
import DifficultySelector from '@/components/ui/DifficultySelector.vue'
import GameButton from '@/components/ui/GameButton.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const ui = useResponsiveUI()

const selectedDifficulty = ref<Difficulty>(gameStore.difficulty)
const uiScale = computed(() => ui.uiScale)

// 动态样式计算
const containerStyle = computed(() => ({
  // 🎨 上下边距各 2%,内容自动放大适配
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%' // 100% - 2% - 2% = 96%
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(83.64),  // 🎨 累计放大 109% (40 * 2.09088)
  marginBottom: ui.getGap(50.18)  // 🎨 累计放大 109% (24 * 2.09088)
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(25.09),  // 🎨 累计放大 109% (12 * 2.09088)
  marginTop: ui.getGap(50.18)  // 🎨 累计放大 109% (24 * 2.09088)
}))

const goBack = () => {
  router.push('/')
}

const startGame = () => {
  // 获取主题 ID 并传递到游戏页面
  const themeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || ''
  console.log('🎨 难度选择完成，使用主题 ID:', themeId)
  
  // 保存主题 ID 到 localStorage
  if (themeId) {
    localStorage.setItem('current-theme-id', themeId)
  }
  
  // 设置难度并跳转到游戏页面
  gameStore.setDifficulty(selectedDifficulty.value)
  gameStore.startGame()
  
  router.push({
    path: '/game',
    query: { theme_id: themeId }
  })
}

// ⭐ 初始化 UI 参数，确保与 StartView 计算逻辑一致
onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('DifficultyView mounted, UI params initialized, UI scale:', ui.uiScale)
})
</script>
