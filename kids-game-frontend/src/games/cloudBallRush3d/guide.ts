import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '\u{26BD}',
      name: '云端滚球大冒险',
      desc: '操控立体球体在浮空赛道滚动，收集星光、拾取道具，平稳抵达终点！',
      ops: [
        { icon: '\u2328\uFE0F', text: '<b>WASD / 方向键</b>控制滚球平衡与转向' },
        { icon: '\u{1F446}', text: '<b>左下虚拟摇杆</b>（移动端）移动' },
        { icon: '\u2B06\uFE0F', text: '<b>空格 / 跳</b>按钮跨越沟壑与障碍' },
        { icon: '\u2B50', text: '收集<b>星光</b>决定关卡星级，隐藏彩蛋加分' },
        { icon: '\u{1F3C6}', text: '<b>休闲</b>加宽赛道 · <b>竞速</b>挑战最快用时' },
      ],
      tipsTitle: '\u{1F4A1} 小技巧',
      tips: '坠落可免费重试无惩罚；护盾免疫减速地块，冲刺压缩用时，导航高亮推荐路线。六关主题从草甸到星穹逐步进阶！',
      bg: '#6EC8FF',
    }
