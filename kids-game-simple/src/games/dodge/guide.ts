import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🏃', name: '轻量躲避', desc: '控制角色左右移动，躲避下落的障碍物，收集金色道具加分！',
      ops: [
        { icon: '👆', text: '<b>手指/鼠标拖动</b>左右移动角色' },
        { icon: '⭐', text: '吃到<b>金色道具</b>获得额外积分' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '障碍物有红色和紫色两种，小心别碰到！收集道具还能触发随机Buff！',
      bg: '#4ECDC4'
    }
