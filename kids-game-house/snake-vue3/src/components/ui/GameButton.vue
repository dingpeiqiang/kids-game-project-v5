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
import { useResponsiveUI } from '@/utils/uiResponsive'
import { useAudioStore } from '@/stores/audio'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
  // 支持自定义样式（如果父组件传入则使用）
  fontSize?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
}>()

const emit = defineEmits<{
  click: []
}>()

const audioStore = useAudioStore()
const ui = useResponsiveUI()

const colorClass = computed(() => {
  switch (props.variant) {
    case 'primary': return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
    case 'secondary': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
    case 'danger': return 'bg-gradient-to-r from-red-400 to-red-500 text-white'
    case 'success': return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
    default: return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
  }
})

// 动态样式计算（支持父组件传入的自定义值）
const buttonStyle = computed(() => ({
  fontSize: props.fontSize ? ui.getFontSize(props.fontSize) : ui.getFontSize(20),
  paddingLeft: props.paddingLeft ? ui.getPadding(props.paddingLeft) : ui.getPadding(32),
  paddingRight: props.paddingRight ? ui.getPadding(props.paddingRight) : ui.getPadding(32),
  paddingTop: props.paddingTop ? ui.getPadding(props.paddingTop) : ui.getPadding(16),
  paddingBottom: props.paddingBottom ? ui.getPadding(props.paddingBottom) : ui.getPadding(16)
}))

const handleClick = () => {
  if (!props.disabled) {
    audioStore.playClickSound()
    emit('click')
  }
}
</script>
