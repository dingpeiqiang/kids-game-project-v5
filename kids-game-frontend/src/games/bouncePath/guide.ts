import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '⚽', name: '弹珠迷宫', desc: '控制弹珠在迷宫中弹跳，收集星星获得高分！',
      ops: [
        { icon: '👆', text: '<b>移动鼠标</b>控制弹珠左右' },
        { icon: '⭐', text: '收集<b>星星</b>获得积分' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '弹珠会自动弹跳，点击给一个向上的力，连续收集星星触发连击！',
      bg: '#4ECDC4'
    }
