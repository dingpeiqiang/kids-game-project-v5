import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🟢', name: '史莱姆跳', desc: '控制史莱姆不断往上跳，收集星星得高分！',
      ops: [
        { icon: '👆', text: '<b>移动鼠标</b>左右移动' },
        { icon: '⬆️', text: '跳上<b>弹簧</b>跳得更高' },
        { icon: '⭐', text: '收集<b>星星</b>获得积分' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '弹簧平台可以跳得更高！紫色移动平台要小心！',
      bg: '#6BCB77'
    }
