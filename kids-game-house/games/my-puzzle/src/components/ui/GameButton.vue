<script setup lang="ts">
/**
 * 游戏按钮组件
 * 
 * 提供统一的游戏按钮样式
 */
import { computed } from 'vue'

interface Props {
  text?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '按钮',
  size: 'medium',
  variant: 'primary',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 计算样式
const buttonStyle = computed(() => {
  const baseStyles = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '12px 24px', fontSize: '16px' },
    large: { padding: '16px 32px', fontSize: '20px' }
  }
  return baseStyles[props.size]
})

const variantStyles = {
  primary: {
    background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
    color: '#ffffff',
    border: 'none'
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '2px solid rgba(255, 255, 255, 0.3)'
  },
  danger: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
    color: '#ffffff',
    border: 'none'
  }
}

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
    <span v-if="loading" class="loading-spinner"></span>
    <slot>{{ text }}</slot>
  </button>
</template>

<style scoped>
.game-button {
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.game-button:hover:not(.disabled):not(.loading) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.game-button:active:not(.disabled):not(.loading) {
  transform: translateY(0);
}

.game-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-button.loading {
  cursor: wait;
}

.game-button.variant-secondary:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
