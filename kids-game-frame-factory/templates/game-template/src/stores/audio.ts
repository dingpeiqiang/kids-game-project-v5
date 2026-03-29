/**
 * 🔊 音频 Store - WebAudio API 版本
 *
 * 纯代码音效合成，无需外部音频文件：
 * - 7 种音效：eat / rareEat / die / click / win / pause / move
 * - BGM：Mario 风格旋律（可循环）
 * - 设置持久化（localStorage）
 *
 * 使用方法：
 * ```ts
 * const audioStore = useAudioStore()
 * audioStore.playClickSound()
 * audioStore.startBGM()
 * ```
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

// localStorage key
const STORAGE_KEY = '__GAME_ID__-audio-settings'

export const useAudioStore = defineStore('audio', () => {
  const soundEnabled   = ref(true)
  const bgmEnabled     = ref(true)
  const audioContext   = ref<AudioContext | null>(null)
  const bgmGain        = ref<GainNode | null>(null)
  const isBGMPlaying   = ref(false)
  const bgmOscillators = ref<OscillatorNode[]>([])

  // ─── 初始化 AudioContext ──────────────────────────────────────────────────

  const initAudio = () => {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume().catch(err => {
        console.warn('Failed to resume AudioContext:', err)
      })
    } else if (audioContext.value.state === 'closed') {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /** 确保 AudioContext 可用（每次播放前调用） */
  const ensureAudioReady = (): boolean => {
    if (!audioContext.value) {
      initAudio()
      return true
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume().catch(() => {})
      return true
    }
    return audioContext.value.state === 'running'
  }

  // ─── 设置持久化 ───────────────────────────────────────────────────────────

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        soundEnabled.value = data.soundEnabled !== false
        bgmEnabled.value   = data.bgmEnabled   !== false
      }
    } catch (e) {
      console.error('Failed to load audio settings:', e)
    }
  }

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      soundEnabled : soundEnabled.value,
      bgmEnabled   : bgmEnabled.value,
    }))
  }

  // ─── 核心播放函数 ─────────────────────────────────────────────────────────

  /**
   * 播放一个音调
   * @param frequency  频率（Hz）
   * @param type       波形类型
   * @param duration   持续时间（秒）
   * @param volume     音量（0-1）
   */
  const playSound = (
    frequency: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.1,
  ) => {
    if (!soundEnabled.value) return
    if (!ensureAudioReady()) {
      console.warn('Audio not ready, skipping sound')
      return
    }
    if (!audioContext.value) return

    try {
      const osc  = audioContext.value.createOscillator()
      const gain = audioContext.value.createGain()

      osc.type           = type
      osc.frequency.value = frequency
      osc.connect(gain)
      gain.connect(audioContext.value.destination)

      gain.gain.setValueAtTime(volume, audioContext.value.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.value.currentTime + duration)

      osc.start()
      osc.stop(audioContext.value.currentTime + duration)
    } catch (e) {
      // 静默失败，避免影响游戏
    }
  }

  // ─── 预置音效 ─────────────────────────────────────────────────────────────

  /** 吃到普通目标 */
  const playEatSound = () => {
    playSound(800, 'sine', 0.1, 0.2)
    setTimeout(() => playSound(1200, 'sine', 0.1, 0.15), 80)
  }

  /** 吃到稀有 / 奖励目标 */
  const playRareEatSound = () => {
    playSound(600, 'sine', 0.1, 0.2)
    setTimeout(() => playSound(900,  'sine', 0.1,  0.15), 100)
    setTimeout(() => playSound(1400, 'sine', 0.15, 0.12), 200)
  }

  /** 死亡 / 游戏结束 */
  const playDieSound = () => {
    playSound(500, 'sawtooth', 0.2, 0.25)
    setTimeout(() => playSound(400, 'sawtooth', 0.2,  0.2), 150)
    setTimeout(() => playSound(300, 'sawtooth', 0.25, 0.2), 300)
    setTimeout(() => playSound(200, 'sawtooth', 0.4,  0.2), 500)
  }

  /** UI 按钮点击 */
  const playClickSound = () => {
    playSound(1000, 'square', 0.05, 0.1)
  }

  /** 过关 / 升级 */
  const playWinSound = () => {
    playSound(523,  'sine', 0.15, 0.2)
    setTimeout(() => playSound(659,  'sine', 0.15, 0.18), 120)
    setTimeout(() => playSound(784,  'sine', 0.2,  0.18), 240)
    setTimeout(() => playSound(1047, 'sine', 0.3,  0.2),  360)
  }

  /** 暂停 */
  const playPauseSound = () => {
    playSound(500, 'sine', 0.1, 0.1)
  }

  /** 移动（轻微） */
  const playMoveSound = () => {
    playSound(150, 'triangle', 0.03, 0.02)
  }

  // ─── BGM（Mario 风格旋律） ────────────────────────────────────────────────

  const startBGM = () => {
    if (!bgmEnabled.value) return
    if (!ensureAudioReady()) {
      console.warn('Cannot start BGM: audio not ready')
      return
    }
    if (!audioContext.value || isBGMPlaying.value) return

    try {
      const masterGain = audioContext.value.createGain()
      masterGain.gain.value = 0.08
      masterGain.connect(audioContext.value.destination)
      bgmGain.value = masterGain

      // 欢快旋律（C 大调）
      const melody = [
        { note: 523.25, dur: 200 }, // C5
        { note: 523.25, dur: 200 },
        { note: 0,      dur: 100 }, // 休止
        { note: 523.25, dur: 200 },
        { note: 0,      dur: 100 },
        { note: 392.00, dur: 200 }, // G4
        { note: 0,      dur: 100 },
        { note: 329.63, dur: 300 }, // E4
        { note: 0,      dur: 100 },
        { note: 349.23, dur: 200 }, // F4
        { note: 0,      dur: 100 },
        { note: 392.00, dur: 200 }, // G4
        { note: 0,      dur: 100 },
        { note: 523.25, dur: 250 }, // C5
        { note: 392.00, dur: 200 }, // G4
        { note: 0,      dur: 100 },
        { note: 329.63, dur: 300 }, // E4
        { note: 0,      dur: 200 },
      ]

      let noteIndex = 0

      const playNote = () => {
        if (!isBGMPlaying.value || !bgmEnabled.value) return

        const note = melody[noteIndex]

        if (note.note > 0) {
          const osc  = audioContext.value!.createOscillator()
          const gain = audioContext.value!.createGain()

          osc.type            = 'square'
          osc.frequency.value = note.note

          // ADSR 包络
          gain.gain.setValueAtTime(0, audioContext.value!.currentTime)
          gain.gain.linearRampToValueAtTime(0.15, audioContext.value!.currentTime + 0.02)
          gain.gain.linearRampToValueAtTime(0.1,  audioContext.value!.currentTime + note.dur / 1000 - 0.02)
          gain.gain.linearRampToValueAtTime(0,    audioContext.value!.currentTime + note.dur / 1000)

          osc.connect(gain)
          gain.connect(masterGain)
          osc.start()
          osc.stop(audioContext.value!.currentTime + note.dur / 1000)
        }

        noteIndex = (noteIndex + 1) % melody.length
        setTimeout(playNote, note.dur)
      }

      isBGMPlaying.value = true
      playNote()
    } catch (e) {
      console.error('Failed to start BGM:', e)
    }
  }

  const stopBGM = () => {
    isBGMPlaying.value = false
    bgmOscillators.value.forEach(osc => {
      try { osc.stop(); osc.disconnect() } catch (e) {}
    })
    bgmOscillators.value = []
    if (bgmGain.value) {
      bgmGain.value.disconnect()
      bgmGain.value = null
    }
  }

  // ─── 开关 ─────────────────────────────────────────────────────────────────

  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
    saveSettings()
  }

  const toggleBGM = () => {
    bgmEnabled.value = !bgmEnabled.value
    if (bgmEnabled.value && !isBGMPlaying.value) {
      startBGM()
    } else if (!bgmEnabled.value) {
      stopBGM()
    }
    saveSettings()
  }

  // 启动时加载设置
  loadSettings()

  return {
    soundEnabled,
    bgmEnabled,
    audioContext,
    isBGMPlaying,
    initAudio,
    ensureAudioReady,
    playEatSound,
    playRareEatSound,
    playDieSound,
    playClickSound,
    playWinSound,
    playPauseSound,
    playMoveSound,
    startBGM,
    stopBGM,
    toggleSound,
    toggleBGM,
    saveSettings,
  }
})
