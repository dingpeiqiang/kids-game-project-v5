import { GridCellType, PlantKind, ZombieKind } from './types'

export const BASE_W = 960
export const BASE_H = 540
export const ASSET_ROOT = '/assets/plantZombieDefense2d'

export const COLORS = {
  primary: '#72D566',
  accent: '#FFD23F',
  bg: '#87CE98',
  danger: '#F87171',
  success: '#4ADE80',
  house: '#C4A46B',
  zombie: '#94B49F',
  pea: '#B8F070',
  lawnDark: '#6BBF7A',
  lawnLight: '#9AD9A5',
  hudBar: '#2D5A3D',
} as const

export const GAME_CONFIG = {
  gridW: 9,
  gridH: 5,
  cellPx: 72,
  houseBaseHp: 100,
  leakDamage: 25,
  sellRefundRatio: 0.2,
  maxZombies: 60,
  maxPeas: 40,
  maxSuns: 25,
  maxFloats: 30,
  maxParticles: 80,
  totalLevels: 15,
  zombieSpawnCol: 7.5,
  zombieReachCol: -0.35,
  peaSpeed: 195,
  sunFallInterval: 9,
  sunFallValue: 25,
  maxWavesPerLevel: 4,
  prepAutoStartSec: 2.5,
  cardBarH: 96,
} as const

/** 0=草坪可放 1=路径 2=小屋 3=禁区 */
export const MAP_LAYOUT: number[][] = [
  [0, 0, 0, 0, 0, 1, 1, 1, 2],
  [0, 0, 0, 0, 0, 1, 1, 1, 2],
  [0, 0, 0, 0, 0, 1, 1, 1, 2],
  [0, 0, 0, 0, 0, 1, 1, 1, 2],
  [0, 0, 0, 0, 0, 1, 1, 1, 2],
]

export const PLANT_DEFS: Record<
  PlantKind,
  {
    name: string
    emoji: string
    color: string
    cost: number
    maxHp: number
    damage: number
    fireRate: number
    rangeCols: number
    sunProduce: number
    sunInterval: number
    mineDelay: number
    mineDamage: number
    slowMul: number
    slowDuration: number
  }
> = {
  [PlantKind.peashooter]: {
    name: '豌豆射手',
    emoji: '🌿',
    color: '#72D566',
    cost: 100,
    maxHp: 80,
    damage: 12,
    fireRate: 1.2,
    rangeCols: 9,
    sunProduce: 0,
    sunInterval: 0,
    mineDelay: 0,
    mineDamage: 0,
    slowMul: 1,
    slowDuration: 0,
  },
  [PlantKind.sunflower]: {
    name: '向日葵',
    emoji: '🌻',
    color: '#FFD23F',
    cost: 50,
    maxHp: 60,
    damage: 0,
    fireRate: 0,
    rangeCols: 0,
    sunProduce: 25,
    sunInterval: 8,
    mineDelay: 0,
    mineDamage: 0,
    slowMul: 1,
    slowDuration: 0,
  },
  [PlantKind.wallnut]: {
    name: '高坚果',
    emoji: '\uD83E\uDD5C',
    color: '#A67C52',
    cost: 50,
    maxHp: 400,
    damage: 0,
    fireRate: 0,
    rangeCols: 0,
    sunProduce: 0,
    sunInterval: 0,
    mineDelay: 0,
    mineDamage: 0,
    slowMul: 1,
    slowDuration: 0,
  },
  [PlantKind.potatoMine]: {
    name: '土豆地雷',
    emoji: '🥔',
    color: '#C4A46B',
    cost: 25,
    maxHp: 50,
    damage: 0,
    fireRate: 0,
    rangeCols: 1,
    sunProduce: 0,
    sunInterval: 0,
    mineDelay: 2,
    mineDamage: 60,
    slowMul: 1,
    slowDuration: 0,
  },
  [PlantKind.snowPea]: {
    name: '寒冰豌豆',
    emoji: '❄️',
    color: '#87CFF0',
    cost: 175,
    maxHp: 75,
    damage: 10,
    fireRate: 1.4,
    rangeCols: 9,
    sunProduce: 0,
    sunInterval: 0,
    mineDelay: 0,
    mineDamage: 0,
    slowMul: 0.7,
    slowDuration: 2.5,
  },
}

export const ZOMBIE_DEFS: Record<
  ZombieKind,
  {
    name: string
    emoji: string
    color: string
    hp: number
    speed: number
    attackDps: number
    armorMul: number
    canJumpNut: boolean
  }
> = {
  [ZombieKind.normalZombie]: {
    name: '呆萌普通僵尸',
    emoji: '🧟',
    color: '#94B49F',
    hp: 120,
    speed: 32,
    attackDps: 5,
    armorMul: 1,
    canJumpNut: false,
  },
  [ZombieKind.flagZombie]: {
    name: '路牌僵尸',
    emoji: '🚩',
    color: '#869788',
    hp: 180,
    speed: 32,
    attackDps: 5,
    armorMul: 1,
    canJumpNut: false,
  },
  [ZombieKind.bucketZombie]: {
    name: '水桶僵尸',
    emoji: '🪣',
    color: '#738CA6',
    hp: 320,
    speed: 30,
    attackDps: 5,
    armorMul: 0.6,
    canJumpNut: false,
  },
  [ZombieKind.sportZombie]: {
    name: '皮球跳跳僵尸',
    emoji: '⚽',
    color: '#D49678',
    hp: 140,
    speed: 20,
    attackDps: 0,
    armorMul: 1,
    canJumpNut: true,
  },
}

export interface WaveGroup {
  kind: ZombieKind
  count: number
}

export interface LevelSpec {
  id: number
  label: string
  startSun: number
  difficultyMul: number
  plantCooldownMul: number
  houseHpBonus: number
  waves: { spawnInterval: number; groups: WaveGroup[] }[]
}

function scaleCount(n: number, mul: number): number {
  return Math.max(1, Math.round(n * mul))
}

function buildLevel(id: number): LevelSpec {
  const tier = id <= 5 ? 1 : id <= 10 ? 1.3 : 1.6
  const startSun = id <= 3 ? 250 : 200
  const plantCooldownMul = id >= 14 ? 0.85 : 1
  const houseHpBonus = id >= 14 ? 0.1 : 0

  const w1: WaveGroup[] =
    id <= 3
      ? [{ kind: ZombieKind.normalZombie, count: scaleCount(6, tier) }]
      : id <= 5
        ? [
            { kind: ZombieKind.normalZombie, count: scaleCount(8, tier) },
            { kind: ZombieKind.flagZombie, count: scaleCount(1, tier) },
          ]
        : id <= 10
          ? [
              { kind: ZombieKind.normalZombie, count: scaleCount(10, tier) },
              { kind: ZombieKind.flagZombie, count: scaleCount(2, tier) },
              { kind: ZombieKind.bucketZombie, count: scaleCount(1, tier) },
            ]
          : id <= 13
            ? [
                { kind: ZombieKind.bucketZombie, count: scaleCount(4, tier) },
                { kind: ZombieKind.flagZombie, count: scaleCount(3, tier) },
                { kind: ZombieKind.sportZombie, count: scaleCount(2, tier) },
              ]
            : [
                { kind: ZombieKind.normalZombie, count: scaleCount(6, tier) },
                { kind: ZombieKind.flagZombie, count: scaleCount(4, tier) },
                { kind: ZombieKind.bucketZombie, count: scaleCount(5, tier) },
                { kind: ZombieKind.sportZombie, count: scaleCount(4, tier) },
              ]

  const waves = [
    { spawnInterval: 0.9, groups: w1 },
    {
      spawnInterval: 0.75,
      groups: w1.map(g => ({ ...g, count: scaleCount(g.count + 1, 1) })),
    },
    {
      spawnInterval: 0.65,
      groups: w1.map(g => ({ ...g, count: scaleCount(g.count + 2, 1) })),
    },
    {
      spawnInterval: 0.55,
      groups: w1.map(g => ({ ...g, count: scaleCount(g.count + 3, 1) })),
    },
  ].slice(0, id <= 5 ? 3 : 4)

  return {
    id,
    label: `第${id}关`,
    startSun,
    difficultyMul: tier,
    plantCooldownMul,
    houseHpBonus,
    waves,
  }
}

export const LEVELS: LevelSpec[] = Array.from({ length: GAME_CONFIG.totalLevels }, (_, i) =>
  buildLevel(i + 1),
)

export const PLANT_CARD_ORDER: PlantKind[] = [
  PlantKind.sunflower,
  PlantKind.peashooter,
  PlantKind.wallnut,
  PlantKind.potatoMine,
  PlantKind.snowPea,
]

export function cellTypeAt(gx: number, gz: number): GridCellType {
  if (gx < 0 || gz < 0 || gx >= GAME_CONFIG.gridW || gz >= GAME_CONFIG.gridH) return GridCellType.forbid
  const v = MAP_LAYOUT[gz]![gx]!
  return v as GridCellType
}

export function canPlacePlantAt(gx: number, gz: number): boolean {
  return cellTypeAt(gx, gz) === GridCellType.empty
}

export function starsForHouseHp(ratio: number): 0 | 1 | 2 | 3 {
  if (ratio >= 1) return 3
  if (ratio >= 0.5) return 2
  if (ratio >= 0.1) return 1
  return 0
}