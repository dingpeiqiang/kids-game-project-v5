// RPG Shooter 塔防融合版 - 陷阱系统

import { GameState, Trap, TrapType } from './types'
import { TRAP_CONFIGS, MAX_TRAPS, GRID_SIZE } from './config'
import { explodeDamage, applySlow } from './enemies'
import { spendCrystals } from './state'

// 生成唯一ID
let trapIdCounter = 0
function generateTrapId(): string {
  return `trap_${++trapIdCounter}`
}

// 检查是否可以放置陷阱
export function canPlaceTrap(
  state: GameState,
  x: number,
  y: number,
  trapType: TrapType
): { canPlace: boolean; reason?: string } {
  const config = TRAP_CONFIGS[trapType]
  
  // 检查资源
  if (state.resources.crystals < config.cost) {
    return { canPlace: false, reason: '水晶不足' }
  }
  
  // 检查最大数量
  if (state.traps.length >= MAX_TRAPS) {
    return { canPlace: false, reason: '已达最大数量' }
  }
  
  // 网格对齐
  const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE
  const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE
  
  // 检查边界
  const margin = 20
  if (gridX < margin || gridX > 400 - margin || 
      gridY < margin || gridY > 600 - margin) {
    return { canPlace: false, reason: '超出边界' }
  }
  
  // 检查是否与炮台重叠
  for (const turret of state.turrets) {
    const dist = Math.sqrt((turret.x - gridX) ** 2 + (turret.y - gridY) ** 2)
    if (dist < 35) {
      return { canPlace: false, reason: '距离炮台太近' }
    }
  }
  
  // 检查是否与其他陷阱重叠
  for (const trap of state.traps) {
    const dist = Math.sqrt((trap.x - gridX) ** 2 + (trap.y - gridY) ** 2)
    if (dist < 30) {
      return { canPlace: false, reason: '距离其他陷阱太近' }
    }
  }
  
  return { canPlace: true }
}

// 放置陷阱
export function placeTrap(
  state: GameState,
  x: number,
  y: number,
  trapType: TrapType
): boolean {
  const check = canPlaceTrap(state, x, y, trapType)
  if (!check.canPlace) {
    console.warn(`无法放置陷阱: ${check.reason}`)
    
    // 显示错误提示
    state.floatTexts.push({
      text: check.reason!,
      x: x,
      y: y - 20,
      life: 1.5,
      color: '#FF4757',
      size: 14,
      vy: -0.5
    })
    
    return false
  }
  
  const config = TRAP_CONFIGS[trapType]
  
  // 消耗水晶
  if (!spendCrystals(state, config.cost)) {
    return false
  }
  
  // 网格对齐
  const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE
  const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE
  
  // 创建陷阱
  const trap: Trap = {
    id: generateTrapId(),
    type: trapType,
    x: gridX,
    y: gridY,
    damage: config.damage,
    radius: config.radius,
    duration: config.duration,
    triggered: false,
    triggerTimer: 0,
    slowFactor: config.slowFactor
  }
  
  state.traps.push(trap)
  
  // 放置特效
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    const speed = 2 + Math.random() * 2
    state.particles.push({
      x: gridX,
      y: gridY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8,
      maxLife: 0.8,
      color: '#9B59B6',
      size: 3
    })
  }
  
  return true
}

// 更新所有陷阱
export function updateTraps(state: GameState, dt: number): void {
  for (let i = state.traps.length - 1; i >= 0; i--) {
    const trap = state.traps[i]
    
    // 更新触发计时器
    if (trap.triggered) {
      trap.triggerTimer -= dt
      
      if (trap.triggerTimer <= 0) {
        // 地雷爆炸或减速力场结束
        if (trap.type === 'mine') {
          explodeDamage(state, trap.x, trap.y, trap.damage!, trap.radius!)
          
          // 爆炸特效
          for (let j = 0; j < 20; j++) {
            const angle = Math.random() * Math.PI * 2
            const speed = 3 + Math.random() * 4
            state.particles.push({
              x: trap.x,
              y: trap.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              maxLife: 1,
              color: '#FF4757',
              size: 4 + Math.random() * 3
            })
          }
        }
        
        // 移除陷阱
        state.traps.splice(i, 1)
      }
    } else {
      // 检测敌人触发
      checkTrapTrigger(state, trap, i)
    }
  }
}

// 检查陷阱触发
function checkTrapTrigger(
  state: GameState,
  trap: Trap,
  trapIndex: number
): void {
  for (const enemy of state.enemies) {
    const dist = Math.sqrt((enemy.x - trap.x) ** 2 + (enemy.y - trap.y) ** 2)
    
    if (dist < 20) {
      // 触发陷阱
      trap.triggered = true
      
      if (trap.type === 'mine') {
        // 地雷立即爆炸
        trap.triggerTimer = 0.2  // 短暂延迟后爆炸
      } else if (trap.type === 'slowField') {
        // 减速力场持续生效
        trap.triggerTimer = trap.duration!
        
        // 对范围内敌人施加减速
        for (const e of state.enemies) {
          const d = Math.sqrt((e.x - trap.x) ** 2 + (e.y - trap.y) ** 2)
          if (d <= trap.radius!) {
            applySlow(e, trap.slowFactor!, trap.duration!)
          }
        }
        
        // 减速特效
        for (let j = 0; j < 15; j++) {
          const angle = Math.random() * Math.PI * 2
          const r = Math.random() * trap.radius!
          state.particles.push({
            x: trap.x + Math.cos(angle) * r,
            y: trap.y + Math.sin(angle) * r,
            vx: 0,
            vy: -1,
            life: 1.5,
            maxLife: 1.5,
            color: '#87CEEB',
            size: 2
          })
        }
      } else if (trap.type === 'spike') {
        // 地刺立即造成伤害
        for (const e of state.enemies) {
          const d = Math.sqrt((e.x - trap.x) ** 2 + (e.y - trap.y) ** 2)
          if (d <= trap.radius!) {
            import('./enemies').then(({ enemyHit }) => {
              enemyHit(state, e, trap.damage!)
            })
          }
        }
        
        // 地刺特效
        trap.triggerTimer = 0.5
        
        for (let j = 0; j < 10; j++) {
          state.particles.push({
            x: trap.x + (Math.random() - 0.5) * 20,
            y: trap.y + (Math.random() - 0.5) * 20,
            vx: 0,
            vy: -2,
            life: 0.6,
            maxLife: 0.6,
            color: '#95A5A6',
            size: 3
          })
        }
      }
      
      break  // 一个陷阱只触发一次
    }
  }
}

// 出售陷阱
export function sellTrap(
  state: GameState,
  trapId: string
): boolean {
  const index = state.traps.findIndex(t => t.id === trapId)
  if (index === -1) return false
  
  const trap = state.traps[index]
  const config = TRAP_CONFIGS[trap.type]
  
  // 回收50%成本
  const refund = Math.floor(config.cost * 0.5)
  import('./state').then(({ addCrystals }) => {
    addCrystals(state, refund)
  })
  
  // 移除陷阱
  state.traps.splice(index, 1)
  
  // 出售特效
  state.floatTexts.push({
    text: `+${refund}💎`,
    x: trap.x,
    y: trap.y - 10,
    life: 1,
    color: '#00E676',
    size: 14,
    vy: -0.8
  })
  
  return true
}

// 绘制陷阱
export function drawTrap(
  ctx: CanvasRenderingContext2D,
  trap: Trap
): void {
  ctx.save()
  ctx.translate(trap.x, trap.y)
  
  switch (trap.type) {
    case 'mine':
      drawMine(ctx, trap)
      break
    case 'slowField':
      drawSlowField(ctx, trap)
      break
    case 'spike':
      drawSpike(ctx, trap)
      break
  }
  
  ctx.restore()
}

// 绘制地雷
function drawMine(ctx: CanvasRenderingContext2D, trap: Trap): void {
  // 主体
  ctx.fillStyle = '#E74C3C'
  ctx.beginPath()
  ctx.arc(0, 0, 10, 0, Math.PI * 2)
  ctx.fill()
  
  // 中心
  ctx.fillStyle = '#C0392B'
  ctx.beginPath()
  ctx.arc(0, 0, 5, 0, Math.PI * 2)
  ctx.fill()
  
  // 闪烁效果（未触发时）
  if (!trap.triggered) {
    const alpha = 0.5 + Math.sin(Date.now() / 200) * 0.3
    ctx.globalAlpha = alpha
    ctx.strokeStyle = '#FF4757'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 14, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// 绘制减速力场
function drawSlowField(ctx: CanvasRenderingContext2D, trap: Trap): void {
  // 范围圈
  ctx.strokeStyle = 'rgba(135, 206, 235, 0.5)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.arc(0, 0, trap.radius!, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  
  // 中心装置
  ctx.fillStyle = '#3498DB'
  ctx.beginPath()
  ctx.arc(0, 0, 8, 0, Math.PI * 2)
  ctx.fill()
  
  // 旋转效果
  const rotation = Date.now() / 1000
  ctx.strokeStyle = '#87CEEB'
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    const angle = rotation + (Math.PI / 2) * i
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12)
    ctx.stroke()
  }
  
  // 已触发时的脉冲效果
  if (trap.triggered) {
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.1
    ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, trap.radius! * pulse, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// 绘制地刺
function drawSpike(ctx: CanvasRenderingContext2D, trap: Trap): void {
  // 尖刺
  ctx.fillStyle = '#95A5A6'
  
  const spikeCount = 8
  for (let i = 0; i < spikeCount; i++) {
    const angle = (Math.PI * 2 / spikeCount) * i
    const length = trap.triggered ? 15 : 8
    
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length)
    ctx.lineWidth = 3
    ctx.strokeStyle = '#7F8C8D'
    ctx.stroke()
  }
  
  // 中心
  ctx.fillStyle = '#BDC3C7'
  ctx.beginPath()
  ctx.arc(0, 0, 5, 0, Math.PI * 2)
  ctx.fill()
  
  // 触发时的红光
  if (trap.triggered) {
    ctx.fillStyle = 'rgba(231, 76, 60, 0.5)'
    ctx.beginPath()
    ctx.arc(0, 0, 12, 0, Math.PI * 2)
    ctx.fill()
  }
}
