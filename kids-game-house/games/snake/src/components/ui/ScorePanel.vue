<template>
  <div class="flex justify-between items-center bg-gray-800/70 rounded-lg backdrop-blur px-2 py-1.5" :style="containerStyle">
    <div class="flex flex-col">
      <span class="text-gray-400" :style="labelStyle">分数</span>
      <span class="font-bold text-green-400 score-pop" :key="score" :style="scoreStyle">{{ score }}</span>
    </div>
    <div class="flex flex-col items-end">
      <span class="text-gray-400" :style="labelStyle">最高分</span>
      <span class="font-bold text-yellow-400" :style="highScoreStyle">🏆 {{ highScore }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsiveUI } from '@/utils/uiResponsive'

const props = defineProps<{
  score: number
  highScore: number
}>()

const ui = useResponsiveUI()

const containerStyle = computed(() => ({
  // 🎨 放大容器内边距
  paddingLeft: ui.getPadding(16),
  paddingRight: ui.getPadding(16),
  paddingTop: ui.getPadding(10),
  paddingBottom: ui.getPadding(10),
  borderRadius: ui.getBorderRadius(12)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(14)  // 🎨 放大标签字体
}))

const scoreStyle = computed(() => ({
  fontSize: ui.getFontSize(28)  // 🎨 放大分数显示
}))

const highScoreStyle = computed(() => ({
  fontSize: ui.getFontSize(20)  // 🎨 放大最高分显示
}))
</script>
