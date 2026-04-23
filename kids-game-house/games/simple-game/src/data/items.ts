import type { GameItem } from '../types'

// 游戏道具定义 - 通过消除带道具图标的方块获得
export const GAME_ITEMS: GameItem[] = [
  // 基础道具（游戏开始即可出现）
  {
    id: 'bomb',
    name: '炸弹',
    desc: '消除周围3x3范围的方块',
    icon: '💣',
    price: 0,
    effect: '范围爆炸',
    type: 'instant'
  },
  {
    id: 'line_h',
    name: '横排消除',
    desc: '消除整行方块',
    icon: '➡️',
    price: 0,
    effect: '横向清除',
    type: 'instant'
  },
  {
    id: 'line_v',
    name: '竖排消除',
    desc: '消除整列方块',
    icon: '⬇️',
    price: 0,
    effect: '纵向清除',
    type: 'instant'
  },
  
  // 中级道具（游戏30秒后解锁）
  {
    id: 'color_bomb',
    name: '颜色炸弹',
    desc: '消除所有同色方块',
    icon: '🎨',
    price: 0,
    effect: '同色全消',
    type: 'instant'
  },
  {
    id: 'hammer',
    name: '锤子',
    desc: '消除单个指定方块',
    icon: '🔨',
    price: 0,
    effect: '精准打击',
    type: 'instant'
  },
  {
    id: 'shuffle',
    name: '洗牌',
    desc: '重新排列所有方块',
    icon: '🔄',
    price: 0,
    effect: '随机重组',
    type: 'instant'
  },
  
  // 高级道具（游戏60秒后解锁）
  {
    id: 'rainbow',
    name: '彩虹球',
    desc: '将方块变为彩虹色',
    icon: '🌈',
    price: 0,
    effect: '万能匹配',
    type: 'instant'
  },
  {
    id: 'freeze',
    name: '冰冻',
    desc: '暂停倒计时5秒',
    icon: '❄️',
    price: 0,
    effect: '时间冻结',
    type: 'buff'
  },
  {
    id: 'magnet',
    name: '磁铁',
    desc: '自动吸附附近道具',
    icon: '🧲',
    price: 0,
    effect: '范围收集',
    type: 'buff'
  },
  
  // 稀有道具（游戏90秒后解锁）
  {
    id: 'mega_bomb',
    name: '超级炸弹',
    desc: '全屏消除',
    icon: '☢️',
    price: 0,
    effect: '毁灭打击',
    type: 'instant'
  },
  {
    id: 'time_plus',
    name: '时间延长',
    desc: '增加15秒超时',
    icon: '⏰',
    price: 0,
    effect: '续命神器',
    type: 'buff'
  },
  {
    id: 'double_score',
    name: '双倍分数',
    desc: '下次消除得分翻倍',
    icon: '✨',
    price: 0,
    effect: '分数倍增',
    type: 'buff'
  }
]

// 道具解锁时间（毫秒）
export const ITEM_UNLOCK_TIMES = {
  bomb: 0,        // 立即解锁
  line_h: 0,
  line_v: 0,
  color_bomb: 30000,   // 30秒
  hammer: 30000,
  shuffle: 30000,
  rainbow: 60000,      // 60秒
  freeze: 60000,
  magnet: 60000,
  mega_bomb: 90000,    // 90秒
  time_plus: 90000,
  double_score: 90000
}

// 道具出现概率（权重）
export const ITEM_SPAWN_WEIGHTS = {
  bomb: 25,
  line_h: 20,
  line_v: 20,
  color_bomb: 15,
  hammer: 15,
  shuffle: 10,
  rainbow: 8,
  freeze: 8,
  magnet: 5,
  mega_bomb: 3,
  time_plus: 5,
  double_score: 5
}
