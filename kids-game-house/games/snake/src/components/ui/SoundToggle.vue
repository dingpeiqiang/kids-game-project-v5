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
import { ref, inject, computed } from 'vue'
import type { SnakePhaserGame } from '@/components/game/PhaserGame'
import { useResponsiveUI } from '@/utils/uiResponsive'

// 从父组件注入 PhaserGame 实例
const phaserGame = inject<SnakePhaserGame | null>('phaserGame', null)

const ui = useResponsiveUI()
const soundEnabled = ref(true)

// ⭐ 动态计算按钮大小
const buttonStyle = computed(() => ({
  width: ui.getWidth(40),
  height: ui.getHeight(40),
  fontSize: ui.getFontSize(20)
}))

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  if (phaserGame) {
    const newEnabled = phaserGame.toggleSound()
    soundEnabled.value = newEnabled
  }
}
</script>
