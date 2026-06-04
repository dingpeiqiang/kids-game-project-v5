// ============================================================================
// 🎮 关卡编排器 - 标准化流程控制
// ============================================================================
// 
// 📌 说明:
//   实现关卡的完整生命周期管理
//   加载 → 解析 → 生成 → 运行 → 结算
//   所有关卡复用此框架，无需重复编写
// ============================================================================

// Phaser 由宿主通过 CDN 提供（peerDependency），此处声明全局变量类型
declare const Phaser: typeof import('phaser').default
import { ILevelConfig, ILevelState, ILevelResult } from '../types/level-types'
import { LevelPhase, LevelFlowEvent } from '../types/level-phase'
import { LevelResourceLoader } from '../utils/LevelResourceLoader'

/**
 * ⭐ 配置解析器接口（由具体游戏实现）
 */
export interface IConfigParser {
  parse(config: ILevelConfig): Promise<any>
}

/**
 * ⭐ 关卡生成器接口（由具体游戏实现）
 */
export interface ILevelSpawner {
  spawn(data: any): Promise<void>
}

/**
 * ⭐ 关卡编排器
 * 
 * @remarks
 * 核心职责：
 * - 统一管理关卡的完整生命周期
 * - 按标准流程执行 6 个阶段
 * - 提供进度回调和事件通知
 * - 所有游戏类型复用此框架
 */
export class LevelOrchestrator {
  protected scene: Phaser.Scene
  protected levelConfig: ILevelConfig | null = null
  protected levelState: ILevelState | null = null
  protected currentPhase: LevelPhase = LevelPhase.NOT_STARTED
  private onProgressCallback: ((event: LevelFlowEvent) => void) | null = null
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  // ===========================================================================
  // 📌 公共 API - 外部调用接口
  // ===========================================================================
  
  /**
   * ⭐ 运行关卡 - 主入口
   */
  async runLevel(levelConfig: ILevelConfig): Promise<ILevelResult> {
    console.log('🎮 [LevelOrchestrator] 开始运行关卡:', levelConfig.info.name)
    
    try {
      this.levelConfig = levelConfig
      
      // ========== 阶段 1: 解锁验证 ==========
      this.currentPhase = LevelPhase.UNLOCK_VALIDATING
      await this.phase1_UnlockValidation()
      
      // ========== 阶段 2: 资源预加载 ==========
      this.currentPhase = LevelPhase.RESOURCES_LOADING
      await this.phase2_ResourceLoading()
      
      // ========== 阶段 3: 配置解析 ==========
      this.currentPhase = LevelPhase.CONFIG_PARSING
      const parsedData = await this.phase3_ConfigParsing()
      
      // ========== 阶段 4: 关卡动态生成 ==========
      this.currentPhase = LevelPhase.LEVEL_SPAWNING
      await this.phase4_LevelSpawning(parsedData)
      
      // ========== 阶段 5: 关卡运行 ==========
      this.currentPhase = LevelPhase.RUNNING
      const result = await this.phase5_LevelRunning()
      
      // ========== 阶段 6: 关卡结算 ==========
      this.currentPhase = LevelPhase.SETTLING
      await this.phase6_Settlement(result)
      
      this.currentPhase = LevelPhase.COMPLETED
      return result
      
    } catch (error) {
      console.error('❌ [LevelOrchestrator] 关卡运行失败:', error)
      throw error
    }
  }
  
  /**
   * ⭐ 设置进度回调
   */
  onProgress(callback: (event: LevelFlowEvent) => void): void {
    this.onProgressCallback = callback
  }
  
  /**
   * ⭐ 获取当前阶段
   */
  getCurrentPhase(): LevelPhase {
    return this.currentPhase
  }
  
  /**
   * ⭐ 获取当前关卡状态
   */
  getLevelState(): ILevelState | null {
    return this.levelState
  }
  
  // ===========================================================================
  // 📌 内部方法 - 6 个阶段的实现
  // ===========================================================================
  
  /**
   * ⭐ 阶段 1: 解锁验证
   */
  protected async phase1_UnlockValidation(): Promise<void> {
    this.notifyProgress({ progress: 0.1, message: '验证关卡解锁状态...' })
    
    if (!this.levelConfig) {
      throw new Error('关卡配置为空')
    }
    
    // 检查前置关卡
    const prerequisites = this.levelConfig.info.prerequisites || []
    if (prerequisites.length > 0) {
      const unlocked = await this.checkPrerequisites(prerequisites)
      if (!unlocked) {
        throw new Error(`关卡未解锁：需要完成前置关卡 ${prerequisites.join(', ')}`)
      }
    }
    
    // 检查玩家等级
    const recommendedLevel = this.levelConfig.info.recommendedLevel
    if (recommendedLevel) {
      const playerLevel = await this.getPlayerLevel()
      if (playerLevel < recommendedLevel) {
        throw new Error(`玩家等级不足：推荐等级 ${recommendedLevel}`)
      }
    }
    
    console.log('✅ [阶段 1] 解锁验证通过')
    this.notifyProgress({ progress: 0.15, message: '解锁验证通过' })
  }
  
  /**
   * ⭐ 阶段 2: 资源预加载
   */
  protected async phase2_ResourceLoading(): Promise<void> {
    this.notifyProgress({ progress: 0.2, message: '预加载关卡资源...' })
    
    if (!this.levelConfig) return
    
    // 创建资源加载器
    const loader = new LevelResourceLoader(this.scene, this.levelConfig)
    
    // 加载该关卡独有的资源
    const result = await loader.loadAll((progress) => {
      const totalProgress = 0.2 + (progress * 0.2)
      this.notifyProgress({ 
        progress: totalProgress, 
        message: `加载中... ${Math.round(progress * 100)}%` 
      })
    })
    
    // 输出加载结果
    console.log(`✅ [阶段 2] 资源加载完成:`)
    console.log(`   - 成功：${result.loadedCount}个`)
    console.log(`   - 失败：${result.failedCount}个`)
    
    if (result.failedCount > 0) {
      console.warn('⚠️ 以下资源加载失败:', result.failedIds)
    }
    
    this.notifyProgress({ progress: 0.4, message: '资源加载完成' })
  }
  
  /**
   * ⭐ 阶段 3: 配置解析
   */
  protected async phase3_ConfigParsing(): Promise<any> {
    this.notifyProgress({ progress: 0.5, message: '解析关卡配置...' })
    
    if (!this.levelConfig) {
      throw new Error('关卡配置为空')
    }
    
    // 使用配置解析器（由具体游戏实现）
    const parser = this.createConfigParser()
    const parsedData = await parser.parse(this.levelConfig)
    
    console.log('✅ [阶段 3] 配置解析完成')
    this.notifyProgress({ progress: 0.6, message: '配置解析完成' })
    
    return parsedData
  }
  
  /**
   * ⭐ 阶段 4: 关卡动态生成
   */
  protected async phase4_LevelSpawning(parsedData: any): Promise<void> {
    this.notifyProgress({ progress: 0.6, message: '生成关卡元素...' })
    
    // 使用关卡生成器（由具体游戏实现）
    const spawner = this.createLevelSpawner()
    await spawner.spawn(parsedData)
    
    // 初始化关卡状态
    this.initializeLevelState()
    
    console.log('✅ [阶段 4] 关卡生成完成')
    this.notifyProgress({ progress: 0.7, message: '关卡生成完成' })
  }
  
  /**
   * ⭐ 阶段 5: 关卡运行
   */
  protected async phase5_LevelRunning(): Promise<ILevelResult> {
    this.notifyProgress({ progress: 0.7, message: '关卡运行中...' })
    
    // 发送关卡开始事件
    this.scene.events.emit('level-started', {
      levelId: this.levelConfig?.info.id,
      levelName: this.levelConfig?.info.name
    })
    
    // 返回一个 Promise，等待胜利/失败条件触发
    return new Promise((resolve) => {
      // 监听关卡完成事件
      const onComplete = (result: ILevelResult) => {
        resolve(result)
      }
      
      this.scene.events.once('level-completed', onComplete)
      this.scene.events.once('level-failed', onComplete)
      
      // 注意：实际的运行逻辑由游戏核心机制接管
      // 这里只是等待结果
    })
  }
  
  /**
   * ⭐ 阶段 6: 关卡结算
   */
  protected async phase6_Settlement(result: ILevelResult): Promise<void> {
    this.notifyProgress({ progress: 0.8, message: '结算中...' })
    
    if (!this.levelConfig || !this.levelState) return
    
    // 1. 发放奖励
    await this.grantRewards(result)
    
    // 2. 更新关卡解锁状态
    await this.updateUnlockStatus(result.success)
    
    // 3. 保存进度到后端
    await this.saveProgressToBackend(result)
    
    // 4. 发送结算事件
    this.scene.events.emit('level-settled', {
      levelId: this.levelConfig.info.id,
      result
    })
    
    console.log('✅ [阶段 6] 关卡结算完成')
    this.notifyProgress({ progress: 0.9, message: '结算完成' })
    
    // 延迟一点显示完成界面
    await new Promise(resolve => setTimeout(resolve, 500))
    this.notifyProgress({ progress: 1.0, message: '关卡完成!' })
  }
  
  // ===========================================================================
  // 📌 辅助方法（子类可以重写）
  // ===========================================================================
  
  /**
   * ⭐ 检查前置关卡是否完成
   */
  protected async checkPrerequisites(prerequisites: string[]): Promise<boolean> {
    // TODO: 调用后端 API 或本地存储检查
    return true
  }
  
  /**
   * ⭐ 获取玩家等级
   */
  protected async getPlayerLevel(): Promise<number> {
    // TODO: 从用户数据中获取
    return 1
  }
  
  /**
   * ⭐ 创建配置解析器（由子类重写）
   */
  protected createConfigParser(): IConfigParser {
    // 默认解析器，具体游戏应重写
    return {
      parse: async (config: ILevelConfig) => ({
        defaultParsed: true,
        config
      })
    }
  }
  
  /**
   * ⭐ 创建关卡生成器（由子类重写）
   */
  protected createLevelSpawner(): ILevelSpawner {
    // 默认生成器，具体游戏应重写
    return {
      spawn: async (data: any) => {
        console.log('[LevelSpawner] 生成关卡:', data)
      }
    }
  }
  
  /**
   * ⭐ 初始化关卡状态
   */
  protected initializeLevelState(): void {
    if (!this.levelConfig) return
    
    this.levelState = {
      levelId: this.levelConfig.info.id,
      isActive: true,
      startTime: Date.now(),
      elapsedTime: 0,
      score: 0,
      objectiveProgress: new Map(),
      gameData: {}
    }
    
    // 初始化目标进度
    if (this.levelConfig.objectives) {
      this.levelConfig.objectives.forEach(obj => {
        this.levelState!.objectiveProgress.set(obj.id, 0)
      })
    }
  }
  
  /**
   * ⭐ 发放奖励
   */
  protected async grantRewards(result: ILevelResult): Promise<void> {
    console.log('💰 [结算] 发放奖励:', result.rewards)
    // TODO: 调用后端 API 或本地存储
  }
  
  /**
   * ⭐ 更新解锁状态
   */
  protected async updateUnlockStatus(success: boolean): Promise<void> {
    if (!success || !this.levelConfig) return
    
    console.log('🔓 [结算] 更新解锁状态')
    // TODO: 调用后端 API 更新下一关的解锁状态
  }
  
  /**
   * ⭐ 保存进度到后端
   */
  protected async saveProgressToBackend(result: ILevelResult): Promise<void> {
    if (!this.levelConfig || !this.levelState) return
    
    const submitData = {
      levelId: this.levelConfig.info.id,
      sessionId: `${this.levelConfig.info.id}_${Date.now()}`,
      success: result.success,
      score: result.score,
      stars: result.stars,
      duration: result.timeUsed,
      objectiveProgress: Object.fromEntries(this.levelState.objectiveProgress),
      statistics: result.statistics
    }
    
    console.log('💾 [结算] 保存进度到后端:', submitData)
    // TODO: 调用后端 API: POST /api/v1/levels/{levelId}/submit
  }
  
  /**
   * ⭐ 通知进度回调
   */
  private notifyProgress(event: { progress: number; message: string }): void {
    if (this.onProgressCallback) {
      this.onProgressCallback({
        phase: this.currentPhase,
        progress: event.progress,
        message: event.message
      })
    }
  }
  
  /**
   * ⭐ 发送游戏事件（供子类使用）
   */
  protected emitGameEvent(eventType: string, payload: any): void {
    this.scene.events.emit(eventType, payload)
  }
}
