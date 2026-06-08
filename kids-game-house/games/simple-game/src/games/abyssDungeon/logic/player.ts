import type { Player, Equipment, Skill, InputState, Position } from '../types'
import { GAME_CONFIG, SKILL_TEMPLATES, WEAPON_TEMPLATES, ARMOR_TEMPLATES, ACCESSORY_TEMPLATES } from '../config'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function createInitialPlayer(): Player {
  const skills: Skill[] = SKILL_TEMPLATES.map((template, index) => ({
    ...template,
    id: `skill_${index}`,
    unlocked: index === 0,
  }))

  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    size: { width: 1, height: 1.8, depth: 1 },
    level: 1,
    experience: 0,
    experienceToNextLevel: GAME_CONFIG.EXPERIENCE_PER_LEVEL,
    hp: GAME_CONFIG.PLAYER_BASE_STATS.hp,
    maxHp: GAME_CONFIG.PLAYER_BASE_STATS.hp,
    mp: GAME_CONFIG.PLAYER_BASE_STATS.mp,
    maxMp: GAME_CONFIG.PLAYER_BASE_STATS.mp,
    strength: GAME_CONFIG.PLAYER_BASE_STATS.strength,
    agility: GAME_CONFIG.PLAYER_BASE_STATS.agility,
    constitution: GAME_CONFIG.PLAYER_BASE_STATS.constitution,
    perception: GAME_CONFIG.PLAYER_BASE_STATS.perception,
    attackSpeed: GAME_CONFIG.PLAYER_BASE_STATS.attackSpeed,
    moveSpeed: GAME_CONFIG.PLAYER_BASE_STATS.moveSpeed,
    equippedWeapon: null,
    equippedArmor: null,
    equippedAccessory: null,
    skills,
    inventory: [],
    lastAttackTime: 0,
    isMoving: false,
    isAttacking: false,
    isDead: false,
    invincibleTime: 0,
    gold: 0,
  }
}

export function calculateTotalStats(player: Player): {
  strength: number
  agility: number
  constitution: number
  perception: number
  attack: number
  defense: number
  maxHp: number
  maxMp: number
  attackSpeed: number
  moveSpeed: number
} {
  let strength = player.strength
  let agility = player.agility
  let constitution = player.constitution
  let perception = player.perception
  let attack = player.strength * 2
  let defense = player.constitution
  let maxHp = GAME_CONFIG.PLAYER_BASE_STATS.hp + (player.level - 1) * GAME_CONFIG.LEVEL_UP_STATS.hp
  let maxMp = GAME_CONFIG.PLAYER_BASE_STATS.mp + (player.level - 1) * GAME_CONFIG.LEVEL_UP_STATS.mp
  let attackSpeed = player.attackSpeed
  let moveSpeed = player.moveSpeed

  const equippedItems = [player.equippedWeapon, player.equippedArmor, player.equippedAccessory]
  
  for (const item of equippedItems) {
    if (item) {
      if (item.stats.strength) strength += item.stats.strength
      if (item.stats.agility) agility += item.stats.agility
      if (item.stats.constitution) constitution += item.stats.constitution
      if (item.stats.perception) perception += item.stats.perception
      if (item.stats.attack) attack += item.stats.attack
      if (item.stats.defense) defense += item.stats.defense
      if (item.stats.maxHp) maxHp += item.stats.maxHp
      if (item.stats.maxMp) maxMp += item.stats.maxMp
      if (item.stats.attackSpeed) attackSpeed += item.stats.attackSpeed
      if (item.stats.moveSpeed) moveSpeed += item.stats.moveSpeed
    }
  }

  return {
    strength,
    agility,
    constitution,
    perception,
    attack,
    defense,
    maxHp,
    maxMp,
    attackSpeed,
    moveSpeed,
  }
}

export function calculateDamage(player: Player): { base: number; critChance: number; critMultiplier: number } {
  const stats = calculateTotalStats(player)
  return {
    base: stats.attack,
    critChance: Math.min(0.5, stats.perception * 0.02),
    critMultiplier: 1.5,
  }
}

export function addExperience(player: Player, amount: number): { leveledUp: boolean; newLevel: number } {
  player.experience += amount
  
  while (player.experience >= player.experienceToNextLevel) {
    player.experience -= player.experienceToNextLevel
    player.level++
    player.experienceToNextLevel = Math.floor(
      GAME_CONFIG.EXPERIENCE_PER_LEVEL * Math.pow(GAME_CONFIG.EXPERIENCE_MULTIPLIER, player.level - 1)
    )
    
    player.strength += GAME_CONFIG.LEVEL_UP_STATS.strength
    player.agility += GAME_CONFIG.LEVEL_UP_STATS.agility
    player.constitution += GAME_CONFIG.LEVEL_UP_STATS.constitution
    player.perception += GAME_CONFIG.LEVEL_UP_STATS.perception
    
    const newMaxHp = calculateTotalStats(player).maxHp
    player.maxHp = newMaxHp
    player.hp = newMaxHp
    
    const newMaxMp = calculateTotalStats(player).maxMp
    player.maxMp = newMaxMp
    player.mp = newMaxMp

    unlockSkills(player)
    
    return { leveledUp: true, newLevel: player.level }
  }
  
  return { leveledUp: false, newLevel: player.level }
}

function unlockSkills(player: Player): void {
  const unlockLevels = [3, 5, 7, 9]
  
  player.skills.forEach((skill, index) => {
    if (index > 0 && !skill.unlocked && unlockLevels.includes(player.level)) {
      skill.unlocked = true
    }
  })
}

export function equipItem(player: Player, equipment: Equipment): void {
  switch (equipment.type) {
    case 'weapon':
      if (player.equippedWeapon) {
        player.inventory.push(player.equippedWeapon)
      }
      player.equippedWeapon = equipment
      break
    case 'armor':
      if (player.equippedArmor) {
        player.inventory.push(player.equippedArmor)
      }
      player.equippedArmor = equipment
      break
    case 'accessory':
      if (player.equippedAccessory) {
        player.inventory.push(player.equippedAccessory)
      }
      player.equippedAccessory = equipment
      break
  }

  const idx = player.inventory.findIndex(item => item.id === equipment.id)
  if (idx !== -1) {
    player.inventory.splice(idx, 1)
  }

  const newMaxHp = calculateTotalStats(player).maxHp
  if (player.maxHp !== newMaxHp) {
    player.hp += newMaxHp - player.maxHp
    player.maxHp = newMaxHp
  }
  
  const newMaxMp = calculateTotalStats(player).maxMp
  if (player.maxMp !== newMaxMp) {
    player.mp += newMaxMp - player.maxMp
    player.maxMp = newMaxMp
  }
}

export function useSkill(player: Player, skillIndex: number, currentTime: number): boolean {
  const skill = player.skills[skillIndex]
  
  if (!skill || !skill.unlocked) return false
  if (skill.currentCooldown > 0) return false
  if (player.mp < skill.manaCost) return false
  
  skill.currentCooldown = skill.cooldown
  player.mp -= skill.manaCost
  
  if (skill.id === 'skill_3') {
    const healAmount = Math.floor(calculateTotalStats(player).maxHp * 0.3)
    player.hp = Math.min(player.hp + healAmount, calculateTotalStats(player).maxHp)
  }
  
  if (skill.id === 'skill_4') {
    player.moveSpeed *= 2
    setTimeout(() => {
      player.moveSpeed = GAME_CONFIG.PLAYER_BASE_STATS.moveSpeed
    }, 3000)
  }
  
  return true
}

export function updatePlayerPosition(
  player: Player,
  input: InputState,
  deltaTime: number,
  isWalkable: (x: number, y: number) => boolean
): void {
  const stats = calculateTotalStats(player)
  const speed = stats.moveSpeed * deltaTime * 60
  let dx = 0
  let dy = 0

  if (input.up) dy -= speed
  if (input.down) dy += speed
  if (input.left) dx -= speed
  if (input.right) dx += speed

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy)
    dx /= length
    dy /= length

    const newX = player.position.x + dx * speed
    const newY = player.position.y + dy * speed

    if (isWalkable(newX, player.position.y)) {
      player.position.x = newX
    }
    if (isWalkable(player.position.x, newY)) {
      player.position.y = newY
    }

    player.rotation = Math.atan2(dy, dx)
    player.isMoving = true
  } else {
    player.isMoving = false
  }
}

export function takeDamage(player: Player, damage: number, currentTime: number): boolean {
  if (player.invincibleTime > currentTime) return false
  if (player.isDead) return false

  const stats = calculateTotalStats(player)
  const actualDamage = Math.max(1, damage - stats.defense)
  
  player.hp -= actualDamage
  
  if (player.hp <= 0) {
    player.hp = 0
    player.isDead = true
    return true
  }

  player.invincibleTime = currentTime + GAME_CONFIG.INVINCIBLE_DURATION
  return true
}

export function heal(player: Player, amount: number): void {
  const stats = calculateTotalStats(player)
  player.hp = Math.min(player.hp + amount, stats.maxHp)
}

export function restoreMana(player: Player, amount: number): void {
  const stats = calculateTotalStats(player)
  player.mp = Math.min(player.mp + amount, stats.maxMp)
}

export function respawnPlayer(player: Player, spawnPosition: Position): void {
  player.position = { ...spawnPosition }
  player.hp = calculateTotalStats(player).maxHp
  player.mp = calculateTotalStats(player).maxMp
  player.isDead = false
  player.invincibleTime = Date.now() + GAME_CONFIG.INVINCIBLE_DURATION
}

export function generateRandomEquipment(rarity: 'common' | 'uncommon' | 'rare'): Equipment | null {
  const templates: Omit<Equipment, 'id'>[] = [
    ...WEAPON_TEMPLATES.filter(e => e.rarity === rarity),
    ...ARMOR_TEMPLATES.filter(e => e.rarity === rarity),
    ...ACCESSORY_TEMPLATES.filter(e => e.rarity === rarity),
  ]

  if (templates.length === 0) return null

  const template = templates[Math.floor(Math.random() * templates.length)]
  return { ...template, id: generateId() }
}