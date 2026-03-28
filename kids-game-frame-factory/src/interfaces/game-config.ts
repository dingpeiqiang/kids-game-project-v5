// ============================================================================
// 🎮 游戏配置接口定义
// ============================================================================
// 
// 📌 说明:
//   定义游戏配置系统的通用接口
//   支持难度配置、自定义配置、配置合并等功能
// ============================================================================

import type { DifficultyLevel } from '../types/difficulty'

/**
 * ⭐ 游戏配置接口
 * 
 * @remarks
 * 定义了一次完整游戏会话的所有可配置参数
 * 
 * @example
 * ```typescript
 * const config: IGameConfig = {
 *   difficulty: 'normal',
 *   gridCols: 32,
 *   gridRows: 18,
 *   cellSize: 40,
 *   enableDynamicDifficulty: true,
 *   customConfig: {
 *     speed: 250,
 *     initialLength: 4
 *   }
 * }
 * ```
 */
export interface IGameConfig {
  /** 
   * 难度级别
   * 
   * @remarks
   * 可选值：'easy' | 'normal' | 'hard' | 'custom'
   * 默认值：'normal'
   */
  difficulty?: DifficultyLevel
  
  /** 
   * 网格列数
   * 
   * @remarks
   * 游戏区域的水平格子数量
   * 默认值：32
   */
  gridCols?: number
  
  /** 
   * 网格行数
   * 
   * @remarks
   * 游戏区域的垂直格子数量
   * 默认值：18
   */
  gridRows?: number
  
  /** 
   * 单元格大小（像素）
   * 
   * @remarks
   * 每个格子的像素尺寸
   * 默认值：40
   */
  cellSize?: number
  
  /** 
   * 是否启用动态难度调整
   * 
   * @remarks
   * true: 根据玩家表现自动调整难度
   * false: 使用固定难度
   * 默认值：false
   */
  enableDynamicDifficulty?: boolean
  
  /** 
   * 自定义配置（可选）
   * 
   * @remarks
   * 用于覆盖默认难度配置的自定义参数
   * 优先级高于难度预设配置
   */
  customConfig?: CustomGameConfig
  
  /** 
   * 主题 ID（可选）
   * 
   * @remarks
   * 用于指定游戏的视觉主题
   */
  themeId?: string
  
  /** 
   * 其他扩展配置（可选）
   * 
   * @remarks
   * 允许添加游戏特定的配置项
   */
  [key: string]: any
}

/**
 * ⭐ 自定义游戏配置接口
 * 
 * @remarks
 * 定义用户可以自定义的所有游戏参数
 * 这些参数会覆盖难度预设配置
 * 
 * @example
 * ```typescript
 * const custom: CustomGameConfig = {
 *   speed: 300,              // 更快的速度
 *   initialLength: 5,        // 更长的初始长度
 *   normalFoodScore: 15,     // 更高的普通食物得分
 *   bonusFoodScore: 80,      // 更高的奖励食物得分
 *   specialFoodScore: 150    // 更高的特殊食物得分
 * }
 * ```
 */
export interface CustomGameConfig {
  /** 
   * 移动速度（像素/秒）
   * 
   * @remarks
   * 覆盖难度配置中的 speed 字段
   */
  speed?: number
  
  /** 
   * 初始长度
   * 
   * @remarks
   * 游戏开始时蛇的分节数
   * 覆盖难度配置中的 initialLength 字段
   */
  initialLength?: number
  
  /** 
   * 普通物品得分
   * 
   * @remarks
   * 覆盖难度配置中的 normalScore 字段
   */
  normalFoodScore?: number
  
  /** 
   * 奖励物品得分
   * 
   * @remarks
   * 覆盖难度配置中的 bonusScore 字段
   */
  bonusFoodScore?: number
  
  /** 
   * 特殊物品得分
   * 
   * @remarks
   * 覆盖难度配置中的 specialScore 字段
   */
  specialFoodScore?: number
  
  /** 
   * 生成概率（0-1）
   * 
   * @remarks
   * 控制物品生成的频率
   * 覆盖难度配置中的 spawnRate 字段
   */
  spawnRate?: number
  
  /** 
   * 障碍物数量
   * 
   * @remarks
   * 游戏区域中的障碍物数量
   * 覆盖难度配置中的 obstacleCount 字段
   */
  obstacleCount?: number
  
  /** 
   * 其他扩展配置
   * 
   * @remarks
   * 允许添加更多自定义参数
   */
  [key: string]: any
}

/**
 * ⭐ 合并后的游戏配置接口
 * 
 * @remarks
 * 经过优先级处理后的最终配置
 * 优先级：customConfig > difficultyPreset > defaultConfig
 * 
 * @example
 * ```typescript
 * // GameConfigComponent.getCurrentConfig() 返回此类型
 * const mergedConfig: MergedGameConfig = {
 *   speed: 250,              // 可能来自 customConfig
 *   initialLength: 4,        // 可能来自 difficultyPreset
 *   normalScore: 10,         // 可能来自 defaultConfig
 *   bonusScore: 50,
 *   specialScore: 100
 * }
 * ```
 */
export interface MergedGameConfig {
  /** 移动速度（像素/秒） */
  speed: number
  /** 初始长度 */
  initialLength: number
  /** 普通物品得分 */
  normalScore: number
  /** 奖励物品得分 */
  bonusScore: number
  /** 特殊物品得分 */
  specialScore: number
  /** 生成概率（如果有） */
  spawnRate?: number
  /** 障碍物数量（如果有） */
  obstacleCount?: number
  /** 其他配置项 */
  [key: string]: any
}

/**
 * ⭐ 配置变更事件数据
 * 
 * @remarks
 * 当游戏配置改变时触发的事件数据
 */
export interface ConfigChangeEvent {
  /** 变更的配置项名称 */
  key: string
  /** 原值 */
  oldValue: any
  /** 新值 */
  newValue: any
  /** 变更来源（'user' | 'system' | 'dynamic_difficulty'） */
  source: string
  /** 时间戳 */
  timestamp: number
}
