export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: 'normal' | 'moving' | 'breakable'
}