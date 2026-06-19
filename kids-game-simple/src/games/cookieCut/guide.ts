import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🍪', name: '切饼干', desc: '滑动切割飞起的饼干，碎屑四溅超有趣！',
      ops: [
        { icon: '👆', text: '<b>滑动</b>手指切割饼干' },
        { icon: '🔥', text: '<b>连击</b>切割得分翻倍' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '饼干从底部飞起，碰到墙壁会反弹！连续切割触发连击加成！',
      bg: '#D2691E'
    }
