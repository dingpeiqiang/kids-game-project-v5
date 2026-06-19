import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '\u{1F3AE}',
      name: '超级玛丽',
      desc: '经典平台跳跃！跑向终点旗杆，共 5 个关卡。',
      ops: [
        { icon: '\u{1F579}\uFE0F', text: '<b>左侧摇杆</b>左右移动（推到底可加速）' },
        { icon: '\u2B06\uFE0F', text: '<b>右侧「跳」</b>或键盘 W / 空格跳跃' },
        { icon: '\u{1F45F}', text: '<b>从上方踩</b>敌人可消灭并获得弹跳' },
        { icon: '\u2753', text: '<b>顶问号砖</b>获得金币与道具' },
      ],
      tipsTitle: '\u{1F4A1} 小技巧',
      tips: '收集 100 枚金币加 1 条命！蘑菇变大可顶碎砖块。星星无敌可冲撞敌人。注意倒计时！',
      bg: '#5c94fc',
    }
