import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Difficulty } from '@/types/game'
import { loadGameData, saveGameData } from '@/utils/storage'

export const useSettingsStore = defineStore('settings', () => {
  const data = loadGameData()
  
  const difficulty = ref<Difficulty>(data.difficulty as Difficulty || 'medium')
  const isMuted = ref(data.isMuted || false)
  const vibration = ref(true)

  watch([difficulty, isMuted, vibration], () => {
    saveGameData({
      difficulty: difficulty.value,
      isMuted: isMuted.value,
    })
  }, { deep: true })

  function setDifficulty(newDifficulty: Difficulty) {
    difficulty.value = newDifficulty
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
  }

  function setMuted(muted: boolean) {
    isMuted.value = muted
  }

  function toggleVibration() {
    vibration.value = !vibration.value
  }

  return {
    difficulty,
    isMuted,
    vibration,
    setDifficulty,
    toggleMute,
    setMuted,
    toggleVibration
  }
})
