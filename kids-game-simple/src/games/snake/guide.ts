import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🐍', name: '贪吃蛇', desc: '经典贪吃蛇！控制小蛇吃食物长大，别撞墙和自己的身体！',
      ops: [
        { icon: '👆', text: '<b>点击屏幕四个方向</b>控制蛇的移动方向' },
        { icon: '🍎', text: '吃到食物<b>蛇身变长</b>，得分增加' },
        { icon: '⚡', text: '<b>金色食物</b>额外加分，<b>蓝色食物</b>短暂加速' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '蛇会越吃越长，空间越来越小！沿边缘行走是经典策略，留够转身空间。金色食物分值更高，不要错过！',
      bg: '#2ECC71'
    }
