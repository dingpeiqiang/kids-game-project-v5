<template>
  <div class="flex flex-col w-full" :style="containerStyle">
    <div
      v-for="diff in difficulties"
      :key="diff.name"
      @click="selectDifficulty(diff.name)"
      :class="[
        'cursor-pointer btn-bounce transition-all border-2 select-none',
        selected === diff.name
          ? 'border-green-400 bg-green-400/20 scale-[1.02] shadow-lg shadow-green-400/30'
          : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700/70'
      ]"
      :style="cardStyle"
    >
      <div class="flex justify-between items-start gap-3">
        <div class="flex-1 min-w-0">
          <h3 class="font-bold truncate" :style="{ ...nameStyle, color: diff.color }">
            {{ diff.nameCN }}
          </h3>
          <p class="text-gray-400 mt-1 line-clamp-1" :style="descriptionStyle">{{ diff.description }}</p>
          <div class="flex flex-wrap gap-1 md:gap-2 text-gray-300" :style="paramsStyle">
            <span class="text-xs md:text-sm">⚡ 速度：{{ getSpeedLabel(diff.speed) }}</span>
            <span class="text-xs md:text-sm">💰 倍率：x{{ diff.scoreMultiplier }}</span>
            <span class="text-xs md:text-sm">🎁 奖励：{{ Math.round(diff.rareFoodChance * 100) }}%</span>
          </div>
        </div>
        <div class="ml-2 flex-shrink-0" :style="iconStyle">
          {{ selected === diff.name ? '✅' : '⭕' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsiveUI } from '@/utils/uiResponsive'
import { DIFFICULTY_CONFIGS, type Difficulty } from '@/types/game'
import { useAudioStore } from '@/stores/audio'

const props = defineProps<{
  modelValue: Difficulty
  uiScale?: number  // ⭐ 支持从父组件传入 uiScale（可选）
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Difficulty]
}>()

const audioStore = useAudioStore()
const ui = useResponsiveUI()
const difficulties = Object.values(DIFFICULTY_CONFIGS)
const selected = computed(() => props.modelValue)

// 动态样式计算
const containerStyle = computed(() => ({
  gap: ui.getGap(16)
}))

const cardStyle = computed(() => ({
  padding: ui.getPadding(16),
  borderRadius: ui.getBorderRadius(12),
  // ⭐ 如果传入了 uiScale，使用传入的值覆盖（用于特殊场景）
  transform: props.uiScale ? `scale(${props.uiScale})` : undefined
}))

const nameStyle = computed(() => ({
  fontSize: ui.getFontSize(20)
}))

const descriptionStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const iconStyle = computed(() => ({
  fontSize: ui.getFontSize(28)
}))

const paramsStyle = computed(() => ({
  marginTop: ui.getGap(8),
  gap: ui.getGap(8),
  fontSize: ui.getFontSize(12)  // ⭐ 稍微调小字体，避免溢出
}))

const selectDifficulty = (diff: Difficulty) => {
  audioStore.playClickSound()
  emit('update:modelValue', diff)
}

const getSpeedLabel = (speed: number) => {
  if (speed > 120) return '慢速 🐢'
  if (speed > 80) return '中速 🚶'
  return '快速 🐇'
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
