import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🏰', name: 'RPG塔防射击', desc: '双系统战斗！建造炮台防御+角色移动射击，策略与操作并重！',
      ops: [
        { icon: '🖱️', text: '<b>鼠标移动</b>控制角色位置' },
        { icon: '🔫', text: '<b>自动射击</b>朝向鼠标方向' },
        { icon: '👆', text: '<b>点击炮台按钮</b>选择炮台' },
        { icon: '🏗️', text: '<b>点击地图</b>直接放置炮台' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '击杀敌人获得钻石建造炮台！激光塔射速快(40💎)、导弹塔范围大(80💎)、冰冻塔减速(50💎)、闪电塔连锁(120💎)！守住8波敌人即可获胜！',
      bg: '#4ECDC4'
    }
