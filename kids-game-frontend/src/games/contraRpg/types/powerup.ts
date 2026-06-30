export interface Powerup {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'hp' | 'maxHp' | 'rapid' | 'spread' | 'shield'
  vy: number
  icon: string
  color: string
}

export interface PowerupSpawn {
  type: 'health' | 'rapidFire' | 'spreadShot' | 'shield' | 'doubleJump'
  x: number
  delay: number
}