// RPG Shooter 塔防融合版 - 敌人系统

import { GameState, Enemy, EnemyType, Turret, Wall } from './types'
import { ENEMY_BASE_STATS, ENEMY_SHOOT_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT } from './config'
import { addCrystals, addExp, addCombo, resetCombo, playerHit } from './state'
import { playSound } from './sounds'
import { wallHit } from './turrets'
import { forceEndWave } from './waves'

// 生成唯一ID
let enemyIdCounter = 0
function generateEnemyId(): string {
  return `enemy_${++enemyIdCounter}`
}

// 创建敌人
export function createEnemy(
  type: EnemyType,
  x: number,
  y: number,
  difficultyMultiplier: number = 1,
  wave: number = 1  // 当前波次
): Enemy {
  const base = ENEMY_BASE_STATS[type]
  
  // 检查是否可以射击（根据波次）
  const shootConfig = (ENEMY_SHOOT_CONFIGS as any)[type]
  const canShoot = shootConfig && wave >= shootConfig.minWave
  
  // 速度随波次提升：每波+5%
  const speedMultiplier = Math.pow(1.05, wave - 1)
  const finalSpeed = base.speed * speedMultiplier
  
  // 伤害随波次提升：每波+8%（基础伤害 * 难度 * 波次系数）
  const waveDamageMultiplier = Math.pow(1.08, wave - 1)
  const finalDamage = Math.floor(base.damage * difficultyMultiplier * waveDamageMultiplier)
  
  return {
    id: generateEnemyId(),
    type,
    x,
    y,
    hp: Math.floor(base.hp * difficultyMultiplier),
    maxHp: Math.floor(base.hp * difficultyMultiplier),
    speed: finalSpeed,
    baseSpeed: finalSpeed,
    damage: finalDamage,
    score: base.score,
    crystals: base.crystals,
    color: base.color,
    shape: getEnemyShape(type),
    frozen: false,
    frozenTimer: 0,
    slowed: false,
    slowTimer: 0,
    pathIndex: 0,
    targetTurret: null,
    
    // 射击能力
    canShoot,
    shootCooldown: canShoot ? (shootConfig.shootCooldown || 3000) : 0,
    lastShot: 0,
    shootRange: canShoot ? (shootConfig.shootRange || 200) : 0
  }
}

// 获取敌人形状
function getEnemyShape(type: EnemyType): string {
  const shapes: Record<EnemyType, string> = {
    basic: 'circle',
    fast: 'triangle',
    tank: 'square',
    exploder: 'star',
    splitter: 'hexagon',
    flyer: 'diamond',
    boss: 'boss'
  }
  return shapes[type]
}

// 从屏幕边缘生成敌人
export function spawnEnemyFromEdge(
  state: GameState,
  type: EnemyType
): void {
  const side = Math.floor(Math.random() * 4)
  let x = 0, y = 0
  
  // 从四个方向生成
  switch (side) {
    case 0: // 上方
      x = Math.random() * CANVAS_WIDTH
      y = -30
      break
    case 1: // 右侧
      x = CANVAS_WIDTH + 30
      y = Math.random() * CANVAS_HEIGHT
      break
    case 2: // 下方
      x = Math.random() * CANVAS_WIDTH
      y = CANVAS_HEIGHT + 30
      break
    case 3: // 左侧
      x = -30
      y = Math.random() * CANVAS_HEIGHT
      break
  }
  
  const enemy = createEnemy(type, x, y, state.difficulty, state.wave)
  state.enemies.push(enemy)
}

// 更新所有敌人
export function updateEnemies(state: GameState, dt: number): void {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i]
    
    // 更新状态计时器
    if (enemy.frozen) {
      enemy.frozenTimer -= dt
      if (enemy.frozenTimer <= 0) {
        enemy.frozen = false
      }
    }
    
    if (enemy.slowed) {
      enemy.slowTimer -= dt
      if (enemy.slowTimer <= 0) {
        enemy.slowed = false
        enemy.speed = enemy.baseSpeed
      }
    }
    
    // 自爆虫寻找目标炮台
    if (enemy.type === 'exploder' && !enemy.targetTurret) {
      enemy.targetTurret = findNearestTurret(state, enemy)
    }
    
    // 移动敌人
    if (!enemy.frozen) {
      moveEnemy(state, enemy, dt)
    }
    
    // 敌人射击（如果可以射击）
    if (enemy.canShoot && !enemy.frozen) {
      updateEnemyShooting(state, enemy, Date.now())
    }
    
    // 检查是否到达终点（玩家位置）
    const distToPlayer = Math.sqrt(
      (enemy.x - state.player.x) ** 2 + 
      (enemy.y - state.player.y) ** 2
    )
    
    if (distToPlayer < 20) {
      // 对玩家造成伤害
      const prevHp = state.player.hp
      playerHit(state, enemy.damage)
      
      // 如果玩家死亡，调用强制结束波次
      if (prevHp > 0 && state.player.hp <= 0) {
        forceEndWave(state)
      }
      
      // 自爆虫爆炸
      if (enemy.type === 'exploder') {
        explodeDamage(state, enemy.x, enemy.y, 80, 60)
      }
      
      // 移除敌人
      state.enemies.splice(i, 1)
      continue
    }
    
    // 检查是否出界（飞行怪可能飞出去）
    if (isOutOfBounds(enemy)) {
      state.enemies.splice(i, 1)
    }
  }
}

// 移动敌人
function moveEnemy(state: GameState, enemy: Enemy, dt: number): void {
  let targetX: number, targetY: number

  // 检查前方是否有城墙阻挡（优先攻击城墙）
  const blockingWall = findBlockingWall(state, enemy)
  if (blockingWall) {
    // 停下来攻击城墙
    attackWall(enemy, blockingWall, state, dt)
    return
  }

  // 自爆虫追踪炮台
  if (enemy.type === 'exploder' && enemy.targetTurret) {
    const turret = state.turrets.find(t => t.id === enemy.targetTurret!.id)
    if (turret) {
      targetX = turret.x
      targetY = turret.y
    } else {
      enemy.targetTurret = null
      targetX = state.player.x
      targetY = state.player.y
    }
  } else {
    // 其他敌人追踪玩家
    targetX = state.player.x
    targetY = state.player.y
  }

  // 计算移动方向
  const dx = targetX - enemy.x
  const dy = targetY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > 0) {
    // 应用减速效果
    const currentSpeed = enemy.slowed ? enemy.speed * 0.5 : enemy.speed

    enemy.x += (dx / dist) * currentSpeed * 60 * dt
    enemy.y += (dy / dist) * currentSpeed * 60 * dt
  }

  // 更新路径索引（用于first优先级）
  enemy.pathIndex++
}

// 寻找挡路的城墙
function findBlockingWall(state: GameState, enemy: Enemy): any {
  const attackRange = 25  // 攻击距离

  for (const wall of state.walls) {
    const halfW = wall.width / 2 + 10  // 加上敌人大小
    const halfH = wall.height / 2 + 10

    // 检查敌人是否在城墙附近
    if (enemy.x >= wall.x - halfW - attackRange &&
        enemy.x <= wall.x + halfW + attackRange &&
        enemy.y >= wall.y - halfH - attackRange &&
        enemy.y <= wall.y + halfH + attackRange) {
      return wall
    }
  }
  return null
}

// 攻击城墙
function attackWall(enemy: Enemy, wall: any, state: GameState, dt: number): void {
  // 敌人对城墙造成伤害（基于敌人大小的攻击间隔）
  const attackInterval = 1.0  // 每秒攻击一次

  // 简化的攻击计时（使用 elapsed 累计）
  if (!enemy.lastShot) enemy.lastShot = 0
  const now = Date.now()

  if (now - enemy.lastShot >= attackInterval * 1000) {
    enemy.lastShot = now

    // 造成伤害
    wall.hp -= enemy.damage
    wall.lastHit = now
    wall.flashTimer = 0.2

    // 伤害数字
    state.floatTexts.push({
      text: `-${enemy.damage}`,
      x: wall.x + (Math.random() - 0.5) * 20,
      y: wall.y - 15,
      life: 1.0,
      color: '#FF4757',
      size: 14,
      vy: -1.2
    })

    // 攻击特效
    for (let i = 0; i < 5; i++) {
      state.particles.push({
        x: wall.x + (Math.random() - 0.5) * wall.width,
        y: wall.y + (Math.random() - 0.5) * wall.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0.5,
        maxLife: 0.5,
        color: '#FF6B6B',
        size: 3
      })
    }

    // 检查城墙是否被摧毁
    if (wall.hp <= 0) {
      const idx = state.walls.indexOf(wall)
      if (idx >= 0) {
        state.walls.splice(idx, 1)

        // 摧毁特效
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 4
          state.particles.push({
            x: wall.x,
            y: wall.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            color: WALL_COLORS[wall.type],
            size: 5 + Math.random() * 3
          })
        }

        state.floatTexts.push({
          text: '城墙摧毁!',
          x: wall.x,
          y: wall.y,
          life: 1.5,
          color: '#FF6B6B',
          size: 18,
          vy: -1.0
        })
      }
    }
  }
}

// 城墙颜色映射（用于特效）
const WALL_COLORS: Record<string, string> = {
  stone: '#8B7355',
  reinforced: '#5A5A6E',
  fortress: '#3D3D5C'
}

// 寻找最近的炮台
function findNearestTurret(state: GameState, enemy: Enemy): Turret | null {
  let nearest: Turret | null = null
  let nearestDist = Infinity
  
  for (const turret of state.turrets) {
    const dist = Math.sqrt((turret.x - enemy.x) ** 2 + (turret.y - enemy.y) ** 2)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = turret
    }
  }
  
  return nearest
}

// 检查是否出界
function isOutOfBounds(enemy: Enemy): boolean {
  const margin = 100
  return (
    enemy.x < -margin ||
    enemy.x > CANVAS_WIDTH + margin ||
    enemy.y < -margin ||
    enemy.y > CANVAS_HEIGHT + margin
  )
}

// 敌人受伤
export function enemyHit(
  state: GameState,
  enemy: Enemy,
  damage: number
): void {
  enemy.hp -= damage
  
  // 更新连击
  state.combo.count++
  state.combo.timer = 2.0  // 2秒内连续击杀算连击
  if (state.combo.count > state.combo.maxCombo) {
    state.combo.maxCombo = state.combo.count
  }
  
  // 屏幕震动（根据伤害强度）
  const shakeIntensity = Math.min(damage / 10, 8)
  state.shakeAmt = shakeIntensity
  
  // 受伤特效 - 更华丽的粒子
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 2
    state.particles.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      color: '#FF6B6B',
      size: 2 + Math.random() * 2
    })
  }
  
  // 显示伤害数字 - 更大更醒目
  const isCritical = Math.random() < 0.1  // 10%暴击率
  const finalDamage = isCritical ? damage * 2 : damage
  
  state.floatTexts.push({
    text: isCritical ? `-${finalDamage}!` : `-${finalDamage}`,
    x: enemy.x + (Math.random() - 0.5) * 20,
    y: enemy.y - 15,
    life: 1.0,
    color: isCritical ? '#FFD700' : '#FF4757',  // 暴击金色
    size: isCritical ? 18 : 14,  // 暴击更大
    vy: -1.2
  })
  
  // 检查死亡
  if (enemy.hp <= 0) {
    enemyDeath(state, enemy)
  } else {
    // 未死亡，播放受击音效
    playSound('enemyHit')
  }
}

// 敌人死亡处理
function enemyDeath(state: GameState, enemy: Enemy): void {
  // ✅ 增加击杀数
  state.resources.kills++
  
  // 增加连击
  state.combo.count++
  state.combo.timer = 2.0
  if (state.combo.count > state.combo.maxCombo) {
    state.combo.maxCombo = state.combo.count
  }
  
  // 计算分数（连击加成）
  const comboMultiplier = 1 + Math.sqrt(Math.min(state.combo.count, 20)) * 0.3
  const scoreGain = Math.floor(enemy.score * comboMultiplier)
  state.resources.score += scoreGain
  
  // 掉落水晶（连击奖励）
  let crystalGain = enemy.crystals
  if (state.combo.count >= 5) {
    crystalGain = Math.floor(crystalGain * 1.5)
  }
  addCrystals(state, crystalGain)
  
  // 给予经验
  addExp(state, enemy.crystals * 2)
  
  // 分裂怪特殊处理
  if (enemy.type === 'splitter') {
    spawnSplitterChildren(state, enemy)
  }
  
  // Boss死亡特效
  if (enemy.type === 'boss') {
    bossDeathEffect(state, enemy)
  }
  
  // 死亡爆炸特效 - 更华丽
  const particleCount = enemy.type === 'boss' ? 30 : 15
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5
    const speed = 3 + Math.random() * 5
    state.particles.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.4,
      maxLife: 1.2,
      color: enemy.color,
      size: 4 + Math.random() * 3
    })
  }
  
  // 连击提示（每5连击显示）
  if (state.combo.count > 0 && state.combo.count % 5 === 0) {
    state.floatTexts.push({
      text: `${state.combo.count} COMBO!`,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2 - 50,
      life: 1.5,
      color: '#FFD700',
      size: 24 + Math.min(state.combo.count, 20),
      vy: -0.5
    })
    
    // 连击时屏幕闪胨
    state.screenFlash = 0.3
  }
  
  // 从数组中移除
  const index = state.enemies.findIndex(e => e.id === enemy.id)
  if (index !== -1) {
    state.enemies.splice(index, 1)
  }

  // 播放死亡音效
  playSound('enemyDie')
}

// 分裂怪生成子代
function spawnSplitterChildren(state: GameState, parent: Enemy): void {
  for (let i = 0; i < 2; i++) {
    const child = createEnemy('basic', parent.x, parent.y, state.difficulty)
    child.hp = 20
    child.maxHp = 20
    child.x += (Math.random() - 0.5) * 40
    child.y += (Math.random() - 0.5) * 40
    state.enemies.push(child)
  }
  
  state.floatTexts.push({
    text: '分裂!',
    x: parent.x,
    y: parent.y - 20,
    life: 1,
    color: '#9B59B6',
    size: 16,
    vy: -0.5
  })
}

// Boss死亡特效
function bossDeathEffect(state: GameState, boss: Enemy): void {
  // 大量粒子爆炸
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 6
    state.particles.push({
      x: boss.x,
      y: boss.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 2,
      maxLife: 2,
      color: ['#FF0000', '#FFD700', '#FF6B6B'][Math.floor(Math.random() * 3)],
      size: 4 + Math.random() * 4
    })
  }
  
  state.shakeAmt = 20
  state.screenFlash = 0.6
  
  state.floatTexts.push({
    text: '🎉 BOSS击败!',
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    life: 3,
    color: '#FFD700',
    size: 28,
    vy: -0.5
  })
}

// 范围伤害（爆炸、地雷等）
export function explodeDamage(
  state: GameState,
  x: number,
  y: number,
  damage: number,
  radius: number
): void {
  for (const enemy of state.enemies) {
    const dist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
    if (dist <= radius) {
      enemyHit(state, enemy, damage)
    }
  }
  
  // 爆炸特效
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color: '#FF4757',
      size: 3 + Math.random() * 3
    })
  }
}

// 应用减速效果
export function applySlow(
  enemy: Enemy,
  slowFactor: number,
  duration: number
): void {
  enemy.slowed = true
  enemy.slowTimer = duration
  enemy.speed = enemy.baseSpeed * slowFactor
}

// 应用冻结效果
export function applyFreeze(
  enemy: Enemy,
  duration: number
): void {
  enemy.frozen = true
  enemy.frozenTimer = duration
}

// 绘制敌人
export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy
): void {
  ctx.save()
  ctx.translate(enemy.x, enemy.y)
  
  // 冻结效果
  if (enemy.frozen) {
    ctx.globalAlpha = 0.7
    ctx.fillStyle = '#87CEEB'
  } else {
    ctx.fillStyle = enemy.color
  }
  
  // 根据类型绘制不同形状
  switch (enemy.shape) {
    case 'circle':
      drawCircle(ctx, 0, 0, 8)  // 从12改为8
      break
    case 'triangle':
      drawTriangle(ctx, 0, 0, 10)  // 从14改为10
      break
    case 'square':
      drawSquare(ctx, 0, 0, 11)  // 从16改为11
      break
    case 'star':
      drawStar(ctx, 0, 0, 10, 5)  // 从14改为10
      break
    case 'hexagon':
      drawHexagon(ctx, 0, 0, 10)  // 从14改为10
      break
    case 'diamond':
      drawDiamond(ctx, 0, 0, 10)  // 从14改为10
      break
    case 'boss':
      drawBoss(ctx, 0, 0, 18)  // 从24改为18
      break
  }
  
  // 血条
  drawHealthBar(ctx, enemy)
  
  // 减速/冻结图标（在translate后的坐标）
  if (enemy.slowed) {
    ctx.fillStyle = '#87CEEB'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('❄️', 10, -18)
  }
  
  ctx.restore()
}

// 绘制圆形
function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制三角形
function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x - size, y + size)
  ctx.lineTo(x + size, y + size)
  ctx.closePath()
  ctx.fill()
}

// 绘制正方形
function drawSquare(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillRect(x - size / 2, y - size / 2, size, size)
}

// 绘制星形
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, outerR: number, points: number): void {
  const innerR = outerR * 0.5
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI * 2 / (points * 2)) * i - Math.PI / 2
    const px = x + Math.cos(angle) * r
    const py = y + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

// 绘制六边形
function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i
    const px = x + Math.cos(angle) * size
    const py = y + Math.sin(angle) * size
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

// 绘制菱形
function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x + size, y)
  ctx.lineTo(x, y + size)
  ctx.lineTo(x - size, y)
  ctx.closePath()
  ctx.fill()
}

// 绘制Boss
function drawBoss(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // 主体
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()
  
  // 眼睛
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(x - 8, y - 5, 6, 0, Math.PI * 2)
  ctx.arc(x + 8, y - 5, 6, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(x - 8, y - 5, 3, 0, Math.PI * 2)
  ctx.arc(x + 8, y - 5, 3, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制血条（在ctx.save/translated之后调用，使用相对于原点的坐标）
function drawHealthBar(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  const barWidth = 24
  const barHeight = 4
  const x = -barWidth / 2  // 相对于已translate的原点
  const y = -20
  
  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(x, y, barWidth, barHeight)
  
  // 血量
  const hpRatio = enemy.hp / enemy.maxHp
  ctx.fillStyle = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757'
  ctx.fillRect(x, y, barWidth * hpRatio, barHeight)
}

// 更新敌人射击
function updateEnemyShooting(
  state: GameState,
  enemy: Enemy,
  currentTime: number
): void {
  // 检查冷却时间
  if (currentTime - enemy.lastShot < enemy.shootCooldown) {
    return
  }
  
  // 获取射击配置
  const shootConfig = (ENEMY_SHOOT_CONFIGS as any)[enemy.type]
  if (!shootConfig) return
  
  // 寻找目标（玩家或最近的炮台）
  let targetX = state.player.x
  let targetY = state.player.y
  let minDist = Math.sqrt((targetX - enemy.x) ** 2 + (targetY - enemy.y) ** 2)
  
  // 如果有炮台，瞄准最近的炮台
  for (const turret of state.turrets) {
    const dist = Math.sqrt((turret.x - enemy.x) ** 2 + (turret.y - enemy.y) ** 2)
    if (dist < minDist && dist <= enemy.shootRange) {
      targetX = turret.x
      targetY = turret.y
      minDist = dist
    }
  }
  
  // 检查是否在射程内
  if (minDist > enemy.shootRange) {
    return
  }
  
  // 计算子弹方向
  const dx = targetX - enemy.x
  const dy = targetY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  if (dist === 0) return
  
  const vx = (dx / dist) * shootConfig.bulletSpeed
  const vy = (dy / dist) * shootConfig.bulletSpeed
  
  // 创建敌人子弹
  state.enemyBullets.push({
    id: `eb_${Date.now()}_${Math.random()}`,
    x: enemy.x,
    y: enemy.y,
    vx,
    vy,
    damage: shootConfig.bulletDamage,
    speed: shootConfig.bulletSpeed,
    color: shootConfig.bulletColor,
    size: shootConfig.bulletSize,
    owner: enemy.id,
    aoeRadius: shootConfig.aoeRadius
  })
  
  // 更新最后射击时间
  enemy.lastShot = currentTime
}
