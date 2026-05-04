// RPG Shooter 塔防融合版 - 炮台系统

import { GameState, Turret, TurretType, Enemy } from './types'
import { TURRET_CONFIGS, MAX_TURRETS, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, SCALE_RATIO } from './config'
import { spendCrystals } from './state'
import { playSound } from './sounds'

// 生成唯一ID
let turretIdCounter = 0
function generateTurretId(): string {
  return `turret_${++turretIdCounter}`
}

// 检查是否可以建造炮台
export function canPlaceTurret(
  state: GameState,
  x: number,
  y: number,
  turretType: TurretType
): { canPlace: boolean; reason?: string } {
  const config = TURRET_CONFIGS[turretType]
  
  // 检查资源
  if (state.resources.crystals < config.cost) {
    return { canPlace: false, reason: '水晶不足' }
  }
  
  // 检查最大数量
  if (state.turrets.length >= MAX_TURRETS) {
    return { canPlace: false, reason: '已达最大数量' }
  }
  
  // 检查边界
  const margin = 20
  if (x < margin || x > CANVAS_WIDTH - margin || 
      y < margin || y > CANVAS_HEIGHT - margin) {
    return { canPlace: false, reason: '超出边界' }
  }
  
  // 检查是否与其他炮台重叠
  for (const turret of state.turrets) {
    const dist = Math.sqrt((turret.x - x) ** 2 + (turret.y - y) ** 2)
    if (dist < 30) {  // 最小间距30像素
      return { canPlace: false, reason: '距离太近' }
    }
  }
  
  // 检查是否与陷阱重叠
  for (const trap of state.traps) {
    const dist = Math.sqrt((trap.x - x) ** 2 + (trap.y - y) ** 2)
    if (dist < 25) {
      return { canPlace: false, reason: '与陷阱重叠' }
    }
  }
  
  return { canPlace: true }
}

// 建造炮台
export function placeTurret(
  state: GameState,
  x: number,
  y: number,
  turretType: TurretType,
  targetLevel: number = 1
): boolean {
  const check = canPlaceTurret(state, x, y, turretType)
  if (!check.canPlace) {
    if (check.reason) {
      state.floatTexts.push({
        text: check.reason,
        x,
        y: y - 20,
        life: 1.5,
        color: '#FF4757',
        size: 14,
        vy: -0.5
      })
    }
    return false
  }
  
  const config = TURRET_CONFIGS[turretType]
  
  // 计算总成本（基础 + 升级费用）
  let totalCost = config.cost
  for (const upg of config.upgradePath) {
    if (upg.level <= targetLevel) {
      totalCost += upg.cost
    }
  }
  
  // 消耗资源
  if (!spendCrystals(state, totalCost)) {
    return false
  }
  
  // 对齐到网格
  const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE
  const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE
  
  // 获取指定等级的属性
  let levelStats = { hp: config.hp, damage: config.damage, fireRate: config.fireRate, range: config.range }
  for (const upg of config.upgradePath) {
    if (upg.level === targetLevel) {
      levelStats = { hp: upg.hp, damage: upg.damage, fireRate: upg.fireRate, range: upg.range }
      break
    }
  }
  
  // 创建炮台
  const turret: Turret = {
    id: generateTurretId(),
    type: turretType,
    level: targetLevel,
    x: gridX,
    y: gridY,
    hp: levelStats.hp,
    maxHp: levelStats.hp,
    damage: levelStats.damage,
    fireRate: levelStats.fireRate,
    range: levelStats.range,
    lastShot: 0,
    target: null,
    angle: 0
  }
  
  state.turrets.push(turret)
  
  // 建造特效
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 / 15) * i
    const speed = 2 + Math.random() * 3
    state.particles.push({
      x: gridX,
      y: gridY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color: '#00E5FF',
      size: 3
    })
  }
  
state.floatTexts.push({
    text: `🔧 建造成功!`,
    x: gridX,
    y: gridY - 30,
    life: 1.5,
    color: '#00E676',
    size: 16,
    vy: -0.5
  })

  // 播放建造音效
  playSound('turretPlace')

  return true
}

// 升级炮台
export function upgradeTurret(state: GameState, turret: Turret): boolean {
  const config = TURRET_CONFIGS[turret.type]
  const upgrade = config.upgradePath.find(u => u.level === turret.level + 1)
  
  if (!upgrade) {
    state.floatTexts.push({
      text: '已达最高等级',
      x: turret.x,
      y: turret.y - 20,
      life: 1.5,
      color: '#FFD700',
      size: 14,
      vy: -0.5
    })
    return false
  }
  
  if (!spendCrystals(state, upgrade.cost)) {
    state.floatTexts.push({
      text: '水晶不足',
      x: turret.x,
      y: turret.y - 20,
      life: 1.5,
      color: '#FF4757',
      size: 14,
      vy: -0.5
    })
    return false
  }
  
  // 应用升级
  turret.level = upgrade.level
  if (upgrade.damage) turret.damage = upgrade.damage
  if (upgrade.fireRate) turret.fireRate = upgrade.fireRate
  if (upgrade.range) turret.range = upgrade.range
  if (upgrade.hp) {
    turret.maxHp = upgrade.hp
    turret.hp = upgrade.hp  // 升级回满血
  }
  
  // 升级特效
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i
    const speed = 2 + Math.random() * 4
    state.particles.push({
      x: turret.x,
      y: turret.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.2,
      maxLife: 1.2,
      color: '#FFD700',
      size: 4
    })
  }
  
  state.floatTexts.push({
    text: `⬆️ Lv.${turret.level}!`,
    x: turret.x,
    y: turret.y - 30,
    life: 2,
    color: '#FFD700',
    size: 18,
    vy: -0.5
  })
  
  return true
}

// 出售炮台
export function sellTurret(state: GameState, turret: Turret): void {
  const config = TURRET_CONFIGS[turret.type]
  const refund = Math.floor(config.cost * 0.5)
  
  state.resources.crystals += refund
  state.turrets = state.turrets.filter(t => t.id !== turret.id)
  
  state.floatTexts.push({
    text: `💰 +${refund}`,
    x: turret.x,
    y: turret.y - 20,
    life: 1.5,
    color: '#FFD700',
    size: 16,
    vy: -0.5
  })

  // 播放出售音效
  playSound('turretSell')
}

// 选择目标（根据优先级）
export function selectTarget(
  turret: Turret,
  enemies: Enemy[]
): Enemy | null {
  const config = TURRET_CONFIGS[turret.type]
  let candidates = enemies.filter(e => {
    const dist = Math.sqrt((e.x - turret.x) ** 2 + (e.y - turret.y) ** 2)
    return dist <= turret.range
  })
  
  if (candidates.length === 0) return null
  
  switch (config.targetPriority) {
    case 'nearest':
      return candidates.reduce((nearest, e) => {
        const dist = Math.sqrt((e.x - turret.x) ** 2 + (e.y - turret.y) ** 2)
        const nearestDist = Math.sqrt((nearest.x - turret.x) ** 2 + (nearest.y - turret.y) ** 2)
        return dist < nearestDist ? e : nearest
      })
    
    case 'strongest':
      return candidates.reduce((strongest, e) => 
        e.hp > strongest.hp ? e : strongest
      )
    
    case 'weakest':
      return candidates.reduce((weakest, e) => 
        e.hp < weakest.hp ? e : weakest
      )
    
    case 'first':
      return candidates.reduce((first, e) => 
        e.pathIndex > first.pathIndex ? e : first
      )
    
    default:
      return candidates[0]
  }
}

// 炮台射击
export function turretShoot(
  state: GameState,
  turret: Turret,
  now: number
): void {
  if (now - turret.lastShot < turret.fireRate) return
  
  const target = selectTarget(turret, state.enemies)
  if (!target) return
  
  turret.lastShot = now
  turret.target = target
  
  // 计算射击角度
  const dx = target.x - turret.x
  const dy = target.y - turret.y
  turret.angle = Math.atan2(dy, dx)
  
  // 根据炮台类型创建不同的投射物
  switch (turret.type) {
    case 'laser':
      createLaserProjectile(state, turret, target)
      playSound('laserShoot')
      break
    case 'missile':
      createMissileProjectile(state, turret, target)
      playSound('missileShoot')
      break
    case 'frost':
      createFrostProjectile(state, turret, target)
      playSound('frostShoot')
      break
    case 'lightning':
      createLightningEffect(state, turret, target)
      playSound('lightningShoot')
      break
  }
}

// 创建激光投射物
function createLaserProjectile(
  state: GameState,
  turret: Turret,
  target: Enemy
): void {
  state.projectiles.push({
    id: `proj_${Date.now()}_${Math.random()}`,
    x: turret.x,
    y: turret.y,
    vx: Math.cos(turret.angle) * 15,
    vy: Math.sin(turret.angle) * 15,
    damage: turret.damage,
    range: turret.range,
    traveled: 0,
    homing: false,
    target: null,
    hitEnemies: new Set()
  })
}

// 创建导弹投射物
function createMissileProjectile(
  state: GameState,
  turret: Turret,
  target: Enemy
): void {
  state.projectiles.push({
    id: `proj_${Date.now()}_${Math.random()}`,
    x: turret.x,
    y: turret.y,
    vx: Math.cos(turret.angle) * 8,
    vy: Math.sin(turret.angle) * 8,
    damage: turret.damage,
    range: turret.range * 1.2,
    traveled: 0,
    homing: true,
    target: target,
    explosionRadius: 60,
    hitEnemies: new Set()
  })
}

// 创建冰冻投射物
function createFrostProjectile(
  state: GameState,
  turret: Turret,
  target: Enemy
): void {
  state.projectiles.push({
    id: `proj_${Date.now()}_${Math.random()}`,
    x: turret.x,
    y: turret.y,
    vx: Math.cos(turret.angle) * 10,
    vy: Math.sin(turret.angle) * 10,
    damage: turret.damage,
    range: turret.range,
    traveled: 0,
    homing: false,
    target: null,
    hitEnemies: new Set()
  })
}

// 创建闪电效果（即时伤害，无投射物）
function createLightningEffect(
  state: GameState,
  turret: Turret,
  target: Enemy
): void {
  // 立即造成伤害
  target.hp -= turret.damage
  
  // 闪电特效
  for (let i = 0; i < 10; i++) {
    const t = i / 10
    const x = turret.x + (target.x - turret.x) * t
    const y = turret.y + (target.y - turret.y) * t + (Math.random() - 0.5) * 20
    state.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.3,
      maxLife: 0.3,
      color: '#FFD700',
      size: 3
    })
  }
  
  // 连锁攻击
  let chainCount = 3
  let currentTarget = target
  const hitIds = new Set<string>([target.id])
  
  while (chainCount > 0) {
    const nextTarget = findChainTarget(state, currentTarget, 80, hitIds)
    if (!nextTarget) break
    
    nextTarget.hp -= turret.damage * 0.7  // 连锁伤害递减
    hitIds.add(nextTarget.id)
    
    // 连锁闪电特效
    for (let i = 0; i < 8; i++) {
      const t = i / 8
      const x = currentTarget.x + (nextTarget.x - currentTarget.x) * t
      const y = currentTarget.y + (nextTarget.y - currentTarget.y) * t + (Math.random() - 0.5) * 15
      state.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.2,
        maxLife: 0.2,
        color: '#A855F7',
        size: 2
      })
    }
    
    currentTarget = nextTarget
    chainCount--
  }
  
  state.floatTexts.push({
    text: `⚡-${Math.floor(turret.damage)}`,
    x: target.x,
    y: target.y - 15,
    life: 1,
    color: '#FFD700',
    size: 14,
    vy: -0.5
  })
}

// 寻找连锁目标
function findChainTarget(
  state: GameState,
  from: Enemy,
  range: number,
  excludedIds: Set<string>
): Enemy | null {
  let nearest: Enemy | null = null
  let nearestDist = range
  
  for (const enemy of state.enemies) {
    if (excludedIds.has(enemy.id)) continue
    
    const dist = Math.sqrt((enemy.x - from.x) ** 2 + (enemy.y - from.y) ** 2)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = enemy
    }
  }
  
  return nearest
}

// 更新所有炮台
export function updateTurrets(state: GameState, now: number): void {
  for (const turret of state.turrets) {
    turretShoot(state, turret, now)
  }
}

// 选择建造类型
export function selectBuildType(
  state: GameState,
  turretType: TurretType | null
): void {
  if (turretType === null) {
    state.buildMode.active = false
    state.buildMode.selectedTurret = null
  } else {
    state.buildMode.active = true
    state.buildMode.selectedTurret = turretType
  }
}

// 绘制炮台
export function drawTurret(
  ctx: CanvasRenderingContext2D,
  turret: Turret,
  isSelected: boolean = false
): void {
  ctx.save()
  ctx.translate(turret.x, turret.y)
  
  // 根据类型绘制不同颜色
  const colors: Record<TurretType, { primary: string; secondary: string; glow: string }> = {
    laser: { primary: '#00D9FF', secondary: '#0099CC', glow: 'rgba(0, 217, 255, 0.5)' },
    missile: { primary: '#FF6B6B', secondary: '#CC4444', glow: 'rgba(255, 107, 107, 0.5)' },
    frost: { primary: '#7FDBFF', secondary: '#4FC3F7', glow: 'rgba(127, 219, 255, 0.5)' },
    lightning: { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.5)' }
  }
  
  const color = colors[turret.type]
  const r = 14 * SCALE_RATIO
  
  // 选中光环
  if (isSelected) {
    ctx.beginPath()
    ctx.arc(0, 0, r + 8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  
  // 外发光
  ctx.shadowColor = color.glow
  ctx.shadowBlur = 15
  
  // 六边形底座
  ctx.fillStyle = '#1a2530'
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = Math.cos(angle) * (r + 2)
    const py = Math.sin(angle) * (r + 2)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  
  // 主体六边形
  ctx.fillStyle = color.primary
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  
  ctx.shadowBlur = 0
  
  // 内部装饰
  ctx.fillStyle = color.secondary
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = Math.cos(angle) * (r * 0.5)
    const py = Math.sin(angle) * (r * 0.5)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  
  // 中心圆点
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(0, 0, 3 * SCALE_RATIO, 0, Math.PI * 2)
  ctx.fill()
  
  // 等级标识（外围）
  if (turret.level > 1) {
    ctx.fillStyle = '#FFD700'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.font = `bold ${9 * SCALE_RATIO}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeText(`★${turret.level}`, 0, -(r + 10))
    ctx.fillText(`★${turret.level}`, 0, -(r + 10))
    ctx.textBaseline = 'alphabetic'
  }
  
  // 血条（更窄更短）
  const barWidth = 18 * SCALE_RATIO
  const barHeight = 3 * SCALE_RATIO
  const hpX = -barWidth / 2
  const hpY = r + 5
  
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.beginPath()
  ctx.roundRect(hpX, hpY, barWidth, barHeight, 2)
  ctx.fill()
  
  const hpRatio = turret.hp / turret.maxHp
  const hpColor = hpRatio > 0.6 ? '#4ADE80' : hpRatio > 0.3 ? '#FBBF24' : '#EF4444'
  ctx.fillStyle = hpColor
  ctx.beginPath()
  ctx.roundRect(hpX, hpY, barWidth * hpRatio, barHeight, 2)
  ctx.fill()
  
  ctx.restore()
}
