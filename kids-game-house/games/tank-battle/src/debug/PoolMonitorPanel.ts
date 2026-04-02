// ============================================================================
// 📊 对象池监控面板 - 实时显示对象池使用率
// ============================================================================

import { RenderManager } from '../RenderManager'

/**
 * ⭐ 对象池监控数据
 */
interface IPoolMonitorData {
  type: string
  current: number      // 当前使用中数量
  max: number          // 最大容量
  usage: number        // 使用率百分比
  status: 'low' | 'normal' | 'high' | 'critical'
  color: string
}

/**
 * ⭐ 对象池监控面板
 */
export class PoolMonitorPanel {
  private scene: Phaser.Scene
  private renderManager: RenderManager
  private container!: Phaser.GameObjects.Container
  private texts: Map<string, Phaser.GameObjects.Text> = new Map()
  private bars: Map<string, Phaser.GameObjects.Graphics> = new Map()
  private visible: boolean = false
  private updateInterval: number = 500  // 500ms 更新一次
  private lastUpdateTime: number = 0
  
  constructor(scene: Phaser.Scene, renderManager: RenderManager) {
    this.scene = scene
    this.renderManager = renderManager
    
    console.log('📊 [PoolMonitor] 监控面板已创建')
  }
  
  /**
   * ⭐ 初始化监控面板 UI
   */
  init(): void {
    // 创建容器（右上角）
    this.container = this.scene.add.container(10, 10)
    this.container.setDepth(10000)  // 最顶层
    this.container.setVisible(false)
    
    // 背景
    const bg = this.scene.add.rectangle(0, 0, 320, 400, 0x000000, 0.8)
    bg.setOrigin(0, 0)
    this.container.add(bg)
    
    // 标题
    const title = this.scene.add.text(10, 10, '📦 对象池监控', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.container.add(title)
    
    console.log('✅ [PoolMonitor] UI 已初始化')
  }
  
  /**
   * ⭐ 显示/隐藏
   */
  toggle(): void {
    this.visible = !this.visible
    this.container.setVisible(this.visible)
    
    if (this.visible) {
      console.log('👁️ [PoolMonitor] 监控面板已显示')
      this.update()
    } else {
      console.log('🙈 [PoolMonitor] 监控面板已隐藏')
    }
  }
  
  /**
   * ⭐ 更新监控数据
   */
  update(time: number = 0): void {
    if (!this.visible) return
    
    // 限制更新频率
    if (time - this.lastUpdateTime < this.updateInterval) return
    this.lastUpdateTime = time
    
    // 获取最新数据
    const poolData = this.renderManager.getPoolUsageByType()
    
    // 清理旧文本
    this.texts.forEach(text => text.destroy())
    this.bars.forEach(bar => bar.destroy())
    this.texts.clear()
    this.bars.clear()
    
    let yOffset = 40
    
    // 显示每个对象池的状态
    Object.entries(poolData).forEach(([type, data]) => {
      const color = this.getStatusColor(data.status)
      
      // 类型名称
      const typeText = this.scene.add.text(15, yOffset, `${type}:`, {
        fontSize: '12px',
        color: '#ffffff'
      })
      this.container.add(typeText)
      this.texts.set(`${type}_name`, typeText)
      
      // 使用率进度条
      const barWidth = 200
      const barHeight = 16
      const barX = 80
      const barY = yOffset + 2
      
      const barGraphics = this.scene.make.graphics({ x: 0, y: 0 })
      barGraphics.lineStyle(1, 0xffffff, 0.5)
      barGraphics.strokeRect(barX, barY, barWidth, barHeight)
      
      // 填充颜色根据状态变化
      barGraphics.fillStyle(this.hexToNumber(color), 0.8)
      barGraphics.fillRect(barX, barY, barWidth * (data.usage / 100), barHeight)
      
      this.container.add(barGraphics)
      this.bars.set(type, barGraphics)
      
      // 使用率数值
      const usageText = this.scene.add.text(290, yOffset, `${data.usage.toFixed(1)}%`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      this.container.add(usageText)
      this.texts.set(`${type}_usage`, usageText)
      
      // 详细信息
      const detailText = this.scene.add.text(15, yOffset + 18, 
        `${data.current}/${data.max} (状态：${status})`, {
        fontSize: '10px',
        color: '#aaaaaa'
      })
      this.container.add(detailText)
      this.texts.set(`${type}_detail`, detailText)
      
      yOffset += 45
    })
  }
  
  /**
   * ⭐ 获取状态颜色
   */
  private getStatusColor(status: string): string {
    switch (status) {
      case 'low': return '#4ade80'      // 绿色
      case 'normal': return '#60a5fa'   // 蓝色
      case 'high': return '#fbbf24'     // 黄色
      case 'critical': return '#f87171' // 红色
      default: return '#ffffff'
    }
  }
  
  /**
   * ⭐ HEX 转 Number
   */
  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', '0x'))
  }
  
  /**
   * ⭐ 打印详细报告到控制台
   */
  printReport(): void {
    this.renderManager.printStats()
  }
  
  /**
   * ⭐ 销毁
   */
  destroy(): void {
    this.container.destroy()
    this.texts.clear()
    this.bars.clear()
    console.log('🗑️ [PoolMonitor] 监控面板已销毁')
  }
}
