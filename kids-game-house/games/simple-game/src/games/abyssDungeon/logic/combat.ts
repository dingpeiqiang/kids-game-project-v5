import type { Player, Enemy, DungeonLevel, DamageNumber, LootItem } from '../types'
import { GAME_CONFIG } from '../config'
import { calculateDamage, addExperience, generateRandomEquipment } from './player'
import { dealDamageToEnemy, calculateEnemyDamage, checkEnemyCollision } from './enemy'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function handlePlayerAttack(
  player: Player,
  dungeon: DungeonLevel,
  currentTime: number
): {
  damageNumbers: DamageNumber[]
  enemiesKilled: number
  experienceGained: number
  goldGained: number
  lootDropped: LootItem[]
} {
  const damageNumbers: DamageNumber[] = []
  let enemiesKilled = 0
  let experienceGained = 0
  let goldGained = 0
  const lootDropped: LootItem[] = []

  const attackCooldown = GAME_CONFIG.ATTACK_COOLDOWN / player.attackSpeed
  if (currentTime - player.lastAttackTime < attackCooldown) {
    return { damageNumbers, enemiesKilled, experienceGained, goldGained, lootDropped }
  }

  const damageInfo = calculateDamage(player)
  const isCritical = Math.random() < damageInfo.critChance

  const allEnemies = [...dungeon.enemies, ...(dungeon.boss ? [dungeon.boss] : [])]
  
  for (const enemy of allEnemies) {
    if (enemy.isDead) continue

    if (checkEnemyCollision(enemy, player.position.x, player.position.y, GAME_CONFIG.ATTACK_RANGE)) {
      const result = dealDamageToEnemy(enemy, damageInfo.base, isCritical)
      
      damageNumbers.push({
        id: generateId(),
        position: { ...enemy.position, z: 1 },
        value: Math.floor(result.damageDealt),
        color: isCritical ? '#ff00ff' : '#ff4444',
        life: 1,
        maxLife: 1,
        velocity: { x: (Math.random() - 0.5) * 2, y: -3 },
        isCritical,
      })

      if (result.killed) {
        enemiesKilled++
        experienceGained += enemy.type === 'boss' 
          ? GAME_CONFIG.EXPERIENCE_REWARD.boss
          : enemy.type === 'elite'
            ? GAME_CONFIG.EXPERIENCE_REWARD.elite
            : GAME_CONFIG.EXPERIENCE_REWARD.normal

        goldGained += enemy.type === 'boss'
          ? GAME_CONFIG.GOLD_REWARD.boss
          : enemy.type === 'elite'
            ? GAME_CONFIG.GOLD_REWARD.elite
            : GAME_CONFIG.GOLD_REWARD.normal

        generateLoot(enemy, lootDropped)
      }
    }
  }

  player.lastAttackTime = currentTime
  return { damageNumbers, enemiesKilled, experienceGained, goldGained, lootDropped }
}

function generateLoot(enemy: Enemy, lootItems: LootItem[]): void {
  if (Math.random() < GAME_CONFIG.LOOT_CHANCES.equipment) {
    const rarity = enemy.type === 'boss' ? 'rare' : enemy.type === 'elite' ? 'uncommon' : 'common'
    const equipment = generateRandomEquipment(rarity)
    if (equipment) {
      lootItems.push({
        type: 'equipment',
        equipment,
        chance: 1,
      })
    }
  }

  if (Math.random() < GAME_CONFIG.LOOT_CHANCES.experience) {
    lootItems.push({
      type: 'experience',
      experienceAmount: enemy.type === 'boss' ? 50 : enemy.type === 'elite' ? 20 : 10,
      chance: 1,
    })
  }
}

export function handleEnemyAttack(
  player: Player,
  enemy: Enemy,
  currentTime: number
): { playerHit: boolean; damage: number } {
  const dist = Math.sqrt(
    Math.pow(player.position.x - enemy.position.x, 2) +
    Math.pow(player.position.y - enemy.position.y, 2)
  )

  if (dist > enemy.attackRange) {
    return { playerHit: false, damage: 0 }
  }

  const attackInterval = 1000 / enemy.attackSpeed
  if (currentTime - enemy.lastAttackTime < attackInterval) {
    return { playerHit: false, damage: 0 }
  }

  enemy.lastAttackTime = currentTime
  const damage = calculateEnemyDamage(enemy)
  
  return { playerHit: true, damage }
}

export function handleTrapCollision(
  player: Player,
  dungeon: DungeonLevel,
  currentTime: number
): { hit: boolean; damage: number; trapId: string | null } {
  for (const trap of dungeon.traps) {
    if (!trap.active || currentTime - trap.lastActivated < trap.cooldown) continue

    const dx = player.position.x - trap.position.x
    const dy = player.position.y - trap.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 1.5) {
      trap.lastActivated = currentTime
      trap.triggered = true
      return { hit: true, damage: trap.damage, trapId: trap.id }
    }
  }

  return { hit: false, damage: 0, trapId: null }
}

export function checkStairsCollision(
  player: Player,
  dungeon: DungeonLevel
): boolean {
  const stairs = dungeon.stairsPosition
  const dx = player.position.x - stairs.x
  const dy = player.position.y - stairs.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  return dist < 2
}

export function checkChestInteraction(
  player: Player,
  dungeon: DungeonLevel
): string | null {
  for (const chest of dungeon.chests) {
    if (chest.opened) continue
    
    const dx = player.position.x - chest.position.x
    const dy = player.position.y - chest.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < 1.5) {
      return chest.id
    }
  }
  
  return null
}

export function checkSwitchInteraction(
  player: Player,
  dungeon: DungeonLevel
): string | null {
  for (const sw of dungeon.switches) {
    const dx = player.position.x - sw.position.x
    const dy = player.position.y - sw.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < 1.5) {
      return sw.id
    }
  }
  
  return null
}

export function checkBossDefeated(dungeon: DungeonLevel): boolean {
  if (!dungeon.boss) return true
  return dungeon.boss.isDead
}

export function checkAllEnemiesDefeated(dungeon: DungeonLevel): boolean {
  return dungeon.enemies.every(e => e.isDead) && (!dungeon.boss || dungeon.boss.isDead)
}

export function updateDamageNumbers(damageNumbers: DamageNumber[], deltaTime: number): DamageNumber[] {
  return damageNumbers.filter(dmg => {
    dmg.life -= deltaTime
    dmg.position.x += dmg.velocity.x * deltaTime * 60
    dmg.position.y += dmg.velocity.y * deltaTime * 60
    dmg.velocity.y += 0.5 * deltaTime * 60
    return dmg.life > 0
  })
}

export function collectLoot(
  player: Player,
  lootItems: LootItem[]
): { experience: number; gold: number; equipment: LootItem[] } {
  let experience = 0
  let gold = 0
  const equipmentLoot: LootItem[] = []

  for (const item of lootItems) {
    switch (item.type) {
      case 'gold':
        gold += item.goldAmount || 0
        player.gold += item.goldAmount || 0
        break
      case 'experience':
        experience += item.experienceAmount || 0
        break
      case 'equipment':
        equipmentLoot.push(item)
        break
    }
  }

  return { experience, gold, equipment: equipmentLoot }
}