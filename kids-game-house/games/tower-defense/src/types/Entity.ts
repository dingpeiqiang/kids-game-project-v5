/**
 * 游戏实体接口定义
 * 与 Phaser 3.90 的 API 兼容
 */

/**
 * 游戏实体基本接口
 */
export interface IGameEntity {
  /** 唯一标识符 */
  readonly id: string
  
  /** 是否激活 */
  active: boolean
  
  /** 是否可见 */
  visible: boolean
  
  /** X 坐标 */
  x: number
  
  /** Y 坐标 */
  y: number
  
  /** 旋转角度 */
  rotation: number
  
  /** 深度 */
  depth: number
  
  /**
   * 设置激活状态
   */
  setActive(value: boolean): void
  
  /**
   * 设置可见状态
   */
  setVisible(value: boolean): void
  
  /**
   * 设置位置
   */
  setPosition(x: number, y: number): void
  
  /**
   * 设置旋转角度
   */
  setRotation(radians: number): void
  
  /**
   * 设置深度
   */
  setDepth(value: number): void
  
  /**
   * 更新方法（每帧调用）
   */
  update(time: number, delta: number): void
}
