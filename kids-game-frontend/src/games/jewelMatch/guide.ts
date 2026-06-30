import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🐾', name: '宠物消消乐', desc: '点击交换相邻宠物，3个以上相同宠物连线消除！',
      ops: [
        { icon: '👆', text: '<b>点击</b>一个宠物选中' },
        { icon: '🔄', text: '<b>点击</b>相邻宠物交换' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '创造更多匹配可以触发连锁反应，得分翻倍！30秒内没有移动会游戏结束！',
      bg: '#FFD700'
    }
