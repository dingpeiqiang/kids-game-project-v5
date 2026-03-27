<template>
  <div class="controls-hint" :class="[`controls-hint--${position}`]">
    <div
      v-for="hint in hints"
      :key="hint.key"
      class="controls-hint__item"
    >
      <span class="controls-hint__icon" v-if="hint.icon">{{ hint.icon }}</span>
      <span class="controls-hint__label">{{ hint.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ControlHint } from '../../types/ui.types'

withDefaults(defineProps<{
  /** 操作提示列表 */
  hints?: ControlHint[]
  /** 显示位置 */
  position?: 'top' | 'bottom' | 'auto'
}>(), {
  hints: () => [
    { key: 'up', label: '向上', icon: '⬆️' },
    { key: 'down', label: '向下', icon: '⬇️' },
    { key: 'left', label: '向左', icon: '⬅️' },
    { key: 'right', label: '向右', icon: '➡️' }
  ],
  position: 'bottom'
})
</script>

<style scoped>
.controls-hint {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(31, 41, 55, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.controls-hint--top {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
}

.controls-hint--bottom {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.controls-hint__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #d1d5db;
}

.controls-hint__icon {
  font-size: 18px;
}

.controls-hint__label {
  font-weight: 500;
}
</style>
