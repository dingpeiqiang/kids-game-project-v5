import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🃏', name: '翻牌配对', desc: '翻开卡牌找到相同图案，考验你的记忆力！共5个关卡，难度递增。',
      ops: [
        { icon: '👀', text: '开局<b>预览1.5秒</b>，记住牌面位置' },
        { icon: '👆', text: '<b>点击卡牌</b>翻开，每次翻2张' },
        { icon: '🎯', text: '图案相同则<b>配对消除</b>，不同则翻回' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '关卡开始时有1.5秒预览时间！连续配对成功可获得连击加分。剩余时间会转化为奖励分数，越快通关分越高！',
      bg: '#0f0c29'
    }
