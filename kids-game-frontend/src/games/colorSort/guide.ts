import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🎨', name: '色彩排序', desc: '点击交换两个管子顶部的彩色球，将相同颜色的球排在一起即完成！',
      ops: [
        { icon: '👆', text: '<b>点击</b>一个管子选中' },
        { icon: '🔄', text: '再<b>点击</b>另一管子交换顶部颜色' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '只能移动到空管或相同颜色的顶部哦！完成所有排序可获得大量加分！',
      bg: '#DDA0DD'
    }
