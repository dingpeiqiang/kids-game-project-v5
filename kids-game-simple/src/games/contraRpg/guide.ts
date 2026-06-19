import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🔫', name: '魂斗罗RPG', desc: '经典横版射击闯关！击败敌人收集道具，挑战最终BOSS！',
      ops: [
        { icon: '⬅️', text: '<b>← → / A D</b>左右移动' },
        { icon: '⬆️', text: '<b>↑ / W / 空格</b>跳跃/二段跳' },
        { icon: '🔫', text: '<b>J / K</b>射击' },
        { icon: '⚔️', text: '<b>L</b>近战攻击' },
        { icon: '🏃', text: '<b>S / ↓</b>滑铲（躲避子弹）' },
        { icon: '📱', text: '<b>触屏</b>虚拟按钮：← → 移动 / ↑跳跃 / ⚔近战 / ↘滑铲 / 🔫射击' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '1. 第三关解锁二段跳！\n2. 收集道具强化能力：❤️回血/💚生命上限/⚡射速/💥散射弹/🛡️护盾\n3. 击败所有敌人过关，最终BOSS有多种攻击模式！\n4. 近战攻击(L/⚔)伤害高，滑铲(S/↘)可躲子弹！',
      bg: '#1a2f1a'
    }
