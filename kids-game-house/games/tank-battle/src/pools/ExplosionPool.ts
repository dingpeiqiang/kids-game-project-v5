// ============================================================================
// 💥 坦克大战 - 爆炸特效对象池
// ============================================================================
// 
// 📌 说明:
//   解决爆炸特效性能问题：
//   - 重复创建（浪费）
//   - 内存泄漏（未回收）
//   - GC 频繁（卡顿）
// ============================================================================

import { RenderManager } from '../managers/RenderManager'

/**
 * ⭐ 爆炸动画配置
 */
interface IExplosionConfig {
  frames: string[]
  frameDuration: number
  scale: number
}

/**
 * ⭐ 爆炸对象池
 */
export class ExplosionPool {
  private scene: Phaser.Scene
  private renderManager: RenderManager
  
  // 对象池
  private pool: Phaser.GameObjects.Sprite[] = []
  private readonly POOL_SIZE = 30  // 预分配 30 个爆炸动画
  
  // 动画配置
  private readonly EXPLOSION_CONFIG: IExplosionConfig = {
    frames: ['explosion_1', 'explosion_2', 'explosion_3'],
    frameDuration: 80,
    scale: 1.0
  }
  
  constructor(scene: Phaser.Scene, renderManager: RenderManager) {
    this.scene = scene
    this.renderManager = renderManager
    
    console.log('💥 [ExplosionPool] 正在初始化...')
    
    // ✅ 预创建对象池
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const sprite = new Phaser.GameObjects.Sprite(scene, -1000, -1000, 'explosion_1')
      sprite.setVisible(false)
      sprite.setActive(false)
      
      // ✅ 添加到场景但不加入容器（独立管理）
      scene.add.existing(sprite)
      
      this.pool.push(sprite)
    }
    
    console.log(`✅ [ExplosionPool] 已预创建 ${this.POOL_SIZE} 个爆炸动画`)
  }
  
  /**
   * ⭐ 播放爆炸动画（复用对象）
   */
  playExplosion(x: number, y: number, size: number = 1): void {
    const sprite = this.getFromPool()
    
    if (!sprite) {
      console.warn('⚠️ 爆炸对象池为空，跳过本次爆炸')
      return
    }
    
    // ✅ 配置爆炸动画
    sprite.setPosition(x, y)
    sprite.setVisible(true)
    sprite.setActive(true)
    sprite.setScale(size, size)
    sprite.setDepth(100)  // ✅ 特效层深度
    
    // ✅ 播放序列帧动画
    const animKey = `explosion_anim_${Date.now()}`
    this.scene.anims.create({
      key: animKey,
      frames: this.EXPLOSION_CONFIG.frames.map(frame => ({ key: frame })),
      frameRate: 1000 / this.EXPLOSION_CONFIG.frameDuration,
      repeat: 0
    })
    
    this.scene.anims.play(animKey, sprite)
    
    // ✅ 动画结束后回收到池中
    sprite.once('animationcomplete', () => {
      this.scene.anims.remove(animKey)
      this.returnToPool(sprite)
    })
    
    // ✅ 超时保护（防止动画卡住）
    this.scene.time.delayedCall(500, () => {
      if (sprite.active) {
        this.scene.anims.remove(animKey)
        this.returnToPool(sprite)
      }
    })
  }
  
  /**
   * ⭐ 从池中获取
   */
  private getFromPool(): Phaser.GameObjects.Sprite | null {
    const sprite = this.pool.find(s => !s.active && !s.visible)
    if (sprite) {
      this.pool = this.pool.filter(s => s !== sprite)
    }
    return sprite || null
  }
  
  /**
   * ⭐ 回收到池
   */
  private returnToPool(sprite: Phaser.GameObjects.Sprite): void {
    sprite.setVisible(false)
    sprite.setActive(false)
    sprite.setPosition(-1000, -1000)  // ✅ 移到视野外
    sprite.setScale(1, 1)
    this.pool.push(sprite)
  }
  
  /**
   * ⭐ 获取池状态
   */
  getPoolStats(): {
    total: number
    available: number
    inUse: number
  } {
    return {
      total: this.POOL_SIZE,
      available: this.pool.length,
      inUse: this.POOL_SIZE - this.pool.length
    }
  }
  
  /**
   * ⭐ 清理所有资源
   */
  destroy(): void {
    console.log('🧹 [ExplosionPool] 清理所有资源...')
    
    this.pool.forEach(sprite => {
      sprite.destroy()
    })
    
    this.pool = []
    console.log('✅ [ExplosionPool] 已清理')
  }
}
