// ============================================================================
// 🎨 坦克大战 - 渲染管理器
// ============================================================================
// 
// 📌 说明:
//   统一管理所有渲染对象，解决渲染问题：
//   - 对象泄漏（未清理）
//   - 重复创建（性能浪费）
//   - 层级混乱（遮挡问题）
//   - 闪烁问题（重绘过多）
// ============================================================================

import { IGameManager } from './IGameManager'

/**
 * ⭐ 对象池配置（支持动态调整）
 */
export interface IPoolConfig {
  minSize: number      // 最小容量
  maxSize: number      // 最大容量
  initialSize: number  // 初始容量
  resizeStep: number   // 扩容步长
}

/**
 * ⭐ 渲染层配置
 */
export interface IRenderLayerConfig {
  name: string
  depth: number
  visible: boolean
}

/**
 * ⭐ 渲染对象包装器
 */
export interface IRenderObject {
  id: string
  type: 'sprite' | 'graphics' | 'text' | 'rectangle' | 'circle' | 'particles'
  object: Phaser.GameObjects.GameObject
  layer: string
  createdAt: number
  autoDestroy?: boolean
  lifespan?: number
}

/**
 * ⭐ 渲染管理器
 */
export class RenderManager implements IGameManager {
  private scene: Phaser.Scene
  
  // 渲染层管理
  private layers: Map<string, Phaser.GameObjects.Container> = new Map()
  private layerConfigs: Map<string, IRenderLayerConfig> = new Map()
  
  // 渲染对象追踪
  private renderObjects: Map<string, IRenderObject> = new Map()
  private objectIndex: Map<string, Set<string>> = new Map() // layer -> objectIds
  
  // 对象池优化
  private pools: Map<string, Phaser.GameObjects.GameObject[]> = new Map()
  private poolConfigs: Map<string, IPoolConfig> = new Map()  // ✅ 对象池配置
  
  // 性能统计
  private stats = {
    totalObjects: 0,
    activeObjects: 0,
    pooledObjects: 0,
    lastFrameTime: 0,
    peakUsage: 0,           // ✅ 峰值使用率
    resizeCount: 0,         // ✅ 扩容次数
    shrinkCount: 0,         // ✅ 缩容次数
    pooledByType: {} as Record<string, number>  // ✅ 按类型统计
  }
  
  // ✅ 对象池监控数据
  private poolMetrics = {
    created: 0,     // 累计创建数
    recycled: 0,    // 累计回收数
    expanded: 0,    // 累计扩容数
    shrunk: 0       // 累计缩容数
  }
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  // ===========================================================================
  // 📌 公共 API - 初始化
  // ===========================================================================
  
  /**
   * ⭐ 创建渲染层
   */
  createLayer(name: string, depth: number): void {
    if (this.layers.has(name)) return
    
    const container = this.scene.add.container(0, 0)
    container.setDepth(depth)
    container.setSize(this.scene.cameras.main.width, this.scene.cameras.main.height)
    
    this.layers.set(name, container)
    this.layerConfigs.set(name, { name, depth, visible: true })
    this.objectIndex.set(name, new Set())
  }
  
  /**
   * ⭐ 初始化默认渲染层
   */
  initDefaultLayers(): void {
    // 创建标准渲染层（从底到顶）
    this.createLayer('background', -1000)    // 背景层
    this.createLayer('ground', -500)         // 地面层（墙壁、基地）
    this.createLayer('entities', 0)          // 实体层（坦克、道具）
    this.createLayer('effects', 100)         // 特效层（粒子、爆炸）
    this.createLayer('ui', 500)              // UI 层（分数、生命）
    this.createLayer('overlay', 1000)        // 遮罩层（暂停、结算）
    
    // ✅ 初始化对象池配置（根据游戏规模调整）
    this.configurePool('sprite', { minSize: 20, maxSize: 200, initialSize: 50, resizeStep: 10 })
    this.configurePool('graphics', { minSize: 10, maxSize: 100, initialSize: 30, resizeStep: 5 })
    this.configurePool('text', { minSize: 5, maxSize: 50, initialSize: 20, resizeStep: 5 })
    this.configurePool('rectangle', { minSize: 5, maxSize: 50, initialSize: 15, resizeStep: 5 })
    this.configurePool('circle', { minSize: 5, maxSize: 50, initialSize: 15, resizeStep: 5 })
    this.configurePool('particles', { minSize: 2, maxSize: 20, initialSize: 5, resizeStep: 2 })
    
    // 配置默认对象池
    this.configurePool('sprite', { minSize: 20, maxSize: 200, initialSize: 50, resizeStep: 10 })
    this.configurePool('graphics', { minSize: 10, maxSize: 100, initialSize: 30, resizeStep: 5 })
    this.configurePool('text', { minSize: 5, maxSize: 50, initialSize: 20, resizeStep: 5 })
    this.configurePool('rectangle', { minSize: 5, maxSize: 50, initialSize: 15, resizeStep: 5 })
    this.configurePool('circle', { minSize: 5, maxSize: 50, initialSize: 15, resizeStep: 5 })
    this.configurePool('particles', { minSize: 2, maxSize: 20, initialSize: 5, resizeStep: 2 })
  }

  /**
   * ⭐ 配置对象池
   */
  configurePool(type: string, config: IPoolConfig): void {
    this.poolConfigs.set(type, config)
    
    const pool = this.pools.get(type)
    if (pool) {
      if (pool.length > config.maxSize) {
        const toRemove = pool.splice(config.maxSize)
        toRemove.forEach(obj => obj.destroy())
        this.stats.shrinkCount += toRemove.length
      }
    } else {
      this.pools.set(type, [])
    }
    
    this.stats.pooledByType[type] = this.pools.get(type)?.length || 0
  }
  
  // ===========================================================================
  // 📌 公共 API - 对象创建
  // ===========================================================================
  
  /**
   * ⭐ 创建 Sprite
   */
  createSprite(
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
    layer: string = 'entities'
  ): Phaser.GameObjects.Sprite {
    const container = this.getContainer(layer)
    
    if (!container) {
      throw new Error(`渲染层 ${layer} 不存在`)
    }
    
    const pooled = this.getPooledObject('sprite') as Phaser.GameObjects.Sprite | null
    if (pooled) {
      pooled.setPosition(x, y)
      pooled.setTexture(texture, frame)
      pooled.setVisible(true)
      container.add(pooled)
      return pooled
    }
    
    const sprite = new Phaser.GameObjects.Sprite(this.scene, x, y, texture, frame)
    container.add(sprite)
    
    this.trackRenderObject({
      id: this.generateId('sprite'),
      type: 'sprite',
      object: sprite,
      layer,
      createdAt: Date.now()
    })
    
    return sprite
  }
  
  /**
   * ⭐ 创建 Graphics（带自动清理）
   */
  createGraphics(
    layer: string = 'effects',
    autoDestroy: boolean = false,
    lifespan: number = 0
  ): Phaser.GameObjects.Graphics {
    const container = this.getContainer(layer)
    
    // 尝试从对象池获取
    const pooled = this.getPooledObject('graphics') as Phaser.GameObjects.Graphics | null
    if (pooled) {
      pooled.clear()
      pooled.setVisible(true)
      // 🔧 修复：不要调用 setActive(true)，避免干扰组件系统
      // pooled.setActive(true)  // ❌ 移除
      container?.add(pooled)
      
      const graphics = pooled
      
      this.trackRenderObject({
        id: this.generateId('graphics'),
        type: 'graphics',
        object: graphics,
        layer,
        createdAt: Date.now(),
        autoDestroy,
        lifespan: lifespan > 0 ? lifespan : undefined
      })
      
      return graphics
    }
    
    // 创建新对象
    const graphics = new Phaser.GameObjects.Graphics(this.scene)
    container?.add(graphics)
    
    this.trackRenderObject({
      id: this.generateId('graphics'),
      type: 'graphics',
      object: graphics,
      layer,
      createdAt: Date.now(),
      autoDestroy,
      lifespan: lifespan > 0 ? lifespan : undefined
    })
    
    // 如果设置了自动销毁，创建定时器
    if (autoDestroy && lifespan > 0) {
      const graphicsId = graphics.id.toString()
      this.scene.time.delayedCall(lifespan, () => {
        this.destroyObject(graphicsId)
      })
    }
    
    return graphics
  }
  
  /**
   * ⭐ 创建 Text（带缓存）
   */
  createText(
    x: number,
    y: number,
    text: string,
    style?: Phaser.Types.GameObjects.Text.TextStyle,
    layer: string = 'ui'
  ): Phaser.GameObjects.Text {
    const container = this.getContainer(layer)
    
    // 尝试从对象池获取
    const pooled = this.getPooledObject('text') as Phaser.GameObjects.Text | null
    if (pooled) {
      pooled.setPosition(x, y)
      pooled.setText(text)
      if (style) pooled.setStyle(style)
      pooled.setVisible(true)
      // 🔧 修复：不要调用 setActive(true)，避免干扰组件系统
      // pooled.setActive(true)  // ❌ 移除
      container?.add(pooled)
      
      return pooled
    }
    
    // 创建新对象
    const textObj = new Phaser.GameObjects.Text(this.scene, x, y, text, style || {})
    container?.add(textObj)
    
    this.trackRenderObject({
      id: this.generateId('text'),
      type: 'text',
      object: textObj,
      layer,
      createdAt: Date.now()
    })
    
    return textObj
  }
  
  /**
   * ⭐ 创建 Rectangle
   */
  createRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    alpha: number = 1.0,
    layer: string = 'effects'
  ): Phaser.GameObjects.Rectangle {
    const container = this.getContainer(layer)
    
    const rect = new Phaser.GameObjects.Rectangle(this.scene, x, y, width, height, color, alpha)
    container?.add(rect)
    
    this.trackRenderObject({
      id: this.generateId('rectangle'),
      type: 'rectangle',
      object: rect,
      layer,
      createdAt: Date.now()
    })
    
    return rect
  }
  
  /**
   * ⭐ 创建粒子发射器
   */
  createParticles(
    x: number,
    y: number,
    texture: string,
    config?: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
    layer: string = 'effects'
  ): Phaser.GameObjects.Particles.ParticleEmitterManager {
    const container = this.getContainer(layer)
    
    const particles = new Phaser.GameObjects.Particles.ParticleEmitterManager(this.scene, texture, {
    x,
    y,
    ...config
  })
    container?.add(particles)
    
    this.trackRenderObject({
      id: this.generateId('particles'),
      type: 'particles',
      object: particles,
      layer,
      createdAt: Date.now()
    })
    
    return particles
  }
  
  // ===========================================================================
  // 📌 公共 API - 对象管理
  // ===========================================================================
  
  /**
   * ⭐ 销毁对象
   */
  destroyObject(id: string): void {
    const renderObj = this.renderObjects.get(id)
    if (!renderObj) return
    
    this.recycleObject(renderObj)
    this.renderObjects.delete(id)
    this.objectIndex.get(renderObj.layer)?.delete(id)
    this.stats.activeObjects--
  }

  /**
   * ⭐ 批量销毁同层对象
   */
  destroyLayerObjects(layer: string): void {
    const ids = this.objectIndex.get(layer)
    if (!ids) return
    
    const idsArray = Array.from(ids)
    idsArray.forEach(id => this.destroyObject(id))
  }
  
  /**
   * ⭐ 显示/隐藏层
   */
  setLayerVisible(layer: string, visible: boolean): void {
    const container = this.layers.get(layer)
    if (!container) return
    
    container.setVisible(visible)
    
    const config = this.layerConfigs.get(layer)
    if (config) {
      config.visible = visible
    }
  }
  
  /**
   * ⭐ 清空所有对象
   */
  clearAll(): void {
    this.renderObjects.forEach(obj => {
      obj.object.destroy()
    })
    
    this.renderObjects.clear()
    this.objectIndex.forEach(set => set.clear())
    
    this.pools.forEach(pool => pool.forEach(obj => obj.destroy()))
    this.pools.clear()
    
    this.stats.totalObjects = 0
    this.stats.activeObjects = 0
    this.stats.pooledObjects = 0
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 获取渲染容器
   */
  private getContainer(name: string): Phaser.GameObjects.Container | null {
    return this.layers.get(name) || null
  }
  
  /**
   * 追踪渲染对象
   */
  private trackRenderObject(renderObj: IRenderObject): void {
    this.renderObjects.set(renderObj.id, renderObj)
    this.objectIndex.get(renderObj.layer)?.add(renderObj.id)
    
    this.stats.totalObjects++
    this.stats.activeObjects++
  }
  
  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 回收到对象池
   */
  private recycleObject(renderObj: IRenderObject): void {
    const type = renderObj.type
    const pool = this.pools.get(type) || []
    const config = this.poolConfigs.get(type)
    
    if (pool.length >= (config?.maxSize || 50)) {
      renderObj.object.destroy()
      return
    }
    
    renderObj.object.setVisible(false)
    if (renderObj.object instanceof Phaser.GameObjects.GameObject) {
      renderObj.object.removeFromContainer()
    }
    
    pool.push(renderObj.object)
    this.pools.set(type, pool)
    
    this.stats.pooledObjects++
    this.stats.pooledByType[type] = pool.length
    this.poolMetrics.recycled++
    
    if (config && pool.length > config.minSize && this.stats.activeObjects < config.minSize / 2) {
      this.shrinkPoolIfNeeded(type, config)
    }
  }
  
  /**
   * 🔧 缩容对象池
   */
  private shrinkPoolIfNeeded(type: string, config: IPoolConfig): void {
    const pool = this.pools.get(type)
    if (!pool || pool.length <= config.minSize) return
    
    const toRemoveCount = Math.min(pool.length - config.minSize, config.resizeStep)
    const toRemove = pool.splice(-toRemoveCount)
    
    toRemove.forEach(obj => obj.destroy())
    this.stats.shrinkCount += toRemoveCount
    this.poolMetrics.shrunk += toRemoveCount
  }

  /**
   * 从对象池获取
   */
  private getPooledObject(type: string): Phaser.GameObjects.GameObject | null {
    const pool = this.pools.get(type)
    if (!pool || pool.length === 0) {
      this.expandPool(type)
      return null
    }
    
    const obj = pool.pop()!
    this.pools.set(type, pool)
    
    this.stats.pooledObjects--
    this.stats.pooledByType[type] = pool.length
    this.stats.activeObjects++
    
    const usageRate = this.calculatePoolUsage(type)
    if (usageRate > this.stats.peakUsage) {
      this.stats.peakUsage = usageRate
    }
    
    return obj
  }

  /**
   * 🔧 扩容对象池
   */
  private expandPool(type: string): void {
    const config = this.poolConfigs.get(type)
    if (!config) return
    
    const pool = this.pools.get(type) || []
    
    if (pool.length >= config.maxSize) return
    
    const toAdd = Math.min(config.resizeStep, config.maxSize - pool.length)
    this.stats.resizeCount++
    this.poolMetrics.expanded += toAdd
  }
  
  /**
   * 🔧 计算对象池使用率
   */
  private calculatePoolUsage(type: string): number {
    const config = this.poolConfigs.get(type)
    if (!config) return 0
    
    const pool = this.pools.get(type) || []
    const activeCount = config.initialSize - pool.length
    
    return (activeCount / config.maxSize) * 100
  }
  
  // ===========================================================================
  // 📊 性能监控（公开 API）
  // ===========================================================================
  
  /**
   * ⭐ 获取性能统计
   */
  getStats(): {
    totalObjects: number
    activeObjects: number
    pooledObjects: number
    layers: number
    peakUsage: number
    resizeCount: number
    shrinkCount: number
    poolMetrics: { created: number; recycled: number; expanded: number; shrunk: number }
    poolUsage: Record<string, { size: number; usage: number; config: IPoolConfig }>
  } {
    const poolUsage: Record<string, { size: number; usage: number; config: IPoolConfig }> = {}
    
    this.poolConfigs.forEach((config, type) => {
      const pool = this.pools.get(type) || []
      poolUsage[type] = {
        size: pool.length,
        usage: this.calculatePoolUsage(type),
        config
      }
    })
    
    return {
      totalObjects: this.stats.totalObjects,
      activeObjects: this.stats.activeObjects,
      pooledObjects: this.stats.pooledObjects,
      layers: this.layers.size,
      peakUsage: this.stats.peakUsage,
      resizeCount: this.stats.resizeCount,
      shrinkCount: this.stats.shrinkCount,
      poolMetrics: { ...this.poolMetrics },
      poolUsage
    }
  }
  
  /**
   * ⭐ 打印性能报告
   */
  printStats(): void {
    const stats = this.getStats()
    console.log('📊 [RenderManager] 性能统计:')
    console.log(`   总对象数：${stats.totalObjects}`)
    console.log(`   活跃对象：${stats.activeObjects}`)
    console.log(`   对象池：${stats.pooledObjects}`)
    console.log(`   渲染层：${stats.layers}`)
    console.log(`   峰值使用率：${stats.peakUsage.toFixed(1)}%`)
    console.log(`   扩容次数：${stats.resizeCount}`)
    console.log(`   缩容次数：${stats.shrinkCount}`)
    console.log(`   创建/回收/扩容/缩容：${stats.poolMetrics.created}/${stats.poolMetrics.recycled}/${stats.poolMetrics.expanded}/${stats.poolMetrics.shrunk}`)
  }
  
  /**
   * ⭐ 获取对象池使用率（监控面板用）
   */
  getPoolUsageByType(): Record<string, { current: number; max: number; usage: number; status: 'low' | 'normal' | 'high' | 'critical' }> {
    const result: Record<string, { current: number; max: number; usage: number; status: 'low' | 'normal' | 'high' | 'critical' }> = {}
    
    this.poolConfigs.forEach((config, type) => {
      const pool = this.pools.get(type) || []
      const usage = this.calculatePoolUsage(type)
      const current = config.initialSize - pool.length
      
      // 状态判断
      let status: 'low' | 'normal' | 'high' | 'critical'
      if (usage < 30) status = 'low'
      else if (usage < 60) status = 'normal'
      else if (usage < 85) status = 'high'
      else status = 'critical'
      
      result[type] = { current, max: config.maxSize, usage, status }
    })
    
    return result
  }
  
  // ===========================================================================
  // 🎮 Phaser 生命周期
  // ===========================================================================
  
  update?(_time: number, delta: number): void {
    // 更新性能统计
    this.stats.lastFrameTime = delta
    
    // 检查需要自动销毁的对象
    const now = Date.now()
    this.renderObjects.forEach((obj, id) => {
      if (obj.autoDestroy && obj.lifespan) {
        const age = now - obj.createdAt
        if (age > obj.lifespan) {
          this.destroyObject(id)
        }
      }
    })
  }
}
