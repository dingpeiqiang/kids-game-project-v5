// 道具系统配置
import type { PowerupConfig, PowerupType } from '../types'

export const POWERUP_CONFIGS: Record<PowerupType, PowerupConfig> = {
  widen: {
    type: 'widen',
    icon: '↔️',
    name: '加宽',
    description: '当前方块宽度增加50%',
    cooldown: 30000,
    duration: 0,
    rarity: 'common',
    effect: (game) => {
      game.currentBlock.w = Math.min(game.currentBlock.w * 1.5, game.W * 0.8)
      game.addFloatText('↔️ 方块加宽', '#2ECC71', 20)
    },
  },
  slow: {
    type: 'slow',
    icon: '🐌',
    name: '减速',
    description: '摆动速度减半，持续10秒',
    cooldown: 45000,
    duration: 10000,
    rarity: 'common',
    effect: (game) => {
      game.currentBlock.dir *= 0.5
      game.addFloatText('🐌 速度减慢', '#1ABC9C', 20)
    },
  },
  perfect: {
    type: 'perfect',
    icon: '✨',
    name: '完美',
    description: '下次自动完美对齐',
    cooldown: 60000,
    duration: 0,
    rarity: 'rare',
    effect: (game) => {
      game.autoPerfect = true
      game.addFloatText('✨ 下次完美', '#FFD700', 20)
    },
  },
  revive: {
    type: 'revive',
    icon: '💖',
    name: '复活',
    description: '游戏结束时自动复活一次',
    cooldown: 120000,
    duration: 0,
    rarity: 'epic',
    effect: (game) => {
      game.hasRevive = true
      game.addFloatText('💖 复活准备', '#FF6B6B', 20)
    },
  },
  magnet: {
    type: 'magnet',
    icon: '🧲',
    name: '磁铁',
    description: '自动吸引方块到中心位置',
    cooldown: 45000,
    duration: 8000,
    rarity: 'rare',
    effect: (game) => {
      game.hasMagnet = true
      game.magnetEndTime = Date.now() + 8000
      game.addFloatText('🧲 磁铁激活', '#E74C3C', 20)
    },
  },
  doubleScore: {
    type: 'doubleScore',
    icon: '⭐',
    name: '双倍',
    description: '分数翻倍，持续15秒',
    cooldown: 60000,
    duration: 15000,
    rarity: 'epic',
    effect: (game) => {
      game.scoreMultiplier = 2
      game.scoreMultiplierEndTime = Date.now() + 15000
      game.addFloatText('⭐ 双倍分数', '#FFD700', 22)
    },
  },
  timeStop: {
    type: 'timeStop',
    icon: '⏰',
    name: '时间停止',
    description: '方块暂停移动，持续3秒',
    cooldown: 90000,
    duration: 3000,
    rarity: 'legendary',
    effect: (game) => {
      game.timeStopped = true
      game.timeStopEndTime = Date.now() + 3000
      game.addFloatText('⏰ 时间停止', '#9B59B6', 24)
    },
  },
  shield: {
    type: 'shield',
    icon: '🛡️',
    name: '护盾',
    description: '免疫一次炸弹效果',
    cooldown: 60000,
    duration: 0,
    rarity: 'rare',
    effect: (game) => {
      game.hasShield = true
      game.addFloatText('🛡️ 护盾激活', '#9400D3', 20)
    },
  },
  rainbow: {
    type: 'rainbow',
    icon: '🌈',
    name: '彩虹',
    description: '接下来3个方块必定是奖励方块',
    cooldown: 120000,
    duration: 0,
    rarity: 'legendary',
    effect: (game) => {
      game.rainbowCount = 3
      game.addFloatText('🌈 彩虹模式', '#FF69B4', 24)
    },
  },
}

// 道具组合效果
export const POWERUP_COMBOS: Record<string, {
  name: string
  description: string
  powerups: PowerupType[]
  effect: (game: any) => void
}> = {
  speedMaster: {
    name: '速度大师',
    description: '减速+时间停止，超级慢动作',
    powerups: ['slow', 'timeStop'],
    effect: (game) => {
      game.currentBlock.dir *= 0.3
      game.addFloatText('⚡ 速度大师！', '#FF4500', 28)
    },
  },
  perfectStorm: {
    name: '完美风暴',
    description: '完美+彩虹，无限奖励',
    powerups: ['perfect', 'rainbow'],
    effect: (game) => {
      game.autoPerfect = true
      game.rainbowCount = 5
      game.addFloatText('🌪️ 完美风暴！', '#00CED1', 28)
    },
  },
  survivalist: {
    name: '生存专家',
    description: '复活+护盾，双重保险',
    powerups: ['revive', 'shield'],
    effect: (game) => {
      game.hasRevive = true
      game.hasShield = true
      game.addFloatText('🏆 生存专家！', '#2ECC71', 28)
    },
  },
}

// 道具获取概率（通过完美对齐获得）
export const POWERUP_DROP_CHANCES: Record<string, { rarity: string; chance: number }> = {
  common: { rarity: 'common', chance: 0.3 },
  rare: { rarity: 'rare', chance: 0.15 },
  epic: { rarity: 'epic', chance: 0.05 },
  legendary: { rarity: 'legendary', chance: 0.01 },
}