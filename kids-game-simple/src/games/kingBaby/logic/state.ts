import {
  CRYSTAL,
  ENEMY_HERO_SPAWN,
  ENEMY_YUJI,
  HERO_LIUBEI,
  LEVELS,
  MATCH,
  PLAYER_SPAWN,
} from '../config'
import type { GameState } from '../types'

export function createInitialState(levelIndex = 0): GameState {
  const level = LEVELS[Math.min(levelIndex, LEVELS.length - 1)]
  return {
    phase: 'playing',
    levelIndex,
    waveIndex: 0,
    wavesTotal: level.waves,
    waveTimer: 2,
    matchTime: 0,
    score: 0,
    gold: 0,
    kills: 0,
    combo: 0,
    comboTimer: 0,
    stars: 0,
    autoFight: false,
    hero: {
      x: PLAYER_SPAWN.x,
      y: PLAYER_SPAWN.y,
      hp: HERO_LIUBEI.maxHp,
      maxHp: HERO_LIUBEI.maxHp,
      shield: 0,
      shieldTimer: 0,
      atkCooldown: 0,
      skill1Cd: 0,
      ultCd: 0,
      dead: false,
      respawnTimer: 0,
      wobble: 0,
      facing: 1,
    },
    enemyHero: {
      active: level.heroAi,
      x: ENEMY_HERO_SPAWN.x,
      y: ENEMY_HERO_SPAWN.y,
      hp: ENEMY_YUJI.maxHp,
      maxHp: ENEMY_YUJI.maxHp,
      atkCooldown: 0,
      skillCd: 0,
      wobble: 0,
    },
    allyCrystal: { hp: CRYSTAL.maxHp, maxHp: CRYSTAL.maxHp },
    enemyCrystal: { hp: CRYSTAL.maxHp, maxHp: CRYSTAL.maxHp },
    minions: [],
    pickups: [],
    particles: [],
    floatTexts: [],
    skillFx: [],
    nextMinionId: 1,
    nextPickupId: 1,
    showedResult: false,
  }
}

export function calcStars(matchTimeSec: number, victory: boolean): number {
  if (!victory) return 0
  if (matchTimeSec <= MATCH.star3Sec) return 3
  if (matchTimeSec <= MATCH.star2Sec) return 2
  return 1
}