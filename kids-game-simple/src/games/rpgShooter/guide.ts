import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🎮', name: '星际猎手', desc: '自由移动的RPG射击游戏！击杀敌人获得经验升级，拾取道具提升属性，挑战无尽波次！',
      ops: [
        { icon: '🖱️', text: '<b>鼠标移动</b>控制角色移动方向' },
        { icon: '⌨️', text: '<b>WASD/方向键</b>也可控制移动' },
        { icon: '🔫', text: '<b>自动射击</b>朝向鼠标方向' },
        { icon: '⬆️', text: '击杀敌人获得<b>经验</b>升级提升属性' },
        { icon: '🎁', text: '<b>掉落道具</b>：💚血量/✨经验/⚡速度/🔥攻击' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '升级可以提升HP上限和攻击力！合理走位躲避敌人，优先击杀落单的敌人。速度道具适合近距离缠斗，攻击道具适合远程火力压制！',
      bg: '#5352ED'
    }
