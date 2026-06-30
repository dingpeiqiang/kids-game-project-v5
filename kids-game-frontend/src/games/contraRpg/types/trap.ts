/** 陷阱关卡配置（无 id，由 createTraps 填充） */
export interface TrapConfig {
  type: 'spike' | 'laser' | 'fire' | 'electric'
  x: number
  y: number
  width?: number
  height?: number
  cooldown?: number
  damage?: number
}

/** 陷阱运行时实体 */
export interface Trap {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'spike' | 'laser' | 'fire' | 'electric'
  active: boolean
  cooldown: number
  lastActivated: number
  damage: number
}