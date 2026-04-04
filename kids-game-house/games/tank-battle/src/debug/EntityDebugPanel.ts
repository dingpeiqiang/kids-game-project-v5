/**
 * 通用实体调试面板
 * 支持显示玩家、敌人等各种实体的属性信息
 */

export interface IEntityDebugData {
  name: string
  type: 'player' | 'enemy' | 'bullet' | 'other'
  entity: any
  customData?: Map<string, any>
}

export class EntityDebugPanel {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private texts: Map<string, Phaser.GameObjects.Text>
  private isVisible: boolean = false
  private updateInterval: number = 100 // 更新间隔（毫秒）
  private lastUpdateTime: number = 0
  private monitoredEntities: Map<string, IEntityDebugData>
  private maxDisplayCount: number = 20 // 最多显示多少个实体

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.texts = new Map()
    this.monitoredEntities = new Map()
    
    // 创建调试面板容器（右侧中间）
    const x = this.scene.scale.width - 320
    const y = 10
    this.container = this.scene.add.container(x, y)
    this.container.setDepth(9999) // 确保在最上层
    this.container.setVisible(false)
  }

  /**
   * 添加要监控的实体
   */
  addEntity(id: string, data: IEntityDebugData): void {
    this.monitoredEntities.set(id, data)
    console.log(`✅ [实体监控] 已添加：${id} (${data.type})`)
  }

  /**
   * 移除监控的实体
   */
  removeEntity(id: string): void {
    this.monitoredEntities.delete(id)
    console.log(`❌ [实体监控] 已移除：${id}`)
  }

  /**
   * 清除所有监控实体
   */
  clearEntities(): void {
    this.monitoredEntities.clear()
    console.log('🧹 [实体监控] 已清空')
  }

  /**
   * 显示调试面板
   */
  show(): void {
    this.container.setVisible(true)
    this.isVisible = true
    console.log('✅ [调试面板] 已开启')
  }

  /**
   * 隐藏调试面板
   */
  hide(): void {
    this.container.setVisible(false)
    this.isVisible = false
    console.log('❌ [调试面板] 已关闭')
  }

  /**
   * 切换调试面板显示状态
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 更新所有实体属性信息
   */
  update(time: number): void {
    if (!this.isVisible) return
    
    // 限制更新频率
    if (time - this.lastUpdateTime < this.updateInterval) return
    this.lastUpdateTime = time

    // 清空旧文本
    this.clear()

    // 标题
    this.setText('title', `🔍 实体监控 (${this.monitoredEntities.size})`, '#ffd700')

    let index = 1
    for (const [id, data] of this.monitoredEntities.entries()) {
      if (index > this.maxDisplayCount) break
      
      const entity = data.entity
      
      // 🔍 详细调试：检查实体状态
      if (!entity) {
        console.warn(`⚠️ [EntityDebugPanel] 实体 ${id} 不存在`)
        continue
      }
      if (!entity.active) {
        console.warn(`⚠️ [EntityDebugPanel] 实体 ${id} 未激活`)
        continue
      }
      if (!entity.visible) {
        console.log(`👁️ [EntityDebugPanel] 实体 ${id} 不可见 (visible=false)`)
      }
      if (entity.alpha < 1) {
        console.log(`🌟 [EntityDebugPanel] 实体 ${id} 透明度：${entity.alpha.toFixed(2)}`)
      }

      // 分隔线
      this.setText(`separator_${id}`, '─────────────────────', '#666666')
      
      // 实体名称和类型
      const typeIcon = this.getTypeIcon(data.type)
      this.setText(`${id}_name`, `${typeIcon} ${data.name}`, '#ffffff')
      
      // 基础属性
      this.setText(`${id}_position`, `📍 (${entity.x.toFixed(0)}, ${entity.y.toFixed(0)})`, '#cccccc')
      this.setText(`${id}_velocity`, `➡️ (${entity.body?.velocity.x.toFixed(0) || 0}, ${entity.body?.velocity.y.toFixed(0) || 0})`, '#cccccc')
      this.setText(`${id}_health`, `❤️ ${entity.health || '?'}`, '#ff6b6b')
      
      // 根据类型显示特定属性
      if (data.type === 'enemy') {
        this.setText(`${id}_enemyType`, `🤖 类型：${entity.enemyType || 'UNKNOWN'}`, '#ffa500')
        this.setText(`${id}_damage`, `⚔️ 伤害：${entity.damage || 10}`, '#ff8c00')
        this.setText(`${id}_speed`, `💨 速度：${entity.speed || 100}`, '#90ee90')
      } else if (data.type === 'player') {
        const playerController = (this.scene as any).playerController

        this.setText(`${id}_armor`, `🛡️ 护甲：${playerController?.data?.armor || 0}`, '#4169e1')
        this.setText(`${id}_shield`, `✨ 护盾：${playerController?.data?.isShieldActive ? '✅' : '❌'}`, '#00ced1')
        this.setText(`${id}_state`, `📊 ${playerController?.data?.state || 'UNKNOWN'}`, '#9370db')
      }
      
      // 渲染状态（详细调试）
      const actualVisible = entity.visible && entity.alpha > 0.1  // 🔧 提高阈值到 0.1，避免误判
      const visibleStatus = actualVisible ? '可见' : '不可见'
      const visibleColor = actualVisible ? '#32cd32' : '#ff4500'
      const activeStatus = entity.active ? '激活' : '未激活'
      const activeColor = entity.active ? '#32cd32' : '#ff4500'
      
      this.setText(`${id}_visible`, `👁️ ${visibleStatus}`, visibleColor)
      this.setText(`${id}_alpha`, `🌟 ${(entity.alpha || 1).toFixed(2)}`, '#da70d6')
      this.setText(`${id}_active`, `✅ ${activeStatus}`, activeColor)

      index++
    }

    if (this.monitoredEntities.size === 0) {
      this.setText('empty', '⚠️ 暂无监控实体', '#ffff00')
    }
  }

  /**
   * 获取类型图标
   */
  private getTypeIcon(type: string): string {
    switch (type) {
      case 'player': return '🎮'
      case 'enemy': return '🤖'
      case 'bullet': return '💥'
      default: return '📦'
    }
  }

  /**
   * 设置文本内容（自动创建或更新）
   */
  private setText(key: string, content: string, color: string = '#ffffff'): void {
    let textObj = this.texts.get(key)
    
    if (!textObj) {
      // 计算 Y 位置（根据 key 在 map 中的顺序）
      const lineHeight = 22
      const index = Array.from(this.texts.keys()).length
      const y = index * lineHeight
      
      // 创建新的文本对象
      textObj = this.scene.add.text(0, y, content, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: color,
        stroke: '#000000',
        strokeThickness: 3
      })
      
      this.container.add(textObj)
      this.texts.set(key, textObj)
    } else {
      textObj.setText(content)
      textObj.setColor(color)
    }
  }

  /**
   * 清除所有文本
   */
  clear(): void {
    this.texts.forEach(text => text.destroy())
    this.texts.clear()
  }

  /**
   * 销毁调试面板
   */
  destroy(): void {
    this.clear()
    this.container.destroy()
  }
}
