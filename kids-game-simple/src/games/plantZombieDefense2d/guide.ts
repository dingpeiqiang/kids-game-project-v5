import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '��',
      name: '萌植防线 2D',
      desc: '摆放萌系植物，收集阳光，击退呆萌僵尸，守护小屋通关闯关。',
      ops: [
        { icon: '☀️', text: '<b>点击</b>飘落阳光，增加放置资源' },
        { icon: '��', text: '<b>点草坪格</b>放置选中的植物' },
        { icon: '🗑️', text: '<b>点已种植物</b>出售，返还 20% 阳光' },
      ],
      tipsTitle: '游玩小技巧',
      tips: '优先种向日葵攒阳光，坚果挡路、豌豆输出，漏怪会扣小屋血量！',
      bg: '#C2E8B9',
    }
