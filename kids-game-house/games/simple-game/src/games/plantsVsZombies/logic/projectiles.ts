import type { Projectile, Zombie } from '../types'

export function updateProjectiles(
  projectiles: Projectile[],
  zombies: Zombie[]
): { projectiles: Projectile[]; zombies: Zombie[]; killedZombies: Zombie[] } {
  const updatedProjectiles: Projectile[] = []
  const updatedZombies = [...zombies]
  const killedZombies: Zombie[] = []
  
  projectiles.forEach(projectile => {
    projectile.x += projectile.speed
    
    if (projectile.x > 800) {
      return
    }
    
    const hitZombie = updatedZombies.find(zombie =>
      zombie.row === projectile.row &&
      Math.abs(zombie.position.x - projectile.x) < 30 &&
      Math.abs(zombie.position.y - projectile.y) < 40 &&
      !zombie.isJumping
    )
    
    if (hitZombie) {
      hitZombie.health -= projectile.damage
      
      if (projectile.type === 'snow_pea') {
        hitZombie.isSlowed = true
        hitZombie.slowTimer = 3000
        hitZombie.speed = hitZombie.baseSpeed * 0.5
      }
      
      if (hitZombie.health <= 0) {
        const idx = updatedZombies.indexOf(hitZombie)
        if (idx !== -1) {
          killedZombies.push(hitZombie)
          updatedZombies.splice(idx, 1)
        }
      }
    } else {
      updatedProjectiles.push(projectile)
    }
  })
  
  return { projectiles: updatedProjectiles, zombies: updatedZombies, killedZombies }
}