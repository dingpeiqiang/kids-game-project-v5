/**
 * 敌人类类型定义
 */

import type { PathFollower } from './Path'

/**
 * 敌人状态枚举
 */
export enum EnemyState {
  /** 等待生成 */
  WAITING = 'waiting',
  /** 移动中 */
  MOVING = 'moving',
  /** 受到攻击 */
  ATTACKED = 'attacked',
  /** 死亡 */
  DEAD = 'dead'
}

/**
 * 敌人实例接口
 */
export interface IEnemy extends PathFollower {
  /** 唯一标识符 */
  readonly id: string
  
  /** 当前状态 */
  state: EnemyState
  
  /** 是否死亡 */
  readonly isDead: boolean
  
  /** 当前生命值 */
  readonly health: number
  
  /** 最大生命值 */
  readonly maxHealth: number
  
  /** 移动速度 */
  speed: number
  
  /** 击杀奖励 */
  readonly reward: number
  
  /**
   * 受到伤害
   * @param damage 伤害值
   * @returns 是否死亡
   */
  receiveDamage(damage: number): boolean
  
  /**
   * 获取当前速度
   */
  getSpeed(): number
  
  /**
   * 设置速度
   */
  setSpeed(value: number): void
  
  /**
   * 获取生命值百分比 (0-1)
   */
  getHealthPercentage(): number
}

/**
 * 敌人事件回调
 */
export interface EnemyEventCallbacks {
  /** 死亡回调 */
  onDeath?: (enemy: IEnemy) => void
  
  /** 受到伤害回调 */
  onDamageTaken?: (damage: number) => void
  
  /** 到达终点回调 */
  onReachEnd?: (enemy: IEnemy) => void
}
