<template>
  <div class="flex justify-between items-center bg-gray-800/70 rounded-lg backdrop-blur px-2 py-1.5" :style="containerStyle">
    <div class="flex flex-col">
      <span class="text-gray-400" :style="labelStyle">阳光</span>
      <span class="font-bold text-yellow-400 score-pop" :key="sunCount" :style="scoreStyle">☀️ {{ sunCount }}</span>
    </div>
    <div class="flex flex-col items-end">
      <span class="text-gray-400" :style="labelStyle">分数</span>
      <span class="font-bold text-green-400" :style="scoreStyle">{{ score }}</span>
    </div>
    <div class="flex flex-col items-end ml-4">
      <span class="text-gray-400" :style="labelStyle">最高分</span>
      <span class="font-bold text-yellow-400" :style="highScoreStyle">🏆 {{ highScore }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsiveUI } from '@/utils/uiResponsive'

const props = defineProps<{
  sunCount: number
  score: number
  highScore: number
}>()

const ui = useResponsiveUI()

const containerStyle = computed(() => ({
  paddingLeft: ui.getPadding(8),
  paddingRight: ui.getPadding(8),
  paddingTop: ui.getPadding(6),
  paddingBottom: ui.getPadding(6),
  borderRadius: ui.getBorderRadius(8)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(10)
}))

const scoreStyle = computed(() => ({
  fontSize: ui.getFontSize(18)
}))

const highScoreStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))
</script>
