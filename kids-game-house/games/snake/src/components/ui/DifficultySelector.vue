<template>
  <div class="diff-grid" :style="gridStyle">
    <div
      v-for="diff in difficulties"
      :key="diff.name"
      @click="selectDifficulty(diff.name)"
      class="diff-card select-none cursor-pointer"
      :class="{ 'diff-card--selected': selected === diff.name }"
      :style="[cardBaseStyle, selected === diff.name ? getSelectedBorderStyle(diff.color) : {}]"
    >
      <!-- 选中光晕背景 -->
      <div
        v-if="selected === diff.name"
        class="diff-card__glow"
        :style="{ background: `radial-gradient(ellipse at top left, ${diff.color}22 0%, transparent 70%)` }"
      />

      <!-- 卡片头部：emoji + 名称 + 勾选 -->
      <div class="diff-card__header flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 min-w-0">
          <!-- 难度色标 -->
          <span class="diff-badge flex-shrink-0" :style="{ background: diff.color, boxShadow: `0 2px 8px ${diff.color}66` }"></span>
          <span class="font-bold truncate" :style="{ fontSize: nameStyle.fontSize, color: diff.color }">
            {{ diff.nameCN }}
          </span>
        </div>
        <!-- 选中图标 -->
        <span class="diff-check flex-shrink-0" :style="{ fontSize: checkStyle.fontSize }">
          {{ selected === diff.name ? '✅' : '⭕' }}
        </span>
      </div>

      <!-- 描述 -->
      <p class="text-gray-400 leading-tight mb-2 line-clamp-2" :style="descStyle">
        {{ diff.description }}
      </p>

      <!-- 参数行 -->
      <div class="diff-params flex flex-wrap gap-x-3 gap-y-1" :style="paramStyle">
        <span class="param-tag">⚡ {{ getSpeedLabel(diff.speed) }}</span>
        <span class="param-tag">💰 x{{ diff.scoreMultiplier }}</span>
        <span class="param-tag">🎁 {{ Math.round(diff.rareFoodChance * 100) }}%</span>
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
  uiScale?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Difficulty]
}>()

const audioStore = useAudioStore()
const ui = useResponsiveUI()
const difficulties = Object.values(DIFFICULTY_CONFIGS)
const selected = computed(() => props.modelValue)

// ===== 样式 =====

const gridStyle = computed(() => ({
  gap: ui.getGap(12 * 1.3),  // ⭐ 放大 30%
}))

const cardBaseStyle = computed(() => ({
  padding: ui.getPadding(18 * 1.3),  // ⭐ 放大 30%
  borderRadius: ui.getBorderRadius(16 * 1.3),  // ⭐ 放大 30%
}))

const getSelectedBorderStyle = (color: string) => ({
  border: `2px solid ${color}`,
  boxShadow: `0 4px 20px ${color}33`,
})

const nameStyle = computed(() => ({
  fontSize: ui.getFontSize(28 * 1.3),  // ⭐ 放大 30%
}))

const checkStyle = computed(() => ({
  fontSize: ui.getFontSize(28 * 1.3),  // ⭐ 放大 30%
}))

const descStyle = computed(() => ({
  fontSize: ui.getFontSize(17 * 1.3),  // ⭐ 放大 30%
}))

const paramStyle = computed(() => ({
  fontSize: ui.getFontSize(16 * 1.3),  // ⭐ 放大 30%
}))

// ===== 交互 =====

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
/* 卡片网格：移动端单列，宽屏双列 */
.diff-grid {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

@media (min-width: 640px) {
  .diff-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 基础卡片 */
.diff-card {
  position: relative;
  overflow: hidden;
  background: rgba(31, 41, 55, 0.6);
  border: 2px solid rgba(75, 85, 99, 0.5);
  transition: all 0.22s ease;
}

.diff-card:hover {
  background: rgba(31, 41, 55, 0.85);
  border-color: rgba(107, 114, 128, 0.7);
  transform: translateY(-1px);
}

.diff-card:active {
  transform: translateY(0) scale(0.98);
}

/* 选中状态 */
.diff-card--selected {
  background: rgba(31, 41, 55, 0.9) !important;
  transform: translateY(-2px) !important;
}

/* 光晕背景层 */
.diff-card__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.diff-card__header,
.diff-card p,
.diff-params {
  position: relative;
  z-index: 1;
}

/* 难度色标圆点 */
.diff-badge {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 参数标签 */
.param-tag {
  color: #9ca3af;
  white-space: nowrap;
}

/* 文字行数限制 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
