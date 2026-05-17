// 音效服务 - Web Audio API 合成音效
export class AudioService {
  private ctx: AudioContext | null = null
  private _ready = false

  private init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    this._ready = true
  }

  private ensure() {
    if (!this._ready) this.init()
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }

  initOnGesture() {
    this.ensure()
  }

  private playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
    if (!this.ctx || !this._ready) return
    try {
      this.ensure()
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.frequency.value = freq
      osc.type = type
      gain.gain.setValueAtTime(vol, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur)
      osc.start()
      osc.stop(this.ctx.currentTime + dur)
    } catch (e) {}
  }

  // 噪音爆发（用于爆炸/撞击）
  private playNoise(dur: number, vol = 0.12) {
    if (!this.ctx || !this._ready) return
    try {
      this.ensure()
      const bufSize = this.ctx.sampleRate * dur
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const src = this.ctx.createBufferSource()
      src.buffer = buf
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 800
      filter.Q.value = 0.5
      src.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)
      gain.gain.setValueAtTime(vol, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur)
      src.start()
    } catch (e) {}
  }

  // 下滑音音效
  private slideDown(freqStart: number, freqEnd: number, dur: number, type: OscillatorType = 'sine', vol = 0.1) {
    if (!this.ctx || !this._ready) return
    try {
      this.ensure()
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur)
      osc.type = type
      gain.gain.setValueAtTime(vol, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur)
      osc.start()
      osc.stop(this.ctx.currentTime + dur)
    } catch (e) {}
  }

  // 上升音音效
  private rise(freqStart: number, freqEnd: number, dur: number, type: OscillatorType = 'sine', vol = 0.1) {
    if (!this.ctx || !this._ready) return
    try {
      this.ensure()
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur)
      osc.type = type
      gain.gain.setValueAtTime(vol, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur)
      osc.start()
      osc.stop(this.ctx.currentTime + dur)
    } catch (e) {}
  }

  // ============ UI 音效 ============
  click = () => {
    this.playTone(1000, 0.05, 'sine', 0.08)
    setTimeout(() => this.playTone(1200, 0.04, 'sine', 0.06), 30)
  }

  // ============ 游戏内音效 ============
  
  slice = () => {
    // 切割音：清脆的撕裂声
    this.playTone(1200, 0.06, 'sawtooth', 0.1)
    setTimeout(() => this.playTone(1500, 0.05, 'sawtooth', 0.08), 30)
    this.playNoise(0.04, 0.08)
  }
  
  sliceCombo = (combo: number) => {
    // 连击切割音：音调随连击数升高，更加华丽
    const baseFreq = 1000 + (combo * 150)
    this.playTone(baseFreq, 0.08, 'sawtooth', 0.12)
    setTimeout(() => this.playTone(baseFreq + 400, 0.06, 'triangle', 0.1), 40)
    setTimeout(() => this.playTone(baseFreq + 600, 0.05, 'sine', 0.08), 80)
    this.playNoise(0.06, 0.12)
  }
  
  juiceSplash = () => {
    // 果汁喷射音：湿润的溅射声
    this.playNoise(0.15, 0.15)
    this.playTone(600, 0.1, 'sine', 0.08)
    setTimeout(() => this.playTone(800, 0.08, 'sine', 0.06), 50)
  }

  // ============ 道具生效音效 ============
  buff = () => {
    // 道具获取音：明亮的三音符
    this.playTone(523, 0.08, 'sine', 0.1)
    setTimeout(() => this.playTone(659, 0.08, 'sine', 0.1), 60)
    setTimeout(() => this.playTone(784, 0.12, 'sine', 0.12), 120)
  }
  
  explosion = () => {
    // 爆炸音：震撼的低频+噪音
    this.playNoise(0.35, 0.25)
    this.slideDown(250, 50, 0.35, 'sawtooth', 0.18)
    setTimeout(() => this.playTone(150, 0.2, 'square', 0.12), 50)
  }
  
  collect = () => {
    this.playTone(800, 0.06, 'sine', 0.1)
    setTimeout(() => this.playTone(1000, 0.08, 'sine', 0.08), 40)
  }

  // ============ 结果音效 ============
  win = () => {
    // 胜利音：欢快的胜利旋律
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 0.25, 'sine', 0.12)
        if (i === notes.length - 1) {
          setTimeout(() => this.playTone(f * 1.5, 0.3, 'triangle', 0.1), 200)
        }
      }, i * 120)
    })
  }
  
  levelUp = () => {
    // 升级音：华丽的上升音阶
    this.rise(400, 800, 0.12, 'sine', 0.12)
    setTimeout(() => this.rise(800, 1200, 0.12, 'sine', 0.12), 100)
    setTimeout(() => this.rise(1200, 1600, 0.15, 'triangle', 0.12), 200)
    setTimeout(() => this.playTone(2000, 0.25, 'sine', 0.15), 300)
  }
  
  slowMo = () => {
    // 减速音：低沉的拖长音
    this.slideDown(500, 120, 0.4, 'triangle', 0.1)
    this.playNoise(0.2, 0.08)
  }
}

export const audioService = new AudioService()
