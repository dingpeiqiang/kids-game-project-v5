// RPG塔防射击 - 音效配置与管理器
// 使用 Web Audio API 程序化生成音效

export type SoundType =
  | 'playerShoot'    // 玩家射击
  | 'turretShoot'    // 炮台射击
  | 'laserShoot'     // 激光炮
  | 'missileShoot'   // 导弹发射
  | 'frostShoot'     // 冰冻射击
  | 'lightningShoot' // 闪电
  | 'enemyHit'       // 敌人受击
  | 'enemyDie'       // 敌人死亡
  | 'turretPlace'    // 放置炮台
  | 'turretSell'     // 出售炮台
  | 'playerHurt'     // 玩家受伤
  | 'waveStart'      // 波次开始
  | 'waveComplete'   // 波次完成
  | 'gameOver'       // 游戏结束
  | 'levelUp'        // 升级
  | 'coin'           // 金币/水晶获取

// 音效配置
export interface SoundConfig {
  frequency?: number      // 主频率 (Hz)
  frequencyEnd?: number   // 结束频率
  duration: number        // 持续时间 (秒)
  type: OscillatorType | 'noise'  // 波形类型
  volume: number          // 音量 0-1
  attack?: number         // 渐入时间
  decay?: number          // 渐出时间
  vibrato?: number        // 颤音深度
  noiseDecay?: number     // 噪音衰减
}

export const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  // 玩家射击 - 快速短促
  playerShoot: {
    frequency: 800,
    frequencyEnd: 200,
    duration: 0.08,
    type: 'square',
    volume: 0.15,
    attack: 0.005,
    decay: 0.05
  },

  // 炮台射击 - 中等
  turretShoot: {
    frequency: 600,
    frequencyEnd: 150,
    duration: 0.12,
    type: 'sawtooth',
    volume: 0.2,
    attack: 0.01,
    decay: 0.08
  },

  // 激光 - 持续嗡鸣
  laserShoot: {
    frequency: 1200,
    frequencyEnd: 400,
    duration: 0.15,
    type: 'square',
    volume: 0.12,
    attack: 0.01,
    decay: 0.1,
    vibrato: 50
  },

  // 导弹发射 - 低沉
  missileShoot: {
    frequency: 200,
    frequencyEnd: 80,
    duration: 0.25,
    type: 'sawtooth',
    volume: 0.25,
    attack: 0.02,
    decay: 0.2
  },

  // 冰冻射击 - 清脆
  frostShoot: {
    frequency: 1500,
    frequencyEnd: 800,
    duration: 0.1,
    type: 'sine',
    volume: 0.15,
    attack: 0.01,
    decay: 0.08
  },

  // 闪电 - 噼啪
  lightningShoot: {
    frequency: 2000,
    frequencyEnd: 100,
    duration: 0.15,
    type: 'square',
    volume: 0.2,
    attack: 0.005,
    decay: 0.12,
    vibrato: 100
  },

  // 敌人受击
  enemyHit: {
    frequency: 300,
    frequencyEnd: 150,
    duration: 0.1,
    type: 'square',
    volume: 0.15,
    attack: 0.01,
    decay: 0.08
  },

  // 敌人死亡 - 爆炸感
  enemyDie: {
    frequency: 150,
    frequencyEnd: 50,
    duration: 0.3,
    type: 'sawtooth',
    volume: 0.3,
    attack: 0.01,
    decay: 0.25,
    noiseDecay: 0.2
  },

  // 放置炮台 - 确认音
  turretPlace: {
    frequency: 500,
    frequencyEnd: 800,
    duration: 0.15,
    type: 'sine',
    volume: 0.25,
    attack: 0.02,
    decay: 0.12
  },

  // 出售炮台 - 上升音
  turretSell: {
    frequency: 300,
    frequencyEnd: 600,
    duration: 0.2,
    type: 'sine',
    volume: 0.2,
    attack: 0.02,
    decay: 0.15
  },

  // 玩家受伤 - 痛苦音
  playerHurt: {
    frequency: 200,
    frequencyEnd: 100,
    duration: 0.25,
    type: 'sawtooth',
    volume: 0.3,
    attack: 0.01,
    decay: 0.2
  },

  // 波次开始
  waveStart: {
    frequency: 400,
    frequencyEnd: 800,
    duration: 0.4,
    type: 'sine',
    volume: 0.3,
    attack: 0.05,
    decay: 0.3
  },

  // 波次完成 - 胜利音
  waveComplete: {
    frequency: 523,
    frequencyEnd: 784,
    duration: 0.5,
    type: 'sine',
    volume: 0.35,
    attack: 0.05,
    decay: 0.4
  },

  // 游戏结束
  gameOver: {
    frequency: 400,
    frequencyEnd: 100,
    duration: 1.0,
    type: 'sawtooth',
    volume: 0.4,
    attack: 0.1,
    decay: 0.8
  },

  // 升级
  levelUp: {
    frequency: 523,
    frequencyEnd: 1047,
    duration: 0.4,
    type: 'sine',
    volume: 0.35,
    attack: 0.05,
    decay: 0.3
  },

  // 金币获取
  coin: {
    frequency: 880,
    frequencyEnd: 1320,
    duration: 0.15,
    type: 'sine',
    volume: 0.2,
    attack: 0.01,
    decay: 0.12
  }
}

// 音效管理器类
export class SoundManager {
  private audioContext: AudioContext | null = null
  private masterVolume: number = 0.5
  private enabled: boolean = true
  private initialized: boolean = false

  // 初始化音频上下文（需要用户交互后调用）
  init(): void {
    if (this.initialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.initialized = true

      // 恢复音频上下文（某些浏览器需要）
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
    } catch (e) {
      console.warn('Web Audio API 不支持:', e)
      this.enabled = false
    }
  }

  // 确保音频上下文已启动
  private async ensureContext(): Promise<AudioContext | null> {
    if (!this.enabled || !this.audioContext) return null

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    return this.audioContext
  }

  // 播放音效
  async play(type: SoundType): Promise<void> {
    if (!this.enabled) return

    const ctx = await this.ensureContext()
    if (!ctx) return

    const config = SOUND_CONFIGS[type]
    if (!config) return

    const now = ctx.currentTime

    // 创建主音量控制
    const masterGain = ctx.createGain()
    masterGain.gain.value = config.volume * this.masterVolume
    masterGain.connect(ctx.destination)

    if (config.type === 'noise') {
      // 噪音音效
      this.playNoise(ctx, masterGain, config, now)
    } else {
      // 音调音效
      this.playTone(ctx, masterGain, config, now)
    }
  }

  // 播放音调
  private playTone(
    ctx: AudioContext,
    output: GainNode,
    config: SoundConfig,
    startTime: number
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = config.type
    osc.frequency.setValueAtTime(config.frequency || 440, startTime)

    if (config.frequencyEnd) {
      osc.frequency.exponentialRampToValueAtTime(
        config.frequencyEnd,
        startTime + config.duration
      )
    }

    // 颤音效果
    if (config.vibrato) {
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = config.vibrato
      lfoGain.gain.value = config.frequencyEnd ? (config.frequencyEnd - (config.frequency || 440)) * 0.1 : 20
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start(startTime)
      lfo.stop(startTime + config.duration)
    }

    // 包络
    const attack = config.attack || 0.01
    const decay = config.decay || 0.1

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(1, startTime + attack)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration - decay)

    osc.connect(gain)
    gain.connect(output)

    osc.start(startTime)
    osc.stop(startTime + config.duration)
  }

  // 播放噪音
  private playNoise(
    ctx: AudioContext,
    output: GainNode,
    config: SoundConfig,
    startTime: number
  ): void {
    const bufferSize = ctx.sampleRate * config.duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const gain = ctx.createGain()
    const decay = config.noiseDecay || config.decay || 0.1

    gain.gain.setValueAtTime(1, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + decay)

    noise.connect(gain)
    gain.connect(output)

    noise.start(startTime)
    noise.stop(startTime + config.duration)
  }

  // 设置主音量
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }

  // 启用/禁用音效
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  // 是否已启用
  isEnabled(): boolean {
    return this.enabled
  }

  // 是否已初始化
  isInitialized(): boolean {
    return this.initialized
  }
}

// 单例
export const soundManager = new SoundManager()

// 便捷函数 - 自动初始化
export const playSound = async (type: SoundType): Promise<void> => {
  if (!soundManager.isInitialized()) {
    soundManager.init()
  }
  await soundManager.play(type)
}

// 背景音乐管理器
export class BGMManager {
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private isPlaying: boolean = false
  private volume: number = 0.3
  private oscillators: OscillatorNode[] = []
  private enabled: boolean = true

  init(): void {
    if (this.audioContext) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = this.volume
      this.gainNode.connect(this.audioContext.destination)
    } catch (e) {
      console.warn('Web Audio API 不支持:', e)
      this.enabled = false
    }
  }

  async startSimpleBgm(): Promise<void> {
    if (!this.enabled || !this.audioContext || !this.gainNode) return

    // 停止现有音乐
    this.stop()

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    this.isPlaying = true

    // 简单的循环音型 - 使用低频脉冲
    const playBeat = () => {
      if (!this.isPlaying || !this.audioContext || !this.gainNode) return

      const now = this.audioContext.currentTime

      // 低音脉冲
      const bass = this.audioContext.createOscillator()
      const bassGain = this.audioContext.createGain()
      bass.type = 'sine'
      bass.frequency.value = 80
      bassGain.gain.setValueAtTime(0.15, now)
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      bass.connect(bassGain)
      bassGain.connect(this.gainNode)
      bass.start(now)
      bass.stop(now + 0.3)
      this.oscillators.push(bass)

      // 柔和的高频点缀
      const melody = this.audioContext.createOscillator()
      const melodyGain = this.audioContext.createGain()
      melody.type = 'sine'
      melody.frequency.value = 440 + Math.random() * 200
      melodyGain.gain.setValueAtTime(0.03, now)
      melodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      melody.connect(melodyGain)
      melodyGain.connect(this.gainNode)
      melody.start(now)
      melody.stop(now + 0.5)
      this.oscillators.push(melody)

      // 每500ms循环
      setTimeout(playBeat, 500)
    }

    playBeat()
  }

  stop(): void {
    this.isPlaying = false
    for (const osc of this.oscillators) {
      try {
        osc.stop()
      } catch (e) {
        // 忽略已停止的错误
      }
    }
    this.oscillators = []
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  isPlaying(): boolean {
    return this.isPlaying
  }
}

export const bgmManager = new BGMManager()