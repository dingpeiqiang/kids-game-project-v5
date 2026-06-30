import type { GameGuide } from '../../types'

export const guide: GameGuide = {
  icon: '\u2708\uFE0F',
  name: '天空狂飙 3D',
  desc: '立体空域射击：移动端左下摇杆、右下瞄准，桌面 WASD + 拖拽。',
  ops: [
    { icon: '\u{1F579}\uFE0F', text: '<b>左下摇杆</b>（手机）或 <b>WASD</b> 移动' },
    { icon: '\u{1F446}', text: '<b>拖动</b>瞄准方向，自动开火清敌' },
    { icon: '\u{1F4A5}', text: '拾取火力、护盾等道具' },
    { icon: '\u{1F3C6}', text: '<b>休闲</b> / <b>竞技</b> 模式选关开局' },
  ],
  tipsTitle: '小技巧',
  tips: '横屏游玩体验最佳；清屏与暂停可用顶栏或快捷键。',
  bg: '#6BCBFF',
}