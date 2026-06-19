import type { Game, GameCategoryDef } from '../types'
import { GameEngine } from '../services/gameEngine'
import type { GameLayoutConfig } from './gameLayout'

export const GAME_CATEGORIES: GameCategoryDef[] = [
  { id: 'logic', label: '🧠 逻辑思维', icon: '💡', color: '#4D96FF', desc: '培养分析推理、因果判断与逻辑思维能力' },
  { id: 'memory', label: '🃏 记忆训练', icon: '🧩', color: '#9B59B6', desc: '增强短期记忆、模式识别与信息处理能力' },
  { id: 'attention', label: '🎯 专注力', icon: '👁️', color: '#FF6B6B', desc: '提升注意力集中、抗干扰与持续专注能力' },
  { id: 'reaction', label: '⚡ 反应速度', icon: '⚡', color: '#FFD93D', desc: '训练快速反应、瞬时决策与手眼协调能力' },
  { id: 'coordination', label: '🎮 手眼协调', icon: '🖐️', color: '#4ECDC4', desc: '锻炼精细动作、节奏控制与操作精准度' },
  { id: 'spatial', label: '📐 空间想象', icon: '🔲', color: '#87CEEB', desc: '发展空间感知、几何思维与立体建构能力' },
  { id: 'strategy', label: '♟️ 策略规划', icon: '♟️', color: '#5352ED', desc: '培养决策能力、资源管理与长远规划思维' },
  { id: 'creativity', label: '🎨 创造力', icon: '🌈', color: '#FF8E53', desc: '激发想象力、艺术感知与创新表达能力' },
  { id: 'problemSolving', label: '🔍 问题解决', icon: '🔑', color: '#A8E6CF', desc: '训练分析问题、寻找方案与灵活应变能力' },
  { id: 'patience', label: '🌱 耐心毅力', icon: '⏳', color: '#6BCB77', desc: '培养坚持不懈、延迟满足与抗压能力' },
]

export const MOCK_RANK_DATA = [
  { name: '小七', score: 9840 },
  { name: '小明', score: 8720 },
  { name: '游戏王', score: 7650 },
  { name: '小红', score: 6430 },
  { name: '随风', score: 5890 },
  { name: '星星', score: 5210 },
  { name: '夜月', score: 4100 },
  { name: '可可', score: 3850 },
  { name: '阿杰', score: 3520 },
  { name: '乐乐', score: 3100 },
  { name: '小雪', score: 2890 },
  { name: '阿明', score: 2650 },
  { name: '小雨', score: 2410 },
  { name: '小杰', score: 2180 },
]

export interface GameDisplayConfig {
  id: string
  visible: boolean
  order: number
  badge: string
}

export const GAME_DISPLAY_CONFIG: GameDisplayConfig[] = [
  { id: 'eliminate',     visible: true,  order: 1,  badge: '热门' },
  { id: 'tetris',        visible: true,  order: 2,  badge: '' },
  { id: 'jewelMatch',    visible: true,  order: 3,  badge: '' },
  { id: 'match3',        visible: true,  order: 4,  badge: '' },
  { id: 'bubbleShooter', visible: true,  order: 5,  badge: '' },
  { id: 'pop',           visible: true,  order: 1,  badge: '' },
  { id: 'whackMole',     visible: true,  order: 2,  badge: '推荐' },
  { id: 'colorTap',      visible: true,  order: 3,  badge: '' },
  { id: 'fruitSlice',    visible: true,  order: 1,  badge: '' },
  { id: 'cookieCut',     visible: true,  order: 2,  badge: '' },
  { id: 'dodge',         visible: true,  order: 1,  badge: '' },
  { id: 'racingRun',     visible: true,  order: 2,  badge: '热门' },
  { id: 'snake',         visible: true,  order: 3,  badge: '推荐' },
  { id: 'neonRun',       visible: true,  order: 4,  badge: '' },
  { id: 'slimeJump',     visible: true,  order: 5,  badge: '' },
  { id: 'superMario',    visible: true,  order: 6,  badge: '新' },
  { id: 'sort',          visible: true,  order: 1,  badge: '' },
  { id: 'bouncePath',    visible: true,  order: 2,  badge: '' },
  { id: 'starCatcher',   visible: true,  order: 3,  badge: '' },
  { id: 'stack',         visible: true,  order: 1,  badge: '' },
  { id: 'spaceShooter',  visible: true,  order: 1,  badge: '新' },
  { id: 'dragonShooter', visible: true,  order: 2,  badge: '新' },
  { id: 'rpgShooter',    visible: true,  order: 3,  badge: '推荐' },
  { id: 'rpgShooterTD',  visible: true,  order: 4,  badge: '新' },
  { id: 'contraRpg',     visible: true,  order: 5,  badge: '新' },
  { id: 'wangzheRpg',    visible: true,  order: 6,  badge: '新' },
  { id: 'towerDefense',  visible: true,  order: 1,  badge: '新' },
  { id: 'dnfRpg',        visible: true,  order: 2,  badge: '新' },
  { id: 'plantsVsZombies', visible: true, order: 3, badge: '新' },
  { id: 'memoryMatch',   visible: true,  order: 1,  badge: '' },
  { id: 'voxelRealm',    visible: true,  order: 2,  badge: '新' },
  { id: 'happyDefense',  visible: true, order: 3,  badge: '' },
  { id: 'plantZombieDefense', visible: true, order: 4, badge: '新' },
  { id: 'plantZombieDefense2d', visible: true, order: 5, badge: '新' },
  { id: 'cloudBallRush3d', visible: true, order: 4, badge: '' },
  { id: 'skyRush3d', visible: true, order: 5, badge: '新' },
  { id: 'skyFrenzy', visible: true, order: 6, badge: '' },
  { id: 'cuteTankBattle', visible: true, order: 6, badge: '新' },
  { id: 'beatDragon', visible: true, order: 7, badge: '新' },
  { id: 'kingBaby', visible: true, order: 8, badge: '新' },
]

export function getGameDisplayConfig(gameId: string): GameDisplayConfig {
  const found = GAME_DISPLAY_CONFIG.find(c => c.id === gameId)
  return found || { id: gameId, visible: false, order: 99, badge: '' }
}

export function getVisibleGameIds(): string[] {
  return GAME_DISPLAY_CONFIG.filter(c => c.visible).map(c => c.id)
}

export function isGameVisible(gameId: string): boolean {
  return getGameDisplayConfig(gameId).visible
}

/** 已接入 GameLifecycle + runCanvasLifecycle 的游戏 id */
export const FRAMEWORK_LIFECYCLE_GAME_IDS = [
  'bouncePath',
  'starCatcher',
  'colorTap',
  'cookieCut',
  'neonRun',
  'dodge',
  'eliminate',
  'pop',
  'whackMole',
  'fruitSlice',
  'snake',
  'tetris',
  'memoryMatch',
  'jewelMatch',
  'bubbleShooter',
  'sort',
  'slimeJump',
  'stack',
  'match3',
  'racingRun',
  'superMario',
  'spaceShooter',
  'dragonShooter',
  'towerDefense',
  'beatDragon',
  'kingBaby',
  'rpgShooter',
  'rpgShooterTD',
  'contraRpg',
  'wangzheRpg',
  'dnfRpg',
  'happyDefense',
  'plantsVsZombies',
  'plantZombieDefense2d',
  'plantZombieDefense',
  'cuteTankBattle',
  'skyFrenzy',
  'skyRush3d',
  'cloudBallRush3d',
  'voxelRealm',
] as const

export type FrameworkLifecycleGameId = (typeof FRAMEWORK_LIFECYCLE_GAME_IDS)[number]

export function isFrameworkLifecycleGame(gameId: string): gameId is FrameworkLifecycleGameId {
  return (FRAMEWORK_LIFECYCLE_GAME_IDS as readonly string[]).includes(gameId)
}

/** 开发环境：FRAMEWORK_LIFECYCLE_GAME_IDS 须与 GAME_REGISTRY 中 frameworkLifecycle 条目一致 */
export function assertFrameworkRegistryConsistency(): void {
  if (import.meta.env?.PROD) return
  const registryIds = Object.entries(GAME_REGISTRY)
    .filter(([, reg]) => reg.frameworkLifecycle)
    .map(([id]) => id)
    .sort()
  const listIds = [...FRAMEWORK_LIFECYCLE_GAME_IDS].sort()
  const missingInList = registryIds.filter(id => !(listIds as string[]).includes(id))
  const missingInRegistry = listIds.filter(id => !registryIds.includes(id))
  const missingDestroy = Object.entries(GAME_REGISTRY)
    .filter(([, reg]) => reg.frameworkLifecycle && !reg.destroy)
    .map(([id]) => id)
  if (missingInList.length || missingInRegistry.length || missingDestroy.length) {
    const msg = `[GameRegistry] frameworkLifecycle mismatch: list↔registry or missing destroy — ${JSON.stringify({ missingInList, missingInRegistry, missingDestroy })}`
    console.error(msg)
    throw new Error(msg)
  }
}

export interface GameRegistration {
  game: Game
  init: (engine: GameEngine, onEnd: () => void) => Promise<void>
  /** 退出/重开前释放 WebGL 等资源 */
  destroy?: () => void
  /** 使用 platform/GameLifecycle 托管循环（见 FRAMEWORK_LIFECYCLE_GAME_IDS） */
  frameworkLifecycle?: boolean
  isSpecial?: boolean
  /** 壳层画布与横竖屏策略（可与 gameLayout 默认合并，见 gameLayout.ts） */
  layout?: Partial<GameLayoutConfig>
  setup?: (canvas: HTMLDivElement) => { gameW: number; gameH: number; displayW: number; displayH: number }
}

export const GAME_REGISTRY: Record<string, GameRegistration> = {
  eliminate: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./eliminate').then(m => m.destroyEliminate())
    },
    game: { id: 'eliminate', name: '极速消除', desc: '点击同色方块，触发连锁爆炸！', type: '2d', category: 'logic', tag: '消除', color: '#FF6B6B,#FF8E53', players: 2847, best: 0, preview: 'eliminate' },
    init: async (engine, onEnd) => {
      const { initEliminate } = await import('./eliminate')
      initEliminate(engine, onEnd)
    }
  },

  tetris: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./tetris').then(m => m.destroyTetris())
    },
    game: { id: 'tetris', name: '方块消除', desc: '经典俄罗斯方块，益智又上瘾！', type: '2d', category: 'logic', tag: '消除', color: '#4D96FF,#FF8E53', players: 2341, best: 0, preview: 'tetris' },
    init: async (engine, onEnd) => {
      const { initTetris } = await import('./tetris')
      initTetris(engine, onEnd)
    }
  },

  jewelMatch: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./jewelMatch').then(m => m.destroyJewelMatch())
    },
    game: { id: 'jewelMatch', name: '宠物消消乐', desc: '交换宠物消除，3个以上连成一线！', type: '2d', category: 'logic', tag: '消除', color: '#FFD700,#9B59B6', players: 1876, best: 0, preview: 'jewelMatch' },
    init: async (engine, onEnd) => {
      const { initJewelMatch } = await import('./jewelMatch')
      initJewelMatch(engine, onEnd)
    }
  },

  match3: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./match3').then(m => m.destroyMatch3())
    },
    game: {
      id: 'match3',
      name: '宝石三消',
      desc: '交换相邻宝石，三连消除得分！',
      type: '2d',
      category: 'logic',
      tag: '消除',
      color: '#9B59B6,#E74C3C',
      players: 1420,
      best: 0,
      preview: 'match3',
    },
    init: async (engine, onEnd) => {
      const { initMatch3 } = await import('./match3')
      initMatch3(engine, onEnd)
    },
  },

  bubbleShooter: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./bubbleShooter').then(m => m.destroyBubbleShooter())
    },
    game: { id: 'bubbleShooter', name: '泡泡龙', desc: '经典泡泡龙射击，3个以上相同颜色消除！', type: '2d', category: 'logic', tag: '消除', color: '#4ECDC4,#FF69B4', players: 2134, best: 0, preview: 'bubbleShooter' },
    init: async (engine, onEnd) => {
      const { initBubbleShooter } = await import('./bubbleShooter')
      initBubbleShooter(engine, onEnd)
    }
  },

  sort: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./colorSort').then(m => m.destroyColorSort())
    },
    game: { id: 'sort', name: '色彩排序', desc: '10关卡渐进难度，液体排序超治愈！', type: '2d', category: 'logic', tag: '益智', color: '#DDA0DD,#BA55D3', players: 1532, best: 0, preview: 'sort' },
    init: async (engine, onEnd) => {
      const { initColorSort } = await import('./colorSort')
      initColorSort(engine, onEnd)
    }
  },

  memoryMatch: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./memoryMatch').then(m => m.destroyMemoryMatch())
    },
    game: { id: 'memoryMatch', name: '翻牌配对', desc: '翻开卡牌找到相同图案，考验你的记忆力！', type: '2d', category: 'memory', tag: '记忆', color: '#0f0c29,#A29BFE', players: 1800, best: 0, preview: 'memoryMatch' },
    init: async (engine, onEnd) => {
      const { initMemoryMatch } = await import('./memoryMatch')
      initMemoryMatch(engine, onEnd)
    }
  },

  colorTap: {
    frameworkLifecycle: true,
    game: { id: 'colorTap', name: '颜色Tap', desc: '快速点击匹配颜色，测试你的反应力！', type: '2d', category: 'attention', tag: '反应', color: '#FF6B6B,#4ECDC4', players: 1456, best: 0, preview: 'colorTap' },
    destroy: () => {
      void import('./colorTap').then(m => m.destroyColorTap())
    },
    init: async (engine, onEnd) => {
      const { initColorTap } = await import('./colorTap')
      initColorTap(engine, onEnd)
    },
  },

  whackMole: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./whackMole').then(m => m.destroyWhackMole())
    },
    game: { id: 'whackMole', name: '打地鼠', desc: '快速敲击出洞的地鼠，金色鼠得分多，小心炸弹！', type: '2d', category: 'attention', tag: '反应', color: '#8B5E3C,#FFD700', players: 2760, best: 0, preview: 'whackMole' },    init: async (engine, onEnd) => {
      const { initWhackMole } = await import('./whackMole')
      initWhackMole(engine, onEnd)
    }
  },

  pop: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./pop').then(m => m.destroyPop())
    },
    game: { id: 'pop', name: '气球砰砰', desc: '疯狂点击气球，炸出高分！', type: '2d', category: 'reaction', tag: '点击', color: '#FF69B4,#FF1493', players: 2108, best: 0, preview: 'pop' },    init: async (engine, onEnd) => {
      const { initPop } = await import('./pop')
      initPop(engine, onEnd)
    }
  },

  fruitSlice: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./fruitSlice').then(m => m.destroyFruitSlice())
    },
    game: { id: 'fruitSlice', name: '水果切切', desc: '划动切割水果，果汁飞溅超解压！', type: '2d', category: 'coordination', tag: '切割', color: '#FF6B6B,#FFD93D', players: 1654, best: 0, preview: 'fruitSlice' },    init: async (engine, onEnd) => {
      const { initFruitSlice } = await import('./fruitSlice')
      initFruitSlice(engine, onEnd)
    }
  },

  cookieCut: {
    frameworkLifecycle: true,
    game: { id: 'cookieCut', name: '切饼干', desc: '滑动切割飞起的饼干，碎屑四溅超有趣！', type: '2d', category: 'coordination', tag: '切割', color: '#D2691E,#FFD700', players: 1567, best: 0, preview: 'cookieCut' },
    destroy: () => {
      void import('./cookieCut').then(m => m.destroyCookieCut())
    },
    init: async (engine, onEnd) => {
      const { initCookieCut } = await import('./cookieCut')
      initCookieCut(engine, onEnd)
    },
  },

  dodge: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./dodge').then(m => m.destroyDodge())
    },
    game: { id: 'dodge', name: '轻量躲避', desc: '滑动躲避障碍，收集加分道具', type: '2d', category: 'coordination', tag: '躲避', color: '#4ECDC4,#45B7AA', players: 3215, best: 0, preview: 'dodge' },    init: async (engine, onEnd) => {
      const { initDodge } = await import('./dodge')
      initDodge(engine, onEnd)
    }
  },

  neonRun: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./neonRun').then(m => m.destroyNeonRun())
    },
    game: { id: 'neonRun', name: '霓虹跑酷', desc: '躲避障碍收集金币，无尽奔跑！', type: '2d', category: 'coordination', tag: '跑酷', color: '#9B59B6,#FF69B4', players: 1987, best: 0, preview: 'neonRun' },    init: async (engine, onEnd) => {
      const { initNeonRun } = await import('./neonRun')
      initNeonRun(engine, onEnd)
    }
  },

  slimeJump: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./slimeJump').then(m => m.destroySlimeJump())
    },
    game: { id: 'slimeJump', name: '史莱姆跳', desc: '控制史莱姆不断往上跳，收集星星得高分！', type: '2d', category: 'coordination', tag: '跳跃', color: '#6BCB77,#9B59B6', players: 987, best: 0, preview: 'slimeJump' },    init: async (engine, onEnd) => {
      const { initSlimeJump } = await import('./slimeJump')
      initSlimeJump(engine, onEnd)
    }
  },

  superMario: {
    frameworkLifecycle: true,
    game: {
      id: 'superMario',
      name: '超级玛丽',
      desc: '手游横版闯关！跳跃踩怪、顶砖块、闯过 5 大关到达终点旗！',
      type: '2d',
      category: 'coordination',
      tag: '平台',
      color: '#e52521,#5c94fc',
      players: 3200,
      best: 0,
      preview: 'superMario',
    },    init: async (engine, onEnd) => {
      const { initSuperMario } = await import('./superMario')
      await initSuperMario(engine, onEnd)
    },
    destroy: () => {
      void import('./superMario').then((m) => m.destroySuperMario())
    },
  },

  snake: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./snake').then(m => m.destroySnake())
    },
    game: { id: 'snake', name: '贪吃蛇', desc: '控制小蛇吃食物，别撞墙和自己的尾巴！', type: '2d', category: 'coordination', tag: '经典', color: '#2ECC71,#27AE60', players: 3500, best: 0, preview: 'snake' },    init: async (engine, onEnd) => {
      const { initSnake } = await import('./snake')
      initSnake(engine, onEnd)
    }
  },

  racingRun: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./racingRun').then(m => m.destroyRacingRun())
    },
    game: { id: 'racingRun', name: '极速赛车', desc: '飙车躲障碍！拾取道具触发火焰加速、护盾、磁铁吸分，超爽！', type: '2d', category: 'coordination', tag: '赛车', color: '#FF6B00,#FFD700', players: 3180, best: 0, preview: 'racingRun' },    init: async (engine, onEnd) => {
      const { initRacingRun } = await import('./racingRun')
      const colors: Array<'red' | 'blue' | 'yellow'> = ['red', 'blue', 'yellow']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      initRacingRun(engine, onEnd, randomColor)
    }
  },

  starCatcher: {
    frameworkLifecycle: true,
    game: { id: 'starCatcher', name: '星星捕手', desc: '控制小精灵收集星星，躲避乌云袭击！', type: '2d', category: 'coordination', tag: '益智', color: '#FFD700,#9B59B6', players: 1234, best: 0, preview: 'starCatcher' },
    destroy: () => {
      void import('./starCatcher').then(m => m.destroyStarCatcher())
    },
    init: async (engine, onEnd) => {
      const { initStarCatcher } = await import('./starCatcher')
      initStarCatcher(engine, onEnd)
    }
  },

  bouncePath: {
    frameworkLifecycle: true,
    game: { id: 'bouncePath', name: '弹珠迷宫', desc: '控制弹珠收集星星，弹跳乐趣多！', type: '2d', category: 'spatial', tag: '益智', color: '#4ECDC4,#FFD93D', players: 1432, best: 0, preview: 'bouncePath' },
    destroy: () => {
      void import('./bouncePath').then(m => m.destroyBouncePath())
    },
    init: async (engine, onEnd) => {
      const { initBouncePath } = await import('./bouncePath')
      initBouncePath(engine, onEnd)
    },
  },

  stack: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./stack').then(m => m.destroyStack())
    },
    game: { id: 'stack', name: '叠叠乐', desc: '精准堆叠方块，叠得越高分数越高！', type: '2d', category: 'spatial', tag: '堆叠', color: '#A8E6CF,#6BCB77', players: 2100, best: 0, preview: 'stack' },    init: async (engine, onEnd) => {
      const { initStack } = await import('./stack')
      initStack(engine, onEnd)
    }
  },

  spaceShooter: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./spaceshooter').then(m => m.destroySpaceShooter())
    },
    game: { id: 'spaceShooter', name: '太空射击', desc: '驾驶飞船消灭外星入侵者，躲避弹幕！', type: '2d', category: 'strategy', tag: '射击', color: '#0d1b2a,#45B7D1', players: 3200, best: 0, preview: 'spaceShooter' },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initSpaceShooter } = await import('./spaceshooter')
      initSpaceShooter(engine, onEnd)
    }
  },

  towerDefense: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./towerDefense').then(m => m.destroyTowerDefense())
    },
    game: { id: 'towerDefense', name: '星际塔防', desc: '放置防御塔拦截外星入侵者，守住防线！', type: '2d', category: 'strategy', tag: '塔防', color: '#0d1b2a,#5352ED', players: 2500, best: 0, preview: 'towerDefense' },    init: async (engine, onEnd) => {
      const { initTowerDefense } = await import('./towerDefense')
      initTowerDefense(engine, onEnd)
    }
  },

  plantsVsZombies: {
    frameworkLifecycle: true,
    game: { id: 'plantsVsZombies', name: '植物大战僵尸', desc: '种植植物抵御僵尸入侵，保护你的家园！', type: '2d', category: 'strategy', tag: '塔防', color: '#7CB342,#FFD700', players: 0, best: 0, preview: 'plantsVsZombies' },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initPlantsVsZombies } = await import('./plantsVsZombies')
      initPlantsVsZombies(engine, onEnd)
    },
    destroy: () => {
      void import('./plantsVsZombies').then(m => m.destroyPlantsVsZombies())
    },
  },

  rpgShooter: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./rpgShooter').then(m => m.destroyRpgShooter())
    },
    game: { id: 'rpgShooter', name: '星际猎手', desc: 'RPG移动射击！击杀敌人获得经验升级，提升属性挑战波次！', type: '2d', category: 'strategy', tag: 'RPG射击', color: '#5352ED,#9B59B6', players: 2100, best: 0, preview: 'rpgShooter' },    init: async (engine, onEnd) => {
      const { initRpgShooter } = await import('./rpgShooter')
      initRpgShooter(engine, onEnd)
    }
  },

  dragonShooter: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./dragonShooter').then(m => m.destroyDragonShooter())
    },
    game: { id: 'dragonShooter', name: '打龙小游戏', desc: '国产爆款！滑动控制自动射击，龙体分裂爽感无限！', type: '2d', category: 'strategy', tag: '射击', color: '#FFD700,#FF5722', players: 9999, best: 0, preview: 'dragonShooter' },    init: async (engine, onEnd) => {
      const { initDragonShooter } = await import('./dragonShooter')
      initDragonShooter(engine, onEnd)
    }
  },

  beatDragon: {
    frameworkLifecycle: true,
    game: {
      id: 'beatDragon',
      name: '打了个龙',
      desc: '竖屏解压屠龙小游戏，滑动走位自动射击，闯关变强，治愈解压！',
      type: '2d',
      category: 'strategy',
      tag: '解压',
      color: '#58A6FF,#4ADE80',
      players: 0,
      best: 0,
      preview: 'beatDragon',
    },    destroy: () => {
      void import('./beatDragon').then(m => m.destroyBeatDragon())
    },
    init: async (engine, onEnd) => {
      const { initBeatDragon } = await import('./beatDragon')
      await initBeatDragon(engine, onEnd)
    },
  },

  kingBaby: {
    frameworkLifecycle: true,
    game: {
      id: 'kingBaby',
      name: '王者萌斗',
      desc: 'Q版萌系1v1轻MOBA，拖动走位、技能清线，摧毁敌方水晶轻松闯关！',
      type: '2d',
      category: 'strategy',
      tag: '竞技',
      color: '#73C0F4,#F8BBD0',
      players: 0,
      best: 0,
      preview: 'kingBaby',
    },    destroy: () => {
      void import('./kingBaby').then(m => m.destroyKingBaby())
    },
    init: async (engine, onEnd) => {
      const { initKingBaby } = await import('./kingBaby')
      await initKingBaby(engine, onEnd)
    },
  },

  rpgShooterTD: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./rpgShooterTowerDefense/init').then(m => m.destroyRpgShooterTD())
    },
    game: { id: 'rpgShooterTD', name: 'RPG塔防射击', desc: '双系统战斗！建造炮台防御+角色移动射击，策略与操作并重！', type: '2d', category: 'strategy', tag: '塔防射击', color: '#4ECDC4,#FF6B6B', players: 1500, best: 0, preview: 'rpgShooterTowerDefense' },    init: async (engine, onEnd) => {
      const { initRpgShooterTD } = await import('./rpgShooterTowerDefense/init')
      initRpgShooterTD(engine, onEnd)
    }
  },

  contraRpg: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./contraRpg').then(m => m.destroyContraRpg())
    },
    game: { id: 'contraRpg', name: '魂斗罗RPG', desc: '经典横版射击闯关！击败敌人收集道具，挑战最终BOSS！', type: '2d', category: 'strategy', tag: '射击RPG', color: '#1a2f1a,#4a90d9', players: 2000, best: 0, preview: 'contraRpg' },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initContraRpg } = await import('./contraRpg')
      initContraRpg(engine, onEnd)
    }
  },

  wangzheRpg: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./wangzheRpg').then(m => m.destroyWangzheRpg())
    },
    game: { id: 'wangzheRpg', name: '王者荣耀', desc: '横版对战！摇杆移动+技能释放，击杀敌方3次获胜！', type: '2d', category: 'strategy', tag: '对战', color: '#1a1a2e,#ffd700', players: 5000, best: 0, preview: 'wangzheRpg' },    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initWangzheRpg } = await import('./wangzheRpg')
      initWangzheRpg(engine, onEnd)
    }
  },

  happyDefense: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./happyDefense').then(m => m.destroyHappyDefense())
    },
    game: {
      id: 'happyDefense',
      name: '欢乐防线大作战',
      desc: '3D俯视角趣味塔防！摆塔刷怪解压，六波闯关竞速冲高分。',
      type: '3d',
      category: 'strategy',
      tag: '塔防',
      color: '#6BCB77,#FFD93D',
      players: 0,
      best: 0,
      preview: 'happyDefense',
    },    init: async (engine, onEnd) => {
      const { initHappyDefense } = await import('./happyDefense')
      await initHappyDefense(engine, onEnd)
    },
  },

  plantZombieDefense: {
    frameworkLifecycle: true,
    game: {
      id: 'plantZombieDefense',
      name: '萌趣植物僵尸3D防线',
      desc: '3D童趣塔防，摆放植物抵御呆萌僵尸，休闲闯关，儿童离线小游戏',
      type: '3d',
      category: 'strategy',
      tag: '塔防',
      color: '#72D566,#FFD23F',
      players: 0,
      best: 0,
      preview: 'plantZombieDefense',
    },    isSpecial: true,
    destroy: () => {
      void import('./plantZombieDefense').then(m => {
        m.destroyPlantZombieDefense()
      })
    },
    init: async (engine, onEnd) => {
      const { initPlantZombieDefense } = await import('./plantZombieDefense')
      await initPlantZombieDefense(engine, onEnd)
    },
  },

  plantZombieDefense2d: {
    frameworkLifecycle: true,
    game: {
      id: 'plantZombieDefense2d',
      name: '萌植防线 2D',
      desc: '横屏种萌植收阳光，挡呆萌僵尸守小屋，休闲闯关冲三星！',
      type: '2d',
      category: 'strategy',
      tag: '塔防',
      color: '#72D566,#FFD23F',
      players: 0,
      best: 0,
      preview: 'plantZombieDefense2d',
    },    destroy: () => {
      void import('./plantZombieDefense2d').then(m => m.destroyPlantZombieDefense2d())
    },
    init: async (engine, onEnd) => {
      const { initPlantZombieDefense2d } = await import('./plantZombieDefense2d')
      await initPlantZombieDefense2d(engine, onEnd)
    },
  },

  cloudBallRush3d: {
    frameworkLifecycle: true,
    game: {
      id: 'cloudBallRush3d',
      name: '云端滚球大冒险',
      desc: '3D物理滚球闯关！治愈解压、收集星光、轻度竞速冲榜。',
      type: '3d',
      category: 'coordination',
      tag: '滚球',
      color: '#6EC8FF,#A8E6CF',
      players: 0,
      best: 0,
      preview: 'cloudBallRush3d',
    },    isSpecial: true,
    destroy: () => {
      void import('./cloudBallRush3d').then(m => {
        m.destroyCloudBallRush3d()
      })
    },
    init: async (engine, onEnd) => {
      const { initCloudBallRush3d } = await import('./cloudBallRush3d')
      await initCloudBallRush3d(engine, onEnd)
    },
  },

  voxelRealm: {
    frameworkLifecycle: true,
    game: {
      id: 'voxelRealm',
      name: '方块幻境',
      desc: '建造与对决！自由搭建、肆意破坏，限时创意建造与地貌竞速。',
      type: '3d',
      category: 'creativity',
      tag: '沙盒',
      color: '#A8E6CF,#6BCBFF',
      players: 0,
      best: 0,
      preview: 'voxelRealm',
    },    isSpecial: true,
    destroy: () => {
      void import('./voxelRealm').then(m => {
        m.destroyVoxelRealm()
      })
    },
    init: async (engine, onEnd) => {
      const { initVoxelRealm } = await import('./voxelRealm')
      await initVoxelRealm(engine, onEnd)
    },
  },

  skyFrenzy: {
    frameworkLifecycle: true,
    game: {
      id: 'skyFrenzy',
      name: '天际狂潮',
      desc: '3D俯视角趣味空战！自动开火清屏解压，六波闯关冲榜竞速。',
      type: '3d',
      category: 'reaction',
      tag: '射击',
      color: '#6BCBFF,#FFD93D',
      players: 0,
      best: 0,
      preview: 'skyFrenzy',
    },    isSpecial: true,
    destroy: () => {
      void import('./skyFrenzy').then(m => {
        m.destroySkyFrenzy()
      })
    },
    init: async (engine, onEnd) => {
      const { initSkyFrenzy } = await import('./skyFrenzy')
      await initSkyFrenzy(engine, onEnd)
    },
  },

  skyRush3d: {
    frameworkLifecycle: true,
    game: {
      id: 'skyRush3d',
      name: '天空狂飙 3D',
      desc: '3D 俯视角空战！摇杆移动、拖动瞄准，六波敌机与 BOSS 闯关。',
      type: '3d',
      category: 'reaction',
      tag: '射击',
      color: '#6BCBFF,#FFD93D',
      players: 0,
      best: 0,
      preview: 'skyRush3d',
    },    isSpecial: true,
    destroy: () => {
      void import('./skyRush3d').then(m => m.destroySkyRush3d())
    },
    init: async (engine, onEnd) => {
      const { initSkyRush3d } = await import('./skyRush3d')
      await initSkyRush3d(engine, onEnd)
    },
  },

  cuteTankBattle: {
    frameworkLifecycle: true,
    game: {
      id: 'cuteTankBattle',
      name: '萌趣坦克大作战',
      desc: 'Q萌卡通坦克闯关，极简操控，击毁敌方小兵，守护家园基地！',
      type: '2d',
      category: 'reaction',
      tag: '射击',
      color: '#48C990,#FFD970',
      players: 0,
      best: 0,
      preview: 'cuteTankBattle',
    },    destroy: () => {
      void import('./cuteTankBattle').then(m => {
        m.destroyCuteTankBattle()
      })
    },
    init: async (engine, onEnd) => {
      const { initCuteTankBattle } = await import('./cuteTankBattle')
      await initCuteTankBattle(engine, onEnd)
    },
  },

  dnfRpg: {
    frameworkLifecycle: true,
    destroy: () => {
      void import('./dnfRpg').then(m => m.destroyDnfRpg())
    },
    game: { id: 'dnfRpg', name: '地下城勇士', desc: '高仿DNF！选择职业闯荡地下城，连招浮空击败BOSS！', type: '2d', category: 'strategy', tag: '格斗RPG', color: '#8B4513,#FFD700', players: 0, best: 0, preview: 'dnfRpg' },    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initDnfRpg } = await import('./dnfRpg')
      initDnfRpg(engine, onEnd)
    }
  },
}

export const GAMES: Game[] = Object.values(GAME_REGISTRY).map(r => r.game)

export function getGameRegistration(gameId: string): GameRegistration | undefined {
  return GAME_REGISTRY[gameId]
}

export function destroyGame(gameId: string): void {
  const registration = GAME_REGISTRY[gameId]
  registration?.destroy?.()
}

export async function initGame(gameId: string, engine: GameEngine, onEnd: () => void): Promise<boolean> {
  const registration = GAME_REGISTRY[gameId]
  if (!registration) {
    console.error(`[GameRegistry] Game not found: ${gameId}`)
    return false
  }

  try {
    const { prepareGameTheme } = await import('./gameThemeBridge')
    await prepareGameTheme(gameId)
  } catch (err) {
    console.warn(`[GameRegistry] GTRS theme prep failed for "${gameId}", using defaults`, err)
  }

  await registration.init(engine, onEnd)
  return true
}

assertFrameworkRegistryConsistency()