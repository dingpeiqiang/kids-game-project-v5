<template>
  <button
    class="sound-toggle rounded-full flex items-center justify-center transition-all"
    :class="compact ? 'compact' : 'normal'"
    :style="btnStyle"
    :title="audioStore.soundEnabled ? '关闭音效' : '开启音效'"
    @click="toggle"
  >
    <span :style="{ fontSize: compact ? ui.getFontSize(18) : ui.getFontSize(22) }">
      {{ audioStore.soundEnabled ? '🔊' : '🔇' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audio'
import { useResponsiveUI } from '@/utils/uiResponsive'

const props = withDefaults(defineProps<{
  /** 紧凑模式（HUD 内嵌使用） */
  compact?: boolean
}>(), {
  compact: false,
})

const audioStore = useAudioStore()
const ui = useResponsiveUI()

const btnStyle = computed(() => ({
  width    : props.compact ? ui.getWidth(36) : ui.getWidth(44),
  height   : props.compact ? ui.getWidth(36) : ui.getWidth(44),
  minWidth : props.compact ? ui.getWidth(36) : ui.getWidth(44),
}))

function toggle() {
  audioStore.toggleSound()
  if (!audioStore.soundEnabled) {
    audioStore.stopBGM()
  } else {
    audioStore.startBGM()
  }
}
</script>

<style scoped>
.sound-toggle {
  background: rgba(75, 85, 99, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sound-toggle:hover {
  background: rgba(107, 114, 128, 0.7);
  transform: scale(1.05);
}
.sound-toggle:active {
  transform: scale(0.95);
}
</style>
