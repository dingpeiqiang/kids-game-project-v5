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

  // 首次调用时需在用户交互后执行
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

  click = () => this.playTone(800, 0.08, 'sine', 0.1)
  pop = () => this.playTone(1200, 0.12, 'sine', 0.12)
  crit = () => {
    this.playTone(880, 0.15, 'square', 0.08)
    setTimeout(() => this.playTone(1100, 0.2, 'sine', 0.1), 80)
  }
  buff = () => {
    this.playTone(660, 0.1, 'sine', 0.1)
    setTimeout(() => this.playTone(880, 0.15, 'sine', 0.1), 60)
  }
  combo = () => {
    this.playTone(440, 0.1, 'triangle', 0.08)
    setTimeout(() => this.playTone(660, 0.15, 'triangle', 0.1), 50)
  }
  collect = () => this.playTone(600, 0.08, 'sine', 0.08)
  win = () => {
    ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 0.2, 'sine', 0.1), i * 100))
  }
  lose = () => this.playTone(220, 0.4, 'sawtooth', 0.08)
  fail = () => {
    this.playTone(300, 0.15, 'sawtooth', 0.1)
    setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.08), 100)
  }
}

export const audioService = new AudioService()
