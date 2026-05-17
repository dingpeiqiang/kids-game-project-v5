// bubbleShooter 游戏类型定义

export interface BubblePosition {
  bx: number
  by: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export interface FloatingScore {
  x: number
  y: number
  text: string
  color: string
  size: number
  life: number
}

export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  color: number
  powerup?: 'color_bomb' | 'clear_row' | 'extra_shot' | 'multishot' | null
}

export interface Shooter {
  x: number
  y: number
  color: number
  angle: number
}

export interface MatchPosition {
  row: number
  col: number
}
