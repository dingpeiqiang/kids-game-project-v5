import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AUDIO_ASSETS, getAssetPath, useFallback } from '@/config/game-assets.config'

export const useAudioStore = defineStore('audio', () => {
  const soundEnabled = ref(true)
  const bgmEnabled = ref(true)
  const audioContext = ref<AudioContext | null>(null)
  const isBGMPlaying = ref(false)
  const currentBGMType = ref<'start' | 'game' | 'win' | 'lose' | null>(null)
  
  let bgmInterval: number | null = null
  let bgmNoteIndex = 0
  let bgmGainNode: GainNode | null = null
  
  // 音频元素缓存
  const audioElements: Map<string, HTMLAudioElement> = new Map()

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

  const ensureAudioReady = () => {
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

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('pvz-audio-settings')
      if (saved) {
        const data = JSON.parse(saved)
        soundEnabled.value = data.soundEnabled !== false
        bgmEnabled.value = data.bgmEnabled !== false
      }
    } catch (e) {
      console.error('Failed to load audio settings:', e)
    }
  }

  const saveSettings = () => {
    localStorage.setItem('pvz-audio-settings', JSON.stringify({
      soundEnabled: soundEnabled.value,
      bgmEnabled: bgmEnabled.value
    }))
  }

  const playSound = (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
    if (!soundEnabled.value) return
    
    if (!ensureAudioReady()) {
      return
    }
    
    if (!audioContext.value) return
    
    try {
      const osc = audioContext.value.createOscillator()
      const gain = audioContext.value.createGain()
      
      osc.type = type
      osc.frequency.value = frequency
      osc.connect(gain)
      gain.connect(audioContext.value.destination)
      
      gain.gain.setValueAtTime(volume, audioContext.value.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.value.currentTime + duration)
      
      osc.start()
      osc.stop(audioContext.value.currentTime + duration)
    } catch (e) {
      // 静默失败
    }
  }

  // 播放自定义音频文件
  const playCustomAudio = (audioKey: string) => {
    if (!soundEnabled.value) return
    
    // 检查是否配置了自定义音频文件
    const config = AUDIO_ASSETS[audioKey as keyof typeof AUDIO_ASSETS]
    if (!config || useFallback('audio', audioKey)) {
      return false  // 使用默认合成音效
    }

    try {
      let audio = audioElements.get(audioKey)
      if (!audio) {
        const path = getAssetPath('audio', audioKey)
        audio = new Audio(path)
        audioElements.set(audioKey, audio)
      }
      
      // 重置播放位置以允许快速连续播放
      audio.currentTime = 0
      audio.play().catch(() => {})
      return true
    } catch (e) {
      return false
    }
  }

  // 音效
  const playPlantSound = () => {
    if (!playCustomAudio('plant')) {
      playSound(600, 'sine', 0.1, 0.15)
      setTimeout(() => playSound(800, 'sine', 0.1, 0.12), 80)
    }
  }

  const playShootSound = () => {
    if (!playCustomAudio('shoot')) {
      playSound(400, 'square', 0.05, 0.08)
    }
  }

  const playSunCollectSound = () => {
    if (!playCustomAudio('sunCollect')) {
      playSound(1000, 'sine', 0.1, 0.15)
      setTimeout(() => playSound(1400, 'sine', 0.15, 0.12), 100)
    }
  }

  const playZombieHitSound = () => {
    if (!playCustomAudio('zombieEat')) {
      playSound(200, 'sawtooth', 0.1, 0.1)
    }
  }

  const playZombieDieSound = () => {
    if (!playCustomAudio('zombieDie')) {
      playSound(150, 'sawtooth', 0.15, 0.15)
      setTimeout(() => playSound(100, 'sawtooth', 0.2, 0.12), 100)
    }
  }

  const playExplosionSound = () => {
    if (!playCustomAudio('cherrybomb')) {
      playSound(100, 'sawtooth', 0.3, 0.25)
      setTimeout(() => playSound(80, 'square', 0.3, 0.2), 100)
    }
  }

  const playClickSound = () => {
    playSound(1000, 'square', 0.05, 0.1)
  }

  const playPauseSound = () => {
    playSound(500, 'sine', 0.1, 0.1)
  }

  const playWinSound = () => {
    playSound(523, 'sine', 0.15, 0.2)
    setTimeout(() => playSound(659, 'sine', 0.15, 0.18), 120)
    setTimeout(() => playSound(784, 'sine', 0.2, 0.18), 240)
    setTimeout(() => playSound(1047, 'sine', 0.3, 0.2), 360)
  }

  const playLoseSound = () => {
    playSound(400, 'sawtooth', 0.2, 0.2)
    setTimeout(() => playSound(350, 'sawtooth', 0.2, 0.18), 200)
    setTimeout(() => playSound(300, 'sawtooth', 0.3, 0.16), 400)
  }

  // BGM 旋律配置
  const bgmMelodies = {
    start: [
      { note: 523.25, dur: 300 }, { note: 0, dur: 100 },
      { note: 659.25, dur: 300 }, { note: 0, dur: 100 },
      { note: 783.99, dur: 300 }, { note: 0, dur: 100 },
      { note: 1046.50, dur: 400 }, { note: 0, dur: 200 },
      { note: 783.99, dur: 300 }, { note: 0, dur: 100 },
      { note: 1046.50, dur: 600 }, { note: 0, dur: 200 },
    ],
    game: [
      { note: 392.00, dur: 200 }, { note: 0, dur: 100 },
      { note: 392.00, dur: 200 }, { note: 0, dur: 100 },
      { note: 440.00, dur: 200 }, { note: 0, dur: 100 },
      { note: 392.00, dur: 200 }, { note: 0, dur: 100 },
      { note: 349.23, dur: 200 }, { note: 0, dur: 100 },
      { note: 329.63, dur: 200 }, { note: 0, dur: 100 },
      { note: 349.23, dur: 200 }, { note: 0, dur: 100 },
      { note: 392.00, dur: 300 }, { note: 0, dur: 100 },
    ],
    win: [
      { note: 523.25, dur: 200 }, { note: 659.25, dur: 200 },
      { note: 783.99, dur: 200 }, { note: 1046.50, dur: 400 },
      { note: 783.99, dur: 200 }, { note: 1046.50, dur: 400 },
    ],
    lose: [
      { note: 392.00, dur: 300 }, { note: 0, dur: 100 },
      { note: 369.99, dur: 300 }, { note: 0, dur: 100 },
      { note: 349.23, dur: 300 }, { note: 0, dur: 100 },
      { note: 329.63, dur: 400 }, { note: 0, dur: 200 },
    ]
  }

  const playBGMNote = (melody: typeof bgmMelodies.start) => {
    if (!isBGMPlaying.value || !bgmEnabled.value || !audioContext.value) return
    
    const note = melody[bgmNoteIndex]
    
    if (note.note > 0 && bgmGainNode) {
      const osc = audioContext.value.createOscillator()
      const gain = audioContext.value.createGain()
      
      osc.type = 'square'
      osc.frequency.value = note.note
      
      gain.gain.setValueAtTime(0, audioContext.value.currentTime)
      gain.gain.linearRampToValueAtTime(0.08, audioContext.value.currentTime + 0.02)
      gain.gain.linearRampToValueAtTime(0.05, audioContext.value.currentTime + note.dur / 1000 - 0.02)
      gain.gain.linearRampToValueAtTime(0, audioContext.value.currentTime + note.dur / 1000)
      
      osc.connect(gain)
      gain.connect(bgmGainNode)
      osc.start()
      osc.stop(audioContext.value.currentTime + note.dur / 1000)
    }

    bgmNoteIndex = (bgmNoteIndex + 1) % melody.length
    
    bgmInterval = window.setTimeout(() => {
      playBGMNote(melody)
    }, note.dur)
  }

  const startBGM = (type: 'start' | 'game' | 'win' | 'lose' = 'game') => {
    if (!bgmEnabled.value) return

    if (!ensureAudioReady()) {
      return
    }

    // 如果已经在播放，先停止
    if (isBGMPlaying.value) {
      stopBGM()
    }

    if (!audioContext.value) return

    try {
      const masterGain = audioContext.value.createGain()
      masterGain.gain.value = 0.15  // 增加音量
      masterGain.connect(audioContext.value.destination)
      bgmGainNode = masterGain

      currentBGMType.value = type
      bgmNoteIndex = 0
      isBGMPlaying.value = true

      const melody = bgmMelodies[type]
      playBGMNote(melody)
    } catch (e) {
      console.error('Failed to start BGM:', e)
    }
  }

  const stopBGM = () => {
    isBGMPlaying.value = false
    currentBGMType.value = null
    if (bgmInterval) {
      clearTimeout(bgmInterval)
      bgmInterval = null
    }
    if (bgmGainNode) {
      bgmGainNode.disconnect()
      bgmGainNode = null
    }
  }

  const pauseBGM = () => {
    if (bgmInterval) {
      clearTimeout(bgmInterval)
      bgmInterval = null
    }
  }

  const resumeBGM = () => {
    if (isBGMPlaying.value && currentBGMType.value && bgmEnabled.value) {
      const melody = bgmMelodies[currentBGMType.value]
      playBGMNote(melody)
    }
  }

  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
    saveSettings()
  }

  const toggleBGM = () => {
    bgmEnabled.value = !bgmEnabled.value
    if (bgmEnabled.value && !isBGMPlaying.value) {
      startBGM(currentBGMType.value || 'game')
    } else if (!bgmEnabled.value) {
      stopBGM()
    }
    saveSettings()
  }

  loadSettings()

  return {
    soundEnabled,
    bgmEnabled,
    audioContext,
    isBGMPlaying,
    initAudio,
    playPlantSound,
    playShootSound,
    playSunCollectSound,
    playZombieHitSound,
    playZombieDieSound,
    playExplosionSound,
    playClickSound,
    playPauseSound,
    playWinSound,
    playLoseSound,
    startBGM,
    stopBGM,
    pauseBGM,
    resumeBGM,
    toggleSound,
    toggleBGM,
    saveSettings
  }
})
