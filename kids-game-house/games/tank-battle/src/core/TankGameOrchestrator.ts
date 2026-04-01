// ============================================================================
// 🎮 坦克大战 - 关卡编排器
// ============================================================================
// 
// 📌 说明:
//   继承自 frame-factory 的 LevelOrchestrator
//   实现坦克大战的关卡生命周期管理
// ============================================================================

import { LevelOrchestrator, IConfigParser, ILevelSpawner } from './LevelOrchestrator'
import { ILevelConfig, ILevelResult } from './types/level-types'
import { TankConfigParser } from './TankConfigParser'
import { TankSpawner } from './TankSpawner'

/**
 * ⭐ 坦克大战关卡编排器
 * 
 * @remarks
 * 核心职责：
 * - 管理坦克大战关卡的完整生命周期
 * - 按标准流程执行 6 个阶段
 * - 协调 ConfigParser 和 Spawner
 */
export class TankGameOrchestrator extends LevelOrchestrator {
  protected configParser: TankConfigParser
  protected spawner: TankSpawner
  
  constructor(scene: Phaser.Scene) {
    super(scene)
    this.configParser = new TankConfigParser(scene)
    this.spawner = new TankSpawner(scene)
    
    console.log('✅ [TankGameOrchestrator] 已创建')
  }
  
  // ===========================================================================
  // 📌 重写父类方法 - 提供坦克大战特定实现
  // ===========================================================================
  
  /**
   * ⭐ 运行关卡（重写版本）
   */
  async runLevel(levelConfig: ILevelConfig): Promise<ILevelResult> {
    console.log('🎮 [TankGameOrchestrator] 开始运行坦克大战关卡:', levelConfig.info.name)
    
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
  
  // ===========================================================================
  // 📌 实现父类的抽象方法
  // ===========================================================================
  
  /**
   * ⭐ 创建配置解析器
   */
  protected createConfigParser(): IConfigParser {
    return this.configParser
  }
  
  /**
   * ⭐ 创建关卡生成器
   */
  protected createLevelSpawner(): ILevelSpawner {
    return this.spawner
  }
  
  // ===========================================================================
  // 📌 坦克大战特定方法
  // ===========================================================================
  
  /**
   * ⭐ 检查前置关卡
   */
  protected async checkPrerequisites(prerequisites: string[]): Promise<boolean> {
    // TODO: 从 localStorage 读取已通关关卡
    const completedLevels = JSON.parse(localStorage.getItem('tank_completed_levels') || '[]')
    return prerequisites.every(id => completedLevels.includes(id))
  }
  
  /**
   * ⭐ 获取玩家等级
   */
  protected async getPlayerLevel(): Promise<number> {
    // TODO: 从玩家数据中读取
    const playerData = JSON.parse(localStorage.getItem('tank_player_data') || '{}')
    return playerData.level || 1
  }
}
