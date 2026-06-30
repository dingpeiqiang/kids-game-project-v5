// 游戏核心类型定义

export type SpecialBlockType = 'bonus' | 'bomb' | 'lucky' | 'shrink' | 'expand' | 'slow' | 'freeze' | 'double' | 'shield' | 'none'

export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'sunset' | 'night'

export type CharacterType = 'cat' | 'dog' | 'bird' | 'rabbit' | 'bear' | 'fox'

export type PowerupType = 'widen' | 'slow' | 'perfect' | 'revive' | 'magnet' | 'doubleScore' | 'timeStop' | 'shield' | 'rainbow'

export interface Layer {
  x: number
  w: number
  y: number
  color: string
  special?: SpecialBlockType
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
  rot: number
  rotSpeed: number
}

export interface FloatText {
  text: string
  x: number
  y: number
  life: number
  color: string
  size: number
}

export interface WeatherParticle {
  x: number
  y: number
  speed: number
  type: 'rain' | 'snow'
}

export interface Character {
  x: number
  y: number
  targetX: number
  type: CharacterType
  frame: number
  frameTimer: number
  emotion: 'happy' | 'sad' | 'excited'
}

export interface Bubble {
  x: number
  y: number
  size: number
  speed: number
  wobble: number
  wobbleSpeed: number
  color: string
}

export interface RainbowParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export interface Cloud {
  x: number
  y: number
  speed: number
  size: number
}

export interface Powerup {
  id: string
  type: PowerupType
  icon: string
  name: string
  description: string
  cooldown: number
  duration: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ActivePowerup {
  type: PowerupType
  endTime: number
  level: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  target: number
}

export interface GameEvent {
  type: string
  data: Record<string, any>
  timestamp: number
}

export interface GameState {
  score: number
  layers: number
  combo: number
  isRunning: boolean
  isPaused: boolean
  activePowerups: ActivePowerup[]
  unlockedAchievements: string[]
}

export interface SpecialBlockConfig {
  color: string
  icon: string
  name: string
  probability: number
}

export interface WeatherConfig {
  name: string
  icon: string
  duration: number
}

export interface PowerupConfig {
  type: PowerupType
  icon: string
  name: string
  description: string
  cooldown: number
  duration: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  effect: (game: any) => void
}