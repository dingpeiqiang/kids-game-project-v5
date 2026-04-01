// ============================================================================
// 🎮 坦克大战 - 游戏资源预加载与验证工具
// ============================================================================
// 
// 📌 说明:
//   在游戏启动前预加载并验证所有必需资源
//   提供详细的错误报告和用户友好的提示
//   杜绝占位符，确保资源完整性
// ============================================================================

import { Logger } from '../utils/Logger'
import { ResourceManager, ResourceType } from '../managers/ResourceManager'

/**
 * ⭐ 资源验证结果
 */
export interface IResourceValidationResult {
  success: boolean
  totalResources: number
  loadedResources: number
  failedResources: number
  requiredFailed: string[]  // 缺失的必需资源
  optionalFailed: string[]  // 缺失的可选资源
  report: string
}

/**
 * ⭐ 坦克大战必需资源清单
 */
const TANK_BATTLE_REQUIRED_RESOURCES = [
  // 🎯 玩家坦克（4 个方向）
  { key: 'player_tank_up', type: ResourceType.IMAGE, url: 'assets/tanks/player/up.png', priority: 10 },
  { key: 'player_tank_down', type: ResourceType.IMAGE, url: 'assets/tanks/player/down.png', priority: 10 },
  { key: 'player_tank_left', type: ResourceType.IMAGE, url: 'assets/tanks/player/left.png', priority: 10 },
  { key: 'player_tank_right', type: ResourceType.IMAGE, url: 'assets/tanks/player/right.png', priority: 10 },
  
  // 👾 敌人坦克（3 种类型 × 4 个方向 = 12 个）
  { key: 'enemy_light_up', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/light_up.png', priority: 10 },
  { key: 'enemy_light_down', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/light_down.png', priority: 10 },
  { key: 'enemy_light_left', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/light_left.png', priority: 10 },
  { key: 'enemy_light_right', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/light_right.png', priority: 10 },
  
  { key: 'enemy_medium_up', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/medium_up.png', priority: 10 },
  { key: 'enemy_medium_down', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/medium_down.png', priority: 10 },
  { key: 'enemy_medium_left', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/medium_left.png', priority: 10 },
  { key: 'enemy_medium_right', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/medium_right.png', priority: 10 },
  
  { key: 'enemy_heavy_up', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/heavy_up.png', priority: 10 },
  { key: 'enemy_heavy_down', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/heavy_down.png', priority: 10 },
  { key: 'enemy_heavy_left', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/heavy_left.png', priority: 10 },
  { key: 'enemy_heavy_right', type: ResourceType.IMAGE, url: 'assets/tanks/enemy/heavy_right.png', priority: 10 },
  
  // 💥 子弹
  { key: 'bullet_normal', type: ResourceType.IMAGE, url: 'assets/bullets/bullet_normal.png', priority: 9 },
  { key: 'bullet_fast', type: ResourceType.IMAGE, url: 'assets/bullets/bullet_fast.png', priority: 9 },
  
  // 🧱 墙壁
  { key: 'wall_brick', type: ResourceType.IMAGE, url: 'assets/walls/brick.png', priority: 8 },
  { key: 'wall_steel', type: ResourceType.IMAGE, url: 'assets/walls/steel.png', priority: 8 },
  
  // 🏠 基地
  { key: 'base', type: ResourceType.IMAGE, url: 'assets/base/base.png', priority: 9 },
  { key: 'base_destroyed', type: ResourceType.IMAGE, url: 'assets/base/base_destroyed.png', priority: 8 },
  
  // ✨ 爆炸特效
  { key: 'explosion_1', type: ResourceType.IMAGE, url: 'assets/effects/explosion_1.png', priority: 7 },
  { key: 'explosion_2', type: ResourceType.IMAGE, url: 'assets/effects/explosion_2.png', priority: 7 },
  { key: 'explosion_3', type: ResourceType.IMAGE, url: 'assets/effects/explosion_3.png', priority: 7 },
  
  // 🎁 道具
  { key: 'powerup_star', type: ResourceType.IMAGE, url: 'assets/powerups/star.png', priority: 6 },
  { key: 'powerup_shield', type: ResourceType.IMAGE, url: 'assets/powerups/shield.png', priority: 6 },
  { key: 'powerup_clock', type: ResourceType.IMAGE, url: 'assets/powerups/clock.png', priority: 6 },
  
  // 🗺️ 地图背景
  { key: 'bg_main', type: ResourceType.IMAGE, url: 'assets/backgrounds/bg_main.png', priority: 5 },
] as const

/**
 * ⭐ 资源预加载验证器
 */
export class ResourcePreloader {
  /**
   * ⭐ 预加载并验证所有资源
   * @param scene - Phaser 场景实例
   * @returns 验证结果
   */
  static async preloadAndValidate(scene: Phaser.Scene): Promise<IResourceValidationResult> {
    Logger.info('🚀 [ResourcePreloader] 开始预加载资源...')
    
    const startTime = Date.now()
    
    // ✅ 1. 注册所有必需资源
    TANK_BATTLE_REQUIRED_RESOURCES.forEach(resource => {
      ResourceManager.registerResource({
        ...resource,
        required: true,  // 全部标记为必需
        retryCount: 3    // 自动重试 3 次
      })
    })
    
    // ✅ 2. 加载所有资源
    const stats = await ResourceManager.loadAllResources(scene)
    
    // ✅ 3. 验证资源完整性
    const result = this.validateResources(stats)
    
    // ✅ 4. 打印详细报告
    this.printValidationReport(result, Date.now() - startTime)
    
    return result
  }
  
  /**
   * ⭐ 验证资源完整性
   */
  private static validateResources(stats: any): IResourceValidationResult {
    const failedResources = ResourceManager.getFailedResources()
    const requiredFailed: string[] = []
    const optionalFailed: string[] = []
    
    // ✅ 分类失败资源
    failedResources.forEach((result: any) => {
      if (result.required) {
        requiredFailed.push(result.key)
      } else {
        optionalFailed.push(result.key)
      }
    })
    
    // ✅ 生成验证结果
    const success = requiredFailed.length === 0
    
    return {
      success,
      totalResources: stats.total,
      loadedResources: stats.loaded,
      failedResources: stats.failed,
      requiredFailed,
      optionalFailed,
      report: this.generateReport(success, stats, requiredFailed, optionalFailed)
    }
  }
  
  /**
   * ⭐ 生成验证报告
   */
  private static generateReport(
    success: boolean,
    stats: any,
    requiredFailed: string[],
    optionalFailed: string[]
  ): string {
    const lines: string[] = []
    
    lines.push('╔════════════════════════════════════════════════════╗')
    lines.push('║  🎮 坦克大战资源验证报告                            ║')
    lines.push('╠════════════════════════════════════════════════════╣')
    
    if (success) {
      lines.push('║  ✅ 验证成功 - 所有必需资源已就绪                    ║')
    } else {
      lines.push('║  ❌ 验证失败 - 缺少必需资源                            ║')
    }
    
    lines.push('╠────────────────────────────────────────────────────╣')
    lines.push(`║  总资源数：${String(stats.total).padEnd(36)}║`)
    lines.push(`║  ✅ 成功：${String(stats.loaded).padEnd(37)}║`)
    lines.push(`║  ❌ 失败：${String(stats.failed).padEnd(37)}║`)
    lines.push(`║  📈 进度：${String(stats.progress).padEnd(36)}║`)
    
    if (requiredFailed.length > 0) {
      lines.push('╠────────────────────────────────────────────────────╣')
      lines.push('║  🚨 缺失的必需资源（必须修复）:                     ║')
      requiredFailed.forEach(key => {
        lines.push(`║     - ${key.padEnd(40)}║`)
      })
    }
    
    if (optionalFailed.length > 0) {
      lines.push('╠────────────────────────────────────────────────────╣')
      lines.push('║  ⚠️ 缺失的可选资源（可以忽略）:                     ║')
      optionalFailed.forEach(key => {
        lines.push(`║     - ${key.padEnd(40)}║`)
      })
    }
    
    lines.push('╚════════════════════════════════════════════════════╝')
    
    return lines.join('\n')
  }
  
  /**
   * ⭐ 打印验证报告
   */
  private static printValidationReport(result: IResourceValidationResult, duration: number): void {
    Logger.info('')
    Logger.info(result.report)
    Logger.info('')
    Logger.info(`⏱️ 总耗时：${duration}ms`)
    
    if (!result.success) {
      Logger.error('🚨 [ResourcePreloader] 游戏无法启动 - 缺少必需资源')
      Logger.error('🛑 请检查资源文件是否存在或路径配置是否正确')
    } else {
      Logger.success('✅ [ResourcePreloader] 游戏可以安全启动')
    }
  }
  
  /**
   * ⭐ 检查单个纹理是否存在
   * @param scene - Phaser 场景实例
   * @param key - 纹理 key
   * @returns 是否存在
   */
  static checkTextureExists(scene: Phaser.Scene, key: string): boolean {
    const exists = scene.textures.exists(key)
    
    if (!exists) {
      Logger.error(`❌ [ResourcePreloader] 纹理不存在：${key}`)
      
      // ✅ 查找相似的纹理（智能提示）
      const textureKeys = scene.textures.list as any
      const similarKeys = Object.keys(textureKeys)
        .filter(k => k.includes(key.split('_')[0]))
      
      if (similarKeys.length > 0) {
        Logger.warn(`💡 提示：是否使用了以下纹理？`)
        similarKeys.forEach(k => Logger.warn(`   - ${k}`))
      }
    }
    
    return exists
  }
  
  /**
   * ⭐ 获取资源加载进度
   */
  static getProgress(): number {
    const stats = ResourceManager.generateStats()
    return stats.progress
  }
}
