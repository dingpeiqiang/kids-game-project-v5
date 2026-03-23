<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4 fade-in overflow-y-auto">
    <h2 class="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-8 text-center">选择难度</h2>
    
    <DifficultySelector v-model="selectedDifficulty" class="w-full max-w-md" />
    
    <div class="flex gap-3 md:gap-4 mt-6 md:mt-8">
      <GameButton variant="secondary" @click="goBack" class="text-sm md:text-base px-4 md:px-6 py-2 md:py-3">
        🔙 返回
      </GameButton>
      <GameButton variant="primary" @click="startGame" class="text-sm md:text-base px-4 md:px-6 py-2 md:py-3">
        ▶️ 开始
      </GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import type { Difficulty } from '@/types/game'
import DifficultySelector from '@/components/ui/DifficultySelector.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { initUIParams } from '@/utils/uiResponsive'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const selectedDifficulty = ref<Difficulty>(gameStore.difficulty)

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
  console.log('DifficultyView mounted, UI params initialized')
})
</script>
