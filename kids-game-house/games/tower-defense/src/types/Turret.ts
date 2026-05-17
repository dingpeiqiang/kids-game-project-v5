/**
 * 炮塔系统类型定义
 */

import type { IEnemy } from './Enemy'

/**
 * 炮塔状态
 */
export enum TurretState {
  /** 空闲 */
  IDLE = 'idle',
  /** 瞄准中 */
  AIMING = 'aiming',
  /** 射击 */
  FIRING = 'firing',
  /** 冷却中 */
  COOLDOWN = 'cooldown'
}

/**
 * 炮塔接口
 */
export interface ITurret {
  /** 唯一标识符 */
  readonly id: string
  
  /** 当前状态 */
  state: TurretState
  
  /** 射程范围 */
  readonly range: number
  
  /** 伤害值 */
  readonly damage: number
  
  /** 射击间隔 */
  readonly fireRate: number
  
  /** 当前位置 X */
  readonly x: number
  
  /** 当前位置 Y */
  readonly y: number
  
  /**
   * 放置炮塔
   * @param gridX 网格 X 坐标
   * @param gridY 网格 Y 坐标
   */
  place(gridX: number, gridY: number): void
  
  /**
   * 寻找目标
   * @param enemies 敌人列表
   * @returns 锁定的目标
   */
  findTarget(enemies: IEnemy[]): IEnemy | null
  
  /**
   * 射击
   * @param target 目标敌人
   */
  fire(target: IEnemy): void
  
  /**
   * 升级炮塔
   * @param multiplier 升级倍率
   */
  upgrade(multiplier: number): void
}

/**
 * 炮塔升级配置
 */
export interface TurretUpgrade {
  damageMultiplier: number
  rangeMultiplier: number
  fireRateMultiplier: number
  cost: number
}
