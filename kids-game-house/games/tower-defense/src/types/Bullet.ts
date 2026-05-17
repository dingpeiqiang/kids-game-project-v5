/**
 * 子弹系统类型定义
 */

import type { IEnemy } from './Enemy'

/**
 * 子弹接口
 */
export interface IBullet {
  /** 唯一标识符 */
  readonly id: string
  
  /** 是否激活 */
  readonly isActive: boolean
  
  /** 伤害值 */
  readonly damage: number
  
  /** 飞行速度 */
  readonly speed: number
  
  /**
   * 发射子弹
   * @param startX 起始 X 坐标
   * @param startY 起始 Y 坐标
   * @param target 目标敌人
   */
  fire(startX: number, startY: number, target: IEnemy): void
  
  /**
   * 击中目标
   * @param enemy 被击中的敌人
   */
  onHit(enemy: IEnemy): void
}

/**
 * 子弹池配置
 */
export interface BulletPoolConfig {
  /** 初始池大小 */
  initialSize: number
  
  /** 最大池大小 */
  maxSize: number
  
  /** 自动扩展 */
  autoExpand: boolean
}
