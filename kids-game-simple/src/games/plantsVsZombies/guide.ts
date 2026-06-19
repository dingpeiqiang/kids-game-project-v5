import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🌱', name: '植物大战僵尸', desc: '种植植物抵御僵尸入侵，保护家园！',
      ops: [
        { icon: '👆', text: '<b>点击卡片</b>选择植物' },
        { icon: '👆', text: '<b>点击草地</b>种植植物' },
        { icon: '☀️', text: '收集<b>阳光</b>种植更多植物' },
        { icon: '🧟', text: '<b>抵御僵尸</b>入侵' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '合理搭配植物阵型！向日葵提供阳光，豌豆射手输出，坚果墙防御！',
      bg: '#7CB342'
    }
