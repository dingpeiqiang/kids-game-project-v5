/**
 * 🔧【可复用组件】音频管理器
 * 
 * 封装 BGM 和音效播放逻辑，支持：
 * - 分类 BGM（main/gameplay/gameover）
 * - 任意音效播放
 * - 全局静音/音量控制
 * - 音频预加载
 */

/** BGM 分类 */
export type BgmType = 'main' | 'gameplay' | 'gameover'

/** 音频配置 */
export interface AudioConfig {
  src: string
  volume?: number
  loop?: boolean
}

/**
 * ⭐ 音频管理器
 * 
 * @example
 * const audio = new AudioManager()
 * audio.playBgm('gameplay', { src: '/audio/bgm.mp3', volume: 0.6, loop: true })
 * audio.playSound({ src: '/audio/eat.mp3', volume: 0.5 })
 */
export class AudioManager {
  private bgmAudios: Map<BgmType, HTMLAudioElement> = new Map()
  private soundEnabled: boolean = true

  // ============================================================================
  // 🎵 BGM 控制
  // ============================================================================

  /**
   * ⭐ 播放背景音乐
   */
  playBgm(type: BgmType, config: AudioConfig): void {
    if (!this.soundEnabled) return
    this.stopAllBgm()
    try {
      const audio = new Audio(config.src)
      audio.loop   = config.loop   ?? true
      audio.volume = Math.max(0, Math.min(1, config.volume ?? 0.6))
      audio.play().catch(err => {
        console.warn(`[AudioManager] ⚠️ BGM(${type}) 播放失败:`, err)
      })
      this.bgmAudios.set(type, audio)
      console.log(`[AudioManager] 🎵 播放 BGM(${type}):`, config.src)
    } catch (err) {
      console.error('[AudioManager] ❌ 创建 BGM 失败:', err)
    }
  }

  /**
   * ⭐ 停止所有 BGM
   */
  stopAllBgm(): void {
    this.bgmAudios.forEach((audio, type) => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch { /* ignore */ }
    })
    this.bgmAudios.clear()
    console.log('[AudioManager] ⏹️ 已停止所有 BGM')
  }

  /**
   * ⭐ 暂停所有音频
   */
  pauseAll(): void {
    this.bgmAudios.forEach(audio => {
      if (!audio.paused) audio.pause()
    })
    console.log('[AudioManager] ⏸️ 已暂停所有音频')
  }

  /**
   * ⭐ 恢复播放所有音频
   */
  resumeAll(): void {
    this.bgmAudios.forEach(audio => {
      if (audio.paused) {
        audio.play().catch(err => console.warn('[AudioManager] 恢复 BGM 失败:', err))
      }
    })
    console.log('[AudioManager] ▶️ 已恢复所有音频')
  }

  /**
   * 设置 BGM 音量
   */
  setBgmVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume))
    this.bgmAudios.forEach(audio => { audio.volume = v })
    console.log(`[AudioManager] 🔊 BGM 音量设置为：${v.toFixed(2)}`)
  }

  // ============================================================================
  // 🔊 音效控制
  // ============================================================================

  /**
   * ⭐ 播放音效
   */
  playSound(config: AudioConfig): void {
    if (!this.soundEnabled) return
    try {
      const audio    = new Audio(config.src)
      audio.loop     = config.loop   ?? false
      audio.volume   = Math.max(0, Math.min(1, config.volume ?? 0.5))
      audio.play().catch(err => {
        console.warn('[AudioManager] ⚠️ 音效播放失败:', err)
      })
    } catch (err) {
      console.error('[AudioManager] ❌ 创建音效失败:', err)
    }
  }

  // ============================================================================
  // 🔧 状态控制
  // ============================================================================

  /**
   * ⭐ 切换声音开关
   */
  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled
    if (!this.soundEnabled) this.stopAllBgm()
    console.log(`[AudioManager] ${this.soundEnabled ? '🔊 声音已开启' : '🔇 声音已关闭'}`)
    return this.soundEnabled
  }

  /**
   * 设置声音状态
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    if (!enabled) this.stopAllBgm()
  }

  /** 获取声音状态 */
  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  // ============================================================================
  // 📥 预加载
  // ============================================================================

  /**
   * ⭐ 预加载音频资源列表（不阻塞，失败则跳过）
   */
  preloadAudio(configs: AudioConfig[]): Promise<void> {
    console.log(`[AudioManager] 📥 预加载 ${configs.length} 个音频资源...`)
    return Promise.all(
      configs.map(config => new Promise<void>(resolve => {
        const audio = new Audio(config.src)
        audio.addEventListener('canplaythrough', () => {
          console.log(`[AudioManager] ✅ 音频就绪：${config.src}`)
          resolve()
        }, { once: true })
        audio.addEventListener('error', () => {
          console.warn(`[AudioManager] ⚠️ 音频加载失败：${config.src}`)
          resolve()
        }, { once: true })
        audio.load()
      }))
    ).then(() => {
      console.log('[AudioManager] ✅ 音频预加载完成')
    })
  }

  // ============================================================================
  // 🗑️ 清理
  // ============================================================================

  /**
   * 销毁音频管理器，释放所有资源
   */
  destroy(): void {
    this.stopAllBgm()
    console.log('[AudioManager] 🗑️ 音频管理器已销毁')
  }
}
