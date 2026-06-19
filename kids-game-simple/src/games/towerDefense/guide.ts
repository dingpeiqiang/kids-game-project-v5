import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🏰', name: '星际塔防', desc: '在路径旁放置防御塔，自动攻击沿路前进的外星敌人！',
      ops: [
        { icon: '👆', text: '<b>点击顶部</b>选择塔类型' },
        { icon: '👆', text: '<b>点击空地</b>放置防御塔' },
        { icon: '💰', text: '击杀敌人获得<b>金币</b>建造更多塔' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '激光塔射速快、火炮塔伤害高带范围爆炸、冰冻塔减速敌人！每5波会出现BOSS，火力集中消灭！',
      bg: '#0d1b2a'
    }
