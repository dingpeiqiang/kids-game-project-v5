import type { Trap, Player } from '../types'
import { GAME_CONFIG } from '../config'

let trapIdCounter = 0

export function createTraps(levelTraps: { type: Trap['type']; x: number; y: number; width?: number; height?: number; cooldown?: number; damage?: number }[]): Trap[] {
  return levelTraps.map(trapConfig => ({
    id: trapIdCounter++,
    x: trapConfig.x,
    y: trapConfig.y,
    width: trapConfig.width || 32,
    height: trapConfig.height || 16,
    type: trapConfig.type,
    active: true,
    cooldown: trapConfig.cooldown || 180,
    lastActivated: 0,
    damage: trapConfig.damage || 10,
  }))
}

export function updateTraps(traps: Trap[], player: Player, cameraX: number, frameCount: number): { playerHit: boolean; damage: number } {
  const visibleLeft = cameraX - 100
  const visibleRight = cameraX + GAME_CONFIG.CANVAS_WIDTH + 100
  
  for (const trap of traps) {
    // 跳过屏幕外的陷阱
    if (trap.x < visibleLeft || trap.x > visibleRight) {
      continue
    }

    // 更新陷阱激活状态
    if (frameCount - trap.lastActivated >= trap.cooldown) {
      trap.active = true
    }

    // 检查碰撞
    if (trap.active && checkTrapCollision(trap, player)) {
      trap.active = false
      trap.lastActivated = frameCount
      
      console.log('[Traps] ⚠️ 陷阱触发！', {
        trapId: trap.id,
        type: trap.type,
        x: trap.x,
        y: trap.y,
        damage: trap.damage,
        frameCount: frameCount,
        playerX: player.x,
        playerY: player.y,
        playerInvincible: player.invincible,
        playerHp: player.hp,
        playerLives: player.lives
      })
      
      return { playerHit: true, damage: trap.damage }
    }
  }

  return { playerHit: false, damage: 0 }
}

function checkTrapCollision(trap: Trap, player: Player): boolean {
  const playerLeft = player.x
  const playerRight = player.x + player.width
  const playerTop = player.y
  const playerBottom = player.y + player.height

  const trapLeft = trap.x
  const trapRight = trap.x + trap.width
  const trapTop = trap.y
  const trapBottom = trap.y + trap.height

  return (
    playerRight > trapLeft &&
    playerLeft < trapRight &&
    playerBottom > trapTop &&
    playerTop < trapBottom
  )
}

export function resetTrapIdCounter(): void {
  trapIdCounter = 0
}
