import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🔨', name: '打地鼠', desc: '地鼠从洞里冒出来，快速点击砸中得分！60秒内拿到最高分！',
      ops: [
        { icon: '👆', text: '<b>点击/触摸</b>地鼠立即砸中' },
        { icon: '⭐', text: '<b>金色地鼠</b>得30分，普通地鼠得10分' },
        { icon: '☠️', text: '点击<b>炸弹地鼠</b>会扣100分！' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '金色地鼠出现时间短，要眼疾手快！炸弹地鼠出现时间长，仔细辨认再下手！后期地鼠冒出越来越快，注意力要高度集中！',
      bg: '#8B5E3C'
    }
