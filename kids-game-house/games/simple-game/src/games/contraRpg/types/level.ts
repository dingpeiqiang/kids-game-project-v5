import type { Platform } from './platform'
import type { EnemySpawn } from './enemy'
import type { TrapConfig } from './trap'
import type { PowerupSpawn } from './powerup'
import type { BackgroundConfig } from './background'

export interface LevelExit {
  x: number
  y: number
  width: number
  height: number
}

export interface LevelConfig {
  id: number
  name: string
  description?: string
  
  // 基础配置
  duration?: number // 关卡时长限制（毫秒）
  maxScore?: number // 关卡最高分数
  requiredScore?: number // 过关所需最低分数
  
  // 视觉配置
  background: BackgroundConfig
  
  // 地图布局
  platforms: Platform[]
  
  // 游戏元素配置
  enemySpawns: EnemySpawn[]
  powerupSpawns: PowerupSpawn[]
  traps: TrapConfig[]
  
  // 终点门配置
  exit?: LevelExit
  
  // BOSS配置
  hasBoss: boolean
  bossConfig?: BossConfig
  
  // 难度配置
  difficulty: 'easy' | 'normal' | 'hard' | 'insane'
  enemyDensity?: number // 敌人密度系数
  spawnRate?: number // 敌人生成速率系数
  
  // 特殊效果
  weatherEffects?: WeatherEffect[]
  ambientSounds?: AmbientSound[]
  
  // 性能与限制
  maxEnemiesOnScreen?: number
  particleLimit?: number
  bulletLimit?: number
  
  // 动态难度
  dynamicDifficulty?: boolean
  difficultyScaling?: number
  playerSkillThreshold?: number
  
  // 视口
  cullingDistance?: number
  preloadDistance?: number
  
  // 调试
  debugMode?: boolean
  showHitboxes?: boolean
  showSpawnPoints?: boolean
}

export interface BossConfig {
  type: string
  x: number
  y: number
  hp: number
  maxHp: number
  attackPatterns: AttackPattern[]
  spawnDelay: number
  music?: string
}

export interface AttackPattern {
  type: string
  cooldown: number
  damage: number
  range: number
  duration?: number
}

export interface WeatherEffect {
  type: 'rain' | 'snow' | 'wind' | 'fog'
  intensity: number
  duration?: number
  startDelay?: number
}

export interface AmbientSound {
  type: string
  file: string
  volume: number
  loop: boolean
  delay?: number
  interval?: number
}
