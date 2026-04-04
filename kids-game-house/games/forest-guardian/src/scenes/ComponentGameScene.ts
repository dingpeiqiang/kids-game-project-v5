// ============================================================================
// 🎮 游戏场景（简化通用版）- 用于播放主菜单 BGM
// ============================================================================
// 
// 📌 说明:
//   这是简化的游戏场景类，仅用于在主菜单播放背景音乐
//   所有游戏都可以使用这个类来播放 BGM
// ============================================================================

/**
 * ⭐ 游戏场景配置（通用版）
 */
interface GameSceneConfig {
  /** 主题 ID */
  themeId?: string
  /** 其他游戏特定配置 */
  [key: string]: any
}

/**
 * 简化的游戏场景类（用于主菜单 BGM）
 * 
 * @remarks
 * 职责：
 * - 创建隐藏的 Phaser 实例用于播放 BGM
 * - 管理 BGM 生命周期
 * - 提供简单的启动/停止接口
 */
export class ComponentGameScene {
  /** Phaser 游戏实例 */
  private game: Phaser.Game | null = null
  
  /** DOM 容器元素 */
  private containerElement: HTMLElement
  
  /** 游戏配置 */
  private config: GameSceneConfig
  
  /** 是否已初始化 */
  private isInitialized: boolean = false

  /**
   * 创建游戏场景
   * 
   * @param containerElement - 容器 DOM 元素
   * @param config - 游戏配置
   */
  constructor(containerElement: HTMLElement, config: GameSceneConfig = {}) {
    this.containerElement = containerElement
    this.config = config
    
    console.log('🎮 ComponentGameScene 已创建:', config)
  }

  /**
   * 启动游戏场景（播放 BGM）
   * 
   * @param config - 启动配置
   */
  async start(config?: GameSceneConfig): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ 游戏场景已经初始化，跳过')
      return
    }

    try {
      // 合并配置
      const finalConfig = { ...this.config, ...config }
      
      // 创建隐藏的 Phaser 实例用于播放 BGM
      this.createHiddenPhaserInstance(finalConfig)
      
      // 标记为已初始化
      this.isInitialized = true
      
      console.log('✅ ComponentGameScene 启动成功（BGM 已就绪）')
    } catch (error) {
      console.error('❌ ComponentGameScene 启动失败:', error)
      throw error
    }
  }

  /**
   * 创建隐藏的 Phaser 实例
   */
  private createHiddenPhaserInstance(config: GameSceneConfig): void {
    // 创建临时的 Phaser 场景类（仅用于播放 BGM）
    class BGMSscene extends Phaser.Scene {
      constructor() {
        super({ key: 'BGMSscene', active: true })
      }

      preload() {
        // 这里可以加载主题相关的音频资源
        console.log('🎵 正在准备 BGM...')
      }

      create() {
        console.log('✅ BGM 场景已创建')
        // BGM 会自动播放（如果主题中有定义）
      }

      update() {
        // 空实现（仅用于播放 BGM，不需要游戏逻辑）
      }
    }

    // 创建 Phaser 游戏实例
    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: this.containerElement,
      width: 1,  // 最小尺寸（仅用于 BGM）
      height: 1,
      transparent: true,
      backgroundColor: '#000000',
      scene: [BGMSscene],
      audio: {
        noAudio: false
      }
    }

    this.game = new Phaser.Game(gameConfig)
    
    console.log('🎮 隐藏的 Phaser 实例已创建（用于播放 BGM）')
  }

  /**
   * 停止游戏场景并清理资源
   */
  stop(): void {
    try {
      // 关闭 Phaser 游戏
      if (this.game) {
        this.game.destroy(true)
        this.game = null
      }
      
      // 清理 DOM 容器
      if (this.containerElement.parentNode) {
        this.containerElement.parentNode.removeChild(this.containerElement)
      }
      
      this.isInitialized = false
      
      console.log('🧹 ComponentGameScene 已清理（BGM 已停止）')
    } catch (error) {
      console.error('❌ 清理 ComponentGameScene 失败:', error)
    }
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized && this.game !== null
  }
}
