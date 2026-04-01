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
  
  // 性能统计
  private stats = {
    totalObjects: 0,
    activeObjects: 0,
    pooledObjects: 0,
    lastFrameTime: 0
  }
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    console.log('🎨 [RenderManager] 已创建')
  }
  
  // ===========================================================================
  // 📌 公共 API - 初始化
  // ===========================================================================
  
  /**
   * ⭐ 创建渲染层
   */
  createLayer(name: string, depth: number): void {
    if (this.layers.has(name)) {
      console.warn(`⚠️ 渲染层 ${name} 已存在`)
      return
    }
    
    const container = this.scene.add.container(0, 0)
    container.setDepth(depth)
    container.setSize(this.scene.cameras.main.width, this.scene.cameras.main.height)
    
    this.layers.set(name, container)
    this.layerConfigs.set(name, { name, depth, visible: true })
    
    this.objectIndex.set(name, new Set())
    
    console.log(`🎨 [RenderManager] 创建渲染层：${name} (depth: ${depth})`)
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
    
    console.log('✅ [RenderManager] 默认渲染层已创建')
  }
  
  // ===========================================================================
  // 📌 公共 API - 对象创建
  // ===========================================================================
  
  /**
   * ⭐ 创建 Sprite（带自动管理）
   */
  createSprite(
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
    layer: string = 'entities'
  ): Phaser.GameObjects.Sprite {
    console.log(`🎨 [RenderManager] 创建 Sprite: texture=${texture}, layer=${layer}, pos=(${x}, ${y})`)
    
    const container = this.getContainer(layer)
    
    // 🔴 严格模式：容器必须存在
    if (!container) {
      const errorMsg = `❌ [RenderManager] 渲染层 ${layer} 不存在，无法创建 Sprite`
      console.error(errorMsg)
      console.error(`   可用的渲染层：${Array.from(this.layers.keys()).join(', ')}`)
      console.error(`   layers.size = ${this.layers.size}`)
      throw new Error(errorMsg)
    }
    
    // 尝试从对象池获取
    const pooled = this.getPooledObject('sprite') as Phaser.GameObjects.Sprite | null
    if (pooled) {
      console.log(`🎨 [RenderManager] 从对象池获取 Sprite`)
      pooled.setPosition(x, y)
      pooled.setTexture(texture, frame)
      pooled.setVisible(true)
      pooled.setActive(true)
      container.add(pooled)  // 必须成功
      
      return pooled
    }
    
    // 创建新对象
    console.log(`🎨 [RenderManager] 创建新 Sprite`)
    const sprite = new Phaser.GameObjects.Sprite(this.scene, x, y, texture, frame)
    container.add(sprite)  // 必须成功
    
    console.log(`🎨 [RenderManager] Sprite 创建成功: id=${sprite.id}`)
    
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
      pooled.setActive(true)
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
      pooled.setActive(true)
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
   * ⭐ 销毁对象（带清理）
   */
  destroyObject(id: string): void {
    const renderObj = this.renderObjects.get(id)
    if (!renderObj) {
      console.warn(`⚠️ 对象 ${id} 不存在`)
      return
    }
    
    // 回收到对象池
    this.recycleObject(renderObj)
    
    // 从追踪列表移除
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
    
    // 转换为数组避免遍历中删除
    const idsArray = Array.from(ids)
    idsArray.forEach(id => this.destroyObject(id))
    
    console.log(`🗑️ [RenderManager] 清理层 ${layer}: ${idsArray.length} 个对象`)
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
    console.log('🧹 [RenderManager] 清空所有渲染对象')
    
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
    const container = this.layers.get(name)
    if (!container) {
      console.error(`❌ 渲染层 ${name} 不存在`)
    }
    return container
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
    const pool = this.pools.get(renderObj.type) || []
    
    // 限制对象池大小
    if (pool.length < 50) {
      renderObj.object.setVisible(false)
      renderObj.object.setActive(false)
      
      // 从容器移除但保留对象
      if (renderObj.object instanceof Phaser.GameObjects.GameObject) {
        renderObj.object.removeFromContainer()
      }
      
      pool.push(renderObj.object)
      this.pools.set(renderObj.type, pool)
      
      this.stats.pooledObjects++
    } else {
      // 对象池已满，直接销毁
      renderObj.object.destroy()
    }
  }
  
  /**
   * 从对象池获取
   */
  private getPooledObject(type: string): Phaser.GameObjects.GameObject | null {
    const pool = this.pools.get(type)
    if (!pool || pool.length === 0) return null
    
    const obj = pool.pop()!
    this.pools.set(type, pool)
    
    this.stats.pooledObjects--
    return obj
  }
  
  // ===========================================================================
  // 📊 性能监控
  // ===========================================================================
  
  /**
   * 获取性能统计
   */
  getStats(): {
    totalObjects: number
    activeObjects: number
    pooledObjects: number
    layers: number
  } {
    return {
      totalObjects: this.stats.totalObjects,
      activeObjects: this.stats.activeObjects,
      pooledObjects: this.stats.pooledObjects,
      layers: this.layers.size
    }
  }
  
  /**
   * 打印性能报告
   */
  printStats(): void {
    const stats = this.getStats()
    console.log('📊 [RenderManager] 性能统计:')
    console.log(`   总对象数：${stats.totalObjects}`)
    console.log(`   活跃对象：${stats.activeObjects}`)
    console.log(`   对象池：${stats.pooledObjects}`)
    console.log(`   渲染层：${stats.layers}`)
    
    this.objectIndex.forEach((ids, layer) => {
      if (ids.size > 0) {
        console.log(`   ${layer}: ${ids.size} 个对象`)
      }
    })
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
