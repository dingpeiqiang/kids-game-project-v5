<template>
  <button
    @click="handleClick"
    :class="[
      'btn-bounce rounded-2xl font-bold transition-all shadow-lg',
      colorClass,
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl active:scale-95'
    ]"
    :style="buttonStyle"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScale } from '../../composables/useScale'

/**
 * ⭐ 与贪吃蛇完全一致的 GameButton
 * - 使用 useScale() inject 获取缩放函数（与游戏 uiResponsive 精确一致）
 * - 4 方向 padding props
 * - btn-bounce 动画
 */

const props = withDefaults(defineProps<{
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义字体大小（基准值，会经过 uiScale 缩放） */
  fontSize?: number
  /** 自定义内边距（基准值，分别控制四个方向） */
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  /** 是否播放点击音效（由父组件通过 slot 或自定义事件处理） */
  soundEnabled?: boolean
}>(), {
  variant: 'primary',
  disabled: false,
  fontSize: 20,
  soundEnabled: true
})

const emit = defineEmits<{
  click: []
}>()

const { getFontSize, getPadding } = useScale()

const colorClass = computed(() => {
  switch (props.variant) {
    case 'primary':   return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
    case 'secondary': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
    case 'danger':    return 'bg-gradient-to-r from-red-400 to-red-500 text-white'
    case 'success':   return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
    case 'warning':   return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
    default:          return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
  }
})

const buttonStyle = computed(() => ({
  fontSize: props.fontSize ? getFontSize(props.fontSize) : getFontSize(20),
  paddingLeft: props.paddingLeft ? getPadding(props.paddingLeft) : getPadding(32),
  paddingRight: props.paddingRight ? getPadding(props.paddingRight) : getPadding(32),
  paddingTop: props.paddingTop ? getPadding(props.paddingTop) : getPadding(16),
  paddingBottom: props.paddingBottom ? getPadding(props.paddingBottom) : getPadding(16)
}))

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>
