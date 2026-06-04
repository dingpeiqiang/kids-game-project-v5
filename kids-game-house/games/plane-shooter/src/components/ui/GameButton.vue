<script setup lang="ts">
/**
 * 游戏按钮组件
 *
 * 支持通过 props 传入原始设计尺寸（px），内部使用 uiScaleRef 自动缩放。
 *
 * 使用方法：
 * ```vue
 * <GameButton variant="primary" :fontSize="24" :paddingTop="16" :paddingBottom="16">
 *   开始游戏
 * </GameButton>
 * ```
 */
import { computed } from 'vue'
import { uiScaleRef } from '@/utils/uiResponsive'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
  loading?: boolean
  /** 原始设计字体大小（px），内部会乘以 uiScale */
  fontSize?: number
  paddingTop?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingRight?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant     : 'primary',
  disabled    : false,
  loading     : false,
  fontSize    : 18,
  paddingTop  : 14,
  paddingBottom: 14,
  paddingLeft : 32,
  paddingRight: 32,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

// 响应式字体和内边距（随屏幕缩放自动更新）
const buttonStyle = computed(() => ({
  fontSize      : `${props.fontSize    * uiScaleRef.value}px`,
  paddingTop    : `${props.paddingTop  * uiScaleRef.value}px`,
  paddingBottom : `${props.paddingBottom * uiScaleRef.value}px`,
  paddingLeft   : `${props.paddingLeft * uiScaleRef.value}px`,
  paddingRight  : `${props.paddingRight * uiScaleRef.value}px`,
}))

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    class="game-button"
    :class="[`variant-${variant}`, { disabled, loading }]"
    :style="buttonStyle"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-spinner"/>
    <slot/>
  </button>
</template>

<style scoped>
.game-button {
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Variants */
.game-button.variant-primary {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: #fff;
}
.game-button.variant-primary:hover:not(.disabled) {
  filter: brightness(1.12);
}

.game-button.variant-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
.game-button.variant-secondary:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.5);
}

.game-button.variant-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
}
.game-button.variant-danger:hover:not(.disabled) {
  filter: brightness(1.1);
}

.game-button.variant-success {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
}
.game-button.variant-success:hover:not(.disabled) {
  filter: brightness(1.1);
}

/* 交互状态 */
.game-button:hover:not(.disabled):not(.loading) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.game-button:active:not(.disabled):not(.loading) {
  transform: translateY(0) scale(0.97);
}

.game-button.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.game-button.loading {
  cursor: wait;
  opacity: 0.8;
}

/* 加载指示器 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
