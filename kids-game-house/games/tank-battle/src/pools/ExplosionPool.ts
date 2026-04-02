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
    
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const sprite = new Phaser.GameObjects.Sprite(scene, -1000, -1000, 'explosion_1')
      sprite.setVisible(false)
      scene.add.existing(sprite)
      this.pool.push(sprite)
    }
  }
  
  /**
   * ⭐ 播放爆炸动画
   */
  playExplosion(x: number, y: number, size: number = 1): void {
    const sprite = this.getFromPool()
    
    if (!sprite) return
    
    sprite.setPosition(x, y)
    sprite.setVisible(true)
    sprite.setScale(size, size)
    sprite.setDepth(100)
    
    const animKey = `explosion_anim_${Date.now()}`
    this.scene.anims.create({
      key: animKey,
      frames: this.EXPLOSION_CONFIG.frames.map(frame => ({ key: frame })),
      frameRate: 1000 / this.EXPLOSION_CONFIG.frameDuration,
      repeat: 0
    })
    
    this.scene.anims.play(animKey, sprite)
    
    sprite.once('animationcomplete', () => {
      this.scene.anims.remove(animKey)
      this.returnToPool(sprite)
    })
    
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
    sprite.setPosition(-1000, -1000)
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
    this.pool.forEach(sprite => {
      sprite.destroy()
    })
    this.pool = []
  }
}
