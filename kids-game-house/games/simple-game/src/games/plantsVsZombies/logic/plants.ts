import type { Plant, PlantType, GridPos, Zombie } from '../types'
import { PLANT_CONFIGS, generateId, gridToPixel } from '../config'

export function createPlant(type: PlantType, gridPos: GridPos): Plant {
  const config = PLANT_CONFIGS[type]
  const pos = gridToPixel(gridPos)
  
  return {
    id: generateId(),
    type,
    name: config.name,
    sunCost: config.sunCost,
    health: config.health,
    maxHealth: config.health,
    attack: config.attack,
    attackSpeed: config.attackSpeed,
    range: config.range,
    sunProduction: config.sunProduction,
    sunInterval: config.sunInterval,
    aoeRadius: config.aoeRadius,
    slowDuration: config.slowDuration,
    gridPos,
    lastAttackTime: 0,
    lastSunTime: Date.now(),
    isReady: type !== 'potato_mine',
    animationFrame: 0,
  }
}

export function updatePlants(
  plants: Plant[],
  zombies: Zombie[],
  projectiles: { id: string; x: number; y: number; speed: number; damage: number; type: 'pea' | 'snow_pea'; row: number }[],
  suns: { id: string; x: number; y: number; vy: number; targetY: number; isCollected: boolean }[],
  currentTime: number
) {
  const newProjectiles: typeof projectiles = []
  
  plants.forEach((plant, plantIndex) => {
    plant.animationFrame = (plant.animationFrame + 0.1) % 4
    
    if (plant.sunProduction && plant.sunInterval) {
      if (currentTime - plant.lastSunTime >= plant.sunInterval) {
        const pos = gridToPixel(plant.gridPos)
        suns.push({
          id: generateId(),
          x: pos.x,
          y: pos.y,
          vy: -2,
          targetY: pos.y - 60,
          isCollected: false,
        })
        plant.lastSunTime = currentTime
      }
    }
    
    if (plant.attack && plant.attackSpeed && plant.isReady) {
      if (currentTime - plant.lastAttackTime >= plant.attackSpeed) {
        const zombiesInRow = zombies.filter(z => z.row === plant.gridPos.row && !z.isJumping)
        const closestZombie = zombiesInRow.reduce((closest, z) => {
          if (!closest) return z
          return z.position.x < closest.position.x ? z : closest
        }, null as Zombie | null)
        
        if (closestZombie) {
          const plantPos = gridToPixel(plant.gridPos)
          const zombieDistance = closestZombie.position.x - plantPos.x
          
          if (zombieDistance > 0 && zombieDistance < (plant.range || 9) * 80) {
            if (plant.type === 'repeater') {
              newProjectiles.push(
                createProjectile(plantPos.x + 30, plantPos.y, plant.slowDuration ? 'snow_pea' : 'pea', plant.gridPos.row, plant.attack),
                createProjectile(plantPos.x + 30, plantPos.y + 10, plant.slowDuration ? 'snow_pea' : 'pea', plant.gridPos.row, plant.attack)
              )
            } else {
              newProjectiles.push(
                createProjectile(plantPos.x + 30, plantPos.y, plant.slowDuration ? 'snow_pea' : 'pea', plant.gridPos.row, plant.attack)
              )
            }
            plant.lastAttackTime = currentTime
          }
        }
      }
    }
    
    if (!plant.isReady) {
      if (currentTime - plant.lastAttackTime >= 1500) {
        plant.isReady = true
      }
    }
  })
  
  return { newProjectiles, plants: plants.filter(p => p.health > 0) }
}

function createProjectile(x: number, y: number, type: 'pea' | 'snow_pea', row: number, damage: number) {
  return {
    id: generateId(),
    x,
    y,
    speed: 8,
    damage,
    type,
    row,
  }
}

export function damagePlant(plant: Plant, damage: number): { plant: Plant; destroyed: boolean } {
  plant.health -= damage
  return { plant, destroyed: plant.health <= 0 }
}

export function getPlantAt(plants: Plant[], gridPos: GridPos): Plant | undefined {
  return plants.find(p => p.gridPos.row === gridPos.row && p.gridPos.col === gridPos.col)
}