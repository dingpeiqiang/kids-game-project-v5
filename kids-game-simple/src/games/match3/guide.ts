import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '��',
      name: '宝石三消',
      desc: '点击选中宝石，再点相邻格交换，三个及以上同色连线消除！',
      ops: [
        { icon: '👆', text: '<b>点击</b>选中一颗宝石' },
        { icon: '��', text: '再<b>点击</b>相邻格交换' },
      ],
      tipsTitle: '�� 小技巧',
      tips: '连锁消除分数更高！长时间不操作会结束游戏。',
      bg: '#9B59B6',
    }
