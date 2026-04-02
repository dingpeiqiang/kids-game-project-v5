/**
 * 顶部调试工具栏管理器
 * 统一管理玩家和实体调试面板的显示/隐藏
 */

export class TopDebugToolbarManager {
  private scene: Phaser.Scene
  private toolbarContainer: Phaser.GameObjects.Container
  private debugButton!: Phaser.GameObjects.Text
  private isDebugPanelVisible: boolean = true  // 🔧 默认为 true，打开状态
  
  // 工具栏配置
  private readonly CONFIG = {
    x: 0,
    y: 10,  // 顶部 Y 坐标
    buttonWidth: 140,
    buttonHeight: 36,
    bgColor: 0x2d3748,
    hoverColor: 0x4a5568,
    activeColor: 0xe53e3e,  // 激活时的红色
    textColor: '#ffffff',
    fontSize: '14px'
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    // 创建工具栏容器（固定在屏幕顶部中间）
    const screenWidth = this.scene.scale.width
    this.CONFIG.x = (screenWidth - this.CONFIG.buttonWidth) / 2
    
    this.toolbarContainer = this.scene.add.container(this.CONFIG.x, this.CONFIG.y)
    this.toolbarContainer.setDepth(10000) // 确保在最上层
    
    // 创建调试按钮
    this.createDebugButton()
    
    // 🔧 默认打开调试面板
    if (this.isDebugPanelVisible) {
      const entityPanel = (this.scene as any).entityDebugPanel
      const playerPanel = (this.scene as any).playerDebugPanel
      
      if (entityPanel && playerPanel) {
        entityPanel.show()
        playerPanel.show()
        console.log('✅ [顶部工具栏] 调试面板已默认开启')
      }
    }
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
      this.isDebugPanelVisible ? this.CONFIG.activeColor : this.CONFIG.bgColor
    ).setOrigin(0.5)
    
    // 圆角边框
    bg.setStrokeStyle(2, 0x4a5568)
    
    // 按钮文字（默认显示关闭状态，因为面板已打开）
    this.debugButton = this.scene.add.text(
      this.CONFIG.buttonWidth / 2,
      this.CONFIG.buttonHeight / 2,
      this.isDebugPanelVisible ? '❌ 关闭调试' : '🔍 调试监控',
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
      if (!this.isDebugPanelVisible) {
        bg.setFillStyle(this.CONFIG.hoverColor)
      }
      this.scene.input.setDefaultCursor('pointer')
    })
    
    this.toolbarContainer.on('pointerout', () => {
      if (!this.isDebugPanelVisible) {
        bg.setFillStyle(this.CONFIG.bgColor)
      }
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
    
    console.log('✅ [顶部工具栏] 调试按钮已创建（默认开启）')
  }

  /**
   * 切换调试面板显示状态
   */
  private toggleDebugPanel(): void {
    const entityPanel = (this.scene as any).entityDebugPanel
    const playerPanel = (this.scene as any).playerDebugPanel
    
    if (!entityPanel || !playerPanel) {
      console.warn('⚠️ [工具栏] 调试面板未初始化')
      return
    }
    
    this.isDebugPanelVisible = !this.isDebugPanelVisible
    
    if (this.isDebugPanelVisible) {
      // 显示面板
      entityPanel.show()
      playerPanel.show()
      this.debugButton.setText('❌ 关闭调试')
      this.debugButton.setColor('#ffffff')
      
      // 更新背景色为激活状态
      const bg = this.toolbarContainer.first as Phaser.GameObjects.Rectangle
      if (bg) {
        bg.setFillStyle(this.CONFIG.activeColor)
      }
      
      console.log('✅ [顶部工具栏] 调试面板已显示')
    } else {
      // 隐藏面板
      entityPanel.hide()
      playerPanel.hide()
      this.debugButton.setText('🔍 调试监控')
      this.debugButton.setColor(this.CONFIG.textColor)
      
      // 恢复背景色
      const bg = this.toolbarContainer.first as Phaser.GameObjects.Rectangle
      if (bg) {
        bg.setFillStyle(this.CONFIG.bgColor)
      }
      
      console.log('❌ [顶部工具栏] 调试面板已隐藏')
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
