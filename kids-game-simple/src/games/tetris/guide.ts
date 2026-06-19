import type { GameGuide } from '../../types'

export const guide: GameGuide = {
      icon: '🧱', name: '方块消除', desc: '经典俄罗斯方块，消除满行得分，消灭50行获胜！',
      ops: [
        { icon: '⬅️', text: '<b>左右箭头</b>移动方块' },
        { icon: '⬆️', text: '<b>上箭头</b>旋转方块' },
        { icon: '⬇️', text: '<b>下箭头</b>加速下落' },
      ],
      tipsTitle: '💡 小技巧',
      tips: '一次消除多行得分更高！消灭50行即可获胜！',
      bg: '#4D96FF'
    }
