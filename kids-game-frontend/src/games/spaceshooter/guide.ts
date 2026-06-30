import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🔫', name: '太空射击', desc: '驾驶战机消灭外星入侵者，收集道具强化火力！',
      ops: [
        { icon: '👆', text: '<b>点击/长按</b>屏幕连续射击' },
        { icon: '👆', text: '<b>移动</b>飞船躲避敌弹' },
        { icon: '🎁', text: '击杀敌人<b>掉落道具</b>（三连发/扩散弹/回血/炸弹）' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '连续击杀触发连击加成！每5波会出现密集敌群，优先收集三连发和炸弹道具！',
      bg: '#0d1b2a'
    }
