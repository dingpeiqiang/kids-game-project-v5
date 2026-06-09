// RPG Shooter 塔防融合版 - 道具系统
import { GameState, Powerup } from './types'
import { playSound } from './sounds'

// 道具配置
export const POWERUP_CONFIGS = {
  scatter: {
    type: 'scatter',
    icon: '💥',
    name: '散射炸弹',
    description: '大范围散射攻击，清除周围敌人',
    color: '#FF6B6B',
    duration: 0
  },
  nuke: {
    type: 'nuke',
    icon: '☢️',
    name: '核弹',
    description: '消灭屏幕上所有敌人',
    color: '#FFD700',
    duration: 0
  },
  freeze_all: {
    type: 'freeze_all',
    icon: '❄️',
    name: '全体冰冻',
    description: '冻结所有敌人5秒',
    color: '#00E5FF',
    duration: 5
  },
  speed_boost: {
    type: 'speed_boost',
    icon: '⚡',
    name: '速度提升',
    description: '炮台射速提升50%，持续10秒',
    color: '#FFA502',
    duration: 10
  }
}

// 生成道具（敌人死亡时概率掉落）
export function spawnPowerup(state: GameState, x: number, y: number): void {
  // 15%概率掉落道具
  if (Math.random() > 0.15) return
  
  const types: Array<'scatter' | 'nuke' | 'freeze_all' | 'speed_boost'> = [
    'scatter', 'scatter', 'scatter',  // 散射更常见
    'nuke',
    'freeze_all',
    'speed_boost'
  ]
  
  const type = types[Math.floor(Math.random() * types.length)]
  const config = POWERUP_CONFIGS[type]
  
  const powerup: Powerup = {
    id: `powerup_${Date.now()}_${Math.random()}`,
    type,
    x,
    y,
    icon: config.icon,
    color: config.color,
    life: 8,  // 8秒后消失
    vy: 0.5 + Math.random() * 0.3
  }
  
  state.powerups.push(powerup)
}

// 更新道具
export function updatePowerups(state: GameState, dt: number): void {
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i]
    
    // 重力下落
    p.y += p.vy
    p.life -= dt
    
    // 自动收集逻辑（靠近玩家时）
    const distToPlayer = Math.sqrt(
      (p.x - state.player.x) ** 2 + (p.y - state.player.y) ** 2
    )
    
    if (distToPlayer < 40) {
      // 自动收集
      usePowerup(state, p.type)
      state.powerups.splice(i, 1)
      continue
    }
    
    // 超时移除
    if (p.life <= 0 || p.y > 700) {
      state.powerups.splice(i, 1)
    }
  }
}

// 使用道具
export function usePowerup(state: GameState, type: string): void {
  const config = POWERUP_CONFIGS[type as keyof typeof POWERUP_CONFIGS]
  if (!config) return
  
  // playSound('collect')  // 暂时注释，等待音效系统更新
  
  switch (type) {
    case 'scatter':
      activateScatterBomb(state)
      break
    case 'nuke':
      activateNuke(state)
      break
    case 'freeze_all':
      activateFreezeAll(state, config.duration)
      break
    case 'speed_boost':
      activateSpeedBoost(state, config.duration)
      break
  }
  
  // 显示提示文字
  state.floatTexts.push({
    text: `${config.icon} ${config.name}!`,
    x: state.player.x,
    y: state.player.y - 40,
    life: 2,
    color: config.color,
    size: 18,
    vy: -1
  })
}

// 激活散射炸弹
function activateScatterBomb(state: GameState): void {
  const centerX = state.player.x
  const centerY = state.player.y
  const radius = 150  // 散射范围半径
  
  // 对范围内所有敌人造成伤害
  let hitCount = 0
  for (const enemy of state.enemies) {
    const dist = Math.sqrt((enemy.x - centerX) ** 2 + (enemy.y - centerY) ** 2)
    if (dist <= radius) {
      // 散射伤害（随距离递减）
      const damageRatio = 1 - (dist / radius)
      const damage = Math.floor(50 * damageRatio)
      
      enemy.hp -= damage
      hitCount++
      
      // 击退效果
      const angle = Math.atan2(enemy.y - centerY, enemy.x - centerX)
      enemy.x += Math.cos(angle) * 20
      enemy.y += Math.sin(angle) * 20
    }
  }
  
  // 特效
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i
    const speed = 3 + Math.random() * 4
    state.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color: '#FF6B6B',
      size: 4 + Math.random() * 3
    })
  }
  
  // 屏幕震动
  state.shakeAmt = 10
  
  if (hitCount > 0) {
    state.floatTexts.push({
      text: `💥 散射击中 ${hitCount} 个敌人!`,
      x: centerX,
      y: centerY - 60,
      life: 1.5,
      color: '#FF6B6B',
      size: 16,
      vy: -0.8
    })
  }
}

// 激活核弹
function activateNuke(state: GameState): void {
  let killCount = 0
  
  for (const enemy of state.enemies) {
    // 直接消灭（Boss除外或造成大量伤害）
    if (enemy.type === 'boss') {
      enemy.hp -= 200  // Boss受到200伤害
    } else {
      enemy.hp = 0
      killCount++
    }
  }
  
  // 清理死亡的敌人
  const beforeLength = state.enemies.length
  state.enemies = state.enemies.filter(e => e.hp > 0)
  killCount = beforeLength - state.enemies.length
  
  // 核爆特效
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 400
    const y = Math.random() * 700
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.5,
      maxLife: 1.5,
      color: ['#FFD700', '#FF6B6B', '#FFFFFF'][Math.floor(Math.random() * 3)],
      size: 5 + Math.random() * 5
    })
  }
  
  // 强烈屏幕震动
  state.shakeAmt = 20
  
  if (killCount > 0) {
    state.floatTexts.push({
      text: `☢️ 核弹消灭 ${killCount} 个敌人!`,
      x: 200,
      y: 350,
      life: 2,
      color: '#FFD700',
      size: 24,
      vy: -0.5
    })
  }
}

// 激活全体冰冻
function activateFreezeAll(state: GameState, duration: number): void {
  for (const enemy of state.enemies) {
    enemy.speed = enemy.baseSpeed * 0.2  // 减速到20%
    // 设置冰冻计时器（在enemy更新逻辑中处理恢复）
    ;(enemy as any).freezeTimer = duration
  }
  
  // 冰冻特效
  for (const enemy of state.enemies) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i
      state.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 0.8,
        maxLife: 0.8,
        color: '#00E5FF',
        size: 3
      })
    }
  }
  
  state.floatTexts.push({
    text: `❄️ 全体冰冻 ${duration} 秒!`,
    x: 200,
    y: 350,
    life: 2,
    color: '#00E5FF',
    size: 20,
    vy: -0.5
  })
}

// 激活速度提升
function activateSpeedBoost(state: GameState, duration: number): void {
  // 为所有炮台添加射速加成
  const originalFireRates = new Map<string, number>()
  
  for (const turret of state.turrets) {
    originalFireRates.set(turret.id, turret.fireRate)
    turret.fireRate = Math.floor(turret.fireRate * 0.6)  // 射速提升40%（间隔减少）
  }
  
  // 设置定时器恢复
  setTimeout(() => {
    for (const turret of state.turrets) {
      const original = originalFireRates.get(turret.id)
      if (original) {
        turret.fireRate = original
      }
    }
  }, duration * 1000)
  
  state.floatTexts.push({
    text: `⚡ 炮台射速提升 ${duration} 秒!`,
    x: 200,
    y: 350,
    life: 2,
    color: '#FFA502',
    size: 20,
    vy: -0.5
  })
}

// 绘制道具
export function drawPowerups(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const p of state.powerups) {
    ctx.save()
    
    // 闪烁效果（即将消失时）
    if (p.life < 2 && Math.floor(p.life * 4) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }
    
    // 道具背景光晕
    ctx.shadowColor = p.color
    ctx.shadowBlur = 15
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    
    // 道具图标
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(p.icon, p.x, p.y)
    
    ctx.restore()
  }
}
