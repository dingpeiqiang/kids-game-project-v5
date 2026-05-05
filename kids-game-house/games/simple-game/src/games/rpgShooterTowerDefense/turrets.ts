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
  
  // ✅ 应用升级
  const oldLevel = turret.level
  turret.level = upgrade.level
  if (upgrade.damage) turret.damage = upgrade.damage
  if (upgrade.fireRate) turret.fireRate = upgrade.fireRate
  if (upgrade.range) turret.range = upgrade.range
  if (upgrade.hp) {
    turret.maxHp = upgrade.hp
    turret.hp = upgrade.hp  // 升级回满血
  }
  
  // ✅ 升级特效 - 多层粒子爆发
  // 第一层：金色光环粒子
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i
    const speed = 3 + Math.random() * 5
    state.particles.push({
      x: turret.x,
      y: turret.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.5,
      maxLife: 1.5,
      color: '#FFD700',
      size: 5 + Math.random() * 3
    })
  }
  
  // 第二层：白色闪光粒子
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3
    state.particles.push({
      x: turret.x,
      y: turret.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      maxLife: 1.0,
      color: '#FFFFFF',
      size: 3
    })
  }
  
  // ✅ 添加升级光晕效果（持续闪烁）
  state.floatTexts.push({
    text: `✨`,
    x: turret.x,
    y: turret.y,
    life: 0.8,
    color: '#FFD700',
    size: 40,
    vy: 0
  })
  
  // ✅ 显示等级提升提示（更大更醒目）
  state.floatTexts.push({
    text: `⬆️ Lv.${oldLevel} → ${turret.level}!`,
    x: turret.x,
    y: turret.y - 40,
    life: 2.5,
    color: '#FFD700',
    size: 20,
    vy: -0.6
  })
  
  // ✅ 显示属性提升提示
  const upgrades: string[] = []
  if (upgrade.damage) upgrades.push(`攻击+${upgrade.damage}`)
  if (upgrade.fireRate) upgrades.push(`射速+${(upgrade.fireRate * 100).toFixed(0)}%`)
  if (upgrade.range) upgrades.push(`范围+${upgrade.range}`)
  
  if (upgrades.length > 0) {
    setTimeout(() => {
      state.floatTexts.push({
        text: upgrades.join(' | '),
        x: turret.x,
        y: turret.y - 60,
        life: 2.0,
        color: '#4ECDC4',
        size: 12,
        vy: -0.4
      })
    }, 300)
  }
  
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
  // 更新所有炮台（炮台不再有生命周期限制）
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
  // ✅ 根据等级调整大小和光效
  const levelScale = 1 + (turret.level - 1) * 0.15  // 每级增加15%大小
  const r = 14 * SCALE_RATIO * levelScale
  
  // ✅ 高等级炮台增强发光效果
  const glowIntensity = 15 + (turret.level - 1) * 8  // 每级增加8像素光晕
  
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
  ctx.shadowBlur = glowIntensity
  
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
  
  // ✅ 根据炮台类型绘制不同的内部装饰
  if (turret.type === 'laser') {
    // 激光炮台：圆形核心 + 十字准星
    ctx.fillStyle = color.secondary
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2)
    ctx.fill()
    
    // 十字准星
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-r * 0.3, 0)
    ctx.lineTo(r * 0.3, 0)
    ctx.moveTo(0, -r * 0.3)
    ctx.lineTo(0, r * 0.3)
    ctx.stroke()
    
  } else if (turret.type === 'missile') {
    // 导弹炮台：三角形指向
    ctx.fillStyle = color.secondary
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.6)
    ctx.lineTo(-r * 0.5, r * 0.4)
    ctx.lineTo(r * 0.5, r * 0.4)
    ctx.closePath()
    ctx.fill()
    
    // 导弹尖端
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(0, -r * 0.3, 3 * SCALE_RATIO, 0, Math.PI * 2)
    ctx.fill()
    
  } else if (turret.type === 'frost') {
    // 冰冻炮台：雪花图案
    ctx.fillStyle = color.secondary
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2)
    ctx.fill()
    
    // 雪花六角
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5)
      ctx.stroke()
    }
    
  } else if (turret.type === 'lightning') {
    // 闪电炮台：Z字形闪电图案
    ctx.fillStyle = color.secondary
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2)
    ctx.fill()
    
    // 闪电符号
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(-r * 0.2, -r * 0.4)
    ctx.lineTo(r * 0.1, 0)
    ctx.lineTo(-r * 0.1, 0)
    ctx.lineTo(r * 0.2, r * 0.4)
    ctx.stroke()
  }
  
  // 中心圆点（所有炮台都有）
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(0, 0, 3 * SCALE_RATIO, 0, Math.PI * 2)
  ctx.fill()
  
  // ✅ 等级标识（外围）- 增强显示
  if (turret.level > 1) {
    ctx.fillStyle = '#FFD700'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    const fontSize = (9 + (turret.level - 1) * 2) * SCALE_RATIO  // 等级越高字体越大
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 添加金色光晕
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10
    
    ctx.strokeText(`★${turret.level}`, 0, -(r + 12))
    ctx.fillText(`★${turret.level}`, 0, -(r + 12))
    
    ctx.shadowBlur = 0
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

// ==========================================
// 城墙系统
// ==========================================

let wallIdCounter = 0
function generateWallId(): string {
  return `wall_${++wallIdCounter}`
}

// 城墙配置导入
import { WALL_CONFIGS, MAX_TURRETS, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, SCALE_RATIO } from './config'
import type { Wall, WallType, GameState } from './types'

// 检查是否可以建造城墙
export function canPlaceWall(
  state: GameState,
  x: number,
  y: number,
  wallType: WallType
): { canPlace: boolean; reason?: string } {
  const config = WALL_CONFIGS[wallType]

  // 检查资源
  if (state.resources.crystals < config.cost) {
    return { canPlace: false, reason: '水晶不足' }
  }

  // 检查最大数量（城墙和炮台共享数量限制）
  if (state.turrets.length + state.walls.length >= MAX_TURRETS) {
    return { canPlace: false, reason: '已达最大数量' }
  }

  // 检查边界
  const halfW = config.width / 2
  const halfH = config.height / 2
  const margin = 10
  if (x - halfW < margin || x + halfW > CANVAS_WIDTH - margin ||
      y - halfH < margin || y + halfH > CANVAS_HEIGHT - margin) {
    return { canPlace: false, reason: '超出边界' }
  }

  // 检查是否与其他城墙重叠
  for (const wall of state.walls) {
    const dx = Math.abs(wall.x - x)
    const dy = Math.abs(wall.y - y)
    if (dx < (wall.width + config.width) / 2 && dy < (wall.height + config.height) / 2) {
      return { canPlace: false, reason: '与城墙重叠' }
    }
  }

  // 检查是否与炮台重叠
  for (const turret of state.turrets) {
    const dist = Math.sqrt((turret.x - x) ** 2 + (turret.y - y) ** 2)
    if (dist < 30) {
      return { canPlace: false, reason: '与炮台重叠' }
    }
  }

  return { canPlace: true }
}

// 建造城墙
export function placeWall(
  state: GameState,
  x: number,
  y: number,
  wallType: WallType
): Wall | null {
  if (!canPlaceWall(state, x, y, wallType).canPlace) return null

  const config = WALL_CONFIGS[wallType]
  if (!spendCrystals(state, config.cost)) return null

  const wall: Wall = {
    id: generateWallId(),
    type: wallType,
    x,
    y,
    width: config.width,
    height: config.height,
    hp: config.hp,
    maxHp: config.hp,
    level: 1,
    lastHit: 0,
    flashTimer: 0
  }

  state.walls.push(wall)
  playSound('turretPlace')

  // 建造特效
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 3
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color: config.color,
      size: 4
    })
  }

  return wall
}

// 城墙受伤
export function wallHit(wall: Wall, damage: number, state: GameState): void {
  wall.hp -= damage
  wall.lastHit = Date.now()
  wall.flashTimer = 0.2

  // 伤害特效
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

  // 城墙被摧毁
  if (wall.hp <= 0) {
    destroyWall(state, wall)
  }
}

// 城墙摧毁
export function destroyWall(state: GameState, wall: Wall): void {
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
        color: wall.type === 'stone' ? '#8B7355' : wall.type === 'reinforced' ? '#5A5A6E' : '#3D3D5C',
        size: 5 + Math.random() * 3
      })
    }
  }
}

// 修复城墙
export function repairWall(state: GameState, wall: Wall): boolean {
  if (wall.hp >= wall.maxHp) return false

  const repairCost = Math.floor((wall.maxHp - wall.hp) * 0.5)
  if (!spendCrystals(state, repairCost)) return false

  wall.hp = wall.maxHp

  // 修复特效
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x: wall.x + (Math.random() - 0.5) * wall.width,
      y: wall.y + (Math.random() - 0.5) * wall.height,
      vx: 0,
      vy: -2,
      life: 1,
      maxLife: 1,
      color: '#4ADE80',
      size: 4
    })
  }

  return true
}

// 升级城墙
export function upgradeWall(state: GameState, wall: Wall): boolean {
  if (wall.level >= 3) return false

  const config = WALL_CONFIGS[wall.type]
  const upgradeCost = config.upgradePath[wall.level - 1]?.cost
  if (!upgradeCost || !spendCrystals(state, upgradeCost)) return false

  wall.level++

  // 应用升级属性
  const upgradeHp = config.upgradePath[wall.level - 2]?.hp
  if (upgradeHp) {
    const hpRatio = wall.hp / wall.maxHp  // 保持血量比例
    wall.maxHp = upgradeHp
    wall.hp = Math.floor(wall.maxHp * hpRatio)
  }

  // 升级特效
  state.shakeAmt = 5
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i
    state.particles.push({
      x: wall.x,
      y: wall.y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      life: 1,
      maxLife: 1,
      color: '#FFD700',
      size: 5
    })
  }

  return true
}

// 更新城墙（闪烁效果）
export function updateWalls(state: GameState, dt: number): void {
  for (const wall of state.walls) {
    if (wall.flashTimer > 0) {
      wall.flashTimer -= dt
    }
  }
}

// 绘制城墙
export function drawWall(ctx: CanvasRenderingContext2D, wall: Wall): void {
  ctx.save()
  ctx.translate(wall.x, wall.y)

  const w = wall.width
  const h = wall.height

  // 受伤闪烁效果
  const flash = wall.flashTimer > 0

  // 城墙底色
  let baseColor = WALL_CONFIGS[wall.type].color
  if (flash) {
    baseColor = '#FFFFFF'
  }

  // 根据等级增加细节
  const levelDetail = wall.level

  // 绘制城墙主体
  ctx.fillStyle = baseColor
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 3

  // 石墙纹理
  if (wall.type === 'stone') {
    ctx.beginPath()
    ctx.roundRect(-w/2, -h/2, w, h, 4)
    ctx.fill()

    // 砖块纹理线
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-w/2 + w/3, -h/2)
    ctx.lineTo(-w/2 + w/3, h/2)
    ctx.moveTo(-w/2 + w*2/3, -h/2)
    ctx.lineTo(-w/2 + w*2/3, h/2)
    ctx.moveTo(-w/2, 0)
    ctx.lineTo(w/2, 0)
    ctx.stroke()
  } else if (wall.type === 'reinforced') {
    // 金属加固纹理
    ctx.beginPath()
    ctx.roundRect(-w/2, -h/2, w, h, 3)
    ctx.fill()

    // 金属条
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(-w/2, -h/4, w, h/2)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(-w/2, -h/2, w, h)
  } else {
    // 堡垒 - 更有质感
    ctx.beginPath()
    ctx.roundRect(-w/2, -h/2, w, h, 5)
    ctx.fill()

    // 城门细节
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.beginPath()
    ctx.arc(0, 0, Math.min(w, h) / 4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // 等级标识
  if (wall.level > 1) {
    ctx.fillStyle = '#FFD700'
    ctx.font = `bold ${10 + wall.level * 2}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 3
    ctx.fillText(`★${wall.level}`, 0, 0)
    ctx.shadowBlur = 0
  }

  // 血条
  const barWidth = w - 10
  const barHeight = 4
  const barY = h/2 + 5

  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.beginPath()
  ctx.roundRect(-barWidth/2, barY, barWidth, barHeight, 2)
  ctx.fill()

  const hpRatio = wall.hp / wall.maxHp
  const hpColor = hpRatio > 0.6 ? '#4ADE80' : hpRatio > 0.3 ? '#FBBF24' : '#EF4444'
  ctx.fillStyle = hpColor
  ctx.beginPath()
  ctx.roundRect(-barWidth/2, barY, barWidth * hpRatio, barHeight, 2)
  ctx.fill()

  ctx.restore()
}
