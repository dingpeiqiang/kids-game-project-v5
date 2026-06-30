import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '⚔️', name: '地下城勇士', desc: '高仿DNF！选择职业闯荡地下城，连招浮空击败BOSS！',
      ops: [
        { icon: '🖱️', text: '<b>鼠标移动</b>控制角色位置' },
        { icon: '⬆️', text: '<b>↑ / W / 空格</b>跳跃' },
        { icon: '⬇️', text: '<b>↓ / S</b>下蹲' },
        { icon: 'J', text: '<b>J</b>普通攻击' },
        { icon: 'K', text: '<b>K</b>跳跃' },
        { icon: 'L', text: '<b>L</b>技能1' },
        { icon: 'U', text: '<b>U</b>技能2' },
        { icon: 'I', text: '<b>I</b>技能3' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '1. 合理连招可以浮空敌人！\n2. 不同职业有不同技能特性！\n3. 击败BOSS掉落装备！\n4. 注意躲避BOSS技能！',
      bg: '#8B4513'
    }
