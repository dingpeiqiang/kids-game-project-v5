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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import type { Difficulty } from '@/types/game'
import DifficultySelector from '@/components/ui/DifficultySelector.vue'
import GameButton from '@/components/ui/GameButton.vue'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()

const selectedDifficulty = ref<Difficulty>(gameStore.difficulty)

const goBack = () => {
  audioStore.playClickSound()
  router.push('/')
}

const startGame = () => {
  audioStore.playClickSound()
  gameStore.setDifficulty(selectedDifficulty.value)
  gameStore.startGame()
  router.push('/game')
}
</script>
