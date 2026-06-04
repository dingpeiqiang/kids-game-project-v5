/**
 * 简单的音效管理器
 * 使用 Web Audio API 生成游戏音效
 */
export class SoundManager {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;

    constructor() {
        this.init();
    }

    private init() {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    /**
     * 播放点击音效
     */
    playClick() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(800, 'sine', 0.1, 0.1);
    }

    /**
     * 播放放置墙壁音效
     */
    playPlaceWall() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(400, 'square', 0.15, 0.15);
    }

    /**
     * 播放猫移动音效
     */
    playCatMove() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(600, 'triangle', 0.1, 0.08);
        setTimeout(() => {
            this.playTone(700, 'triangle', 0.1, 0.08);
        }, 80);
    }

    /**
     * 播放胜利音效
     */
    playWin() {
        if (!this.enabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        this.playTone(523.25, 'sine', 0.2, 0.15, now);
        this.playTone(659.25, 'sine', 0.2, 0.15, now + 0.15);
        this.playTone(783.99, 'sine', 0.2, 0.15, now + 0.3);
        this.playTone(1046.50, 'sine', 0.3, 0.2, now + 0.45);
    }

    /**
     * 播放失败音效
     */
    playLose() {
        if (!this.enabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        this.playTone(400, 'sawtooth', 0.2, 0.2, now);
        this.playTone(350, 'sawtooth', 0.2, 0.2, now + 0.2);
        this.playTone(300, 'sawtooth', 0.3, 0.25, now + 0.4);
    }

    /**
     * 播放重置音效
     */
    playReset() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(500, 'sine', 0.1, 0.1);
        setTimeout(() => {
            this.playTone(600, 'sine', 0.1, 0.1);
        }, 100);
    }

    /**
     * 播放撤销音效
     */
    playUndo() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(700, 'sine', 0.08, 0.08);
        setTimeout(() => {
            this.playTone(600, 'sine', 0.08, 0.08);
        }, 80);
    }

    /**
     * 播放音调
     */
    private playTone(frequency: number, type: OscillatorType, volume: number, duration: number, startTime?: number) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, startTime || this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, (startTime || this.audioContext.currentTime) + duration);

        oscillator.start(startTime || this.audioContext.currentTime);
        oscillator.stop((startTime || this.audioContext.currentTime) + duration);
    }

    /**
     * 启用/禁用音效
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    /**
     * 恢复音频上下文（需要在用户交互后调用）
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// 创建全局音效管理器实例
export const soundManager = new SoundManager();
