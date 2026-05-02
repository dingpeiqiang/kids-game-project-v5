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
  click = () => this.playTone(800, 0.08, 'sine', 0.1)

  // ============ 游戏内音效 ============
  shoot = () => this.playTone(600, 0.06, 'square', 0.06)
  hit = () => this.playTone(400, 0.05, 'sawtooth', 0.06)
  kill = () => {
    this.playTone(200, 0.15, 'sawtooth', 0.1)
    this.playNoise(0.12, 0.15)
  }
  pop = () => this.playTone(1200, 0.12, 'sine', 0.12)
  crit = () => {
    this.playTone(880, 0.15, 'square', 0.08)
    setTimeout(() => this.playTone(1100, 0.2, 'sine', 0.1), 80)
  }

  // ============ 道具生效音效 ============
  buff = () => {
    this.playTone(660, 0.1, 'sine', 0.1)
    setTimeout(() => this.playTone(880, 0.15, 'sine', 0.1), 60)
  }
  explosion = () => {
    this.playNoise(0.3, 0.2)
    this.slideDown(300, 60, 0.3, 'sawtooth', 0.15)
  }
  freeze = () => {
    this.playTone(1200, 0.1, 'sine', 0.08)
    this.slideDown(900, 400, 0.3, 'triangle', 0.1)
  }
  shield = () => {
    this.rise(300, 900, 0.2, 'sine', 0.1)
    setTimeout(() => this.playTone(1200, 0.15, 'sine', 0.08), 150)
  }
  lightning = () => {
    this.playTone(1500, 0.08, 'sawtooth', 0.1)
    setTimeout(() => this.playTone(1800, 0.12, 'square', 0.08), 50)
  }
  slowMo = () => {
    this.slideDown(500, 150, 0.4, 'triangle', 0.08)
  }
  bigShot = () => {
    this.playTone(200, 0.15, 'sine', 0.1)
    this.rise(300, 600, 0.1, 'square', 0.08)
  }
  rapidFire = () => {
    this.playTone(1000, 0.04, 'square', 0.05)
  }

  // ============ 资源/状态音效 ============
  combo = () => {
    this.playTone(440, 0.1, 'triangle', 0.08)
    setTimeout(() => this.playTone(660, 0.15, 'triangle', 0.1), 50)
  }
  coin = () => {
    this.rise(800, 1600, 0.08, 'sine', 0.08)
    setTimeout(() => this.playTone(2000, 0.08, 'sine', 0.06), 60)
  }
  collect = () => this.playTone(600, 0.08, 'sine', 0.08)

  // ============ 结果音效 ============
  win = () => {
    ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 0.2, 'sine', 0.1), i * 100))
  }
  levelUp = () => {
    this.rise(400, 800, 0.15, 'sine', 0.1)
    setTimeout(() => this.rise(800, 1200, 0.15, 'sine', 0.1), 100)
    setTimeout(() => this.playTone(1500, 0.2, 'sine', 0.1), 200)
  }
  lose = () => this.playTone(220, 0.4, 'sawtooth', 0.08)
  fail = () => {
    this.playTone(300, 0.15, 'sawtooth', 0.1)
    setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.08), 100)
  }
}

export const audioService = new AudioService()
