<template>
  <div class="flex items-center gap-2">
    <button
      @click="toggleSound"
      class="w-10 h-10 rounded-full bg-gray-700/80 flex items-center justify-center text-xl btn-bounce hover:bg-gray-600"
      title="声音开关"
    >
      {{ soundEnabled ? '🔊' : '🔇' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import type { SnakePhaserGame } from '@/components/game/PhaserGame'

// 从父组件注入 PhaserGame 实例
const phaserGame = inject<SnakePhaserGame | null>('phaserGame', null)

const soundEnabled = ref(true)

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  if (phaserGame) {
    const newEnabled = phaserGame.toggleSound()
    soundEnabled.value = newEnabled
  }
}
</script>
