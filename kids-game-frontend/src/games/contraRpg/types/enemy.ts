export interface EnemySpawn {
  type: 'normal' | 'elite' | 'melee'
  x: number
  y?: number
  /** 触发生成距离（像素）：玩家距此点多远时生成敌人，默认使用全局 TRIGGER_DISTANCE */
  triggerDistance?: number
  quantity?: number
  spacing?: number
  behavior?: 'walk' | 'fly' | 'jump' | 'stationary'
  groupId?: string
  shootInterval?: number
  patrolRange?: number
  flyHeight?: number
  jumpHeight?: number
}

export interface EnemyConfig {
  width: number
  height: number
  hp: number
  speed: number
  shootInterval: number
  score: number
  color: string
}

export interface AttackPattern {
  type: 'single' | 'spread' | 'laser' | 'homing' | 'aoe'
  cooldown: number
  damage: number
  bulletSpeed: number
  bulletCount: number
  angleSpread?: number
  range?: number
  duration?: number
}
