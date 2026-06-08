import type { Player, SaveData } from '../types'
import { GAME_CONFIG } from '../config'

const SAVE_KEY = 'abyss_dungeon_save'

export function saveGame(
  player: Player,
  currentLevel: number,
  highestLevel: number,
  totalScore: number,
  totalKills: number,
  totalGold: number,
  collectedEquipment: Player['inventory']
): void {
  const saveData: SaveData = {
    player: JSON.parse(JSON.stringify(player)),
    currentLevel,
    highestLevel: Math.max(highestLevel, currentLevel),
    totalScore,
    totalKills,
    totalGold,
    collectedEquipment: JSON.parse(JSON.stringify(collectedEquipment)),
    lastPlayed: new Date().toISOString(),
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
}

export function loadGame(): SaveData | null {
  const saved = localStorage.getItem(SAVE_KEY)
  if (!saved) return null

  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}

export function createNewGamePlayer(): Player {
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
    skills: [
      { id: 'skill_0', name: 'Basic Attack', icon: '⚔️', level: 1, maxLevel: 5, cooldown: 0, currentCooldown: 0, damage: 1.0, manaCost: 0, description: 'Basic melee attack.', unlocked: true },
      { id: 'skill_1', name: 'Power Strike', icon: '💥', level: 1, maxLevel: 5, cooldown: 5000, currentCooldown: 0, damage: 2.5, manaCost: 15, description: 'Powerful strike.', unlocked: false },
      { id: 'skill_2', name: 'Whirlwind', icon: '🌀', level: 1, maxLevel: 5, cooldown: 8000, currentCooldown: 0, damage: 1.5, manaCost: 20, description: 'Attack all nearby enemies.', unlocked: false },
      { id: 'skill_3', name: 'Heal', icon: '💚', level: 1, maxLevel: 5, cooldown: 10000, currentCooldown: 0, damage: 0, manaCost: 30, description: 'Heal 30% HP.', unlocked: false },
      { id: 'skill_4', name: 'Sprint', icon: '⚡', level: 1, maxLevel: 5, cooldown: 12000, currentCooldown: 0, damage: 0, manaCost: 10, description: 'Increase speed.', unlocked: false },
    ],
    inventory: [],
    lastAttackTime: 0,
    isMoving: false,
    isAttacking: false,
    isDead: false,
    invincibleTime: 0,
    gold: 0,
  }
}

export function mergePlayerData(savedPlayer: Player, newPlayer: Player): Player {
  return {
    ...newPlayer,
    level: savedPlayer.level,
    experience: savedPlayer.experience,
    experienceToNextLevel: savedPlayer.experienceToNextLevel,
    strength: savedPlayer.strength,
    agility: savedPlayer.agility,
    constitution: savedPlayer.constitution,
    perception: savedPlayer.perception,
    skills: savedPlayer.skills,
    inventory: savedPlayer.inventory,
    equippedWeapon: savedPlayer.equippedWeapon,
    equippedArmor: savedPlayer.equippedArmor,
    equippedAccessory: savedPlayer.equippedAccessory,
    gold: savedPlayer.gold,
    maxHp: savedPlayer.maxHp,
    maxMp: savedPlayer.maxMp,
  }
}