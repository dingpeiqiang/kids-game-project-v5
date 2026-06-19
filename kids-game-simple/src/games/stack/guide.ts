import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🏗️', name: '叠叠乐', desc: '左右摆动的方块从顶部落下，精准对齐堆叠！',
      ops: [
        { icon: '👆', text: '<b>点击屏幕</b>放下方块' },
        { icon: '🎯', text: '<b>对齐越精准</b>，方块越不缩小' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '偏差小于4像素触发"完美对齐"，方块不会缩小！连续完美对齐获得大量奖励分数！',
      bg: '#A8E6CF'
    }
