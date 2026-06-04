// ─────────────────────────────────────────────
//  AudioManager.ts
//  经典坦克大战音效系统
//  使用 Web Audio API 生成 8-bit 音效
// ─────────────────────────────────────────────

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private constructor() {}

  public init(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  public resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = 0.5
  ): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration + 0.1);
  }

  private playNoise(duration: number, volume: number = 0.4): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  public playShoot(): void {
    this.playTone(800, 0.05, 'square', 0.3);
  }

  public playExplosion(): void {
    this.playNoise(0.2, 0.5);
    setTimeout(() => this.playNoise(0.15, 0.3), 50);
  }

  public playPlayerHit(): void {
    this.playExplosion();
  }

  public playEnemyHit(): void {
    this.playExplosion();
  }

  public playBrickHit(): void {
    this.playTone(300, 0.08, 'square', 0.2);
  }

  public playPowerUp(): void {
    this.playTone(523, 0.1, 'square', 0.3);
    setTimeout(() => this.playTone(659, 0.1, 'square', 0.3), 100);
    setTimeout(() => this.playTone(784, 0.15, 'square', 0.3), 200);
  }

  public playOneUp(): void {
    this.playTone(523, 0.1, 'square', 0.3);
    setTimeout(() => this.playTone(659, 0.1, 'square', 0.3), 150);
    setTimeout(() => this.playTone(784, 0.1, 'square', 0.3), 300);
    setTimeout(() => this.playTone(1047, 0.2, 'square', 0.3), 450);
  }

  public playGameOver(): void {
    this.playTone(330, 0.3, 'square', 0.4);
    setTimeout(() => this.playTone(262, 0.3, 'square', 0.4), 350);
    setTimeout(() => this.playTone(220, 0.3, 'square', 0.4), 700);
    setTimeout(() => this.playTone(165, 0.6, 'square', 0.4), 1050);
  }

  public playLevelComplete(): void {
    const notes = [523, 587, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'square', 0.3), i * 120);
    });
  }

  public playSpawn(): void {
    this.playTone(200, 0.1, 'square', 0.25);
    setTimeout(() => this.playTone(400, 0.1, 'square', 0.25), 100);
  }

  public playBomb(): void {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.playExplosion(), i * 80);
    }
  }

  public playFreeze(): void {
    this.playTone(1000, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(800, 0.1, 'sine', 0.3), 100);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.3), 200);
  }

  public playPause(): void {
    this.playTone(440, 0.1, 'square', 0.2);
  }

  public playResume(): void {
    this.playTone(660, 0.1, 'square', 0.2);
  }
}

export const audioManager = AudioManager.getInstance();
