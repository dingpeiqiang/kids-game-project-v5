import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '💥', name: '极速消除', desc: '找出相同的彩色方块，点击3个及以上连成一线即可消除！',
      ops: [
        { icon: '🖱️', text: '<b>点击</b>任意彩色方块开始' },
        { icon: '🔗', text: '相同颜色<b>3个以上</b>相连即消除' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '方块消除后，上方方块会下落，可能引发连锁反应，得分翻倍！',
      bg: '#FF6B6B'
    }
