/**
 * Phaser3 通用屏幕适配工具（全项目复用，无依赖）
 * 封装官方 Scale Manager，支持全设备适配
 */

/**
 * Phaser 游戏配置的 scale 字段生成器
 * @param designWidth 设计稿宽度（如：600 竖版/1920 横版）
 * @param designHeight 设计稿高度（如：600 竖版/1080 横版）
 * @returns Phaser 游戏配置的 scale 字段
 */
export const createGameScaleConfig = (designWidth: number, designHeight: number): Phaser.Types.Core.ScaleConfig => {
  return {
    // 1. 基础设计分辨率（你的美术出图尺寸）
    width: designWidth,
    height: designHeight,

    // 2. 适配模式（核心！4种常用模式选1个）
    mode: Phaser.Scale.ENVELOP, // 🔥 推荐：填满屏幕，无黑边（边缘轻微裁剪）
    // FIT：等比缩放（无拉伸，自动黑边，最通用）
    // ENVELOP：填满屏幕（无黑边，边缘轻微裁剪）
    // RESIZE：响应式（画布随屏幕拉伸，全屏填满）
    // NONE：固定尺寸（不适配，需要手动管理）

    // 3. 自动居中（水平+垂直，必开）
    autoCenter: Phaser.Scale.CENTER_BOTH,

    // 4. 扩展父容器
    expandParent: true,

    // 5. 移动端全屏优化
    autoRound: true, // 自动取整像素，避免模糊
    resizeInterval: 100, // 窗口 resize 防抖

    // 6. 最小/最大尺寸限制（防止屏幕过小/过大变形）
    min: { width: 320, height: 480 },
    max: { width: 2560, height: 1440 },
  };
};

/**
 * UI 固定位置适配工具（全项目复用）
 * 用法：UIAnchor.fixedTopLeft(this, 按钮, 20, 20)
 */
export class UIAnchor {
  /**
   * 固定到屏幕左上角
   */
  static fixedTopLeft(
    scene: Phaser.Scene,
    element: Phaser.GameObjects.GameObject,
    offsetX = 0,
    offsetY = 0
  ) {
    if (element instanceof Phaser.GameObjects.Container) {
      element.setPosition(offsetX, offsetY)
    } else if ('setPosition' in element) {
      (element as Phaser.GameObjects.GameObject & { setPosition: (x: number, y: number) => void }).setPosition(offsetX, offsetY)
    }
    if ('setScrollFactor' in element) {
      (element as Phaser.GameObjects.GameObject & { setScrollFactor: (x: number, y?: number) => void }).setScrollFactor(0)
    }
  }

  /**
   * 固定到屏幕右上角
   */
  static fixedTopRight(
    scene: Phaser.Scene,
    element: Phaser.GameObjects.GameObject,
    offsetX = 0,
    offsetY = 0
  ) {
    const { width } = scene.scale.gameSize

    if (element instanceof Phaser.GameObjects.Container) {
      element.setPosition(width - offsetX, offsetY)
      element.setOrigin(1, 0)
    } else if ('setPosition' in element && 'setOrigin' in element) {
      const el = element as Phaser.GameObjects.GameObject & {
        setPosition: (x: number, y: number) => void
        setOrigin: (x: number, y: number) => void
      }
      el.setPosition(width - offsetX, offsetY)
      el.setOrigin(1, 0)
    }

    if ('setScrollFactor' in element) {
      (element as Phaser.GameObjects.GameObject & { setScrollFactor: (x: number, y?: number) => void }).setScrollFactor(0)
    }
  }

  /**
   * 固定到屏幕底部中央
   */
  static fixedBottomCenter(
    scene: Phaser.Scene,
    element: Phaser.GameObjects.GameObject,
    offsetY = 0
  ) {
    const { width, height } = scene.scale.gameSize

    if (element instanceof Phaser.GameObjects.Container) {
      element.setPosition(width / 2, height - offsetY)
      element.setOrigin(0.5, 1)
    } else if ('setPosition' in element && 'setOrigin' in element) {
      const el = element as Phaser.GameObjects.GameObject & {
        setPosition: (x: number, y: number) => void
        setOrigin: (x: number, y: number) => void
      }
      el.setPosition(width / 2, height - offsetY)
      el.setOrigin(0.5, 1)
    }

    if ('setScrollFactor' in element) {
      (element as Phaser.GameObjects.GameObject & { setScrollFactor: (x: number, y?: number) => void }).setScrollFactor(0)
    }
  }

  /**
   * 固定到屏幕中央
   */
  static fixedCenter(
    scene: Phaser.Scene,
    element: Phaser.GameObjects.GameObject
  ) {
    const { width, height } = scene.scale.gameSize

    if (element instanceof Phaser.GameObjects.Container) {
      element.setPosition(width / 2, height / 2)
      element.setOrigin(0.5, 0.5)
    } else if ('setPosition' in element && 'setOrigin' in element) {
      const el = element as Phaser.GameObjects.GameObject & {
        setPosition: (x: number, y: number) => void
        setOrigin: (x: number, y: number) => void
      }
      el.setPosition(width / 2, height / 2)
      el.setOrigin(0.5, 0.5)
    }

    if ('setScrollFactor' in element) {
      (element as Phaser.GameObjects.GameObject & { setScrollFactor: (x: number, y?: number) => void }).setScrollFactor(0)
    }
  }
}

/**
 * 监听屏幕尺寸变化（自动重绘UI）
 */
export const listenScreenResize = (
  scene: Phaser.Scene,
  callback: (width: number, height: number) => void
) => {
  scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
    // 尺寸变化后执行UI重绘
    callback(gameSize.width, gameSize.height)
  })
}
