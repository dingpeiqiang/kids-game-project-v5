import type { GameItem } from '../types'

// 游戏道具定义 - 通过消除带道具图标的方块获得
// 重新设计的核心道具系统，针对极速消除游戏的核心痛点
export const GAME_ITEMS: GameItem[] = [
  // 核心道具（游戏开始即可出现）
  {
    id: 'time_extend',
    name: '时间延长',
    desc: '立即增加10秒游戏时间',
    icon: '⏰',
    price: 0,
    effect: '增加时间',
    type: 'instant'
  },
  {
    id: 'hint',
    name: '提示高亮',
    desc: '高亮显示可消除的方块组合',
    icon: '🔍',
    price: 0,
    effect: '智能提示',
    type: 'buff'
  },
  
  // 中级道具（游戏20秒后解锁）
  {
    id: 'double_score',
    name: '分数加倍',
    desc: '20秒内所有得分翻倍',
    icon: '✨',
    price: 0,
    effect: '得分倍增',
    type: 'buff'
  },
  {
    id: 'bomb',
    name: '炸弹',
    desc: '消除数量最多的颜色所有方块',
    icon: '💣',
    price: 0,
    effect: '范围爆炸',
    type: 'instant'
  }
]

// 道具解锁时间（毫秒）- 调整为更合理的解锁时间
export const ITEM_UNLOCK_TIMES = {
  time_extend: 0,     // 立即解锁
  hint: 0,            // 立即解锁
  double_score: 10000, // 10秒后解锁（适配短关卡）
  bomb: 10000         // 10秒后解锁（适配短关卡）
}

// 道具出现概率（权重）- 平衡各道具的出现频率
export const ITEM_SPAWN_WEIGHTS = {
  time_extend: 30,   // 时间延长：最常用
  hint: 25,          // 提示高亮：帮助新手
  double_score: 25,  // 分数加倍：冲刺高分
  bomb: 20           // 炸弹：紧急清场
}
