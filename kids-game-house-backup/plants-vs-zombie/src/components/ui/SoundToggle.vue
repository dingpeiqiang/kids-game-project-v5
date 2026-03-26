<template>
  <div class="flex items-center gap-2">
    <button
      @click="toggleSound"
      class="w-10 h-10 rounded-full bg-gray-700/80 flex items-center justify-center text-xl btn-bounce hover:bg-gray-600"
      title="音效开关"
    >
      {{ soundEnabled ? '🔊' : '🔇' }}
    </button>
    <button
      @click="toggleBGM"
      class="w-10 h-10 rounded-full bg-gray-700/80 flex items-center justify-center text-xl btn-bounce hover:bg-gray-600"
      title="背景音乐开关"
    >
      {{ bgmEnabled ? '🎵' : '🔇' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audio'

const audioStore = useAudioStore()

const soundEnabled = computed(() => audioStore.soundEnabled)
const bgmEnabled = computed(() => audioStore.bgmEnabled)

const toggleSound = () => {
  audioStore.toggleSound()
}

const toggleBGM = () => {
  audioStore.toggleBGM()
}
</script>
