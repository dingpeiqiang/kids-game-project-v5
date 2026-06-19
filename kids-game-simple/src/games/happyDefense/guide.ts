import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '\u{1F3F0}',
      name: '欢乐防线大作战',
      desc: '在草地上布置四款趣味炮塔，抵御萌系怪物六波进攻，保护基地！',
      ops: [
        { icon: '\u{1F446}', text: '<b>点击空地</b>放置选中的防御塔' },
        { icon: '\u2B06\uFE0F', text: '<b>点击已有塔</b>选中，可升级或出售' },
        { icon: '\u{1F4B0}', text: '击杀怪物获得<b>金币</b>，用于建塔升级' },
        { icon: '\u{1F30A}', text: '<b>下一波</b>自主开战；<b>重置战局</b>随时重来无惩罚' },
        { icon: '\u{1F381}', text: '每波结束随机<b>趣味Buff</b>，清屏/翻倍/金币雨' },
      ],
      tipsTitle: '\u{1F4A1} 小技巧',
      tips: '爆米花塔清小怪群，冰霜塔减速，闪电塔链式清屏，穿刺塔打BOSS！连击加分冲最高纪录，满血快通拿S评级。',
      bg: '#6BCB77',
    }
