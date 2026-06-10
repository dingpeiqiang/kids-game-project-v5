import type { Game, GameGuide, GameCategoryDef } from '../types'
import { GameEngine } from '../services/gameEngine'

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
  { id: 'bubbleShooter', visible: true,  order: 4,  badge: '' },
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
  { id: 'cloudBallRush3d', visible: true, order: 4, badge: '' },
  { id: 'skyFrenzy', visible: true, order: 5, badge: '' },
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

export interface GameRegistration {
  game: Game
  guide?: GameGuide
  init: (engine: GameEngine, onEnd: () => void) => Promise<void>
  /** 退出/重开前释放 WebGL 等资源 */
  destroy?: () => void
  isSpecial?: boolean
  setup?: (canvas: HTMLDivElement) => { gameW: number; gameH: number; displayW: number; displayH: number }
}

export const GAME_REGISTRY: Record<string, GameRegistration> = {
  eliminate: {
    game: { id: 'eliminate', name: '极速消除', desc: '点击同色方块，触发连锁爆炸！', type: '2d', category: 'logic', tag: '消除', color: '#FF6B6B,#FF8E53', players: 2847, best: 0, preview: 'eliminate' },
    guide: {
      icon: '💥', name: '极速消除', desc: '找出相同的彩色方块，点击3个及以上连成一线即可消除！',
      ops: [
        { icon: '🖱️', text: '<b>点击</b>任意彩色方块开始' },
        { icon: '🔗', text: '相同颜色<b>3个以上</b>相连即消除' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '方块消除后，上方方块会下落，可能引发连锁反应，得分翻倍！',
      bg: '#FF6B6B'
    },
    init: async (engine, onEnd) => {
      const { initEliminate } = await import('./eliminate')
      initEliminate(engine, onEnd)
    }
  },

  tetris: {
    game: { id: 'tetris', name: '方块消除', desc: '经典俄罗斯方块，益智又上瘾！', type: '2d', category: 'logic', tag: '消除', color: '#4D96FF,#FF8E53', players: 2341, best: 0, preview: 'tetris' },
    guide: {
      icon: '🧱', name: '方块消除', desc: '经典俄罗斯方块，消除满行得分，消灭50行获胜！',
      ops: [
        { icon: '⬅️', text: '<b>左右箭头</b>移动方块' },
        { icon: '⬆️', text: '<b>上箭头</b>旋转方块' },
        { icon: '⬇️', text: '<b>下箭头</b>加速下落' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '一次消除多行得分更高！消灭50行即可获胜！',
      bg: '#4D96FF'
    },
    init: async (engine, onEnd) => {
      const { initTetris } = await import('./tetris')
      initTetris(engine, onEnd)
    }
  },

  jewelMatch: {
    game: { id: 'jewelMatch', name: '宠物消消乐', desc: '交换宠物消除，3个以上连成一线！', type: '2d', category: 'logic', tag: '消除', color: '#FFD700,#9B59B6', players: 1876, best: 0, preview: 'jewelMatch' },
    guide: {
      icon: '🐾', name: '宠物消消乐', desc: '点击交换相邻宠物，3个以上相同宠物连线消除！',
      ops: [
        { icon: '👆', text: '<b>点击</b>一个宠物选中' },
        { icon: '🔄', text: '<b>点击</b>相邻宠物交换' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '创造更多匹配可以触发连锁反应，得分翻倍！30秒内没有移动会游戏结束！',
      bg: '#FFD700'
    },
    init: async (engine, onEnd) => {
      const { initAnimalMatch } = await import('./animalMatch')
      initAnimalMatch(engine, onEnd)
    }
  },

  bubbleShooter: {
    game: { id: 'bubbleShooter', name: '泡泡龙', desc: '经典泡泡龙射击，3个以上相同颜色消除！', type: '2d', category: 'logic', tag: '消除', color: '#4ECDC4,#FF69B4', players: 2134, best: 0, preview: 'bubbleShooter' },
    guide: {
      icon: '🫧', name: '泡泡龙', desc: '10关闯关模式！发射泡泡匹配消除，在限定时间内清空棋盘！',
      ops: [
        { icon: '🖱️', text: '<b>移动鼠标/手指</b>控制瞄准方向' },
        { icon: '👆', text: '<b>点击/触屏</b>发射泡泡' },
        { icon: '💥', text: '<b>3个及以上</b>相同颜色泡泡相连即消除' },
        { icon: '⏱️', text: '<b>限时挑战</b>在时间内清空棋盘通关' },
        { icon: '🎁', text: '射出<b>道具泡泡</b>加速消除（炸弹/清行/三连射）' },
      ],
      tipsTitle: '💡 游戏技巧',
      tips: '1. 瞄准同色泡泡发射，触发连锁消除获得高分！\n2. 泡泡反弹可以到达死角位置\n3. 消除底部泡泡会让上方漂浮的泡泡落下，获得额外奖励分数！\n4. 连续消除触发连击加成，分数翻倍！\n5. 关卡越高难度越大，时间越紧张！',
      bg: '#4ECDC4'
    },
    init: async (engine, onEnd) => {
      const { initBubbleShooter } = await import('./bubbleShooter')
      initBubbleShooter(engine, onEnd)
    }
  },

  sort: {
    game: { id: 'sort', name: '色彩排序', desc: '10关卡渐进难度，液体排序超治愈！', type: '2d', category: 'logic', tag: '益智', color: '#DDA0DD,#BA55D3', players: 1532, best: 0, preview: 'sort' },
    guide: {
      icon: '🎨', name: '色彩排序', desc: '点击交换两个管子顶部的彩色球，将相同颜色的球排在一起即完成！',
      ops: [
        { icon: '👆', text: '<b>点击</b>一个管子选中' },
        { icon: '🔄', text: '再<b>点击</b>另一管子交换顶部颜色' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '只能移动到空管或相同颜色的顶部哦！完成所有排序可获得大量加分！',
      bg: '#DDA0DD'
    },
    init: async (engine, onEnd) => {
      const { initColorSort } = await import('./colorSort')
      initColorSort(engine, onEnd)
    }
  },

  memoryMatch: {
    game: { id: 'memoryMatch', name: '翻牌配对', desc: '翻开卡牌找到相同图案，考验你的记忆力！', type: '2d', category: 'memory', tag: '记忆', color: '#0f0c29,#A29BFE', players: 1800, best: 0, preview: 'memoryMatch' },
    guide: {
      icon: '🃏', name: '翻牌配对', desc: '翻开卡牌找到相同图案，考验你的记忆力！共5个关卡，难度递增。',
      ops: [
        { icon: '👀', text: '开局<b>预览1.5秒</b>，记住牌面位置' },
        { icon: '👆', text: '<b>点击卡牌</b>翻开，每次翻2张' },
        { icon: '🎯', text: '图案相同则<b>配对消除</b>，不同则翻回' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '关卡开始时有1.5秒预览时间！连续配对成功可获得连击加分。剩余时间会转化为奖励分数，越快通关分越高！',
      bg: '#0f0c29'
    },
    init: async (engine, onEnd) => {
      const { initMemoryMatch } = await import('./memoryMatch')
      initMemoryMatch(engine, onEnd)
    }
  },

  colorTap: {
    game: { id: 'colorTap', name: '颜色Tap', desc: '快速点击匹配颜色，测试你的反应力！', type: '2d', category: 'attention', tag: '反应', color: '#FF6B6B,#4ECDC4', players: 1456, best: 0, preview: 'colorTap' },
    guide: {
      icon: '🎨', name: '颜色Tap', desc: '快速点击匹配颜色，测试你的反应力！',
      ops: [
        { icon: '👆', text: '<b>观察</b>顶部颜色' },
        { icon: '👆', text: '<b>点击</b>下方匹配按钮' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '反应越快得分越高！连续正确匹配触发连击加成！',
      bg: '#FF6B6B'
    },
    init: async (engine, onEnd) => {
      const { initColorTap } = await import('./colorTap')
      initColorTap(engine, onEnd)
    }
  },

  whackMole: {
    game: { id: 'whackMole', name: '打地鼠', desc: '快速敲击出洞的地鼠，金色鼠得分多，小心炸弹！', type: '2d', category: 'attention', tag: '反应', color: '#8B5E3C,#FFD700', players: 2760, best: 0, preview: 'whackMole' },
    guide: {
      icon: '🔨', name: '打地鼠', desc: '地鼠从洞里冒出来，快速点击砸中得分！60秒内拿到最高分！',
      ops: [
        { icon: '👆', text: '<b>点击/触摸</b>地鼠立即砸中' },
        { icon: '⭐', text: '<b>金色地鼠</b>得30分，普通地鼠得10分' },
        { icon: '☠️', text: '点击<b>炸弹地鼠</b>会扣100分！' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '金色地鼠出现时间短，要眼疾手快！炸弹地鼠出现时间长，仔细辨认再下手！后期地鼠冒出越来越快，注意力要高度集中！',
      bg: '#8B5E3C'
    },
    init: async (engine, onEnd) => {
      const { initWhackMole } = await import('./whackMole')
      initWhackMole(engine, onEnd)
    }
  },

  pop: {
    game: { id: 'pop', name: '气球砰砰', desc: '疯狂点击气球，炸出高分！', type: '2d', category: 'reaction', tag: '点击', color: '#FF69B4,#FF1493', players: 2108, best: 0, preview: 'pop' },
    guide: {
      icon: '🎈', name: '气球砰砰', desc: '疯狂点击屏幕上飘起的气球，气球越大点击得分越高！',
      ops: [
        { icon: '👆', text: '<b>快速点击</b>飘起的气球' },
        { icon: '📏', text: '气球<b>越大</b>，得分<b>越高</b>' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '大气球飘得慢但分高，小气球飘得快但分低，看准时机快速点击！',
      bg: '#FF69B4'
    },
    init: async (engine, onEnd) => {
      const { initPop } = await import('./pop')
      initPop(engine, onEnd)
    }
  },

  fruitSlice: {
    game: { id: 'fruitSlice', name: '水果切切', desc: '划动切割水果，果汁飞溅超解压！', type: '2d', category: 'coordination', tag: '切割', color: '#FF6B6B,#FFD93D', players: 1654, best: 0, preview: 'fruitSlice' },
    guide: {
      icon: '🍉', name: '水果切切', desc: '滑动手指切割飞起的水果，果汁四溅超解压！',
      ops: [
        { icon: '👆', text: '<b>滑动</b>手指切割水果' },
        { icon: '🔥', text: '<b>连击</b>切割得分翻倍' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '不要让水果飞出屏幕！连续切割触发连击加成！',
      bg: '#FF6B6B'
    },
    init: async (engine, onEnd) => {
      const { initFruitSlice } = await import('./fruitSlice')
      initFruitSlice(engine, onEnd)
    }
  },

  cookieCut: {
    game: { id: 'cookieCut', name: '切饼干', desc: '滑动切割飞起的饼干，碎屑四溅超有趣！', type: '2d', category: 'coordination', tag: '切割', color: '#D2691E,#FFD700', players: 1567, best: 0, preview: 'cookieCut' },
    guide: {
      icon: '🍪', name: '切饼干', desc: '滑动切割飞起的饼干，碎屑四溅超有趣！',
      ops: [
        { icon: '👆', text: '<b>滑动</b>手指切割饼干' },
        { icon: '🔥', text: '<b>连击</b>切割得分翻倍' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '饼干从底部飞起，碰到墙壁会反弹！连续切割触发连击加成！',
      bg: '#D2691E'
    },
    init: async (engine, onEnd) => {
      const { initCookieCut } = await import('./cookieCut')
      initCookieCut(engine, onEnd, 1)
    }
  },

  dodge: {
    game: { id: 'dodge', name: '轻量躲避', desc: '滑动躲避障碍，收集加分道具', type: '2d', category: 'coordination', tag: '躲避', color: '#4ECDC4,#45B7AA', players: 3215, best: 0, preview: 'dodge' },
    guide: {
      icon: '🏃', name: '轻量躲避', desc: '控制角色左右移动，躲避下落的障碍物，收集金色道具加分！',
      ops: [
        { icon: '👆', text: '<b>手指/鼠标拖动</b>左右移动角色' },
        { icon: '⭐', text: '吃到<b>金色道具</b>获得额外积分' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '障碍物有红色和紫色两种，小心别碰到！收集道具还能触发随机Buff！',
      bg: '#4ECDC4'
    },
    init: async (engine, onEnd) => {
      const { initDodge } = await import('./dodge')
      initDodge(engine, onEnd)
    }
  },

  neonRun: {
    game: { id: 'neonRun', name: '霓虹跑酷', desc: '躲避障碍收集金币，无尽奔跑！', type: '2d', category: 'coordination', tag: '跑酷', color: '#9B59B6,#FF69B4', players: 1987, best: 0, preview: 'neonRun' },
    guide: {
      icon: '🏃', name: '霓虹跑酷', desc: '三道跑酷，左右切换躲避障碍，收集金币！',
      ops: [
        { icon: '👈', text: '<b>左滑/点击左侧</b>向左移动' },
        { icon: '👉', text: '<b>右滑/点击右侧</b>向右移动' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '速度会逐渐加快！躲避障碍和收集金币可以获得分数！',
      bg: '#9B59B6'
    },
    init: async (engine, onEnd) => {
      const { initNeonRun } = await import('./neonRun')
      initNeonRun(engine, onEnd)
    }
  },

  slimeJump: {
    game: { id: 'slimeJump', name: '史莱姆跳', desc: '控制史莱姆不断往上跳，收集星星得高分！', type: '2d', category: 'coordination', tag: '跳跃', color: '#6BCB77,#9B59B6', players: 987, best: 0, preview: 'slimeJump' },
    guide: {
      icon: '🟢', name: '史莱姆跳', desc: '控制史莱姆不断往上跳，收集星星得高分！',
      ops: [
        { icon: '👆', text: '<b>移动鼠标</b>左右移动' },
        { icon: '⬆️', text: '跳上<b>弹簧</b>跳得更高' },
        { icon: '⭐', text: '收集<b>星星</b>获得积分' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '弹簧平台可以跳得更高！紫色移动平台要小心！',
      bg: '#6BCB77'
    },
    init: async (engine, onEnd) => {
      const { initSlimeJump } = await import('./slimeJump')
      initSlimeJump(engine, onEnd)
    }
  },

  snake: {
    game: { id: 'snake', name: '贪吃蛇', desc: '控制小蛇吃食物，别撞墙和自己的尾巴！', type: '2d', category: 'coordination', tag: '经典', color: '#2ECC71,#27AE60', players: 3500, best: 0, preview: 'snake' },
    guide: {
      icon: '🐍', name: '贪吃蛇', desc: '经典贪吃蛇！控制小蛇吃食物长大，别撞墙和自己的身体！',
      ops: [
        { icon: '👆', text: '<b>点击屏幕四个方向</b>控制蛇的移动方向' },
        { icon: '🍎', text: '吃到食物<b>蛇身变长</b>，得分增加' },
        { icon: '⚡', text: '<b>金色食物</b>额外加分，<b>蓝色食物</b>短暂加速' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '蛇会越吃越长，空间越来越小！沿边缘行走是经典策略，留够转身空间。金色食物分值更高，不要错过！',
      bg: '#2ECC71'
    },
    init: async (engine, onEnd) => {
      const { initSnake } = await import('./snake')
      initSnake(engine, onEnd)
    }
  },

  racingRun: {
    game: { id: 'racingRun', name: '极速赛车', desc: '飙车躲障碍！拾取道具触发火焰加速、护盾、磁铁吸分，超爽！', type: '2d', category: 'coordination', tag: '赛车', color: '#FF6B00,#FFD700', players: 3180, best: 0, preview: 'racingRun' },
    guide: {
      icon: '🏎️', name: '极速赛车', desc: '在高速公路飙车躲避来车！12种超级道具让你爽到飞起：氮气冲刺、护盾、无敌星魂、时间凝固、狂怒毁灭、幽灵穿墙！',
      ops: [
        { icon: '🖱️', text: '<b>鼠标移动/手指拖拽</b>控制赛车左右' },
        { icon: '⬅️➡️', text: '<b>方向键/WASD</b>切换车道' },
        { icon: '🔥', text: '<b>🔥氮气</b>10秒极速冲刺 | <b>🛡️护盾</b>12秒无敌防御' },
        { icon: '⚡', text: '<b>⚡闪电</b>雷霆清屏 | <b>💣炸弹</b>毁灭轰炸' },
        { icon: '🧲', text: '<b>🧲磁铁</b>15秒全屏吸引 | <b>⭐星魂</b>15秒无敌' },
        { icon: '✨', text: '<b>✨双分</b>20秒双倍得分 | <b>❄️时停</b>12秒减速' },
        { icon: '🚀', text: '<b>🚀狂怒</b>10秒自动追踪炸车 | <b>👻幽灵</b>12秒穿墙无视' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '道具持续时间大幅延长！幽灵模式可以无视碰撞，狂怒模式自动炸车！双倍分数期间连击得分翻倍！速度越快得分越高！',
      bg: '#FF6B00'
    },
    init: async (engine, onEnd) => {
      const { initRacingRun } = await import('./racingRun')
      const colors: Array<'red' | 'blue' | 'yellow'> = ['red', 'blue', 'yellow']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      initRacingRun(engine, onEnd, randomColor)
    }
  },

  starCatcher: {
    game: { id: 'starCatcher', name: '星星捕手', desc: '控制小精灵收集星星，躲避乌云袭击！', type: '2d', category: 'coordination', tag: '益智', color: '#FFD700,#9B59B6', players: 1234, best: 0, preview: 'starCatcher' },
    guide: {
      icon: '🧚', name: '星星捕手', desc: '控制小精灵收集星星，躲避乌云袭击！',
      ops: [
        { icon: '👆', text: '<b>移动鼠标</b>控制小精灵' },
        { icon: '⭐', text: '收集<b>星星</b>获得积分' },
        { icon: '☁️', text: '<b>躲避</b>乌云！' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '金色星星分值更高！碰到乌云会扣分，连续收集触发连击！',
      bg: '#FFD700'
    },
    init: async (engine, onEnd) => {
      const { initStarCatcher } = await import('./starCatcher')
      initStarCatcher(engine, onEnd)
    }
  },

  bouncePath: {
    game: { id: 'bouncePath', name: '弹珠迷宫', desc: '控制弹珠收集星星，弹跳乐趣多！', type: '2d', category: 'spatial', tag: '益智', color: '#4ECDC4,#FFD93D', players: 1432, best: 0, preview: 'bouncePath' },
    guide: {
      icon: '⚽', name: '弹珠迷宫', desc: '控制弹珠在迷宫中弹跳，收集星星获得高分！',
      ops: [
        { icon: '👆', text: '<b>移动鼠标</b>控制弹珠左右' },
        { icon: '⭐', text: '收集<b>星星</b>获得积分' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '弹珠会自动弹跳，点击给一个向上的力，连续收集星星触发连击！',
      bg: '#4ECDC4'
    },
    init: async (engine, onEnd) => {
      const { initBouncePath } = await import('./bouncePath')
      initBouncePath(engine, onEnd)
    }
  },

  stack: {
    game: { id: 'stack', name: '叠叠乐', desc: '精准堆叠方块，叠得越高分数越高！', type: '2d', category: 'spatial', tag: '堆叠', color: '#A8E6CF,#6BCB77', players: 2100, best: 0, preview: 'stack' },
    guide: {
      icon: '🏗️', name: '叠叠乐', desc: '左右摆动的方块从顶部落下，精准对齐堆叠！',
      ops: [
        { icon: '👆', text: '<b>点击屏幕</b>放下方块' },
        { icon: '🎯', text: '<b>对齐越精准</b>，方块越不缩小' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '偏差小于4像素触发"完美对齐"，方块不会缩小！连续完美对齐获得大量奖励分数！',
      bg: '#A8E6CF'
    },
    init: async (engine, onEnd) => {
      const { initStack } = await import('./stack')
      initStack(engine, onEnd)
    }
  },

  spaceShooter: {
    game: { id: 'spaceShooter', name: '太空射击', desc: '驾驶飞船消灭外星入侵者，躲避弹幕！', type: '2d', category: 'strategy', tag: '射击', color: '#0d1b2a,#45B7D1', players: 3200, best: 0, preview: 'spaceShooter' },
    guide: {
      icon: '🔫', name: '太空射击', desc: '驾驶战机消灭外星入侵者，收集道具强化火力！',
      ops: [
        { icon: '👆', text: '<b>点击/长按</b>屏幕连续射击' },
        { icon: '👆', text: '<b>移动</b>飞船躲避敌弹' },
        { icon: '🎁', text: '击杀敌人<b>掉落道具</b>（三连发/扩散弹/回血/炸弹）' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '连续击杀触发连击加成！每5波会出现密集敌群，优先收集三连发和炸弹道具！',
      bg: '#0d1b2a'
    },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initSpaceShooter } = await import('./spaceshooter')
      initSpaceShooter(engine, onEnd)
    }
  },

  towerDefense: {
    game: { id: 'towerDefense', name: '星际塔防', desc: '放置防御塔拦截外星入侵者，守住防线！', type: '2d', category: 'strategy', tag: '塔防', color: '#0d1b2a,#5352ED', players: 2500, best: 0, preview: 'towerDefense' },
    guide: {
      icon: '🏰', name: '星际塔防', desc: '在路径旁放置防御塔，自动攻击沿路前进的外星敌人！',
      ops: [
        { icon: '👆', text: '<b>点击顶部</b>选择塔类型' },
        { icon: '👆', text: '<b>点击空地</b>放置防御塔' },
        { icon: '💰', text: '击杀敌人获得<b>金币</b>建造更多塔' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '激光塔射速快、火炮塔伤害高带范围爆炸、冰冻塔减速敌人！每5波会出现BOSS，火力集中消灭！',
      bg: '#0d1b2a'
    },
    init: async (engine, onEnd) => {
      const { initTowerDefense } = await import('./towerDefense')
      initTowerDefense(engine, onEnd)
    }
  },

  plantsVsZombies: {
    game: { id: 'plantsVsZombies', name: '植物大战僵尸', desc: '种植植物抵御僵尸入侵，保护你的家园！', type: '2d', category: 'strategy', tag: '塔防', color: '#7CB342,#FFD700', players: 0, best: 0, preview: 'plantsVsZombies' },
    guide: {
      icon: '🌱', name: '植物大战僵尸', desc: '种植植物抵御僵尸入侵，保护家园！',
      ops: [
        { icon: '👆', text: '<b>点击卡片</b>选择植物' },
        { icon: '👆', text: '<b>点击草地</b>种植植物' },
        { icon: '☀️', text: '收集<b>阳光</b>种植更多植物' },
        { icon: '🧟', text: '<b>抵御僵尸</b>入侵' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '合理搭配植物阵型！向日葵提供阳光，豌豆射手输出，坚果墙防御！',
      bg: '#7CB342'
    },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initPlantsVsZombies } = await import('./plantsVsZombies')
      initPlantsVsZombies(engine, onEnd)
    }
  },

  rpgShooter: {
    game: { id: 'rpgShooter', name: '星际猎手', desc: 'RPG移动射击！击杀敌人获得经验升级，提升属性挑战波次！', type: '2d', category: 'strategy', tag: 'RPG射击', color: '#5352ED,#9B59B6', players: 2100, best: 0, preview: 'rpgShooter' },
    guide: {
      icon: '🎮', name: '星际猎手', desc: '自由移动的RPG射击游戏！击杀敌人获得经验升级，拾取道具提升属性，挑战无尽波次！',
      ops: [
        { icon: '🖱️', text: '<b>鼠标移动</b>控制角色移动方向' },
        { icon: '⌨️', text: '<b>WASD/方向键</b>也可控制移动' },
        { icon: '🔫', text: '<b>自动射击</b>朝向鼠标方向' },
        { icon: '⬆️', text: '击杀敌人获得<b>经验</b>升级提升属性' },
        { icon: '🎁', text: '<b>掉落道具</b>：💚血量/✨经验/⚡速度/🔥攻击' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '升级可以提升HP上限和攻击力！合理走位躲避敌人，优先击杀落单的敌人。速度道具适合近距离缠斗，攻击道具适合远程火力压制！',
      bg: '#5352ED'
    },
    init: async (engine, onEnd) => {
      const { initRpgShooter } = await import('./rpgShooter')
      initRpgShooter(engine, onEnd)
    }
  },

  dragonShooter: {
    game: { id: 'dragonShooter', name: '打龙小游戏', desc: '国产爆款！滑动控制自动射击，龙体分裂爽感无限！', type: '2d', category: 'strategy', tag: '射击', color: '#FFD700,#FF5722', players: 9999, best: 0, preview: 'dragonShooter' },
    guide: {
      icon: '🐉', name: '打龙小游戏', desc: '国产爆款！国风卡通风格，自动射击，龙体分裂，越打越多越爽！',
      ops: [
        { icon: '👆', text: '<b>滑动/拖拽</b>控制角色左右移动' },
        { icon: '🔫', text: '<b>自动射击</b>，无需手动点击' },
        { icon: '🐉', text: '龙体分裂！击杀龙段生成小龙' },
        { icon: '🎁', text: '拾取道具：⚔️攻击/⚡射速/🔫多重/💥穿透/❤️回血' },
        { icon: '🎁', text: '关卡升级！选择Buff强化自己' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '连击越多得分越高！优先打龙段制造分裂，获得更多击杀机会。升级时选择合适的Buff，强化自己的战斗风格！',
      bg: '#FFD700'
    },
    init: async (engine, onEnd) => {
      const { initDragonShooter } = await import('./dragonShooter')
      initDragonShooter(engine, onEnd)
    }
  },

  beatDragon: {
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
    },
    guide: {
      icon: '��',
      name: '打了个龙',
      desc: '竖屏滑动走位，自动射击分段巨龙，拾取 buff 无脑变强，极致解压屠龙闯关。',
      ops: [
        { icon: '👆', text: '<b>滑动</b>操控勇者走位' },
        { icon: '⚔️', text: '角色<b>自动开火</b>，无需手动攻击' },
        { icon: '✨', text: '击碎宝箱，<b>选择强化 buff</b>变强屠龙' },
      ],
      tipsTitle: '屠龙小技巧',
      tips: '优先击碎小龙宝箱，多选穿透、多重子弹 buff，躲开光弹轻松通关！',
      bg: '#F0F4FF',
    },
    destroy: () => {
      void import('./beatDragon').then(m => m.destroyBeatDragon())
    },
    init: async (engine, onEnd) => {
      const { initBeatDragon } = await import('./beatDragon')
      await initBeatDragon(engine, onEnd)
    },
  },

  kingBaby: {
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
    },
    guide: {
      icon: '��',
      name: '王者萌斗',
      desc: '横屏轻MOBA：拖动走位、普攻自动、两键技能，推线拆水晶拿星级。',
      ops: [
        { icon: '��', text: '左侧<b>拖动</b>控制萌版刘备走位' },
        { icon: '⚔️', text: '<b>普攻自动</b>攻击范围内敌人' },
        { icon: '✨', text: '右侧<b>技能/大招</b>清小兵，可开自动作战' },
      ],
      tipsTitle: '萌斗小技巧',
      tips: '先清小兵攒金币，残血后撤等复活；大招留给小兵扎堆，优先推掉敌方水晶！',
      bg: '#E8F4FC',
    },
    destroy: () => {
      void import('./kingBaby').then(m => m.destroyKingBaby())
    },
    init: async (engine, onEnd) => {
      const { initKingBaby } = await import('./kingBaby')
      await initKingBaby(engine, onEnd)
    },
  },

  rpgShooterTD: {
    game: { id: 'rpgShooterTD', name: 'RPG塔防射击', desc: '双系统战斗！建造炮台防御+角色移动射击，策略与操作并重！', type: '2d', category: 'strategy', tag: '塔防射击', color: '#4ECDC4,#FF6B6B', players: 1500, best: 0, preview: 'rpgShooterTowerDefense' },
    guide: {
      icon: '🏰', name: 'RPG塔防射击', desc: '双系统战斗！建造炮台防御+角色移动射击，策略与操作并重！',
      ops: [
        { icon: '🖱️', text: '<b>鼠标移动</b>控制角色位置' },
        { icon: '🔫', text: '<b>自动射击</b>朝向鼠标方向' },
        { icon: '👆', text: '<b>点击炮台按钮</b>选择炮台' },
        { icon: '🏗️', text: '<b>点击地图</b>直接放置炮台' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '击杀敌人获得钻石建造炮台！激光塔射速快(40💎)、导弹塔范围大(80💎)、冰冻塔减速(50💎)、闪电塔连锁(120💎)！守住8波敌人即可获胜！',
      bg: '#4ECDC4'
    },
    init: async (engine, onEnd) => {
      const { initRpgShooterTD } = await import('./rpgShooterTowerDefense/init')
      initRpgShooterTD(engine, onEnd)
    }
  },

  contraRpg: {
    game: { id: 'contraRpg', name: '魂斗罗RPG', desc: '经典横版射击闯关！击败敌人收集道具，挑战最终BOSS！', type: '2d', category: 'strategy', tag: '射击RPG', color: '#1a2f1a,#4a90d9', players: 2000, best: 0, preview: 'contraRpg' },
    guide: {
      icon: '🔫', name: '魂斗罗RPG', desc: '经典横版射击闯关！击败敌人收集道具，挑战最终BOSS！',
      ops: [
        { icon: '⬅️', text: '<b>← → / A D</b>左右移动' },
        { icon: '⬆️', text: '<b>↑ / W / 空格</b>跳跃/二段跳' },
        { icon: '🔫', text: '<b>J / K</b>射击' },
        { icon: '⚔️', text: '<b>L</b>近战攻击' },
        { icon: '🏃', text: '<b>S / ↓</b>滑铲（躲避子弹）' },
        { icon: '📱', text: '<b>触屏</b>虚拟按钮：← → 移动 / ↑跳跃 / ⚔近战 / ↘滑铲 / 🔫射击' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '1. 第三关解锁二段跳！\n2. 收集道具强化能力：❤️回血/💚生命上限/⚡射速/💥散射弹/🛡️护盾\n3. 击败所有敌人过关，最终BOSS有多种攻击模式！\n4. 近战攻击(L/⚔)伤害高，滑铲(S/↘)可躲子弹！',
      bg: '#1a2f1a'
    },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initContraRpg } = await import('./contraRpg')
      initContraRpg(engine, onEnd)
    }
  },

  wangzheRpg: {
    game: { id: 'wangzheRpg', name: '王者荣耀', desc: '横版对战！摇杆移动+技能释放，击杀敌方3次获胜！', type: '2d', category: 'strategy', tag: '对战', color: '#1a1a2e,#ffd700', players: 5000, best: 0, preview: 'wangzheRpg' },
    guide: {
      icon: '⚔️', name: '王者荣耀', desc: '横版对战！摇杆移动+技能释放，击杀敌方3次获胜！',
      ops: [
        { icon: '🕹️', text: '<b>左侧摇杆</b>360度移动英雄' },
        { icon: '⚔️', text: '<b>普攻按键</b>短按单次攻击，长按连续攻击' },
        { icon: '1️⃣', text: '<b>1/2技能</b>小范围金色伤害' },
        { icon: '3️⃣', text: '<b>3技能大招</b>大范围高伤害' },
        { icon: '🔄', text: '<b>重新开局</b>顶部按钮重置对局' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '1. 击杀敌方3次即可胜利！\n2. 1/2技能小范围伤害150，3技能大范围伤害250\n3. 敌方会巡逻、追击、攻击，保持走位拉扯\n4. 180秒超时判负，注意时间！',
      bg: '#1a1a2e'
    },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initWangzheRpg } = await import('./wangzheRpg')
      initWangzheRpg(engine, onEnd)
    }
  },

  happyDefense: {
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
    },
    guide: {
      icon: '\u{1F3F0}',
      name: '欢乐防线大作战',
      desc: '在草地上布置四款趣味炮塔，抵御萌系怪物六波进攻，保护基地！',
      ops: [
        { icon: '\u{1F446}', text: '<b>点击空地</b>放置选中的防御塔' },
        { icon: '\u2B06\uFE0F', text: '<b>点击已有塔</b>选中，可升级或出售' },
        { icon: '\u{1F4B0}', text: '击杀怪物获得<b>金币</b>，用于建塔升级' },
        { icon: '\u{1F30A}', text: '<b>下一波</b>自主开战；<b>重置战局</b>随时重来无惩罚' },
        { icon: '\u{1F381}', text: '每波结束随机<b>趣味Buff</b>，清屏/翻倍/金币雨' },
      ],
      tipsTitle: '\u{1F4A1} 小技巧',
      tips: '爆米花塔清小怪群，冰霜塔减速，闪电塔链式清屏，穿刺塔打BOSS！连击加分冲最高纪录，满血快通拿S评级。',
      bg: '#6BCB77',
    },
    isSpecial: true,
    destroy: () => {
      void import('./happyDefense').then(m => {
        m.destroyHappyDefense()
      })
    },
    init: async (engine, onEnd) => {
      const { initHappyDefense } = await import('./happyDefense')
      await initHappyDefense(engine, onEnd)
    },
  },

  plantZombieDefense: {
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
    },
    guide: {
      icon: '��',
      name: '萌趣植物僵尸3D防线',
      desc: '摆放Q版植物炮塔，击退呆萌僵尸，守护庭院小屋通关闯关。',
      ops: [
        { icon: '☀️', text: '<b>点击</b>收集，获取植物放置资源' },
        { icon: '🌱', text: '<b>点击草坪格子</b>放置选中的植物' },
        { icon: '🗑️', text: '<b>点击已放置植物</b>，一键移除返还20%阳光' },
      ],
      tipsTitle: '游玩小技巧',
      tips: '优先种植向日葵收集阳光，搭配坚果阻挡僵尸，合理布局轻松通关哦！',
      bg: '#C2E8B9',
    },
    isSpecial: true,
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

  cloudBallRush3d: {
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
    },
    guide: {
      icon: '\u{26BD}',
      name: '云端滚球大冒险',
      desc: '操控立体球体在浮空赛道滚动，收集星光、拾取道具，平稳抵达终点！',
      ops: [
        { icon: '\u2328\uFE0F', text: '<b>WASD / 方向键</b>控制滚球平衡与转向' },
        { icon: '\u{1F446}', text: '<b>左下虚拟摇杆</b>（移动端）移动' },
        { icon: '\u2B06\uFE0F', text: '<b>空格 / 跳</b>按钮跨越沟壑与障碍' },
        { icon: '\u2B50', text: '收集<b>星光</b>决定关卡星级，隐藏彩蛋加分' },
        { icon: '\u{1F3C6}', text: '<b>休闲</b>加宽赛道 · <b>竞速</b>挑战最快用时' },
      ],
      tipsTitle: '\u{1F4A1} 小技巧',
      tips: '坠落可免费重试无惩罚；护盾免疫减速地块，冲刺压缩用时，导航高亮推荐路线。六关主题从草甸到星穹逐步进阶！',
      bg: '#6EC8FF',
    },
    isSpecial: true,
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
    },
    guide: {
      icon: '\u{1F9E1}',
      name: '方块幻境：建造与对决',
      desc: '治愈系体素沙盒：休闲无限建造、零惩罚破坏解压，还可挑战限时主题建造与地貌改造竞速！',
      ops: [
        { icon: '\u{1F5B1}\uFE0F', text: '<b>点击画面</b>锁定鼠标转动视角' },
        { icon: '\u2328\uFE0F', text: '<b>WASD</b>移动 · <b>空格</b>跳跃 · <b>Shift</b>慢跑' },
        { icon: '\u26CF\uFE0F', text: '<b>左键</b>破坏方块 · <b>右键</b>放置方块' },
        { icon: '\u{1F7E9}', text: '底部素材栏 / <b>Q·E</b>切换方块' },
        { icon: '\u{1F3C6}', text: '<b>主题建造赛</b>5分钟评分 · <b>地貌竞速</b>快速开凿' },
      ],
      tipsTitle: '\u{1F4A1} 小技巧',
      tips: '休闲模式可随时建造探索；竞技模式主题建造请多用主题素材；世界会自动存档，保存退出不丢进度！',
      bg: '#6BCBFF',
    },
    isSpecial: true,
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
    },
    guide: {
      icon: '\u{2708}\uFE0F',
      name: '天际狂潮：空战对决',
      desc: '云端空域全自动射击，躲避弹幕拾取道具，抵御六波敌机并击败终极BOSS！',
      ops: [
        { icon: '\u{1F446}', text: '<b>拖拽</b>或 <b>WASD</b> 移动战机' },
        { icon: '\u{1F52B}', text: '<b>自动开火</b>，四阶弹幕随道具升级' },
        { icon: '\u{1F381}', text: '拾取火力/护盾/回血/缓速道具' },
        { icon: '\u{1F4A5}', text: '<b>清屏技能</b>瞬间秒杀全场敌弹' },
        { icon: '\u{1F3C6}', text: '<b>休闲</b>佛系刷怪 · <b>竞技</b>高密度冲分速通' },
      ],
      tipsTitle: '\u{1F4A1} 小技巧',
      tips: '连击提升得分倍率！清屏有冷却但无扣分；竞技模式敌更密、倍率更高。无伤通关可冲 S 评级。',
      bg: '#6BCBFF',
    },
    isSpecial: true,
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

  cuteTankBattle: {
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
    },
    guide: {
      icon: '\u{1F3AE}',
      name: '萌趣坦克大作战',
      desc: '操控Q萌坦克击毁敌方小兵，守护基地，闯关通关休闲射击小游戏。',
      ops: [
        { icon: '👆', text: '<b>滑动</b>控制坦克上下左右移动' },
        { icon: '💥', text: '<b>点击</b>屏幕发射炮弹，击毁敌方与砖墙' },
      ],
      tipsTitle: '闯关小技巧',
      tips: '躲避敌方炮弹，击碎砖墙开辟道路，保护基地即可轻松通关哦！',
      bg: '#E6F4FF',
    },
    destroy: () => {
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
    game: { id: 'dnfRpg', name: '地下城勇士', desc: '高仿DNF！选择职业闯荡地下城，连招浮空击败BOSS！', type: '2d', category: 'strategy', tag: '格斗RPG', color: '#8B4513,#FFD700', players: 0, best: 0, preview: 'dnfRpg' },
    guide: {
      icon: '⚔️', name: '地下城勇士', desc: '高仿DNF！选择职业闯荡地下城，连招浮空击败BOSS！',
      ops: [
        { icon: '🖱️', text: '<b>鼠标移动</b>控制角色位置' },
        { icon: '⬆️', text: '<b>↑ / W / 空格</b>跳跃' },
        { icon: '⬇️', text: '<b>↓ / S</b>下蹲' },
        { icon: 'J', text: '<b>J</b>普通攻击' },
        { icon: 'K', text: '<b>K</b>跳跃' },
        { icon: 'L', text: '<b>L</b>技能1' },
        { icon: 'U', text: '<b>U</b>技能2' },
        { icon: 'I', text: '<b>I</b>技能3' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '1. 合理连招可以浮空敌人！\n2. 不同职业有不同技能特性！\n3. 击败BOSS掉落装备！\n4. 注意躲避BOSS技能！',
      bg: '#8B4513'
    },
    isSpecial: true,
    init: async (engine, onEnd) => {
      const { initDnfRpg } = await import('./dnfRpg')
      initDnfRpg(engine, onEnd)
    }
  },
}

export const GAMES: Game[] = Object.values(GAME_REGISTRY).map(r => r.game)

export const GAME_GUIDES: Record<string, GameGuide> = Object.fromEntries(
  Object.entries(GAME_REGISTRY)
    .filter(([, reg]) => reg.guide)
    .map(([id, reg]) => [id, reg.guide!])
)

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
  await registration.init(engine, onEnd)
  return true
}