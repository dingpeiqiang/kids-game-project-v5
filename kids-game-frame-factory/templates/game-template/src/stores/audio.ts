/**
 * 音频状态管理
 */
import { defineStore } from 'pinia'

export const useAudioStore = defineStore('audio', {
  state: () => ({
    // 背景音乐
    bgm: null as HTMLAudioElement | null,
    
    // 音效
    effects: {} as Record<string, HTMLAudioElement>,
    
    // 音量 (0-1)
    volume: 0.5,
    
    // 静音状态
    muted: false,
    
    // BGM 音量
    bgmVolume: 0.6,
    
    // 音效音量
    effectVolume: 0.8
  }),

  getters: {
    // 是否静音
    isMuted: (state) => state.muted,
    
    // 实际 BGM 音量
    actualBgmVolume: (state) => state.muted ? 0 : state.bgmVolume * state.volume,
    
    // 实际音效音量
    actualEffectVolume: (state) => state.muted ? 0 : state.effectVolume * state.volume
  },

  actions: {
    // 播放背景音乐
    playBgm(src: string, loop = true) {
      // 停止现有 BGM
      this.stopBgm()
      
      if (!src) return
      
      this.bgm = new Audio(src)
      this.bgm.loop = loop
      this.bgm.volume = this.actualBgmVolume
      this.bgm.play().catch(err => {
        console.warn('BGM 播放失败:', err)
      })
    },
    
    // 停止背景音乐
    stopBgm() {
      if (this.bgm) {
        this.bgm.pause()
        this.bgm.currentTime = 0
        this.bgm = null
      }
    },
    
    // 暂停 BGM
    pauseBgm() {
      this.bgm?.pause()
    },
    
    // 恢复 BGM
    resumeBgm() {
      this.bgm?.play().catch(err => {
        console.warn('BGM 恢复播放失败:', err)
      })
    },
    
    // 播放音效
    playEffect(src: string, key?: string) {
      if (!src) return
      
      const audio = new Audio(src)
      audio.volume = this.actualEffectVolume
      audio.play().catch(err => {
        console.warn('音效播放失败:', err)
      })
      
      // 保存音效引用（用于停止特定音效）
      if (key) {
        this.effects[key] = audio
      }
      
      // 播放完成后清理
      audio.onended = () => {
        if (key && this.effects[key] === audio) {
          delete this.effects[key]
        }
      }
    },
    
    // 停止特定音效
    stopEffect(key: string) {
      const audio = this.effects[key]
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        delete this.effects[key]
      }
    },
    
    // 停止所有音效
    stopAllEffects() {
      Object.keys(this.effects).forEach(key => {
        this.effects[key].pause()
        this.effects[key].currentTime = 0
      })
      this.effects = {}
    },
    
    // 切换静音
    toggleMute() {
      this.muted = !this.muted
      
      // 更新 BGM 音量
      if (this.bgm) {
        this.bgm.volume = this.actualBgmVolume
      }
    },
    
    // 设置音量
    setVolume(volume: number) {
      this.volume = Math.max(0, Math.min(1, volume))
      
      // 更新 BGM 音量
      if (this.bgm) {
        this.bgm.volume = this.actualBgmVolume
      }
    },
    
    // 清理
    cleanup() {
      this.stopBgm()
      this.stopAllEffects()
    }
  }
})
