<template>
  <div class="flex flex-col gap-3 md:gap-4 w-full">
    <div
      v-for="diff in difficulties"
      :key="diff.name"
      @click="selectDifficulty(diff.name)"
      :class="[
        'p-3 md:p-4 rounded-xl cursor-pointer btn-bounce transition-all border-2 select-none',
        selected === diff.name
          ? 'border-green-400 bg-green-400/20 scale-[1.02] shadow-lg shadow-green-400/30'
          : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700/70'
      ]"
    >
      <div class="flex justify-between items-center">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg md:text-xl font-bold truncate" :style="{ color: diff.color }">
            {{ diff.nameCN }}
          </h3>
          <p class="text-gray-400 text-xs md:text-sm mt-1 line-clamp-1">{{ diff.description }}</p>
        </div>
        <div class="text-2xl md:text-3xl ml-3 flex-shrink-0">
          {{ selected === diff.name ? '✅' : '⭕' }}
        </div>
      </div>
      <div class="mt-2 md:mt-3 flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-300">
        <span class="whitespace-nowrap">🧟 僵尸速度：{{ getSpeedLabel(diff.zombieSpeedMultiplier) }}</span>
        <span class="whitespace-nowrap">❤️ 僵尸血量：x{{ diff.zombieHealthMultiplier }}</span>
        <span class="whitespace-nowrap">☀️ 阳光频率：{{ getSunLabel(diff.sunSpawnRate) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DIFFICULTY_CONFIGS, type Difficulty } from '@/types/game'
import { useAudioStore } from '@/stores/audio'

const props = defineProps<{
  modelValue: Difficulty
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Difficulty]
}>()

const audioStore = useAudioStore()
const difficulties = Object.values(DIFFICULTY_CONFIGS)
const selected = computed(() => props.modelValue)

const selectDifficulty = (diff: Difficulty) => {
  audioStore.playClickSound()
  emit('update:modelValue', diff)
}

const getSpeedLabel = (multiplier: number) => {
  if (multiplier < 0.9) return '慢速 🐢'
  if (multiplier < 1.2) return '中速 🚶'
  return '快速 🐇'
}

const getSunLabel = (rate: number) => {
  if (rate > 8000) return '充足 ☀️☀️'
  if (rate > 6000) return '平衡 ☀️'
  return '紧张 ⚡'
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
