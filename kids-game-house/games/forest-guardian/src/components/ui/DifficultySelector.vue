<script setup lang="ts">
/**
 * 难度选择器组件
 */
import { computed } from 'vue'

interface Difficulty {
  id: string
  label: string
  description?: string
  gridCols?: number
  gridRows?: number
  speed?: number
  scoreMultiplier?: number
}

interface Props {
  difficulties: Difficulty[]
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 当前选中的难度
const selectedId = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 获取难度样式
function getDifficultyStyle(difficulty: Difficulty) {
  const colors = {
    easy: { primary: '#22c55e', secondary: '#4ade80' },
    normal: { primary: '#3b82f6', secondary: '#60a5fa' },
    hard: { primary: '#ef4444', secondary: '#f87171' }
  }
  return colors[difficulty.id as keyof typeof colors] || colors.normal
}

function selectDifficulty(id: string) {
  selectedId.value = id
}
</script>

<template>
  <div class="difficulty-selector">
    <div 
      v-for="difficulty in difficulties" 
      :key="difficulty.id"
      class="difficulty-item"
      :class="{ active: selectedId === difficulty.id }"
      :style="{
        '--primary': getDifficultyStyle(difficulty).primary,
        '--secondary': getDifficultyStyle(difficulty).secondary
      }"
      @click="selectDifficulty(difficulty.id)"
    >
      <div class="radio">
        <div class="radio-inner" v-if="selectedId === difficulty.id"></div>
      </div>
      <div class="content">
        <span class="label">{{ difficulty.label }}</span>
        <span v-if="difficulty.description" class="desc">{{ difficulty.description }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.difficulty-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.difficulty-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.difficulty-item.active {
  background: rgba(var(--primary), 0.1);
  border-color: var(--primary);
}

.radio {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.difficulty-item.active .radio {
  border-color: var(--primary);
}

.radio-inner {
  width: 12px;
  height: 12px;
  background: var(--primary);
  border-radius: 50%;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
}

.difficulty-item.active .label {
  color: var(--secondary);
}

.desc {
  font-size: 13px;
  color: #94a3b8;
}
</style>
