import type { Zombie, ZombieType, Plant } from '../types'
import { ZOMBIE_CONFIGS, GAME_CONFIG, generateId } from '../config'

export function createZombie(type: ZombieType, row: number): Zombie {
  const config = ZOMBIE_CONFIGS[type]
  return {
    id: generateId(),
    type,
    health: config.health,
    maxHealth: config.health,
    speed: config.speed,
    baseSpeed: config.speed,
    damage: config.damage,
    reward: config.reward,
    position: {
      x: GAME_CONFIG.CANVAS_WIDTH + 50,
      y: row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2,
    },
    row,
    isSlowed: false,
    slowTimer: 0,
    isEating: false,
    lastEatTime: 0,
    animationFrame: 0,
    isJumping: false,
    jumpProgress: 0,
  }
}

export function updateZombies(
  zombies: Zombie[],
  plants: Plant[],
  currentTime: number
): { zombies: Zombie[]; plants: Plant[]; zombiesReached: number } {
  let zombiesReached = 0
  const updatedZombies: Zombie[] = []
  const updatedPlants = [...plants]
  
  zombies.forEach(zombie => {
    zombie.animationFrame = (zombie.animationFrame + 0.05) % 8
    
    if (zombie.isSlowed && zombie.slowTimer > 0) {
      zombie.slowTimer -= 16
      if (zombie.slowTimer <= 0) {
        zombie.isSlowed = false
        zombie.speed = zombie.baseSpeed
      }
    }
    
    if (zombie.isJumping) {
      zombie.jumpProgress += 0.05
      const jumpHeight = Math.sin(zombie.jumpProgress * Math.PI) * 60
      zombie.position.y = zombie.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2 - jumpHeight
      
      if (zombie.jumpProgress >= 1) {
        zombie.isJumping = false
        zombie.jumpProgress = 0
        zombie.position.y = zombie.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2
      }
    }
    
    const plantInFront = updatedPlants.find(p =>
      p.gridPos.row === zombie.row &&
      Math.abs(p.gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2 - zombie.position.x) < GAME_CONFIG.CELL_WIDTH / 2 + 20
    )
    
    if (plantInFront && !zombie.isJumping) {
      zombie.isEating = true
      zombie.position.x = plantInFront.gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2 + GAME_CONFIG.CELL_WIDTH / 2 - 10
      
      if (currentTime - zombie.lastEatTime >= 1000) {
        plantInFront.health -= zombie.damage
        zombie.lastEatTime = currentTime
        
        if (plantInFront.health <= 0) {
          const idx = updatedPlants.indexOf(plantInFront)
          if (idx !== -1) {
            updatedPlants.splice(idx, 1)
          }
          zombie.isEating = false
        }
      }
    } else {
      zombie.isEating = false
      zombie.position.x -= zombie.speed * (zombie.isSlowed ? 0.5 : 1)
    }
    
    if (zombie.type === 'pole_vault' && !zombie.isJumping && plantInFront && !zombie.isEating) {
      zombie.isJumping = true
    }
    
    if (zombie.position.x < -50) {
      zombiesReached++
    } else {
      updatedZombies.push(zombie)
    }
  })
  
  return { zombies: updatedZombies, plants: updatedPlants, zombiesReached }
}

export function damageZombie(zombie: Zombie, damage: number, slowDuration?: number): { zombie: Zombie; killed: boolean } {
  zombie.health -= damage
  
  if (slowDuration && slowDuration > 0) {
    zombie.isSlowed = true
    zombie.slowTimer = slowDuration
    zombie.speed = zombie.baseSpeed * 0.5
  }
  
  return { zombie, killed: zombie.health <= 0 }
}