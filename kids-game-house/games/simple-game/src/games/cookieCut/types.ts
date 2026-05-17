/**
 * 切饼干游戏 - 类型定义
 */

export interface CookieTemplate {
  shape: string
  emoji: string
  color: string
}

export interface Cookie {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotSpeed: number
  shape: string
  emoji: string
  color: string
  sliced: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
  rotation?: number
  rotSpeed?: number
  isFalling?: boolean // 标记是否为掉落粒子
  isSparkle?: boolean // 标记是否为闪光粒子
}

export interface Slice {
  x1: number
  y1: number
  x2: number
  y2: number
  life: number
}

export interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  color: string
}

export interface ScorePopup {
  x: number
  y: number
  score: number
  life: number
  combo: number
}

export interface LevelTransition {
  active: boolean
  level: number
  name: string
  progress: number // 0-1
  direction: 'in' | 'out' | 'show'
}

export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  gameDuration: number
  spawnInterval: number
  maxCookies: number
  cookieSizeMin: number
  cookieSizeMax: number
  baseVerticalSpeed: number
  verticalSpeedRange: number
  baseHorizontalSpeed: number
  rotationSpeed: number
}

export interface LevelConfig {
  level: number
  name: string
  description: string
  duration: number
  spawnInterval: number
  maxCookies: number
  verticalSpeed: number
  horizontalSpeed: number
  targetScore: number
  rotationSpeed: number
  cookieSizeMin?: number
  cookieSizeMax?: number
  canvasWidth?: number
  canvasHeight?: number
}
