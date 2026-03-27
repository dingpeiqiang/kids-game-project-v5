<template>
  <div class="difficulty-selector">
    <div
      v-for="diff in config.levels"
      :key="diff.id"
      class="difficulty-selector__item"
      :class="{ 'difficulty-selector__item--selected': selectedId === diff.id }"
      @click="selectDifficulty(diff.id)"
    >
      <div class="difficulty-selector__content">
        <div class="difficulty-selector__header">
          <span class="difficulty-selector__icon">{{ diff.icon || '🎮' }}</span>
          <h3 class="difficulty-selector__name">
            {{ diff.nameCN || diff.name }}
          </h3>
          <span class="difficulty-selector__check">
            {{ selectedId === diff.id ? '✅' : '⭕' }}
          </span>
        </div>
        <p class="difficulty-selector__desc">{{ diff.description }}</p>
        <div class="difficulty-selector__params">
          <slot name="params" :params="diff.params" :level="diff">
            <!-- 默认参数展示，可被覆盖 -->
            <span v-for="(value, key) in diff.params" :key="key" class="difficulty-selector__param">
              {{ formatParam(key as string, value) }}
            </span>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DifficultyConfig, DifficultyLevel } from '../../types/ui.types'

const props = defineProps<{
  /** 难度配置 */
  config: DifficultyConfig
  /** 当前选中的难度 ID */
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [level: DifficultyLevel]
}>()

const selectedId = computed(() => props.modelValue || props.config.defaultId || props.config.levels[0]?.id)

function selectDifficulty(id: string) {
  const level = props.config.levels.find(l => l.id === id)
  if (level) {
    emit('update:modelValue', id)
    emit('select', level)
  }
}

function formatParam(key: string, value: number | string): string {
  // 自定义参数格式化，可根据游戏需求扩展
  const paramLabels: Record<string, string> = {
    speed: '⚡ 速度',
    scoreMultiplier: '💰 倍率'
    // 游戏特定的参数可在此扩展
  }
  return `${paramLabels[key] || key}: ${value}`
}
</script>

<style scoped>
.difficulty-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.difficulty-selector__item {
  cursor: pointer;
  border: 2px solid rgba(75, 85, 99, 0.5);
  border-radius: 12px;
  background: rgba(55, 65, 81, 0.5);
  padding: 16px;
  transition: all 0.2s ease;
}

.difficulty-selector__item:hover {
  border-color: rgba(107, 114, 128, 0.8);
  background: rgba(55, 65, 81, 0.7);
  transform: translateX(4px);
}

.difficulty-selector__item--selected {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.2);
}

.difficulty-selector__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.difficulty-selector__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.difficulty-selector__icon {
  font-size: 24px;
}

.difficulty-selector__name {
  flex: 1;
  font-size: 18px;
  font-weight: bold;
  color: #4ade80;
  margin: 0;
}

.difficulty-selector__check {
  font-size: 20px;
}

.difficulty-selector__desc {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.difficulty-selector__params {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

.difficulty-selector__param {
  font-size: 12px;
  color: #d1d5db;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
