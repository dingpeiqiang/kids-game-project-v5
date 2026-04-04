/**
 * 游戏内工具栏 UI 管理器
 * 提供悬浮按钮式的调试工具控制
 */

import { Logger } from '../utils/Logger'

export class GameToolbarManager {
  private scene: Phaser.Scene
  private toolbarContainer: Phaser.GameObjects.Container
  private debugButton!: Phaser.GameObjects.Text
  private isDebugPanelVisible: boolean = false
  
  // 工具栏配置
  private readonly CONFIG = {
    x: 10,  // 左下角 X 坐标
    y: 0,   // Y 坐标（会在 create 中设置为底部）
    buttonWidth: 120,
    buttonHeight: 36,
    bgColor: 0x2d3748,
    hoverColor: 0x4a5568,
    textColor: '#ffffff',
    fontSize: '14px',
    cornerRadius: 6
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    // 创建工具栏容器（固定在屏幕左下角）
    const screenHeight = this.scene.scale.height
    this.CONFIG.y = screenHeight - this.CONFIG.buttonHeight - 10
    
    this.toolbarContainer = this.scene.add.container(0, this.CONFIG.y)
    this.toolbarContainer.setDepth(10000) // 确保在最上层
    this.toolbarContainer.setSize(this.CONFIG.buttonWidth, this.CONFIG.buttonHeight)
    
    // 创建调试面板按钮
    this.createDebugButton()
  }

  /**
   * 创建调试按钮
   */
  private createDebugButton(): void {
    // 按钮背景
    const bg = this.scene.add.rectangle(
      this.CONFIG.buttonWidth / 2,
      this.CONFIG.buttonHeight / 2,
      this.CONFIG.buttonWidth,
      this.CONFIG.buttonHeight,
      this.CONFIG.bgColor
    ).setOrigin(0.5)
    
    // 圆角效果（使用 mask 或简单矩形）
    bg.setStrokeStyle(2, 0x4a5568)
    
    // 按钮文字
    this.debugButton = this.scene.add.text(
      this.CONFIG.buttonWidth / 2,
      this.CONFIG.buttonHeight / 2,
      '🐛 调试监控',
      {
        fontFamily: 'Arial',
        fontSize: this.CONFIG.fontSize,
        color: this.CONFIG.textColor
      }
    ).setOrigin(0.5)
    
    // 添加到容器
    this.toolbarContainer.add(bg)
    this.toolbarContainer.add(this.debugButton)
    
    // 使整个容器可交互
    this.toolbarContainer.setInteractive(new Phaser.Geom.Rectangle(
      0, 0, this.CONFIG.buttonWidth, this.CONFIG.buttonHeight
    ), (rect: any, x: number, y: number) => {
      return x >= 0 && x <= rect.width && y >= 0 && y <= rect.height
    })
    
    // 鼠标悬停效果
    this.toolbarContainer.on('pointerover', () => {
      bg.setFillStyle(this.CONFIG.hoverColor)
      this.scene.input.setDefaultCursor('pointer')
    })
    
    this.toolbarContainer.on('pointerout', () => {
      bg.setFillStyle(this.CONFIG.bgColor)
      this.scene.input.setDefaultCursor('default')
    })
    
    // 点击事件 - 切换调试面板
    this.toolbarContainer.on('pointerdown', () => {
      this.toggleDebugPanel()
      
      // 点击反馈动画
      this.scene.tweens.add({
        targets: [bg, this.debugButton],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: 'Power2'
      })
    })
    
    Logger.debug('✅ [工具栏] 调试按钮已创建')
  }

  /**
   * 切换调试面板显示状态
   */
  private toggleDebugPanel(): void {
    const entityPanel = (this.scene as any).entityDebugPanel
    const playerPanel = (this.scene as any).playerDebugPanel
    
    if (!entityPanel || !playerPanel) {
      Logger.warn('⚠️ [工具栏] 调试面板未初始化')
      return
    }
    
    this.isDebugPanelVisible = !this.isDebugPanelVisible
    
    if (this.isDebugPanelVisible) {
      // 显示面板
      entityPanel.show()
      playerPanel.show()
      this.debugButton.setText('❌ 关闭调试')
      this.debugButton.setColor('#ff6b6b')
      Logger.debug('✅ [工具栏] 调试面板已显示')
    } else {
      // 隐藏面板
      entityPanel.hide()
      playerPanel.hide()
      this.debugButton.setText('🐛 调试监控')
      this.debugButton.setColor(this.CONFIG.textColor)
      Logger.debug('❌ [工具栏] 调试面板已隐藏')
    }
  }

  /**
   * 显示工具栏
   */
  show(): void {
    this.toolbarContainer.setVisible(true)
  }

  /**
   * 隐藏工具栏
   */
  hide(): void {
    this.toolbarContainer.setVisible(false)
  }

  /**
   * 设置工具栏位置
   */
  setPosition(x: number, y: number): void {
    this.toolbarContainer.setPosition(x, y)
  }

  /**
   * 获取当前状态
   */
  isPanelVisible(): boolean {
    return this.isDebugPanelVisible
  }

  /**
   * 销毁工具栏
   */
  destroy(): void {
    this.toolbarContainer.destroy(true)
  }
}
