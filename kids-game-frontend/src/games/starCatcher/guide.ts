import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🧚', name: '星星捕手', desc: '控制小精灵收集星星，躲避乌云袭击！',
      ops: [
        { icon: '👆', text: '<b>移动鼠标</b>控制小精灵' },
        { icon: '⭐', text: '收集<b>星星</b>获得积分' },
        { icon: '☁️', text: '<b>躲避</b>乌云！' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '金色星星分值更高！碰到乌云会扣分，连续收集触发连击！',
      bg: '#FFD700'
    }
