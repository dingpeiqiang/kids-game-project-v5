// ============================================================================
// 🎮 对象池系统 - 高性能实体复用
// ============================================================================
// 
// 📌 说明:
//   用于频繁创建/销毁的实体（如食物、子弹、粒子）
//   通过复用对象减少内存分配和 GC 压力
//   显著提升游戏性能（特别是移动端）
// ============================================================================

/**
 * ⭐ 可回收对象接口
 */
export interface IPoolable {
  /** 是否激活（使用中） */
  active: boolean
  
  /** 初始化对象 */
  init(...args: any[]): void
  
  /** 重置对象到初始状态 */
  reset(): void
  
  /** 销毁前的清理 */
  onRelease?(): void
}

/**
 * 🎯 对象池配置
 */
export interface ObjectPoolConfig<T extends IPoolable> {
  /** 工厂函数：创建新对象 */
  create: () => T
  
  /** 初始容量 */
  initialCapacity?: number
  
  /** 最大容量（可选，0 表示无限制） */
  maxCapacity?: number
  
  /** 是否自动扩容 */
  autoExpand?: boolean
  
  /** 扩容步长 */
  expandStep?: number
}

/**
 * 🎮 通用对象池类
 * 
 * @remarks
 * 用于管理可复用对象的生命周期
 * 
 * @example
 * ```typescript
 * // 创建食物对象池
 * const foodPool = new ObjectPool<FoodEntity>({
 *   create: () => new FoodEntity(),
 *   initialCapacity: 10,
 *   maxCapacity: 50,
 *   autoExpand: true
 * })
 * 
 * // 获取对象
 * const food = foodPool.acquire()
 * food.init(x, y, config)
 * 
 * // 释放对象回池
 * food.release()
 * ```
 */
export class ObjectPool<T extends IPoolable> {
  /** 空闲对象队列 */
  private available: T[] = []
  
  /** 所有对象（包括使用中的） */
  private allObjects: T[] = []
  
  /** 池中对象数量统计 */
  private stats = {
    totalCreated: 0,      // 总共创建数
    totalAcquired: 0,     // 总共获取数
    totalReleased: 0,     // 总共释放数
    currentActive: 0,     // 当前活跃数
    peakActive: 0         // 峰值活跃数
  }
  
  /** 配置 */
  private config: Required<ObjectPoolConfig<T>>
  
  /**
   * 构造函数
   * @param config 对象池配置
   */
  constructor(config: ObjectPoolConfig<T>) {
    this.config = {
      create: config.create,
      initialCapacity: config.initialCapacity ?? 10,
      maxCapacity: config.maxCapacity ?? 0,
      autoExpand: config.autoExpand ?? true,
      expandStep: config.expandStep ?? 5
    }
    
    // 预创建初始对象
    this.preload(this.config.initialCapacity)
  }
  
  /**
   * ⭐ 从池中获取对象
   * @returns 可用的对象，如果池为空且无法扩容则返回 null
   */
  public acquire(): T | null {
    let obj: T | null = null
    
    // 1. 尝试从空闲队列获取
    if (this.available.length > 0) {
      obj = this.available.pop()!
    }
    // 2. 尝试创建新对象
    else if (this.canCreate()) {
      obj = this.config.create()
      this.allObjects.push(obj)
      this.stats.totalCreated++
    }
    // 3. 尝试自动扩容
    else if (this.config.autoExpand && this.tryExpand()) {
      obj = this.config.create()
      this.allObjects.push(obj)
      this.stats.totalCreated++
    }
    
    // 4. 初始化并返回
    if (obj) {
      obj.active = true
      this.stats.totalAcquired++
      this.stats.currentActive++
      
      // 更新峰值统计
      if (this.stats.currentActive > this.stats.peakActive) {
        this.stats.peakActive = this.stats.currentActive
      }
    }
    
    return obj
  }
  
  /**
   * ⭐ 释放对象回池
   * @param obj - 要释放的对象
   */
  public release(obj: T): void {
    if (!obj || !this.allObjects.includes(obj)) {
      console.warn('⚠️ [ObjectPool] 尝试释放不属于池的对象')
      return
    }
    
    // 调用清理回调
    if (obj.onRelease) {
      obj.onRelease()
    }
    
    // 重置对象状态
    obj.reset()
    obj.active = false
    
    // 回收到空闲队列
    this.available.push(obj)
    
    // 更新统计
    this.stats.totalReleased++
    this.stats.currentActive--
  }
  
  /**
   * 预创建对象
   * @param count - 预创建数量
   */
  public preload(count: number): void {
    for (let i = 0; i < count; i++) {
      if (!this.canCreate()) break
      
      const obj = this.config.create()
      obj.active = false
      this.allObjects.push(obj)
      this.available.push(obj)
      this.stats.totalCreated++
    }
  }
  
  /**
   * 清空对象池
   * @param force - 是否强制清空（即使对象正在使用中）
   */
  public clear(force: boolean = false): void {
    if (force) {
      // 强制清空：销毁所有对象
      this.allObjects.forEach(obj => {
        if (obj.onRelease) obj.onRelease()
      })
      this.allObjects = []
      this.available = []
      this.stats.currentActive = 0
    } else {
      // 非强制：只清空空闲对象
      this.available = []
    }
  }
  
  /**
   * 获取池统计信息
   */
  public getStats() {
    return {
      ...this.stats,
      totalCapacity: this.allObjects.length,
      availableCount: this.available.length,
      utilization: this.stats.currentActive / this.allObjects.length
    }
  }
  
  /**
   * 检查是否可以创建新对象
   */
  private canCreate(): boolean {
    if (this.config.maxCapacity === 0) return true // 无限制
    return this.allObjects.length < this.config.maxCapacity
  }
  
  /**
   * 尝试自动扩容
   */
  private tryExpand(): boolean {
    if (!this.canCreate()) return false
    
    const expandCount = Math.min(
      this.config.expandStep,
      this.config.maxCapacity - this.allObjects.length
    )
    
    return expandCount > 0
  }
  
  /**
   * 打印调试信息
   */
  public debug(message?: string): void {
    const stats = this.getStats()
    const prefix = message ? `[${message}] ` : ''
    
    console.log(`${prefix}🎮 ObjectPool Stats:`, {
      '总创建': stats.totalCreated,
      '总获取': stats.totalAcquired,
      '总释放': stats.totalReleased,
      '当前活跃': stats.currentActive,
      '峰值活跃': stats.peakActive,
      '池容量': stats.totalCapacity,
      '利用率': `${(stats.utilization * 100).toFixed(1)}%`
    })
  }
}
