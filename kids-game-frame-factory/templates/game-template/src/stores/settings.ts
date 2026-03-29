/**
 * 设置状态管理
 */
import { defineStore } from 'pinia'

export interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  vibrationEnabled: boolean
  showTutorial: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): GameSettings => ({
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    showTutorial: true
  }),

  actions: {
    // 加载设置
    loadSettings() {
      const saved = localStorage.getItem('gameSettings')
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          Object.assign(this.$state, settings)
        } catch (e) {
          console.warn('加载设置失败:', e)
        }
      }
    },
    
    // 保存设置
    saveSettings() {
      localStorage.setItem('gameSettings', JSON.stringify({
        soundEnabled: this.soundEnabled,
        musicEnabled: this.musicEnabled,
        vibrationEnabled: this.vibrationEnabled,
        showTutorial: this.showTutorial
      }))
    },
    
    // 切换音效
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      this.saveSettings()
    },
    
    // 切换音乐
    toggleMusic() {
      this.musicEnabled = !this.musicEnabled
      this.saveSettings()
    },
    
    // 切换振动
    toggleVibration() {
      this.vibrationEnabled = !this.vibrationEnabled
      this.saveSettings()
    },
    
    // 设置音效开关
    setSound(enabled: boolean) {
      this.soundEnabled = enabled
      this.saveSettings()
    },
    
    // 设置音乐开关
    setMusic(enabled: boolean) {
      this.musicEnabled = enabled
      this.saveSettings()
    },
    
    // 重置设置
    resetSettings() {
      this.soundEnabled = true
      this.musicEnabled = true
      this.vibrationEnabled = true
      this.showTutorial = true
      this.saveSettings()
    }
  }
})
