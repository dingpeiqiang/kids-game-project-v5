import Car from './car'
import MainScene from '../scenes/mainScene'

/**
 * 键盘控制器 - 支持方向键和WASD
 */
export default class KeyboardController {
  private scene: MainScene
  private car: Car
  private cursors: any = null
  private keyW: Phaser.Input.Keyboard.Key | null = null
  private keyA: Phaser.Input.Keyboard.Key | null = null
  private keyS: Phaser.Input.Keyboard.Key | null = null
  private keyD: Phaser.Input.Keyboard.Key | null = null
  private keyL: Phaser.Input.Keyboard.Key | null = null
  private keyR: Phaser.Input.Keyboard.Key | null = null
  private lastLPress: number = 0
  private lastRPress: number = 0

  constructor(scene: MainScene, car: Car) {
    this.scene = scene
    this.car = car
    
    // 检查键盘是否可用
    if (this.scene.input.keyboard) {
      this.setupKeyboard()
    }
  }

  private setupKeyboard() {
    // 创建方向键控制器
    this.cursors = this.scene.input.keyboard!.createCursorKeys()
    
    // 创建 WASD 键
    this.keyW = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyA = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyS = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyD = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    
    // 创建功能键
    this.keyL = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L)
    this.keyR = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)
  }

  update() {
    if (!this.cursors) return

    // 重置控制状态
    this.car.gas.right = false
    this.car.gas.left = false

    // 前进控制：右箭头 或 D键 或 W键
    if (this.cursors.right.isDown || this.keyD?.isDown || this.keyW?.isDown) {
      this.car.gas.right = true
    }

    // 后退控制：左箭头 或 A键 或 S键
    if (this.cursors.left.isDown || this.keyA?.isDown || this.keyS?.isDown) {
      this.car.gas.left = true
    }

    // L键 - 打开关卡选择（带防抖）
    const now = Date.now()
    if (this.keyL?.isDown && (now - this.lastLPress) > 500) {
      this.lastLPress = now
      this.scene.openLevelSelect()
    }

    // R键 - 重试当前关卡（带防抖）
    if (this.keyR?.isDown && (now - this.lastRPress) > 500) {
      this.lastRPress = now
      this.scene.retryLevel()
    }
  }

  destroy() {
    // 清理键盘监听
    this.cursors = null
    this.keyW = null
    this.keyA = null
    this.keyS = null
    this.keyD = null
    this.keyL = null
    this.keyR = null
  }
}
