// ============================================================================
// ⚙️ 游戏配置管理组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏的所有配置参数
//   支持难度设置、游戏速度、音量等配置
//   提供配置的加载、保存和动态调整功能
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'

/**
 * ⭐ 难度级别枚举
 */
export enum DifficultyLevel {
  /** 简单模式 */
  EASY = 'easy',
  /** 普通模式 */
  NORMAL = 'normal',
  /** 困难模式 */
  HARD = 'hard',
  /** 专家模式 */
  EXPERT = 'expert'
}

/**
 * ⭐ 游戏配置接口
 */
interface GameConfig {
  /** 难度级别 */
  difficulty: DifficultyLevel
  /** 游戏速度倍率（0.5 - 2.0） */
  gameSpeed: number
  /** 主音量（0 - 1） */
  masterVolume: number
  /** 音乐音量（0 - 1） */
  musicVolume: number
  /** 音效音量（0 - 1） */
  sfxVolume: number
  /** 是否启用粒子效果 */
  enableParticles: boolean
  /** 是否启用屏幕震动 */
  enableScreenShake: boolean
  /** 是否显示 FPS */
  showFPS: boolean
  /** 是否启用连击系统 */
  enableCombo: boolean
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
  /** 单元格大小（像素） */
  cellSize: number
  /** 移动速度（像素/秒） */
  moveSpeed: number
}

/**
 * ⭐ 难度配置接口
 */
interface DifficultyConfig {
  /** 移动速度倍率 */
  speedMultiplier: number
  /** 物品生成概率倍率 */
  spawnRateMultiplier: number
  /** 敌人 AI 强度（1-10） */
  aiIntensity: number
  /** 得分倍率 */
  scoreMultiplier: number
  /** 生命数量 */
  lives: number
  /** 初始连击阈值（毫秒） */
  comboThreshold: number
}

/**
 * ⭐ 游戏配置管理组件参数
 */
interface GameConfigManagerParams {
  /** 默认难度（可选，默认 NORMAL） */
  defaultDifficulty?: DifficultyLevel
  /** 是否自动保存配置（可选，默认 true） */
  autoSave?: boolean
  /** 配置存储键名（可选，默认 'game_config'） */
  storageKey?: string
  /** 是否使用本地存储（可选，默认 true） */
  useLocalStorage?: boolean
}

/**
 * ⭐ 游戏配置管理组件类
 * 
 * @remarks
 * 职责：
 * - 管理游戏配置参数
 * - 支持难度切换和动态调整
 * - 配置的持久化存储
 * - 发送配置变更事件
 * 
 * @example
 * ```typescript
 * const configManager = new GameConfigManager(scene)
 * configManager.init({
 *   defaultDifficulty: DifficultyLevel.NORMAL,
 *   autoSave: true
 * })
 * 
 * // 设置难度
 * configManager.setDifficulty(DifficultyLevel.HARD)
 * 
 * // 获取当前配置
 * const config = configManager.getConfig()
 * ```
 */
export class GameConfigManager extends ComponentBase {
  /** 当前游戏配置 */
  private config: GameConfig
  
  /** 难度配置映射表 */
  private difficultyConfigs: Map<DifficultyLevel, DifficultyConfig> = new Map()
  
  /** 当前参数 */
  private params: GameConfigManagerParams | null = null
  
  /** 配置是否已修改 */
  private isDirty: boolean = false
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'game_config_manager', '配置管理器')
    
    // 初始化默认配置
    this.config = {
      difficulty: DifficultyLevel.NORMAL,
      gameSpeed: 1.0,
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.9,
      enableParticles: true,
      enableScreenShake: true,
      showFPS: false,
      enableCombo: true,
      gridCols: 32,
      gridRows: 18,
      cellSize: 40,
      moveSpeed: 200
    }
    
    // 初始化难度配置
    this.initializeDifficultyConfigs()
  }
  
  /**
   * ⭐ 初始化配置管理组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as GameConfigManagerParams
    
    // 设置默认值
    if (this.params.defaultDifficulty === undefined) {
      this.params.defaultDifficulty = DifficultyLevel.NORMAL
    }
    if (this.params.autoSave === undefined) {
      this.params.autoSave = true
    }
    if (this.params.storageKey === undefined) {
      this.params.storageKey = 'game_config'
    }
    if (this.params.useLocalStorage === undefined) {
      this.params.useLocalStorage = true
    }
    
    // 设置默认难度
    this.config.difficulty = this.params.defaultDifficulty
    
    // 加载保存的配置
    if (this.params.useLocalStorage) {
      this.loadConfig()
    }
    
    console.log(`✅ [ConfigManager] 配置管理器初始化完成`)
    console.log(`   默认难度：${this.params.defaultDifficulty}`)
    console.log(`   自动保存：${this.params.autoSave ? '✓' : '✗'}`)
  }
  
  /**
   * ⭐ 每帧更新（可以处理动态难度调整）
   * 
   * @param _deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled) return
    
    // 可以在这里实现动态难度调整（DDA）
    // 根据玩家表现自动调整难度
  }
  
  /**
   * ⭐ 获取当前游戏配置
   * 
   * @returns 游戏配置对象
   */
  public getConfig(): GameConfig {
    return { ...this.config }
  }
  
  /**
   * ⭐ 获取指定配置项
   * 
   * @param key - 配置项键名
   * @returns 配置值
   */
  public getConfigItem<K extends keyof GameConfig>(key: K): GameConfig[K] {
    return this.config[key]
  }
  
  /**
   * ⭐ 设置配置项
   * 
   * @param key - 配置项键名
   * @param value - 配置值
   * @param emitEvent - 是否发送事件（可选，默认 true）
   */
  public setConfigItem<K extends keyof GameConfig>(
    key: K,
    value: GameConfig[K],
    emitEvent: boolean = true
  ): void {
    const oldValue = this.config[key]
    this.config[key] = value
    this.isDirty = true
    
    if (emitEvent) {
      this.emit({
        type: GameEventType.UI_REFRESH,
        payload: {
          configKey: key,
          oldValue,
          newValue: value
        },
        timestamp: Date.now()
      })
    }
    
    console.log(`⚙️ [ConfigManager] 配置更新：${key} = ${value}`)
    
    // 自动保存
    if (this.params?.autoSave && emitEvent) {
      this.saveConfig()
    }
  }
  
  /**
   * ⭐ 设置难度级别
   * 
   * @param difficulty - 难度级别
   */
  public setDifficulty(difficulty: DifficultyLevel): void {
    const oldDifficulty = this.config.difficulty
    this.config.difficulty = difficulty
    
    // 应用难度配置
    this.applyDifficultyConfig(difficulty)
    
    this.isDirty = true
    
    // 发送难度变更事件
    this.emit({
      type: GameEventType.SCORE_CHANGED,  // 复用分数改变事件，或创建新事件
      payload: {
        difficulty,
        oldDifficulty,
        config: this.getDifficultyConfig(difficulty)
      },
      timestamp: Date.now()
    })
    
    console.log(`🎮 [ConfigManager] 难度调整：${oldDifficulty} → ${difficulty}`)
    
    // 自动保存
    if (this.params?.autoSave) {
      this.saveConfig()
    }
  }
  
  /**
   * ⭐ 获取当前难度级别
   * 
   * @returns 难度级别
   */
  public getDifficulty(): DifficultyLevel {
    return this.config.difficulty
  }
  
  /**
   * ⭐ 获取难度配置
   * 
   * @param difficulty - 难度级别
   * @returns 难度配置对象
   */
  public getDifficultyConfig(difficulty: DifficultyLevel): DifficultyConfig {
    return this.difficultyConfigs.get(difficulty) || this.getDefaultDifficultyConfig()
  }
  
  /**
   * ⭐ 获取当前难度配置
   * 
   * @returns 当前难度配置对象
   */
  public getCurrentDifficultyConfig(): DifficultyConfig {
    return this.getDifficultyConfig(this.config.difficulty)
  }
  
  /**
   * ⭐ 重置为默认配置
   */
  public resetToDefaults(): void {
    this.config = {
      difficulty: this.params?.defaultDifficulty ?? DifficultyLevel.NORMAL,
      gameSpeed: 1.0,
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.9,
      enableParticles: true,
      enableScreenShake: true,
      showFPS: false,
      enableCombo: true,
      gridCols: 32,
      gridRows: 18,
      cellSize: 40,
      moveSpeed: 200
    }
    
    this.isDirty = true
    
    console.log(`🔄 [ConfigManager] 已重置为默认配置`)
    
    // 自动保存
    if (this.params?.autoSave) {
      this.saveConfig()
    }
  }
  
  /**
   * ⭐ 保存配置到本地存储
   */
  public saveConfig(): void {
    if (!this.params?.useLocalStorage) {
      return
    }
    
    try {
      const serialized = JSON.stringify(this.config)
      localStorage.setItem(this.params!.storageKey!, serialized)
      this.isDirty = false
      
      console.log(`💾 [ConfigManager] 配置已保存到本地存储`)
    } catch (error) {
      console.error(`❌ [ConfigManager] 保存配置失败：`, error)
    }
  }
  
  /**
   * ⭐ 从本地存储加载配置
   */
  public loadConfig(): boolean {
    if (!this.params?.useLocalStorage) {
      return false
    }
    
    try {
      const serialized = localStorage.getItem(this.params!.storageKey!)
      
      if (serialized) {
        const loadedConfig = JSON.parse(serialized)
        
        // 合并配置（确保所有字段都存在）
        this.config = {
          ...this.config,
          ...loadedConfig
        }
        
        console.log(`📥 [ConfigManager] 已从本地存储加载配置`)
        return true
      }
      
      return false
    } catch (error) {
      console.error(`❌ [ConfigManager] 加载配置失败：`, error)
      return false
    }
  }
  
  /**
   * ⭐ 获取配置统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    currentDifficulty: DifficultyLevel
    gameSpeed: number
    isDirty: boolean
    hasParticles: boolean
    hasScreenShake: boolean
  } {
    return {
      currentDifficulty: this.config.difficulty,
      gameSpeed: this.config.gameSpeed,
      isDirty: this.isDirty,
      hasParticles: this.config.enableParticles,
      hasScreenShake: this.config.enableScreenShake
    }
  }
  
  /**
   * ⭐ 应用难度配置
   * 
   * @param difficulty - 难度级别
   * @protected
   */
  protected applyDifficultyConfig(difficulty: DifficultyLevel): void {
    const diffConfig = this.getDifficultyConfig(difficulty)
    
    // 应用速度倍率
    this.config.moveSpeed = 200 * diffConfig.speedMultiplier
    
    // 可以根据需要应用其他配置
    // 例如：敌人生成率、AI 强度等
  }
  
  /**
   * ⭐ 初始化难度配置
   * 
   * @protected
   */
  protected initializeDifficultyConfigs(): void {
    // 简单模式
    this.difficultyConfigs.set(DifficultyLevel.EASY, {
      speedMultiplier: 0.7,
      spawnRateMultiplier: 0.8,
      aiIntensity: 2,
      scoreMultiplier: 0.8,
      lives: 5,
      comboThreshold: 5000
    })
    
    // 普通模式
    this.difficultyConfigs.set(DifficultyLevel.NORMAL, {
      speedMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      aiIntensity: 5,
      scoreMultiplier: 1.0,
      lives: 3,
      comboThreshold: 3000
    })
    
    // 困难模式
    this.difficultyConfigs.set(DifficultyLevel.HARD, {
      speedMultiplier: 1.3,
      spawnRateMultiplier: 1.2,
      aiIntensity: 7,
      scoreMultiplier: 1.2,
      lives: 2,
      comboThreshold: 2000
    })
    
    // 专家模式
    this.difficultyConfigs.set(DifficultyLevel.EXPERT, {
      speedMultiplier: 1.6,
      spawnRateMultiplier: 1.5,
      aiIntensity: 10,
      scoreMultiplier: 1.5,
      lives: 1,
      comboThreshold: 1500
    })
  }
  
  /**
   * ⭐ 获取默认难度配置
   * 
   * @returns 默认难度配置对象
   * @protected
   */
  protected getDefaultDifficultyConfig(): DifficultyConfig {
    return {
      speedMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      aiIntensity: 5,
      scoreMultiplier: 1.0,
      lives: 3,
      comboThreshold: 3000
    }
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以响应游戏事件来调整配置
    switch (event.type) {
      case GameEventType.GAME_OVER:
        // 游戏结束时保存配置
        if (this.params?.autoSave) {
          this.saveConfig()
        }
        break
        
      case GameEventType.PAUSE:
        // 暂停时禁用某些特效
        if (event.payload.reason === 'show_message') {
          const oldParticles = this.config.enableParticles
          this.config.enableParticles = false
          
          setTimeout(() => {
            this.config.enableParticles = oldParticles
          }, 1000)
        }
        break
    }
  }
}
