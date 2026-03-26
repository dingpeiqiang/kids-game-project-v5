<template>
  <button
    @click="toggle"
    class="w-12 h-12 rounded-full bg-gray-700/80 flex items-center justify-center text-2xl btn-bounce hover:bg-gray-600"
  >
    {{ isPaused ? '▶️' : '⏸️' }}
  </button>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'

const gameStore = useGameStore()
const audioStore = useAudioStore()

const isPaused = gameStore.isPaused

const toggle = () => {
  audioStore.playPauseSound()
  gameStore.togglePause()
}
</script>
