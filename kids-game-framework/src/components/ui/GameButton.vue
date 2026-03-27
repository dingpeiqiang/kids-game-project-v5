<template>
  <button
    @click="handleClick"
    :class="[
      'game-button',
      `game-button--${variant}`,
      `game-button--${size}`,
      disabled && 'game-button--disabled'
    ]"
    :style="buttonStyle"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonVariant, ButtonSize, ButtonConfig } from '../../types/ui.types'

const props = withDefaults(defineProps<{
  /** 按钮变体 */
  variant?: ButtonVariant
  /** 按钮尺寸 */
  size?: ButtonSize
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义字体大小 */
  fontSize?: number | string
  /** 自定义内边距 */
  padding?: string
  /** 圆角大小 */
  borderRadius?: string
  /** 是否播放点击音效 */
  soundEnabled?: boolean
}>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  fontSize: 20,
  borderRadius: '12px',
  soundEnabled: true
})

const emit = defineEmits<{
  click: []
}>()

const colorMap: Record<ButtonVariant, string> = {
  primary: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
  secondary: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  danger: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
  success: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
  warning: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)'
}

const sizeMap: Record<ButtonSize, { padding: string; fontSize: string }> = {
  small: { padding: '8px 16px', fontSize: '14px' },
  medium: { padding: '12px 24px', fontSize: '18px' },
  large: { padding: '16px 32px', fontSize: '22px' }
}

const buttonStyle = computed(() => ({
  background: colorMap[props.variant],
  fontSize: typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize,
  padding: props.padding || sizeMap[props.size].padding,
  borderRadius: props.borderRadius
}))

const handleClick = () => {
  if (!props.disabled) {
    // 点击音效由父组件通过 slot 或自定义事件处理
    emit('click')
  }
}
</script>

<style scoped>
.game-button {
  border: none;
  cursor: pointer;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  outline: none;
}

.game-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.game-button:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.game-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-button--small {
  min-width: 80px;
}

.game-button--medium {
  min-width: 120px;
}

.game-button--large {
  min-width: 160px;
}
</style>
