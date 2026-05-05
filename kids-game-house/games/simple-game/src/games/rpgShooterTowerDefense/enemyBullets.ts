// RPG Shooter 塔防融合版 - 敌人子弹系统

import { GameState, EnemyBullet } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, SCALE_RATIO } from './config'
import { playerHit } from './state'

// 生成唯一ID
let bulletIdCounter = 0
function generateBulletId(): string {
  return `eb_${++bulletIdCounter}`
}

// 更新所有敌人子弹
export function updateEnemyBullets(state: GameState, dt: number): void {
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const bullet = state.enemyBullets[i]

    // 移动子弹
    bullet.x += bullet.vx * 60 * dt
    bullet.y += bullet.vy * 60 * dt

    // 检查是否超出屏幕
    if (bullet.x < -50 || bullet.x > CANVAS_WIDTH + 50 ||
        bullet.y < -50 || bullet.y > CANVAS_HEIGHT + 50) {
      state.enemyBullets.splice(i, 1)
      continue
    }

    // 检查与玩家的碰撞（玩家大小为8）
    const distToPlayer = Math.sqrt(
      (bullet.x - state.player.x) ** 2 +
      (bullet.y - state.player.y) ** 2
    )

    if (distToPlayer < 8 * SCALE_RATIO + bullet.size) {
      // 范围伤害
      if (bullet.aoeRadius) {
        applyAoeDamage(state, bullet.x, bullet.y, bullet.damage, bullet.aoeRadius, bullet.color)
      } else {
        playerHit(state, bullet.damage)
      }

      // 击中特效
      for (let j = 0; j < 3; j++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1 + Math.random() * 2
        state.particles.push({
          x: bullet.x,
          y: bullet.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          color: bullet.color,
          size: 2 + Math.random() * 2
        })
      }

      // 移除子弹
      state.enemyBullets.splice(i, 1)
      continue
    }

    // 检查与炮台的碰撞
    let hitTurret = false
    for (const turret of state.turrets) {
      const distToTurret = Math.sqrt(
        (bullet.x - turret.x) ** 2 +
        (bullet.y - turret.y) ** 2
      )

      if (distToTurret < 15 + bullet.size) {
        // 范围伤害
        if (bullet.aoeRadius) {
          applyAoeDamage(state, bullet.x, bullet.y, bullet.damage, bullet.aoeRadius, bullet.color)
        } else {
          // 击中炮台
          turret.hp -= bullet.damage

          // 显示伤害数字
          state.floatTexts.push({
            text: `-${bullet.damage}`,
            x: turret.x + (Math.random() - 0.5) * 20,
            y: turret.y - 15,
            life: 1.0,
            color: '#FF4757',
            size: 14,
            vy: -1.2
          })

          // 检查炮台是否被摧毁
          if (turret.hp <= 0) {
            const index = state.turrets.findIndex(t => t.id === turret.id)
            if (index !== -1) {
              state.turrets.splice(index, 1)
            }
          }
        }

        // 击中特效
        for (let j = 0; j < 3; j++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 1 + Math.random() * 2
          state.particles.push({
            x: bullet.x,
            y: bullet.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3 + Math.random() * 0.2,
            maxLife: 0.5,
            color: '#FFA502',
            size: 2 + Math.random() * 2
          })
        }

        hitTurret = true
        break
      }
    }

    if (hitTurret) {
      state.enemyBullets.splice(i, 1)
    }
  }
}

// 范围伤害处理
function applyAoeDamage(
  state: GameState,
  x: number,
  y: number,
  damage: number,
  radius: number,
  color: string
): void {
  // 对玩家造成伤害
  const distToPlayer = Math.sqrt(
    (x - state.player.x) ** 2 + (y - state.player.y) ** 2
  )
  if (distToPlayer <= radius) {
    playerHit(state, damage)
  }

  // 对范围内的炮台造成伤害
  for (let i = state.turrets.length - 1; i >= 0; i--) {
    const turret = state.turrets[i]
    const dist = Math.sqrt((turret.x - x) ** 2 + (turret.y - y) ** 2)
    if (dist <= radius) {
      turret.hp -= damage
      state.floatTexts.push({
        text: `-${damage}`,
        x: turret.x + (Math.random() - 0.5) * 20,
        y: turret.y - 15,
        life: 1.0,
        color: '#FF4757',
        size: 14,
        vy: -1.2
      })
      if (turret.hp <= 0) {
        state.turrets.splice(i, 1)
      }
    }
  }

  // 范围伤害特效（更大的爆炸圈）
  const particleCount = Math.min(Math.floor(radius / 2), 30)
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 / particleCount) * i
    const speed = 2 + Math.random() * 3
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 0.3,
      maxLife: 0.9,
      color,
      size: 3 + Math.random() * 3
    })
  }

  // 范围伤害提示文字
  state.floatTexts.push({
    text: `💥 范围伤害!`,
    x: x,
    y: y - 30,
    life: 1.2,
    color: '#FF6B6B',
    size: 16,
    vy: -1.0
  })
}

// 绘制所有敌人子弹
export function drawEnemyBullets(ctx: any, state: GameState): void {
  for (const bullet of state.enemyBullets) {
    ctx.save()
    
    // 发光效果
    ctx.shadowColor = bullet.color
    ctx.shadowBlur = 8
    
    // 绘制子弹
    ctx.fillStyle = bullet.color
    ctx.beginPath()
    ctx.arc(bullet.x, bullet.y, bullet.size * SCALE_RATIO, 0, Math.PI * 2)
    ctx.fill()
    
    // 内部高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(bullet.x - 1, bullet.y - 1, bullet.size * SCALE_RATIO * 0.4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }
}
