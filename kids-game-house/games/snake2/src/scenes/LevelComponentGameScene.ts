// ============================================================================
// 🐍 贪吃蛇游戏场景 - 集成 GCRS 关卡系统
// ============================================================================
// 
// 📌 说明:
//   这是使用 GCRS 规范关卡系统的新版本
//   支持标准化的 6 阶段流程：解锁→加载→解析→生成→运行→结算
// ============================================================================

import { ComponentGameScene } from './ComponentGameScene'
import { SnakeLevelOrchestrator } from '../core/SnakeLevelOrchestrator'
import { SnakeLevelLoader } from '../utils/SnakeLevelLoader'

/**
 * ⭐ 扩展后的游戏场景配置
 */
interface LevelGameSceneConfig {
  /** 难度级别 */
  difficulty?: 'easy' | 'normal' | 'hard'
  /** 主题 ID */
  themeId?: string
  /** 初始关卡 ID（默认：snake_level_1） */
  initialLevelId?: string
  /** 是否启用关卡系统 */
  enableLevelSystem?: boolean
}

/**
 * 🎮 基于 GCRS 关卡系统的游戏场景
 * 
 * @remarks
 * 在原有 ComponentGameScene 基础上，增加了：
 * - 关卡编排器（SnakeLevelOrchestrator）
 * - 关卡配置加载（SnakeLevelLoader）
 * - 标准化 6 阶段流程
 * 
 * @example
 * ```typescript
 * const scene = new LevelComponentGameScene(container, {
 *   initialLevelId: 'snake_level_1',
 *   difficulty: 'easy'
 * })
 * await scene.start()
 * ```
 */
export class LevelComponentGameScene extends ComponentGameScene {
  /** 关卡编排器 */
  private orchestrator: SnakeLevelOrchestrator | null = null
  
  /** 当前关卡 ID */
  private currentLevelId: string
  
  /** 下一关 ID（用于自动跳转） */
  private nextLevelId: string | null = null
  
  /** 是否正在过渡到下一关 */
  private isTransitioning: boolean = false
  
  /**
   * 构造函数
   */
  constructor(
    containerElement: HTMLElement,
    config: LevelGameSceneConfig = {}
  ) {
    super(containerElement, {
      difficulty: config.difficulty,
      themeId: config.themeId
    })
    
    this.currentLevelId = config.initialLevelId || 'snake_level_1'
    
    console.log('🎮 [LevelComponentGameScene] 创建新游戏场景')
    console.log(`   ├─ 初始关卡：${this.currentLevelId}`)
    console.log(`   └─ 难度：${config.difficulty || 'normal'}`)
  }
  
  /**
   * ⭐ 启动游戏（重写父类方法）
   */
  public async start(config: Partial<LevelGameSceneConfig> = {}): Promise<void> {
    // 合并配置
    const mergedConfig: LevelGameSceneConfig = {
      initialLevelId: 'snake_level_1',
      difficulty: 'normal',
      enableLevelSystem: true,
      ...config
    }
    
    console.log('🚀 [LevelComponentGameScene] 开始启动游戏...')
    
    try {
      // 1. 调用父类启动基础游戏
      await super.start({
        difficulty: mergedConfig.difficulty,
        themeId: mergedConfig.themeId
      })
      
      // 2. 创建关卡编排器
      this.createOrchestrator()
      
      // 3. 加载并运行第一个关卡
      if (mergedConfig.enableLevelSystem !== false) {
        await this.loadAndRunLevel(this.currentLevelId)
      }
      
      console.log('✅ [LevelComponentGameScene] 游戏启动完成！')
      
    } catch (error) {
      console.error('❌ [LevelComponentGameScene] 游戏启动失败:', error)
      throw error
    }
  }
  
  /**
   * ⭐ 加载并运行关卡
   */
  private async loadAndRunLevel(levelId: string): Promise<void> {
    console.log(`📖 [LevelComponentGameScene] 加载关卡：${levelId}`)
    
    try {
      // 1. 从 JSON 文件加载关卡配置
      const levelConfig = await SnakeLevelLoader.loadFromJSON(levelId)
      
      console.log('✅ [LevelComponentGameScene] 关卡配置加载成功')
      console.log(`   ├─ 关卡名称：${levelConfig.info.name}`)
      console.log(`   ├─ 难度：${levelConfig.info.difficulty}`)
      console.log(`   └─ 目标数量：${levelConfig.objectives.length}`)
      
      // 2. 运行关卡（执行 6 个阶段）
      if (this.orchestrator) {
        // 设置进度回调（用于显示加载界面）
        this.orchestrator.onProgress((event) => {
          this.onLevelProgress(event)
        })
        
        // 运行关卡
        const result = await this.orchestrator.runLevel(levelConfig)
        
        // 3. 处理关卡结果
        this.onLevelComplete(result)
      }
      
    } catch (error) {
      console.error(`❌ [LevelComponentGameScene] 关卡 ${levelId} 运行失败:`, error)
      throw error
    }
  }
  
  /**
   * ⭐ 创建关卡编排器
   */
  private createOrchestrator(): void {
    // 获取 Phaser 场景引用
    const phaserScene = this.getPhaserScene()
    
    if (!phaserScene) {
      console.warn('⚠️ [LevelComponentGameScene] Phaser 场景未就绪，无法创建编排器')
      return
    }
    
    // 创建编排器
    this.orchestrator = new SnakeLevelOrchestrator(phaserScene)
    
    console.log('✅ [LevelComponentGameScene] 关卡编排器已创建')
    
    // 监听关卡事件
    this.setupLevelEventListeners()
  }
  
  /**
   * ⭐ 设置关卡事件监听
   */
  private setupLevelEventListeners(): void {
    if (!this.orchestrator) return
    
    // 监听关卡开始
    this.orchestrator.on('level-started', (payload: any) => {
      console.log('🎮 [LevelEvent] 关卡开始:', payload.levelName)
      this.emitGameEvent('level_started', payload)
    })
    
    // 监听关卡完成
    this.orchestrator.on('level-completed', (result: any) => {
      console.log('🎉 [LevelEvent] 关卡完成:', result.success ? '胜利' : '失败')
      this.emitGameEvent('level_completed', result)
    })
    
    // 监听关卡失败
    this.orchestrator.on('level-failed', (result: any) => {
      console.log('😢 [LevelEvent] 关卡失败')
      this.emitGameEvent('level_failed', result)
    })
    
    // 监听关卡结算
    this.orchestrator.on('level-settled', (payload: any) => {
      console.log('💰 [LevelEvent] 关卡结算完成')
      this.emitGameEvent('level_settled', payload)
    })
  }
  
  /**
   * ⭐ 处理关卡进度（用于显示加载界面）
   */
  protected onLevelProgress(event: any): void {
    console.log(`📊 [LevelProgress] ${event.phase}: ${event.message} (${Math.round(event.progress * 100)}%)`)
    
    // TODO: 在这里更新 UI 进度条
    // 例如：this.updateProgressBar(event.progress, event.message)
  }
  
  /**
   * ⭐ 处理关卡完成
   */
  protected onLevelComplete(result: any): void {
    console.log('🎊 [LevelComplete] 关卡完成!')
    console.log(`   ├─ 成功：${result.success}`)
    console.log(`   ├─ 星级：${result.stars}`)
    console.log(`   ├─ 分数：${result.score}`)
    console.log(`   └─ 用时：${result.timeUsed}秒`)
    
    if (result.success) {
      // 胜利：准备进入下一关
      this.prepareNextLevel()
    } else {
      // 失败：可以选择重试
      this.handleLevelFailure()
    }
  }
  
  /**
   * ⭐ 准备进入下一关
   */
  private prepareNextLevel(): void {
    // 计算下一关 ID
    const match = this.currentLevelId.match(/snake_level_(\d+)/)
    if (match) {
      const currentLevelNum = parseInt(match[1])
      const nextLevelNum = currentLevelNum + 1
      this.nextLevelId = `snake_level_${nextLevelNum}`
      
      console.log(`🔜 [LevelComplete] 准备进入下一关：${this.nextLevelId}`)
      
      // TODO: 显示过关界面，询问是否进入下一关
      // 玩家确认后调用 this.goToNextLevel()
    } else {
      console.log('✅ [LevelComplete] 已是最后一关')
    }
  }
  
  /**
   * ⭐ 进入下一关
   */
  public async goToNextLevel(): Promise<void> {
    if (!this.nextLevelId) {
      console.warn('⚠️ [LevelComplete] 没有下一关')
      return
    }
    
    if (this.isTransitioning) {
      console.warn('⚠️ [LevelComplete] 正在过渡中，请等待')
      return
    }
    
    this.isTransitioning = true
    this.currentLevelId = this.nextLevelId
    this.nextLevelId = null
    
    console.log(`🔄 [LevelComplete] 进入下一关：${this.currentLevelId}`)
    
    // 重置游戏状态
    this.resetGameState()
    
    // 加载并运行新关卡
    await this.loadAndRunLevel(this.currentLevelId)
    
    this.isTransitioning = false
  }
  
  /**
   * ⭐ 处理关卡失败
   */
  protected handleLevelFailure(): void {
    console.log('😢 [LevelFailure] 关卡失败，可以选择重试')
    
    // TODO: 显示失败界面，提供重试选项
    // 玩家确认后调用 this.retryLevel()
  }
  
  /**
   * ⭐ 重试当前关卡
   */
  public async retryLevel(): Promise<void> {
    console.log(`🔄 [LevelRetry] 重试关卡：${this.currentLevelId}`)
    
    // 重置游戏状态
    this.resetGameState()
    
    // 重新加载当前关卡
    await this.loadAndRunLevel(this.currentLevelId)
  }
  
  /**
   * ⭐ 重置游戏状态
   */
  private resetGameState(): void {
    console.log('🔄 [Reset] 重置游戏状态...')
    
    // TODO: 重置蛇的位置、分数、目标进度等
    // 可以通过发送事件或调用组件方法实现
    this.emitGameEvent('reset_game', {})
  }
  
  /**
   * ⭐ 获取 Phaser 场景引用
   */
  private getPhaserScene(): any {
    // TODO: 通过反射或其他方式获取父类的 scene 引用
    // 这里需要根据实际实现调整
    return null
  }
  
  /**
   * ⭐ 发送游戏事件（供子类使用）
   */
  protected emitGameEvent(eventType: string, payload: any): void {
    // 可以通过 EventBus 或直接调用父类方法
    console.log(`📡 [Event] ${eventType}:`, payload)
  }
}
