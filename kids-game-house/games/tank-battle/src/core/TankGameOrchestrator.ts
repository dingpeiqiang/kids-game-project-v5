// ============================================================================
// 🎮 坦克大战 - 关卡编排器
// ============================================================================
// 
// 📌 说明:
//   实现坦克大战关卡的完整生命周期管理
//   遵循 frame-factory 标准的 6 阶段流程
// ============================================================================

import { ILevelConfig, ILevelResult, ITankLevelData } from '../types/level-types'
import { TankSpawner } from './TankSpawner'
import { TankConfigParser } from './TankConfigParser'

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
 * ⭐ 关卡阶段枚举
 */
export enum LevelPhase {
  NOT_STARTED = 'not_started',
  UNLOCK_VALIDATING = 'unlock_validating',
  RESOURCES_LOADING = 'resources_loading',
  CONFIG_PARSING = 'config_parsing',
  LEVEL_SPAWNING = 'level_spawning',
  RUNNING = 'running',
  SETTLING = 'settling',
  COMPLETED = 'completed'
}

/**
 * ⭐ 关卡事件接口
 */
export interface LevelFlowEvent {
  phase: LevelPhase
  progress: number
  message: string
  data?: any
}

/**
 * ⭐ 坦克大战关卡编排器
 * 
 * @remarks
 * 核心职责：
 * - 统一管理关卡的完整生命周期
 * - 按标准流程执行 6 个阶段
 * - 提供进度回调和事件通知
 */
export class TankGameOrchestrator {
  protected scene: Phaser.Scene
  protected levelConfig: ILevelConfig | null = null
  protected currentPhase: LevelPhase = LevelPhase.NOT_STARTED
  private onProgressCallback: ((event: LevelFlowEvent) => void) | null = null
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    console.log('🎮 [TankGameOrchestrator] 已创建')
  }
  
  // ===========================================================================
  // 📌 公共 API - 外部调用接口
  // ===========================================================================
  
  /**
   * ⭐ 运行关卡 - 主入口
   */
  async runLevel(levelConfig: ILevelConfig): Promise<ILevelResult> {
    console.log('🎮 [TankGameOrchestrator] 开始运行关卡:', levelConfig.info.name)
    
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
      console.error('❌ [TankGameOrchestrator] 关卡运行失败:', error)
      throw error
    }
  }
  
  /**
   * ⭐ 设置进度回调
   */
  set onProgress(callback: (event: LevelFlowEvent) => void) {
    this.onProgressCallback = callback
  }
  
  // ===========================================================================
  // 🎯 内部方法 - 6 个阶段实现
  // ===========================================================================
  
  /**
   * 阶段 1: 解锁验证
   */
  protected async phase1_UnlockValidation(): Promise<void> {
    console.log('🔓 [阶段 1] 解锁验证...')
    this.emitProgress(0.1, '验证关卡解锁状态...')
    
    // TODO: 检查前置关卡是否完成
    await this.delay(100)
    
    console.log('✅ [阶段 1] 完成')
  }
  
  /**
   * 阶段 2: 资源预加载
   */
  protected async phase2_ResourceLoading(): Promise<void> {
    console.log('📦 [阶段 2] 资源预加载...')
    this.emitProgress(0.2, '加载关卡资源...')
    
    if (!this.levelConfig?.resources) {
      console.warn('⚠️ 未找到资源配置，使用默认资源')
    }
    
    // TODO: 实现资源加载逻辑
    await this.delay(200)
    
    console.log('✅ [阶段 2] 完成')
  }
  
  /**
   * 阶段 3: 配置解析
   */
  protected async phase3_ConfigParsing(): Promise<ITankLevelData> {
    console.log('📋 [阶段 3] 配置解析...')
    this.emitProgress(0.4, '解析关卡配置...')
    
    // ✅ 使用 TankConfigParser 解析配置
    const parser = new TankConfigParser(this.scene)
    if (!this.levelConfig) {
      throw new Error('关卡配置为空')
    }
    const data = await parser.parse(this.levelConfig as any)
    
    console.log('📊 解析结果:', {
      walls: data.walls.length,
      enemies: data.enemies.reduce((sum, e) => sum + e.count, 0),
      powerUps: data.powerUps.length
    })
    
    await this.delay(100)
    
    console.log('✅ [阶段 3] 完成')
    return data
  }
  
  /**
   * 阶段 4: 关卡动态生成
   */
  protected async phase4_LevelSpawning(parsedData: ITankLevelData): Promise<void> {
    console.log('🏗️ [阶段 4] 关卡生成...')
    this.emitProgress(0.6, '生成游戏实体...')
    
    // ✅ 使用 TankSpawner 生成实体
    const spawner = new TankSpawner(this.scene)
    await spawner.spawn(parsedData)
    
    console.log('✅ [阶段 4] 完成')
  }
  
  /**
   * 阶段 5: 关卡运行
   */
  protected async phase5_LevelRunning(): Promise<ILevelResult> {
    console.log('🎮 [阶段 5] 关卡运行中...')
    this.emitProgress(0.8, '关卡进行中...')
    
    // ✅ 返回一个 Promise，等待游戏结束
    return new Promise((resolve) => {
      // 监听游戏结束事件（由 TankGameScene 触发）
      const gameScene = this.scene as any
      if (gameScene.onLevelComplete) {
        gameScene._resolveLevelResult = resolve
      } else {
        // 兜底方案：30 秒后自动完成（用于测试）
        this.time.delayedCall(30000, () => {
          console.warn('⚠️ 超时，自动完成关卡')
          resolve({
            success: true,
            completion: 1.0,
            score: 1000,
            stars: 3,
            rewards: { score: 1000 },
            timeUsed: 30,
            statistics: {}
          })
        })
      }
    })
  }
  
  /**
   * 阶段 6: 关卡结算
   */
  protected async phase6_Settlement(result: ILevelResult): Promise<void> {
    console.log('🏆 [阶段 6] 关卡结算...')
    this.emitProgress(0.95, '结算中...')
    
    console.log('结果:', result)
    await this.delay(100)
    
    console.log('✅ [阶段 6] 完成')
  }
  
  // ===========================================================================
  // 🔧 工具方法
  // ===========================================================================
  
  /**
   * 发射进度事件
   */
  protected emitProgress(progress: number, message: string, data?: any): void {
    if (this.onProgressCallback) {
      this.onProgressCallback({
        phase: this.currentPhase,
        progress,
        message,
        data
      })
    }
  }
  
  /**
   * 延迟工具函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 获取 Scene 的 time 组件
   */
  protected get time(): any {
    return (this.scene as any).time
  }
  
  /**
   * 获取当前阶段
   */
  getCurrentPhase(): LevelPhase {
    return this.currentPhase
  }
}
