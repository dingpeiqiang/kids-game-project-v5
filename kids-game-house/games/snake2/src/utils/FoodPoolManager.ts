// ============================================================================
// 🍎 食物对象池管理器 - 高性能食物复用
// ============================================================================
// 
// 📌 说明:
//   专门用于管理 FoodEntity 的对象池
//   避免频繁创建/销毁食物导致的 GC 压力
//   显著提升游戏性能（特别是移动端）
// ============================================================================

import { ObjectPool } from './ObjectPool'
import { Food } from '../components/game/entities/Food'
import type { FoodConfig } from '../types/entity'

/**
 * 🎯 食物对象池配置
 */
interface FoodPoolConfig {
  /** 初始容量 */
  initialCapacity: number
  
  /** 最大容量 */
  maxCapacity: number
  
  /** 是否启用调试模式 */
  debugMode: boolean
}

/**
 * 🍎 食物对象池管理器
 * 
 * @remarks
 * 单例模式，全局访问
 * 
 * @example
 * ```typescript
 * // 获取单例
 * const pool = FoodPoolManager.getInstance()
 * 
 * // 初始化
 * pool.initialize({
 *   initialCapacity: 5,
 *   maxCapacity: 20,
 *   debugMode: false
 * })
 * 
 * // 获取食物
 * const food = pool.acquire(x, y, config)
 * 
 * // 释放食物（自动回收到池）
 * food.destroy()
 * ```
 */
export class FoodPoolManager {
  /** 单例实例 */
  private static instance: FoodPoolManager | null = null
  
  /** 食物对象池 */
  private foodPool: ObjectPool<Food> | null = null
  
  /** 配置 */
  private config: FoodPoolConfig = {
    initialCapacity: 5,
    maxCapacity: 20,
    debugMode: false
  }
  
  /** 是否已初始化 */
  private isInitialized: boolean = false
  
  /**
   * 私有构造函数（单例模式）
   */
  private constructor() {}
  
  /**
   * ⭐ 获取单例实例
   */
  public static getInstance(): FoodPoolManager {
    if (!FoodPoolManager.instance) {
      FoodPoolManager.instance = new FoodPoolManager()
    }
    return FoodPoolManager.instance
  }
  
  /**
   * ⭐ 初始化食物池
   * @param config 配置参数
   */
  public initialize(config?: Partial<FoodPoolConfig>): void {
    if (this.isInitialized) {
      console.warn('⚠️ [FoodPool] 已初始化，忽略重复调用')
      return
    }
    
    this.config = { ...this.config, ...config }
    
    // 创建对象池
    this.foodPool = new ObjectPool<Food>({
      create: () => new Food(),
      initialCapacity: this.config.initialCapacity,
      maxCapacity: this.config.maxCapacity,
      autoExpand: true,
      expandStep: 3
    })
    
    this.isInitialized = true
    
    console.log(`✅ [FoodPool] 初始化完成：初始=${this.config.initialCapacity}, 最大=${this.config.maxCapacity}`)
  }
  
  /**
   * ⭐ 从池中获取食物
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param config - 食物配置
   * @returns 食物实体
   */
  public acquire(x: number, y: number, config: FoodConfig): Food | null {
    if (!this.foodPool || !this.isInitialized) {
      console.error('❌ [FoodPool] 未初始化')
      return null
    }
    
    // 从池中获取
    const food = this.foodPool.acquire()
    
    if (!food) {
      console.warn('⚠️ [FoodPool] 池为空且无法扩容')
      return null
    }
    
    // 初始化食物
    food.init(x, y, config)
    
    // 注册释放回调（自动回收到池）
    food.onRelease = () => {
      this.release(food)
    }
    
    if (this.config.debugMode) {
      console.log(`🍎 [FoodPool] 获取食物：类型=${config.type}, 位置=(${x}, ${y})`)
      this.debug()
    }
    
    return food
  }
  
  /**
   * ⭐ 释放食物回池
   * @param food - 要释放的食物
   */
  private release(food: Food): void {
    if (!this.foodPool) return
    
    this.foodPool.release(food)
    
    if (this.config.debugMode) {
      console.log(`♻️ [FoodPool] 释放食物：类型=${food.foodType}`)
      this.debug()
    }
  }
  
  /**
   * 清空所有食物
   * @param force - 是否强制清空
   */
  public clear(force: boolean = false): void {
    if (!this.foodPool) return
    
    this.foodPool.clear(force)
    
    console.log('🧹 [FoodPool] 已清空')
  }
  
  /**
   * 打印调试信息
   */
  public debug(): void {
    if (!this.foodPool) return
    
    this.foodPool.debug('FoodPool')
  }
  
  /**
   * 获取池统计信息
   */
  public getStats() {
    if (!this.foodPool) return null
    
    return this.foodPool.getStats()
  }
  
  /**
   * 清理单例（用于测试或重新初始化）
   */
  public static dispose(): void {
    if (FoodPoolManager.instance) {
      FoodPoolManager.instance.clear(true)
      FoodPoolManager.instance = null
    }
  }
}
