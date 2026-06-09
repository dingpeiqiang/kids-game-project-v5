import type { LevelDef, TrackTheme } from './types'

export const STORAGE_KEY = 'cloudBallRush3d_stats'

export const GAME_CONFIG = {
  ballRadius: 0.45,
  fallY: -12,
  baseAccel: 28,
  maxSpeed: 14,
  friction: 0.92,
  airControl: 0.35,
  jumpImpulse: 7.5,
  gravity: 22,
  casualTrackWidthMul: 1.18,
  casualBarrierSpeedMul: 0.72,
  competeTrackWidthMul: 1,
  starScore: 120,
  hiddenStarScore: 200,
  levelCompleteBonus: 500,
  threeStarRatio: 0.95,
  twoStarRatio: 0.7,
  powerUpDuration: { shield: 8, speed: 5, guide: 10 } as const,
} as const

const THEME_SKY: Record<TrackTheme, { clear: [number, number, number, number]; ground: [number, number, number] }> = {
  meadow: { clear: [0.72, 0.9, 0.82, 1], ground: [0.55, 0.85, 0.55] },
  cloud: { clear: [0.62, 0.82, 0.98, 1], ground: [0.75, 0.88, 1] },
  ice: { clear: [0.75, 0.88, 0.98, 1], ground: [0.65, 0.85, 0.95] },
  star: { clear: [0.15, 0.12, 0.35, 1], ground: [0.45, 0.35, 0.75] },
}

export function themeSky(theme: TrackTheme) {
  return THEME_SKY[theme]
}

function seg(
  x: number,
  z: number,
  halfW: number,
  halfD: number,
  y = 0,
  ice?: boolean,
): LevelDef['segments'][0] {
  return { x, z, halfW, halfD, y, ice }
}

/** 6 关递进：草甸 → 云端 → 冰雪 → 星穹 */
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: '青空草甸',
    theme: 'meadow',
    spawn: { x: 0, z: -14 },
    segments: [
      seg(0, -10, 4.5, 8),
      seg(0, 0, 4.5, 10),
      seg(0, 12, 4.2, 8),
      seg(2, 22, 3.5, 6),
    ],
    finish: { x: 2, z: 26, halfW: 2.5, halfD: 2 },
    stars: [
      { x: 0, z: -4, hidden: false },
      { x: -2, z: 4, hidden: false },
      { x: 2, z: 10, hidden: false },
      { x: 3.5, z: 22, hidden: true },
    ],
    powerUps: [{ kind: 'shield', x: 0, z: 6 }],
    barriers: [],
    slowZones: [{ x: 0, z: 2, halfW: 2, halfD: 2 }],
    bouncePads: [],
  },
  {
    id: 2,
    name: '草甸缓坡',
    theme: 'meadow',
    spawn: { x: 0, z: -16 },
    segments: [
      seg(0, -12, 4.5, 8),
      seg(0, -2, 4, 8, 0.8),
      seg(0, 8, 4, 10, 1.2),
      seg(0, 20, 4, 8, 0.5),
    ],
    finish: { x: 0, z: 24, halfW: 2.5, halfD: 2 },
    stars: [
      { x: 0, z: -6, hidden: false },
      { x: -2.5, z: 4, hidden: false },
      { x: 2, z: 14, hidden: false },
      { x: 0, z: 20, hidden: true },
    ],
    powerUps: [{ kind: 'speed', x: 0, z: 0 }],
    barriers: [],
    slowZones: [],
    bouncePads: [],
  },
  {
    id: 3,
    name: '云端弯道',
    theme: 'cloud',
    spawn: { x: -8, z: -12 },
    segments: [
      seg(-8, -8, 3.5, 8),
      seg(-4, 0, 3.5, 8),
      seg(2, 6, 3.5, 8),
      seg(6, 16, 3, 10),
      seg(2, 26, 3, 6),
    ],
    finish: { x: 2, z: 29, halfW: 2.2, halfD: 2 },
    stars: [
      { x: -6, z: -4, hidden: false },
      { x: 0, z: 6, hidden: false },
      { x: 6, z: 18, hidden: false },
      { x: 4, z: 26, hidden: true },
    ],
    powerUps: [{ kind: 'guide', x: -2, z: 2 }],
    barriers: [],
    slowZones: [],
    bouncePads: [{ x: 2, z: 12, halfW: 1.5, halfD: 1.2, impulse: 9 }],
  },
  {
    id: 4,
    name: '浮空平台',
    theme: 'cloud',
    spawn: { x: 0, z: -14 },
    segments: [
      seg(0, -10, 3.2, 8),
      seg(-3, 0, 2.8, 6),
      seg(3, 8, 2.8, 6),
      seg(0, 18, 3, 8),
      seg(0, 28, 2.8, 6),
    ],
    finish: { x: 0, z: 31, halfW: 2, halfD: 2 },
    stars: [
      { x: 0, z: -6, hidden: false },
      { x: -3, z: 4, hidden: false },
      { x: 3, z: 12, hidden: false },
      { x: 0, z: 24, hidden: true },
    ],
    powerUps: [{ kind: 'shield', x: 0, z: 16 }],
    barriers: [
      { x: 0, z: 6, halfW: 1.2, halfD: 0.4, axis: 'x', amp: 2.2, speed: 1.1, phase: 0 },
    ],
    slowZones: [{ x: 0, z: 20, halfW: 1.8, halfD: 2 }],
    bouncePads: [],
  },
  {
    id: 5,
    name: '冰雪琉璃',
    theme: 'ice',
    spawn: { x: 0, z: -16 },
    segments: [
      seg(0, -12, 3, 8, 0, true),
      seg(0, -2, 2.8, 8, 0, true),
      seg(-2, 10, 2.6, 8, 0.3, true),
      seg(2, 22, 2.6, 8, 0, true),
      seg(0, 32, 2.5, 6, 0, false),
    ],
    finish: { x: 0, z: 35, halfW: 2, halfD: 2 },
    stars: [
      { x: 0, z: -8, hidden: false },
      { x: -1.5, z: 6, hidden: false },
      { x: 2, z: 18, hidden: false },
      { x: 0, z: 30, hidden: true },
    ],
    powerUps: [{ kind: 'speed', x: -2, z: 10 }],
    barriers: [
      { x: 0, z: 4, halfW: 1, halfD: 0.35, axis: 'z', amp: 1.8, speed: 1.4, phase: 0.5 },
      { x: 2, z: 22, halfW: 1, halfD: 0.35, axis: 'x', amp: 2, speed: 1.2, phase: 1 },
    ],
    slowZones: [],
    bouncePads: [{ x: -2, z: 14, halfW: 1.2, halfD: 1, impulse: 8 }],
  },
  {
    id: 6,
    name: '星穹秘境',
    theme: 'star',
    spawn: { x: 0, z: -18 },
    segments: [
      seg(0, -14, 2.4, 8),
      seg(-2, -4, 2.2, 6),
      seg(2, 4, 2.2, 6),
      seg(0, 14, 2, 8),
      seg(-1, 24, 2, 6),
      seg(1, 34, 2, 8),
    ],
    finish: { x: 1, z: 38, halfW: 1.8, halfD: 2 },
    stars: [
      { x: 0, z: -10, hidden: false },
      { x: -2, z: 0, hidden: false },
      { x: 2, z: 10, hidden: false },
      { x: 0, z: 20, hidden: false },
      { x: 1, z: 32, hidden: true },
    ],
    powerUps: [
      { kind: 'shield', x: 0, z: 8 },
      { kind: 'guide', x: 1, z: 28 },
    ],
    barriers: [
      { x: 0, z: 6, halfW: 0.9, halfD: 0.35, axis: 'x', amp: 2.5, speed: 1.6, phase: 0 },
      { x: 0, z: 18, halfW: 0.9, halfD: 0.35, axis: 'z', amp: 2, speed: 1.5, phase: 1.2 },
      { x: 1, z: 30, halfW: 0.85, halfD: 0.35, axis: 'x', amp: 2.2, speed: 1.7, phase: 0.3 },
    ],
    slowZones: [{ x: 0, z: 12, halfW: 1.5, halfD: 1.5 }],
    bouncePads: [{ x: 2, z: 4, halfW: 1, halfD: 1, impulse: 9 }],
  },
]

/** 程序回退色；有贴图时由 assets 覆盖（manifest skin_*） */
export const BALL_SKINS = [
  { id: 0, name: '原生柔白', color: [0.96, 0.97, 0.98] as [number, number, number] },
  { id: 1, name: '马卡龙薄荷', color: [0.55, 0.92, 0.88] as [number, number, number], unlockStars: 4 },
  { id: 2, name: '马卡龙蜜桃', color: [1, 0.78, 0.68] as [number, number, number], unlockStars: 8 },
  { id: 3, name: '马卡龙薰衣草', color: [0.82, 0.72, 0.95] as [number, number, number], unlockStars: 12 },
  { id: 4, name: '星云青辉', color: [0.45, 0.85, 1] as [number, number, number], unlockStars: 16, nebula: true },
  { id: 5, name: '星云紫雾', color: [0.72, 0.55, 0.98] as [number, number, number], unlockStars: 20, nebula: true },
] as const