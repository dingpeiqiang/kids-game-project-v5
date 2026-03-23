<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in overflow-y-auto" :style="containerStyle">
    <h2 class="font-bold text-white text-center" :style="titleStyle">选择难度</h2>

    <DifficultySelector v-model="selectedDifficulty" class="w-full max-w-md" :uiScale="uiScale" />

    <div class="flex flex-col md:flex-row gap-2 md:gap-3 w-full max-w-md justify-center" :style="buttonContainerStyle">
      <GameButton
        variant="secondary"
        @click="goBack"
        class="flex-1 min-w-[120px]"
        :fontSize="18"
        :paddingLeft="24"
        :paddingRight="24"
        :paddingTop="12"
        :paddingBottom="12"
      >
        🔙 返回
      </GameButton>
      <GameButton
        variant="primary"
        @click="startGame"
        class="flex-1 min-w-[120px]"
        :fontSize="18"
        :paddingLeft="24"
        :paddingRight="24"
        :paddingTop="12"
        :paddingBottom="12"
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
  paddingTop: ui.getPadding(16),
  paddingBottom: ui.getPadding(16)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(40),  // 对应 text-3xl ~ text-5xl
  marginBottom: ui.getGap(24)
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(12),
  marginTop: ui.getGap(24)
}))

const goBack = () => {
  // 不再使用 audioStore，由 Phaser 游戏统一管理音效
  router.push('/')
}

const startGame = () => {
  // 不再使用 audioStore，由 Phaser 游戏统一管理音效
  gameStore.setDifficulty(selectedDifficulty.value)
  gameStore.startGame()

  // 获取主题 ID 并传递到游戏页面
  const themeId = route.query.theme_id as string
  console.log('🎨 难度选择完成，使用主题 ID:', themeId)

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
