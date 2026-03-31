// ============================================================================
// 🔧【可复用框架层】音频管理器 - 所有游戏通用
// ============================================================================
// 📌 说明：负责背景音乐和音效的播放、暂停、音量控制
// ============================================================================

/**
 * ⭐ 音频配置接口
 * 📌 说明：所有游戏通用
 */
export interface AudioConfig {
  src: string       // 音频文件路径
  volume?: number   // 音量 (0.0-1.0)
  loop?: boolean    // 是否循环
}

/**
 * ⭐ BGM 类型枚举
 */
export type BgmType = 'main' | 'gameplay' | 'gameover'

/**
 * ⭐ 音频管理器
 * 
 * 📌 说明：所有游戏通用，直接复制
 * 
 * 职责:
 *   1. 背景音乐播放控制
 *   2. 音效播放
 *   3. 音量管理
 *   4. 音频资源预加载
 */
export class AudioManager {
  private bgmMainAudio: HTMLAudioElement | null = null
  private bgmGameplayAudio: HTMLAudioElement | null = null
  private bgmGameoverAudio: HTMLAudioElement | null = null
  private soundEnabled: boolean = true
  
  /**
   * ⭐ 播放背景音乐
   * 
   * @param type BGM 类型
   * @param config 音频配置
   */
  playBgm(type: BgmType, config: AudioConfig): void {
    if (!this.soundEnabled) return
    
    // 先停止所有 BGM
    this.stopAllBgm()
    
    try {
      const audio = new Audio(config.src)
      audio.loop = config.loop ?? true
      audio.volume = Math.max(0, Math.min(1, config.volume ?? 0.6))
      
      audio.play().catch(err => {
        console.warn('[AudioManager] ⚠️ BGM 播放失败:', err, 'src:', config.src)
      })
      
      // 保存引用
      switch (type) {
        case 'main':
          this.bgmMainAudio = audio
          console.log('[AudioManager] 🎵 播放主菜单 BGM:', config.src)
          break
        case 'gameplay':
          this.bgmGameplayAudio = audio
          console.log('[AudioManager] 🎵 播放游戏中 BGM:', config.src)
          break
        case 'gameover':
          this.bgmGameoverAudio = audio
          console.log('[AudioManager] 🎵 播放结束 BGM:', config.src)
          break
      }
    } catch (err) {
      console.error('[AudioManager] ❌ 创建 BGM 对象失败:', err)
    }
  }

  /**
   * ⭐ 播放音效
   * 
   * @param config 音频配置
   */
  playSound(config: AudioConfig): void {
    if (!this.soundEnabled) return
    
    try {
      const audio = new Audio(config.src)
      audio.loop = config.loop ?? false
      audio.volume = Math.max(0, Math.min(1, config.volume ?? 0.5))
      
      audio.play().catch(err => {
        console.warn('[AudioManager] ⚠️ 音效播放失败:', err, 'src:', config.src)
      })
      
      console.log('[AudioManager] 🔊 播放音效:', config.src)
    } catch (err) {
      console.error('[AudioManager] ❌ 创建音效对象失败:', err)
    }
  }

  /**
   * ⭐ 停止所有背景音乐
   */
  stopAllBgm(): void {
    try {
      if (this.bgmMainAudio) {
        this.bgmMainAudio.pause()
        this.bgmMainAudio.currentTime = 0
        this.bgmMainAudio = null
      }
      if (this.bgmGameplayAudio) {
        this.bgmGameplayAudio.pause()
        this.bgmGameplayAudio.currentTime = 0
        this.bgmGameplayAudio = null
      }
      if (this.bgmGameoverAudio) {
        this.bgmGameoverAudio.pause()
        this.bgmGameoverAudio.currentTime = 0
        this.bgmGameoverAudio = null
      }
      console.log('[AudioManager] ⏹️ 已停止所有 BGM')
    } catch (err) {
      console.warn('[AudioManager] ⚠️ 停止 BGM 时出错:', err)
    }
  }

  /**
   * ⭐ 暂停所有音频
   */
  pauseAll(): void {
    if (this.bgmMainAudio && !this.bgmMainAudio.paused) {
      this.bgmMainAudio.pause()
    }
    if (this.bgmGameplayAudio && !this.bgmGameplayAudio.paused) {
      this.bgmGameplayAudio.pause()
    }
    if (this.bgmGameoverAudio && !this.bgmGameoverAudio.paused) {
      this.bgmGameoverAudio.pause()
    }
    console.log('[AudioManager] ⏸️ 已暂停所有音频')
  }

  /**
   * ⭐ 恢复播放
   */
  resumeAll(): void {
    if (this.bgmMainAudio && this.bgmMainAudio.paused) {
      this.bgmMainAudio.play().catch(err => console.warn('恢复 BGM 失败:', err))
    }
    if (this.bgmGameplayAudio && this.bgmGameplayAudio.paused) {
      this.bgmGameplayAudio.play().catch(err => console.warn('恢复 BGM 失败:', err))
    }
    if (this.bgmGameoverAudio && this.bgmGameoverAudio.paused) {
      this.bgmGameoverAudio.play().catch(err => console.warn('恢复 BGM 失败:', err))
    }
    console.log('[AudioManager] ▶️ 已恢复所有音频')
  }

  /**
   * ⭐ 切换声音开关
   * 
   * @returns 新的声音状态
   */
  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled
    
    if (!this.soundEnabled) {
      this.stopAllBgm()
      console.log('[AudioManager] 🔇 声音已关闭')
    } else {
      console.log('[AudioManager] 🔊 声音已开启')
    }
    
    return this.soundEnabled
  }

  /**
   * ⭐ 设置声音状态
   * 
   * @param enabled 是否启用声音
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    if (!enabled) {
      this.stopAllBgm()
    }
  }

  /**
   * ⭐ 获取声音状态
   * 
   * @returns 当前声音是否启用
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  /**
   * ⭐ 设置 BGM 音量
   * 
   * @param volume 音量值 (0.0-1.0)
   */
  setBgmVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume))
    if (this.bgmMainAudio) {
      this.bgmMainAudio.volume = v
    }
    if (this.bgmGameplayAudio) {
      this.bgmGameplayAudio.volume = v
    }
    if (this.bgmGameoverAudio) {
      this.bgmGameoverAudio.volume = v
    }
    console.log(`[AudioManager] 🔊 BGM 音量设置为：${v.toFixed(2)}`)
  }

  /**
   * ⭐ 预加载音频资源
   * 
   * @param configs 音频配置数组
   */
  preloadAudio(configs: AudioConfig[]): Promise<void> {
    console.log(`[AudioManager] 📥 预加载 ${configs.length} 个音频资源...`)
    
    return Promise.all(
      configs.map(config => {
        return new Promise<void>((resolve, reject) => {
          const audio = new Audio(config.src)
          
          const onCanPlayThrough = () => {
            console.log(`[AudioManager] ✅ 音频已就绪：${config.src}`)
            cleanup()
            resolve()
          }
          
          const onError = () => {
            console.warn(`[AudioManager] ⚠️ 音频加载失败：${config.src}`)
            cleanup()
            resolve() // 加载失败也继续，不阻塞
          }
          
          const cleanup = () => {
            audio.removeEventListener('canplaythrough', onCanPlayThrough)
            audio.removeEventListener('error', onError)
          }
          
          audio.addEventListener('canplaythrough', onCanPlayThrough)
          audio.addEventListener('error', onError)
          
          // 开始加载
          audio.load()
        })
      })
    ).then(() => {
      console.log('[AudioManager] ✅ 音频预加载完成')
    })
  }

  /**
   * ⭐ 清理资源
   */
  destroy(): void {
    this.stopAllBgm()
    this.bgmMainAudio = null
    this.bgmGameplayAudio = null
    this.bgmGameoverAudio = null
    console.log('[AudioManager] 🗑️ 音频管理器已销毁')
  }
}
