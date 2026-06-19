import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '⚔️', name: '王者荣耀', desc: '横版对战！摇杆移动+技能释放，击杀敌方3次获胜！',
      ops: [
        { icon: '🕹️', text: '<b>左侧摇杆</b>360度移动英雄' },
        { icon: '⚔️', text: '<b>普攻按键</b>短按单次攻击，长按连续攻击' },
        { icon: '1️⃣', text: '<b>1/2技能</b>小范围金色伤害' },
        { icon: '3️⃣', text: '<b>3技能大招</b>大范围高伤害' },
        { icon: '🔄', text: '<b>重新开局</b>顶部按钮重置对局' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '1. 击杀敌方3次即可胜利！\n2. 1/2技能小范围伤害150，3技能大范围伤害250\n3. 敌方会巡逻、追击、攻击，保持走位拉扯\n4. 180秒超时判负，注意时间！',
      bg: '#1a1a2e'
    }
