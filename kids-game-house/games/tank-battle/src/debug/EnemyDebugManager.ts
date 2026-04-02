/**
 * 敌人调试管理器
 * 自动监控战场上所有敌人的状态
 */

import { EntityDebugPanel } from './EntityDebugPanel'

export class EnemyDebugManager {
  private scene: Phaser.Scene
  private debugPanel: EntityDebugPanel
  private trackedEnemies: Map<string, any>
  private updateInterval: number = 500 // 更新间隔（毫秒）
  private lastUpdateTime: number = 0

  constructor(scene: Phaser.Scene, debugPanel: EntityDebugPanel) {
    this.scene = scene
    this.debugPanel = debugPanel
    this.trackedEnemies = new Map()
  }

  /**
   * 更新敌人监控列表
   */
  update(time: number): void {
    if (time - this.lastUpdateTime < this.updateInterval) return
    this.lastUpdateTime = time

    const enemies = (this.scene as any).enemies?.getChildren() || []
    
    // 清理已死亡的敌人
    for (const [id, enemy] of this.trackedEnemies.entries()) {
      if (!enemy.active) {
        this.debugPanel.removeEntity(id)
        this.trackedEnemies.delete(id)
      }
    }

    // 添加新敌人
    enemies.forEach((enemy: any) => {
      if (!enemy.active) return
      
      // 🔧 关键修复：使用 enemy 的唯一标识，避免每帧生成新 ID
      const id = `enemy_${enemy.entityId || enemy.id || enemy.uuid}`
      
      if (!this.trackedEnemies.has(id)) {
        this.trackedEnemies.set(id, enemy)
        
        this.debugPanel.addEntity(id, {
          name: `${enemy.enemyType || 'UNKNOWN'}`,
          type: 'enemy',
          entity: enemy,
          customData: new Map([
            ['damage', enemy.damage || 10],
            ['speed', enemy.speed || 100],
            ['score', enemy.score || 100]
          ])
        })
        
        console.log(`🤖 [敌人监控] 新增：${id} - ${enemy.enemyType}`)
      }
    })
  }

  /**
   * 清空所有监控
   */
  clear(): void {
    this.trackedEnemies.clear()
    this.debugPanel.clearEntities()
    console.log('🧹 [敌人监控] 已清空')
  }

  /**
   * 获取当前监控的敌人数量
   */
  getTrackedCount(): number {
    return this.trackedEnemies.size
  }
}
