<template>
  <div class="flex items-center gap-2">
    <button
      @click="toggleSound"
      class="rounded-full bg-gray-700/80 flex items-center justify-center btn-bounce hover:bg-gray-600 transition-all"
      :style="buttonStyle"
      title="声音开关"
    >
      {{ soundEnabled ? '🔊' : '🔇' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScale } from '../../composables/useScale'

/**
 * ⭐ 与贪吃蛇完全一致的 SoundToggle
 * - 使用 useScale() inject 获取缩放函数
 * - 内部 ref 自管理状态
 * - emit toggle 事件让父组件处理实际音效
 */

const soundEnabled = ref(true)

const emit = defineEmits<{
  toggle: [enabled: boolean]
}>()

const { getWidth, getHeight, getFontSize } = useScale()

const buttonStyle = computed(() => ({
  width: getWidth(40),
  height: getHeight(40),
  fontSize: getFontSize(20)
}))

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  emit('toggle', soundEnabled.value)
}
</script>
