import type { GameGuide } from '../../types'

export const guide: GameGuide = {
  icon: '\u{1F476}',
  name: '王者萌斗',
  desc: '横屏轻MOBA：拖动走位、普攻自动、两键技能，推线拆水晶拿星级。',
  ops: [
    { icon: '\u{1F579}\uFE0F', text: '左侧<b>拖动</b>控制萌版刘备走位' },
    { icon: '\u2694\uFE0F', text: '<b>普攻自动</b>攻击范围内敌人' },
    { icon: '\u2728', text: '右侧<b>技能/大招</b>清小兵，可开自动作战' },
  ],
  tipsTitle: '萌斗小技巧',
  tips: '先清小兵攒金币，残血后撤等复活；大招留给小兵扎堆，优先推掉敌方水晶！',
  bg: '#E8F4FC',
}