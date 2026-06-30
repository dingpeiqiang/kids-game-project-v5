import { GAME_CONFIG } from './config'
import type { LevelConfig } from './types/level'
import type { Enemy } from './types'
import type { EnemySpawn } from './types/enemy'

import { level1Config } from './levels/level1'
import { level2Config } from './levels/level2'
import { level3Config } from './levels/level3'
import { level4Config } from './levels/level4'

/** 玩家前方多少像素内的生成点会被触发（默认值，可由单个 spawn 的 triggerDistance 覆盖） */
const DEFAULT_TRIGGER_DISTANCE = 400

/** 每帧最多生成敌人数量 */
const MAX_SPAWN_PER_FRAME = 4

/** 同屏最多活动敌人数量 */
const MAX_ACTIVE_ENEMIES = 12

/** 敌人 despawn 后重新生成的冷却帧数（防止快速循环） */
const RESPAWN_COOLDOWN_FRAMES = 120

/** 敌人状态 */
type EnemyState = 'unspawned' | 'active' | 'dead' | 'cooldown'

interface SpawnState {
  spawn: EnemySpawn
  state: EnemyState
  spawnedCount: number
  spawnedEnemyIds: number[]
  cooldownTimer: number
}

export class LevelManager {
  private currentLevel: LevelConfig
  private levelIndex: number

  private spawnStates: SpawnState[] = []
  private activeEnemyCount = 0
  
  // 优化：使用 Map 快速查找敌人 ID 对应的 spawnState
  private enemyIdToSpawnState = new Map<number, SpawnState>()

  // Boss 追踪
  private bossSpawned = false
  private bossDefeated = false

  constructor(initialLevel = 1) {
    this.levelIndex = initialLevel - 1
    this.currentLevel = this.getLevelConfig(initialLevel)
    this.initSpawnStates()
  }

  private getLevelConfig(levelId: number): LevelConfig {
    const levels: Record<number, LevelConfig> = {
      1: level1Config,
      2: level2Config,
      3: level3Config,
      4: level4Config,
    }
    return levels[levelId] || level1Config
  }

  public getCurrentLevel(): LevelConfig {
    return this.currentLevel
  }

  public getSpawnedCount(): number {
    return this.spawnStates.filter(s => s.state !== 'unspawned').length
  }

  public getTotalSpawnCount(): number {
    return this.currentLevel.enemySpawns.length
  }

  public getTotalLevelCount(): number {
    return 4
  }

  /** 当前关卡是否有 Boss */
  public hasBoss(): boolean {
    return this.currentLevel.hasBoss && !!this.currentLevel.bossConfig
  }

  /** Boss 是否已经生成 */
  public isBossSpawned(): boolean {
    return this.bossSpawned
  }

  /** Boss 是否已被击败 */
  public isBossDefeated(): boolean {
    return this.bossDefeated
  }

  /** 标记 Boss 被击败 */
  public markBossDefeated(): void {
    this.bossDefeated = true
  }

  /** 判断玩家是否已到达 Boss 区域 */
  public shouldSpawnBoss(playerX: number): boolean {
    if (!this.hasBoss() || this.bossSpawned) return false
    const bossCfg = this.currentLevel.bossConfig!
    // 玩家到达 Boss 位置前 600px 时触发生成
    return playerX >= bossCfg.x - 600
  }

  /** 生成 Boss 敌人 */
  public spawnBoss(enemies: Enemy[]): Enemy | null {
    if (!this.hasBoss() || this.bossSpawned) return null
    const bossCfg = this.currentLevel.bossConfig!

    const boss: Enemy = {
      id: Date.now() + Math.random(),
      x: bossCfg.x,
      y: 0, // 从顶部降下
      width: 80,
      height: 80,
      hp: bossCfg.hp,
      maxHp: bossCfg.maxHp,
      type: 'boss',
      name: bossCfg.type, // 添加 name 属性，用于差异化渲染
      speed: 0,
      vx: 0,
      vy: 0,
      shootTimer: 0,
      shootInterval: Infinity,
      behavior: 'stationary',
      score: 1000,
      color: '#FF0044',
      recentlyHit: 0,
      enteringArena: true,
      attackPatterns: bossCfg.attackPatterns.map(p => ({
        type: p.type,
        cooldown: p.cooldown,
        damage: p.damage,
        range: p.range,
        duration: p.duration,
      })),
      patternIndex: 0,
      patternTimer: 2000, // 入场后 2 秒开始攻击
    }

    enemies.push(boss)
    this.bossSpawned = true
    return boss
  }

  private initSpawnStates(): void {
    this.spawnStates = this.currentLevel.enemySpawns.map(spawn => ({
      spawn,
      state: 'unspawned',
      spawnedCount: 0,
      spawnedEnemyIds: [],
      cooldownTimer: 0,
    }))
    this.activeEnemyCount = 0
    this.bossSpawned = false
    this.bossDefeated = false
    this.enemyIdToSpawnState.clear()
  }

  public nextLevel(): boolean {
    const nextLevelId = this.levelIndex + 2
    const nextLevel = this.getLevelConfig(nextLevelId)
    if (nextLevel && nextLevel.id !== this.currentLevel.id) {
      this.levelIndex++
      this.currentLevel = nextLevel
      this.initSpawnStates()
      return true
    }
    return false
  }

  public reset(): void {
    this.currentLevel = this.getLevelConfig(this.levelIndex + 1)
    this.initSpawnStates()
  }

  /**
   * 标记敌人死亡（永久死亡）
   */
  public markEnemyDead(enemyId: number): void {
    const spawnState = this.enemyIdToSpawnState.get(enemyId)
    if (spawnState) {
      const index = spawnState.spawnedEnemyIds.indexOf(enemyId)
      if (index !== -1) {
        spawnState.spawnedEnemyIds.splice(index, 1)
      }

      const quantity = spawnState.spawn.quantity || 1
      if (spawnState.spawnedCount >= quantity && spawnState.spawnedEnemyIds.length === 0) {
        spawnState.state = 'dead'
      }

      this.enemyIdToSpawnState.delete(enemyId)
      this.activeEnemyCount = Math.max(0, this.activeEnemyCount - 1)
    }
  }

  /**
   * 标记敌人离开屏幕（进入冷却后可重新生成）
   */
  public markEnemyDespawned(enemyId: number): void {
    const spawnState = this.enemyIdToSpawnState.get(enemyId)
    if (spawnState && spawnState.state === 'active') {
      const index = spawnState.spawnedEnemyIds.indexOf(enemyId)
      if (index !== -1) {
        spawnState.spawnedEnemyIds.splice(index, 1)
      }

      if (spawnState.spawnedEnemyIds.length === 0) {
        spawnState.state = 'cooldown'
        spawnState.spawnedCount = 0
        spawnState.cooldownTimer = RESPAWN_COOLDOWN_FRAMES
      }

      this.enemyIdToSpawnState.delete(enemyId)
      this.activeEnemyCount = Math.max(0, this.activeEnemyCount - 1)
    }
  }

  /**
   * 生成敌人（纯距离触发，无时间延迟）
   *
   * 触发条件：玩家与生成点的距离 <= triggerDistance（前后均可）
   * - 每个 spawn 可单独设置 triggerDistance，否则使用默认值
   * - 敌人出生在相机右边缘（玩家前方），确保始终可见
   * - 敌人 despawn 后，spawn 点重置，玩家回到范围内可再次触发
   */
  public spawnEnemies(enemies: Enemy[], playerX: number, cameraX: number): number {
    let spawnedCount = 0

    // 更新当前活动敌人数量
    this.activeEnemyCount = enemies.filter(e => e.hp > 0).length

    if (this.activeEnemyCount >= MAX_ACTIVE_ENEMIES) {
      return 0
    }

    let spawnedThisFrame = 0

    // 收集所有满足条件的生成点
    const candidates: { spawnState: SpawnState; spawn: EnemySpawn; distance: number }[] = []

    for (const spawnState of this.spawnStates) {
      const spawn = spawnState.spawn

      if (spawnState.state === 'dead') {
        continue
      }

      // 冷却中：递减 timer，归零后恢复为可生成状态
      if (spawnState.state === 'cooldown') {
        spawnState.cooldownTimer--
        if (spawnState.cooldownTimer <= 0) {
          spawnState.state = 'unspawned'
          spawnState.cooldownTimer = 0
        } else {
          continue
        }
      }

      // 计算与玩家的距离（正数 = 敌人在玩家前方，负数 = 敌人在玩家后方）
      const distanceToPlayer = spawn.x - playerX

      // 使用单个 spawn 的 triggerDistance，或默认值
      const triggerDistance = spawn.triggerDistance ?? DEFAULT_TRIGGER_DISTANCE

      // 距离检查：玩家距离生成点 <= triggerDistance（无论前后）
      if (Math.abs(distanceToPlayer) > triggerDistance) {
        continue
      }

      // 检查是否还有需要生成的敌人
      const quantity = spawn.quantity || 1
      const remainingToSpawn = quantity - spawnState.spawnedCount

      if (remainingToSpawn <= 0) {
        spawnState.state = 'active'
        continue
      }

      candidates.push({ spawnState, spawn, distance: Math.abs(distanceToPlayer) })
    }

    // 按距离排序，近的优先
    candidates.sort((a, b) => a.distance - b.distance)

    // 生成敌人
    for (const candidate of candidates) {
      const { spawnState, spawn } = candidate

      if (this.activeEnemyCount >= MAX_ACTIVE_ENEMIES || spawnedThisFrame >= MAX_SPAWN_PER_FRAME) {
        break
      }

      const quantity = spawn.quantity || 1
      const remainingToSpawn = quantity - spawnState.spawnedCount

      if (remainingToSpawn <= 0) {
        continue
      }

      // 敌人出生在屏幕右边缘外侧，形成从右侧走进屏幕的效果
      const spacing = spawn.spacing || 0
      const spawnIndex = spawnState.spawnedCount
      const baseX = cameraX + GAME_CONFIG.CANVAS_WIDTH + 400
      const enemyX = baseX + spawnIndex * spacing

      const enemy = this.createEnemy(spawn.type, enemyX, spawn.behavior)
      enemies.push(enemy)

      spawnState.spawnedCount++
      spawnState.spawnedEnemyIds.push(enemy.id)
      spawnState.state = 'active'
      
      // 建立敌人 ID 到 spawnState 的映射，加速后续查找
      this.enemyIdToSpawnState.set(enemy.id, spawnState)

      this.activeEnemyCount++
      spawnedCount++
      spawnedThisFrame++
    }

    return spawnedCount
  }

  private createEnemy(type: 'normal' | 'elite' | 'melee', x: number, behavior?: string): Enemy {
    const enemyConfigs = {
      normal: { width: 32, height: 40, hp: 2, speed: 2, shootInterval: 2000, score: 100, color: '#ff6600' },
      elite: { width: 36, height: 44, hp: 4, speed: 3, shootInterval: 1500, score: 300, color: '#ff0066' },
      melee: { width: 40, height: 48, hp: 1, speed: 3, shootInterval: Infinity, score: 50, color: '#cc3300' },
    }
    const config = enemyConfigs[type]
    return {
      id: Date.now() + Math.random(),
      x,
      y: 240,
      width: config.width,
      height: config.height,
      hp: config.hp,
      maxHp: config.hp,
      type,
      speed: config.speed,
      vx: type === 'melee' ? -2 : (type === 'elite' ? -1.5 : -1),
      vy: 0,
      shootTimer: config.shootInterval,
      shootInterval: config.shootInterval,
      behavior: (behavior as any) || (type === 'melee' ? 'walk' : 'walk'),
      score: config.score,
      color: config.color,
      recentlyHit: 0,
    }
  }
}