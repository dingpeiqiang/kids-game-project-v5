// Web Audio API 音效生成器

export class AudioGenerator {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgmOscillators: OscillatorNode[] = []
  private bgmGain: GainNode | null = null
  private bgmInterval: number | null = null

  /**
   * 初始化音频上下文
   */
  init(): void {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.context.createGain()
      this.masterGain.connect(this.context.destination)
      this.masterGain.gain.value = 0.3
    }
  }

  /**
   * 设置主音量
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = volume
    }
  }

  /**
   * 播放按钮点击音效
   */
  playClick(): void {
    if (!this.context || !this.masterGain) return
    
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    
    oscillator.connect(gain)
    gain.connect(this.masterGain)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(800, this.context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1)
    
    gain.gain.setValueAtTime(0.5, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1)
    
    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + 0.1)
  }

  /**
   * 播放吃食物音效
   */
  playEat(foodType: 'apple' | 'strawberry' | 'coin'): void {
    if (!this.context || !this.masterGain) return
    
    const baseFreq = foodType === 'coin' ? 1200 : foodType === 'strawberry' ? 880 : 660
    const duration = foodType === 'coin' ? 0.3 : 0.15
    
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    
    oscillator.connect(gain)
    gain.connect(this.masterGain)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(baseFreq, this.context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.context.currentTime + duration)
    
    gain.gain.setValueAtTime(0.4, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration)
    
    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + duration)
  }

  /**
   * 播放碰撞死亡音效
   */
  playCrash(): void {
    if (!this.context || !this.masterGain) return
    
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    
    oscillator.connect(gain)
    gain.connect(this.masterGain)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(200, this.context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5)
    
    gain.gain.setValueAtTime(0.5, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5)
    
    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + 0.5)
  }

  /**
   * 播放胜利音效
   */
  playVictory(): void {
    if (!this.context || !this.masterGain) return
    
    const notes = [523.25, 659.25, 783.99, 1046.50] // C E G C
    notes.forEach((freq, i) => {
      const oscillator = this.context!.createOscillator()
      const gain = this.context!.createGain()
      
      oscillator.connect(gain)
      gain.connect(this.masterGain!)
      
      oscillator.type = 'sine'
      oscillator.frequency.value = freq
      
      const startTime = this.context!.currentTime + i * 0.15
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.3)
    })
  }

  /**
   * 播放移动音效（轻微）
   */
  playMove(): void {
    if (!this.context || !this.masterGain) return
    
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    
    oscillator.connect(gain)
    gain.connect(this.masterGain)
    
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(200, this.context.currentTime)
    
    gain.gain.setValueAtTime(0.05, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05)
    
    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + 0.05)
  }

  /**
   * 开始播放背景音乐
   */
  startBGM(): void {
    if (!this.context || !this.masterGain) return
    this.stopBGM()
    
    this.bgmGain = this.context.createGain()
    this.bgmGain.connect(this.masterGain)
    this.bgmGain.gain.value = 0.15
    
    // 简单的欢快旋律循环
    const melody = [
      { freq: 523.25, duration: 0.25 }, // C
      { freq: 587.33, duration: 0.25 }, // D
      { freq: 659.25, duration: 0.25 }, // E
      { freq: 698.46, duration: 0.25 }, // F
      { freq: 783.99, duration: 0.5 },  // G
      { freq: 698.46, duration: 0.25 }, // F
      { freq: 659.25, duration: 0.25 }, // E
      { freq: 587.33, duration: 0.25 }, // D
      { freq: 523.25, duration: 0.5 },  // C
      { freq: 440.00, duration: 0.25 }, // A
      { freq: 493.88, duration: 0.25 }, // B
      { freq: 523.25, duration: 0.25 }, // C
      { freq: 587.33, duration: 0.25 }, // D
      { freq: 659.25, duration: 0.5 },  // E
      { freq: 587.33, duration: 0.25 }, // D
      { freq: 523.25, duration: 0.5 },  // C
    ]
    
    let time = this.context.currentTime
    const loopDuration = melody.reduce((sum, n) => sum + n.duration, 0)
    
    const playLoop = () => {
      if (!this.bgmGain) return
      
      melody.forEach(note => {
        const oscillator = this.context!.createOscillator()
        const gain = this.context!.createGain()
        
        oscillator.connect(gain)
        gain.connect(this.bgmGain!)
        
        oscillator.type = 'sine'
        oscillator.frequency.value = note.freq
        
        gain.gain.setValueAtTime(0.3, time)
        gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration)
        
        oscillator.start(time)
        oscillator.stop(time + note.duration)
        
        this.bgmOscillators.push(oscillator)
        time += note.duration
      })
      
      // 循环播放
      this.bgmInterval = window.setTimeout(playLoop, loopDuration * 1000)
    }
    
    playLoop()
  }

  /**
   * 停止背景音乐
   */
  stopBGM(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval)
      this.bgmInterval = null
    }
    
    this.bgmOscillators.forEach(osc => {
      try {
        osc.stop()
      } catch (e) {
        // 忽略已停止的振荡器
      }
    })
    this.bgmOscillators = []
    
    if (this.bgmGain) {
      this.bgmGain.disconnect()
      this.bgmGain = null
    }
  }

  /**
   * 清理音频资源
   */
  cleanup(): void {
    this.stopBGM()
    if (this.context) {
      this.context.close()
      this.context = null
      this.masterGain = null
    }
  }
}

// 导出单例
export const audioGenerator = new AudioGenerator()
