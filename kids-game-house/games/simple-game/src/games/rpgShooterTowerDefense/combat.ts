// RPG Shooter 塔防融合版 - 战斗系统

import { GameState, Projectile, Enemy } from './types'
import { enemyHit, applySlow, applyFreeze, explodeDamage } from './enemies'
import { SCALE_RATIO } from './config'
import { playSound } from './sounds'

// 更新所有投射物
export function updateProjectiles(state: GameState, dt: number): void {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i]
    
    // 追踪导弹更新方向
    if (proj.homing && proj.target) {
      const targetEnemy = state.enemies.find(e => e.id === proj.target!.id)
      if (targetEnemy) {
        // 调整方向朝向目标
        const dx = targetEnemy.x - proj.x
        const dy = targetEnemy.y - proj.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist > 0) {
          const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
          proj.vx = (dx / dist) * speed
          proj.vy = (dy / dist) * speed
        }
      } else {
        proj.homing = false
        proj.target = null
      }
    }
    
    // 更新位置
    proj.x += proj.vx * 60 * dt
    proj.y += proj.vy * 60 * dt
    
    // 更新已飞行距离
    const moveDist = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) * 60 * dt
    proj.traveled += moveDist
    
    // 检查是否超出射程
    if (proj.traveled >= proj.range) {
      state.projectiles.splice(i, 1)
      continue
    }
    
    // 检查碰撞
    checkProjectileCollisions(state, proj, i)
  }
}

// 检查投射物碰撞
function checkProjectileCollisions(
  state: GameState,
  proj: Projectile,
  projIndex: number
): void {
  let hitSomething = false
  
  for (const enemy of state.enemies) {
    // 跳过已击中的敌人（防止多段伤害）
    if (proj.hitEnemies.has(enemy.id)) continue
    
    // 碰撞检测
    const dist = Math.sqrt((enemy.x - proj.x) ** 2 + (enemy.y - proj.y) ** 2)
    const hitRadius = enemy.shape === 'boss' ? 24 : 15
    
    if (dist < hitRadius) {
      // 命中！
      hitSomething = true
      
      // 根据炮台类型应用不同效果
      applyProjectileEffect(state, proj, enemy)
      
      // 标记为已击中
      proj.hitEnemies.add(enemy.id)
      
      // 非穿透武器移除投射物
      if (!proj.homing) {
        state.projectiles.splice(projIndex, 1)
        return
      }
    }
  }
  
  // 导弹爆炸检测
  if (proj.explosionRadius && hitSomething) {
    explodeDamage(state, proj.x, proj.y, proj.damage, proj.explosionRadius)
    state.projectiles.splice(projIndex, 1)
    
    // 爆炸特效
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      state.particles.push({
        x: proj.x,
        y: proj.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: '#FF6B6B',
        size: 3 + Math.random() * 2
      })
    }
  }
}

// 应用投射物效果
function applyProjectileEffect(
  state: GameState,
  proj: Projectile,
  enemy: Enemy
): void {
  // 基础伤害
  enemyHit(state, enemy, proj.damage)
  
  // 特殊效果（根据投射物特征判断）
  // 这里简化处理，实际应该从炮台类型传递过来
  
  // 冰冻效果（低速弹）
  if (Math.abs(proj.vx) < 12 && Math.abs(proj.vy) < 12) {
    applySlow(enemy, 0.5, 2)  // 减速50%，持续2秒
    
    // 冰冻特效
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      state.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 0.8,
        maxLife: 0.8,
        color: '#87CEEB',
        size: 2
      })
    }
  }
}

// 自动瞄准并射击最近的敌人
let _lastShootTime = 0
const _shootCooldown = 400  // 毫秒（降低攻速）

export function updateAutoAim(state: GameState, dt: number): void {
  const player = state.player
  const now = performance.now()

  if (now - _lastShootTime < _shootCooldown) return

  // 寻找最近的敌人
  const attackRange = 150 * SCALE_RATIO
  let nearest: Enemy | null = null
  let minDist = Infinity

  for (const enemy of state.enemies) {
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2)
    if (dist < minDist && dist <= attackRange) {
      minDist = dist
      nearest = enemy
    }
  }

  if (!nearest) return

  _lastShootTime = now

  // 更新射击角度
  const dx = nearest.x - player.x
  const dy = nearest.y - player.y
  player.shootAngle = Math.atan2(dy, dx)

  // 发射子弹
  const speed = 12 * SCALE_RATIO
  state.projectiles.push({
    id: `p_${now}`,
    x: player.x,
    y: player.y,
    vx: Math.cos(player.shootAngle) * speed,
    vy: Math.sin(player.shootAngle) * speed,
    damage: player.atk,
    range: attackRange,
    traveled: 0,
    homing: false,
    target: null,
    hitEnemies: new Set()
  })

  // 播放射击音效
  playSound('playerShoot')

  // 射击特效
  state.particles.push({
    x: player.x + Math.cos(player.shootAngle) * 12,
    y: player.y + Math.sin(player.shootAngle) * 12,
    vx: Math.cos(player.shootAngle) * 2,
    vy: Math.sin(player.shootAngle) * 2,
    life: 0.2,
    maxLife: 0.2,
    color: '#FFD700',
    size: 3
  })
}

// 兼容旧接口
export function playerShoot(state: GameState, now: number): void {
  if (!state.buildMode.active) {
    updateAutoAim(state, 0)
  }
}

// 玩家键盘/摇杆状态
export interface PlayerKeys {
  w: boolean; a: boolean; s: boolean; d: boolean
  arrowup: boolean; arrowdown: boolean; arrowleft: boolean; arrowright: boolean
}

export interface JoystickState {
  active: boolean
  dx: number; dy: number  // 归一化方向 -1~1
  baseX: number; baseY: number  // 摇杆基准位置
  touchId: number | null
}

// 更新玩家（改进版：支持WASD键盘 + 触摸直接控制）
export function updatePlayer(state: GameState, dt: number): void {
  const player = state.player
  const speed = player.speed * 60 * dt

  // 递减无敌时间和受伤锁定
  if (player.invincible > 0) {
    player.invincible -= dt
  }
  if (player.hitLock > 0) {
    player.hitLock -= dt
  }

  // 键盘/WASD移动
  if (state.keys.w || state.keys.arrowup) player.y -= speed
  if (state.keys.s || state.keys.arrowdown) player.y += speed
  if (state.keys.a || state.keys.arrowleft) player.x -= speed
  if (state.keys.d || state.keys.arrowright) player.x += speed

  // 虚拟摇杆移动（触摸控制）
  if (state.joystick.active) {
    player.x += state.joystick.dx * speed * 0.8  // 摇杆稍微降速
    player.y += state.joystick.dy * speed * 0.8
  }

  // 边界限制
  const margin = 15
  player.x = Math.max(margin, Math.min(400 - margin, player.x))
  player.y = Math.max(margin, Math.min(600 - margin, player.y))

  // 自动瞄准最近的敌人并射击
  if (!state.buildMode.active) {
    updateAutoAim(state, dt)
  }
}

// 绘制玩家
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  const player = state.player
  
  // 无敌时闪烁
  if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) {
    return
  }
  
  ctx.save()
  ctx.translate(player.x, player.y)
  ctx.rotate(player.shootAngle + Math.PI / 2)
  
  // 角色主体（根据屏幕尺寸调整大小）
  const playerSize = 8 * SCALE_RATIO  // 从10改为8
  const innerSize = 3 * SCALE_RATIO    // 从4改为3
  const coreSize = 2 * SCALE_RATIO     // 从3改为2
  
  ctx.fillStyle = '#45B7D1'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i - Math.PI / 8
    const r = playerSize
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  
  // 内部装饰
  ctx.fillStyle = '#2E86AB'
  ctx.beginPath()
  ctx.arc(0, 0, innerSize, 0, Math.PI * 2)
  ctx.fill()
  
  // 核心发光
  ctx.fillStyle = '#00E5FF'
  ctx.shadowColor = '#00E5FF'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(0, 0, coreSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  
  // 武器指示
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(0, -16 * SCALE_RATIO)
  ctx.lineTo(-2 * SCALE_RATIO, -11 * SCALE_RATIO)
  ctx.lineTo(2 * SCALE_RATIO, -11 * SCALE_RATIO)
  ctx.closePath()
  ctx.fill()
  
  ctx.restore()
  
  // 等级显示
  ctx.fillStyle = '#FFD700'
  ctx.font = `bold ${8 * SCALE_RATIO}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(`Lv.${player.level}`, player.x, player.y - 18 * SCALE_RATIO)
  
  // 绘制攻击范围（半透明圆圈，根据屏幕尺寸调整）
  const attackRange = 80 * SCALE_RATIO
  
  ctx.strokeStyle = 'rgba(69, 183, 209, 0.2)'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.arc(player.x, player.y, attackRange, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  
  // 寻找并标记最近的敌人（目标指示器）
  let nearestEnemy: Enemy | null = null
  let minDistance = Infinity
  
  for (const enemy of state.enemies) {
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2)
    if (dist < minDistance && dist <= attackRange) {
      minDistance = dist
      nearestEnemy = enemy
    }
  }
  
  // 如果有目标，绘制瞄准线
  if (nearestEnemy) {
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(player.x, player.y)
    ctx.lineTo(nearestEnemy.x, nearestEnemy.y)
    ctx.stroke()
    
    // 目标标记（缩小）
    ctx.strokeStyle = '#FF4757'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(nearestEnemy.x, nearestEnemy.y, 12 * SCALE_RATIO, 0, Math.PI * 2)  // 从15改为12
    ctx.stroke()
  }
}

// 绘制投射物
export function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  for (const proj of state.projectiles) {
    ctx.save()
    
    // 根据速度判断类型
    const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)
    
    if (speed < 12) {
      // 冰冻弹 - 蓝色
      ctx.fillStyle = '#87CEEB'
      ctx.shadowColor = '#87CEEB'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(proj.x, proj.y, 4 * SCALE_RATIO, 0, Math.PI * 2)  // 从5改为4
      ctx.fill()
    } else if (proj.homing) {
      // 导弹 - 红色带尾焰
      ctx.fillStyle = '#FF4757'
      ctx.shadowColor = '#FF4757'
      ctx.shadowBlur = 10
      
      ctx.beginPath()
      ctx.arc(proj.x, proj.y, 5 * SCALE_RATIO, 0, Math.PI * 2)  // 从6改为5
      ctx.fill()
      
      // 尾焰
      const angle = Math.atan2(proj.vy, proj.vx)
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 1 - i / 3
        ctx.fillStyle = '#FF6B6B'
        ctx.beginPath()
        ctx.arc(
          proj.x - Math.cos(angle) * i * 4 * SCALE_RATIO,  // 从5改为4
          proj.y - Math.sin(angle) * i * 4 * SCALE_RATIO,  // 从5改为4
          (4 - i) * SCALE_RATIO,  // 添加缩放
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
    } else {
      // 普通子弹 - 黄色
      ctx.fillStyle = '#FFD700'
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(proj.x, proj.y, 3 * SCALE_RATIO, 0, Math.PI * 2)  // 从4改为3
      ctx.fill()
    }
    
    ctx.restore()
  }
}
