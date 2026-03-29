/**
 * ⚙️ 用户设置 Store
 *
 * 管理可持久化的用户偏好：
 * - 难度选择
 * - 音效开关
 * - 震动开关
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Difficulty } from '@/stores/game'

const STORAGE_KEY = 'puzzle-settings'

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveData(data: Record<string, any>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export const useSettingsStore = defineStore('settings', () => {
  const data = loadData()

  const difficulty = ref<Difficulty>(data.difficulty as Difficulty || 'medium')
  const isMuted    = ref<boolean>(data.isMuted || false)
  const vibration  = ref<boolean>(true)

  // 监听变化并保存
  watch([difficulty, isMuted, vibration], () => {
    saveData({
      difficulty : difficulty.value,
      isMuted    : isMuted.value,
    })
  }, { deep: true })

  function setDifficulty(d: Difficulty) {
    difficulty.value = d
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
    toggleVibration,
  }
})
