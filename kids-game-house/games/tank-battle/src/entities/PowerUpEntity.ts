// ============================================================================
// 🎁 坦克大战道具实体 - 遵循单一职责原则
// ============================================================================
// 
// 📌 架构设计:
//   1. IPowerUpConfigData  - 配置数据接口（纯数据）
//   2. PowerUpData         - 道具数据类（只保存状态）
//   3. PowerUpConfigService- 配置服务（管理固定配置）
//   4. PowerUpDomainService- 领域服务（处理业务逻辑）
// ============================================================================

import { PowerUpType } from '../types/powerup-types'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 道具配置数据接口
 * 
 * @remarks
 * 纯数据接口，不包含任何方法
 * 职责：定义每种道具的固定属性
 */
export interface IPowerUpConfigData {
  readonly type: PowerUpType
  readonly duration: number      // 持续时间（毫秒，0 为永久/立即）
  readonly power: number         // 效果值
  readonly color: number         // 颜色
  readonly description: string   // 描述
  readonly isInstant: boolean    // 是否立即生效
  readonly isTemporary: boolean  // 是否持续生效
}

/**
 * ⭐ 道具运行时数据类
 * 
 * @remarks
 * 只保存道具的状态信息，不包含业务逻辑
 * 职责：记录道具的当前状态（是否被拾取、生成时间等）
 */
export class PowerUpData {
  // ─── 不变数据 ──────────────────────────────────────────
  
  /** 道具类型 */
  public readonly type: PowerUpType
  
  /** 效果持续时间（毫秒） */
  public readonly duration: number
  
  /** 效果值 */
  public readonly power: number
  
  /** 颜色 */
  public readonly color: number
  
  /** 描述 */
  public readonly description: string
  
  // ─── 可变状态 ──────────────────────────────────────────
  
  /** 是否已被拾取 */
  public isCollected: boolean = false
  
  /** 生成时间戳 */
  public readonly spawnTime: number
  
  // ─── 构造函数 ──────────────────────────────────────────
  
  constructor(config: IPowerUpConfigData) {
    this.type = config.type
    this.duration = config.duration
    this.power = config.power
    this.color = config.color
    this.description = config.description
    this.spawnTime = Date.now()
  }
  
  // ─── 简单状态查询（无逻辑） ───────────────────────────
  
  /**
   * ⭐ 获取已存在时间（毫秒）
   */
  getAge(): number {
    return Date.now() - this.spawnTime
  }
}

/**
 * ⭐ 道具配置服务
 * 
 * @remarks
 * 纯静态工具类，提供配置数据查询
 * 职责：管理和查询所有道具的固定配置
 */
export class PowerUpConfigService {
  /** 所有道具配置的缓存 */
  private static readonly configs: Map<PowerUpType, IPowerUpConfigData> = new Map()
  
  // ─── 初始化配置 ──────────────────────────────────────
  
  static {
    // 基础道具
    PowerUpConfigService.configs.set(PowerUpType.STAR, {
      type: PowerUpType.STAR,
      duration: 0,
      power: 1,
      color: 0xFFFF00,
      description: '火力升级',
      isInstant: true,
      isTemporary: false
    })
    
    PowerUpConfigService.configs.set(PowerUpType.SHIELD, {
      type: PowerUpType.SHIELD,
      duration: 10000,
      power: 1,
      color: 0x00FF00,
      description: '护盾保护',
      isInstant: false,
      isTemporary: true
    })
    
    PowerUpConfigService.configs.set(PowerUpType.CLOCK, {
      type: PowerUpType.CLOCK,
      duration: 8000,
      power: 1,
      color: 0x0000FF,
      description: '时间冻结',
      isInstant: false,
      isTemporary: true
    })
    
    // 新道具
    PowerUpConfigService.configs.set(PowerUpType.GUN, {
      type: PowerUpType.GUN,
      duration: 5000,
      power: 1,
      color: 0xFFA500,
      description: '散弹枪模式',
      isInstant: false,
      isTemporary: true
    })
    
    PowerUpConfigService.configs.set(PowerUpType.HOMING, {
      type: PowerUpType.HOMING,
      duration: 10000,
      power: 1,
      color: 0x00FFFF,
      description: '追踪导弹',
      isInstant: false,
      isTemporary: true
    })
    
    PowerUpConfigService.configs.set(PowerUpType.BOMB, {
      type: PowerUpType.BOMB,
      duration: 0,
      power: 1,
      color: 0x800080,
      description: '全屏炸弹',
      isInstant: true,
      isTemporary: false
    })
    
    PowerUpConfigService.configs.set(PowerUpType.SPEED, {
      type: PowerUpType.SPEED,
      duration: 10000,
      power: 1.5,
      color: 0xFFFFFF,
      description: '速度提升',
      isInstant: false,
      isTemporary: true
    })
    
    PowerUpConfigService.configs.set(PowerUpType.HEALTH, {
      type: PowerUpType.HEALTH,
      duration: 0,
      power: 50,
      color: 0xFF69B4,
      description: '生命恢复',
      isInstant: true,
      isTemporary: false
    })
    
    PowerUpConfigService.configs.set(PowerUpType.ARMOR, {
      type: PowerUpType.ARMOR,
      duration: 15000,
      power: 50,
      color: 0xC0C0C0,
      description: '装甲强化',
      isInstant: false,
      isTemporary: true
    })
    
    PowerUpConfigService.configs.set(PowerUpType.GRENADE, {
      type: PowerUpType.GRENADE,
      duration: 0,
      power: 1,
      color: 0x8B4513,
      description: '手榴弹',
      isInstant: true,
      isTemporary: false
    })
    
    PowerUpConfigService.configs.set(PowerUpType.INVINCIBLE, {
      type: PowerUpType.INVINCIBLE,
      duration: 8000,
      power: 1,
      color: 0xFFD700,
      description: '无敌状态',
      isInstant: false,
      isTemporary: true
    })
    
    PowerUpConfigService.configs.set(PowerUpType.LIFE, {
      type: PowerUpType.LIFE,
      duration: 0,
      power: 1,
      color: 0xFF0000,
      description: '额外生命',
      isInstant: true,
      isTemporary: false
    })
  }
  
  // ─── 公开静态方法 ────────────────────────────────────
  
  /**
   * ⭐ 获取道具配置
   */
  static getConfig(type: PowerUpType): IPowerUpConfigData {
    const config = this.configs.get(type)
    if (!config) {
      throw new Error(`未知的道具类型：${type}`)
    }
    return config
  }
  
  /**
   * ⭐ 判断是否是强力道具
   */
  static isPowerful(type: PowerUpType): boolean {
    return [
      PowerUpType.INVINCIBLE,
      PowerUpType.BOMB,
      PowerUpType.LIFE,
      PowerUpType.HOMING
    ].includes(type)
  }
  
  /**
   * ⭐ 从字符串解析道具类型
   */
  static fromString(typeStr: string): PowerUpType {
    return (PowerUpType as any)[typeStr.toUpperCase()] || PowerUpType.STAR
  }
}

/**
 * ⭐ 道具领域服务
 * 
 * @remarks
 * 处理道具的业务逻辑
 * 职责：拾取判断、生命周期判断等领域规则
 */
export class PowerUpDomainService {
  /** 默认存在时长（毫秒） */
  private static readonly DEFAULT_LIFETIME = 15000
  
  /**
   * ⭐ 检查道具是否应该消失
   * 
   * @param data - 道具数据
   * @returns true 表示应该消失
   */
  static shouldDespawn(data: PowerUpData): boolean {
    if (data.isCollected) return true
    return data.getAge() >= this.DEFAULT_LIFETIME
  }
  
  /**
   * ⭐ 获取剩余存在时间（毫秒）
   */
  static getRemainingLifetime(data: PowerUpData): number {
    const age = data.getAge()
    return Math.max(0, this.DEFAULT_LIFETIME - age)
  }
  
  /**
   * ⭐ 标记为已拾取
   * 
   * @param data - 道具数据
   * @returns true 表示成功拾取
   */
  static collect(data: PowerUpData): boolean {
    if (data.isCollected) return false
    
    data.isCollected = true
    Logger.debug(`🎁 [PowerUpDomainService] 拾取 ${data.type} - ${data.description}`)
    return true
  }
}
