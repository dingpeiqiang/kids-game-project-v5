import {
  BASE_H,
  BASE_W,
  BUFF_OPTIONS,
  DRAGON_FIRE,
  DRAGON_NORMAL,
  ENDLESS_HP_MULT,
  HERO,
  WAVES,
  BOX_EVERY_SEGMENTS,
} from '../config'
import type { BuffId } from '../config'
import type { Dragon, DragonKind, GameState, Player } from '../types'

function createPlayer(): Player {
  return {
    x: BASE_W / 2,
    y: BASE_H * HERO.yRatio,
    hp: HERO.maxHp,
    maxHp: HERO.maxHp,
    fireCooldown: 0,
    damage: HERO.damage,
    fireRate: HERO.fireRate,
    pierce: 0,
    multiShot: 1,
  }
}

function layoutDragon(kind: DragonKind, hpMult = 1, extraSegments = 0): Dragon {
  const def = kind === 'dragon_fire' ? DRAGON_FIRE : DRAGON_NORMAL
  const count = def.segments + extraSegments
  const segHp = (def.totalHp / def.segments) * hpMult
  const totalW = count * def.segmentWidth
  const startX = (BASE_W - totalW) / 2 + def.segmentWidth / 2
  const segments = Array.from({ length: count }, (_, i) => ({
    index: i,
    hp: segHp,
    maxHp: segHp,
    x: startX + i * def.segmentWidth,
    y: BASE_H * def.yRatio,
    isBox: (i + 1) % BOX_EVERY_SEGMENTS === 0,
    boxOpened: false,
    wobble: Math.random() * Math.PI * 2,
  }))
  return {
    kind,
    segments,
    fireTimer: def.bulletInterval * 0.5,
    dead: false,
  }
}

export function createInitialState(): GameState {
  const player = createPlayer()
  const dragon = spawnWaveDragon(0, false)
  return {
    waveIndex: 0,
    endless: false,
    phase: 'playing',
    score: 0,
    stars: 3,
    player,
    dragon,
    bullets: [],
    particles: [],
    floatTexts: [],
    buffChoices: [],
    waveHpAtStart: player.hp,
    time: 0,
    waveClearTimer: 0,
    showedWave1Guide: false,
  }
}

export function spawnWaveDragon(waveIndex: number, endless: boolean): Dragon {
  if (endless) {
    const kind: DragonKind = Math.random() < 0.45 ? 'dragon_fire' : 'dragon_normal'
    const mult = Math.pow(ENDLESS_HP_MULT, waveIndex - WAVES.length + 1)
    return layoutDragon(kind, mult)
  }
  const wave = WAVES[Math.min(waveIndex, WAVES.length - 1)]
  return layoutDragon(wave.dragon, 1, 'extraSegments' in wave ? wave.extraSegments ?? 0 : 0)
}

export function rollBuffChoices(): BuffId[] {
  const pool = [...BUFF_OPTIONS.map(b => b.id)]
  const picks: BuffId[] = []
  while (picks.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    picks.push(pool.splice(i, 1)[0])
  }
  return picks
}

export function applyBuff(state: GameState, buff: BuffId): void {
  const p = state.player
  switch (buff) {
    case 'pierce':
      p.pierce = Math.max(p.pierce, 2)
      break
    case 'multi':
      p.multiShot = 3
      break
    case 'atk':
      p.damage = Math.floor(p.damage * 1.4)
      break
    case 'rate':
      p.fireRate *= 1.35
      break
    case 'heal':
      p.hp = Math.min(p.maxHp, p.hp + 2)
      break
    default:
      break
  }
  state.phase = 'playing'
  state.buffChoices = []
}

export function computeStars(hp: number, maxHp: number): number {
  const ratio = hp / maxHp
  if (ratio >= 1) return 3
  if (ratio >= 0.5) return 2
  return 1
}