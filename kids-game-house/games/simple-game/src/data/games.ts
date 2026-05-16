import type { Game, GameGuide, GameCategoryDef } from '../types'

// 玩法分类定义
export const GAME_CATEGORIES: GameCategoryDef[] = [
  { id: 'eliminate', label: '热门消除', icon: '💥', color: '#FF6B6B' },
  { id: 'reaction',  label: '反应力',   icon: '⚡', color: '#FFD93D' },
  { id: 'slice',     label: '切割爽感', icon: '🗡️', color: '#FF8E53' },
  { id: 'action',    label: '动作闯关', icon: '🏃', color: '#4ECDC4' },
  { id: 'puzzle',    label: '益智休闲', icon: '🧩', color: '#9B59B6' },
  { id: '3d',        label: '3D沉浸',   icon: '🎮', color: '#87CEEB' },
  { id: 'build',     label: '堆叠建造', icon: '🏗️', color: '#A8E6CF' },
  { id: 'shoot',        label: '射击枪战', icon: '🔫', color: '#FF4757' },
  { id: 'towerDefense', label: '策略塔防', icon: '🏰', color: '#5352ED' },
  { id: 'card',         label: '卡牌记忆', icon: '🃏', color: '#FDCB6E' },
]

export const GAMES: Game[] = [
  { id: 'eliminate', name: '极速消除', desc: '点击同色方块，触发连锁爆炸！', type: '2d', category: 'eliminate', tag: '消除', color: '#FF6B6B,#FF8E53', players: 2847, best: 0, preview: 'eliminate' },
  { id: 'dodge',     name: '轻量躲避', desc: '滑动躲避障碍，收集加分道具', type: '2d', category: 'action', tag: '躲避', color: '#4ECDC4,#45B7AA', players: 3215, best: 0, preview: 'dodge' },
  { id: 'stack3d',   name: '3D堆叠乐园', desc: '3D模型堆叠挑战，不倒塌就得分', type: '3d', category: '3d', tag: '3D', color: '#A8E6CF,#88D8B0', players: 1893, best: 0, preview: 'stack3d' },
  { id: 'sort',      name: '色彩排序', desc: '滑动排序彩色液体，超治愈！', type: '2d', category: 'puzzle', tag: '益智', color: '#DDA0DD,#BA55D3', players: 1532, best: 0, preview: 'sort' },
  { id: 'pop',       name: '气球砰砰', desc: '疯狂点击气球，炸出高分！', type: '2d', category: 'reaction', tag: '点击', color: '#FF69B4,#FF1493', players: 2108, best: 0, preview: 'pop' },
  { id: 'fruitSlice',name: '水果切切', desc: '划动切割水果，果汁飞溅超解压！', type: '2d', category: 'slice', tag: '切割', color: '#FF6B6B,#FFD93D', players: 1654, best: 0, preview: 'fruitSlice' },
  { id: 'bouncePath',name: '弹珠迷宫', desc: '控制弹珠收集星星，弹跳乐趣多！', type: '2d', category: 'puzzle', tag: '益智', color: '#4ECDC4,#FFD93D', players: 1432, best: 0, preview: 'bouncePath' },
  { id: 'neonRun',   name: '霓虹跑酷', desc: '躲避障碍收集金币，无尽奔跑！', type: '2d', category: 'action', tag: '跑酷', color: '#9B59B6,#FF69B4', players: 1987, best: 0, preview: 'neonRun' },
  { id: 'tetris',    name: '方块消除', desc: '经典俄罗斯方块，益智又上瘾！', type: '2d', category: 'eliminate', tag: '消除', color: '#4D96FF,#FF8E53', players: 2341, best: 0, preview: 'tetris' },
  { id: 'jewelMatch',name: '宝石消消乐', desc: '交换宝石消除，3个以上连成一线！', type: '2d', category: 'eliminate', tag: '消除', color: '#FFD700,#9B59B6', players: 1876, best: 0, preview: 'jewelMatch' },
  { id: 'cookieCut',name: '切饼干', desc: '滑动切割飞起的饼干，碎屑四溅超有趣！', type: '2d', category: 'slice', tag: '切割', color: '#D2691E,#FFD700', players: 1567, best: 0, preview: 'cookieCut' },
  { id: 'starCatcher',name: '星星捕手', desc: '控制小精灵收集星星，躲避乌云袭击！', type: '2d', category: 'puzzle', tag: '益智', color: '#FFD700,#9B59B6', players: 1234, best: 0, preview: 'starCatcher' },
  { id: 'bubbleShooter',name: '泡泡龙', desc: '经典泡泡龙射击，3个以上相同颜色消除！', type: '2d', category: 'eliminate', tag: '消除', color: '#4ECDC4,#FF69B4', players: 2134, best: 0, preview: 'bubbleShooter' },
  { id: 'slimeJump',name: '史莱姆跳', desc: '控制史莱姆不断往上跳，收集星星得高分！', type: '2d', category: 'action', tag: '跳跃', color: '#6BCB77,#9B59B6', players: 987, best: 0, preview: 'slimeJump' },
  { id: 'colorTap',name: '颜色Tap', desc: '快速点击匹配颜色，测试你的反应力！', type: '2d', category: 'reaction', tag: '反应', color: '#FF6B6B,#4ECDC4', players: 1456, best: 0, preview: 'colorTap' },
  { id: 'stack', name: '叠叠乐', desc: '精准堆叠方块，叠得越高分数越高！', type: '2d', category: 'build', tag: '堆叠', color: '#A8E6CF,#6BCB77', players: 2100, best: 0, preview: 'stack' },
  { id: 'spaceShooter', name: '太空射击', desc: '驾驶飞船消灭外星入侵者，躲避弹幕！', type: '2d', category: 'shoot', tag: '射击', color: '#0d1b2a,#45B7D1', players: 3200, best: 0, preview: 'spaceShooter' },
  { id: 'towerDefense', name: '星际塔防', desc: '放置防御塔拦截外星入侵者，守住防线！', type: '2d', category: 'towerDefense', tag: '塔防', color: '#0d1b2a,#5352ED', players: 2500, best: 0, preview: 'towerDefense' },
  { id: 'memoryMatch', name: '翻牌配对', desc: '翻开卡牌找到相同图案，考验你的记忆力！', type: '2d', category: 'card', tag: '记忆', color: '#0f0c29,#A29BFE', players: 1800, best: 0, preview: 'memoryMatch' },
  { id: 'snake', name: '贪吃蛇', desc: '控制小蛇吃食物，别撞墙和自己的尾巴！', type: '2d', category: 'action', tag: '经典', color: '#2ECC71,#27AE60', players: 3500, best: 0, preview: 'snake' },
  { id: 'whackMole', name: '打地鼠', desc: '快速敲击出洞的地鼠，金色鼠得分多，小心炸弹！', type: '2d', category: 'reaction', tag: '反应', color: '#8B5E3C,#FFD700', players: 2760, best: 0, preview: 'whackMole' },
  { id: 'racingRun', name: '极速赛车', desc: '飙车躲障碍！拾取道具触发火焰加速、护盾、磁铁吸分，超爽！', type: '2d', category: 'action', tag: '赛车', color: '#FF6B00,#FFD700', players: 3180, best: 0, preview: 'racingRun' },
  { id: 'rpgShooter', name: '星际猎手', desc: 'RPG移动射击！击杀敌人获得经验升级，提升属性挑战波次！', type: '2d', category: 'shoot', tag: 'RPG射击', color: '#5352ED,#9B59B6', players: 2100, best: 0, preview: 'rpgShooter' },
  { id: 'rpgShooterTD', name: 'RPG塔防射击', desc: '双系统战斗！建造炮台防御+角色移动射击，策略与操作并重！', type: '2d', category: 'shoot', tag: '塔防射击', color: '#4ECDC4,#FF6B6B', players: 1500, best: 0, preview: 'rpgShooterTowerDefense' },
  { id: 'dragonShooter', name: '打龙小游戏', desc: '国产爆款！滑动控制自动射击，龙体分裂爽感无限！', type: '2d', category: 'shoot', tag: '射击', color: '#FFD700,#FF5722', players: 9999, best: 0, preview: 'dragonShooter' },
]

export const GAME_GUIDES: Record<string, GameGuide> = {
  eliminate: {
    icon: '💥', name: '极速消除', desc: '找出相同的彩色方块，点击3个及以上连成一线即可消除！',
    ops: [
      { icon: '🖱️', text: '<b>点击</b>任意彩色方块开始' },
      { icon: '🔗', text: '相同颜色<b>3个以上</b>相连即消除' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '方块消除后，上方方块会下落，可能引发连锁反应，得分翻倍！',
    bg: '#FF6B6B'
  },
  dodge: {
    icon: '🏃', name: '轻量躲避', desc: '控制角色左右移动，躲避下落的障碍物，收集金色道具加分！',
    ops: [
      { icon: '👆', text: '<b>手指/鼠标拖动</b>左右移动角色' },
      { icon: '⭐', text: '吃到<b>金色道具</b>获得额外积分' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '障碍物有红色和紫色两种，小心别碰到！收集道具还能触发随机Buff！',
    bg: '#4ECDC4'
  },
  stack3d: {
    icon: '🏗️', name: '3D堆叠乐园', desc: '3D方块左右摆动，点击屏幕将方块放到下方底座上，堆得越高分数越多！',
    ops: [
      { icon: '👆', text: '<b>点击/点击屏幕</b>放下方块' },
      { icon: '🎯', text: '方块需落在下方底座上' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '落点偏移越小，分数加成越高！超过底座宽度游戏结束。',
    bg: '#A8E6CF'
  },
  sort: {
    icon: '🎨', name: '色彩排序', desc: '点击交换两个管子顶部的彩色球，将相同颜色的球排在一起即完成！',
    ops: [
      { icon: '👆', text: '<b>点击</b>一个管子选中' },
      { icon: '🔄', text: '再<b>点击</b>另一管子交换顶部颜色' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '只能移动到空管或相同颜色的顶部哦！完成所有排序可获得大量加分！',
    bg: '#DDA0DD'
  },
  pop: {
    icon: '🎈', name: '气球砰砰', desc: '疯狂点击屏幕上飘起的气球，气球越大点击得分越高！',
    ops: [
      { icon: '👆', text: '<b>快速点击</b>飘起的气球' },
      { icon: '📏', text: '气球<b>越大</b>，得分<b>越高</b>' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '大气球飘得慢但分高，小气球飘得快但分低，看准时机快速点击！',
    bg: '#FF69B4'
  },
  fruitSlice: {
    icon: '🍉', name: '水果切切', desc: '滑动手指切割飞起的水果，果汁四溅超解压！',
    ops: [
      { icon: '👆', text: '<b>滑动</b>手指切割水果' },
      { icon: '🔥', text: '<b>连击</b>切割得分翻倍' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '不要让水果飞出屏幕！连续切割触发连击加成！',
    bg: '#FF6B6B'
  },
  bouncePath: {
    icon: '⚽', name: '弹珠迷宫', desc: '控制弹珠在迷宫中弹跳，收集星星获得高分！',
    ops: [
      { icon: '👆', text: '<b>移动鼠标</b>控制弹珠左右' },
      { icon: '⭐', text: '收集<b>星星</b>获得积分' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '弹珠会自动弹跳，点击给一个向上的力，连续收集星星触发连击！',
    bg: '#4ECDC4'
  },
  neonRun: {
    icon: '🏃', name: '霓虹跑酷', desc: '三道跑酷，左右切换躲避障碍，收集金币！',
    ops: [
      { icon: '👈', text: '<b>左滑/点击左侧</b>向左移动' },
      { icon: '👉', text: '<b>右滑/点击右侧</b>向右移动' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '速度会逐渐加快！躲避障碍和收集金币可以获得分数！',
    bg: '#9B59B6'
  },
  tetris: {
    icon: '🧱', name: '方块消除', desc: '经典俄罗斯方块，消除满行得分，消灭50行获胜！',
    ops: [
      { icon: '⬅️', text: '<b>左右箭头</b>移动方块' },
      { icon: '⬆️', text: '<b>上箭头</b>旋转方块' },
      { icon: '⬇️', text: '<b>下箭头</b>加速下落' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '一次消除多行得分更高！消灭50行即可获胜！',
    bg: '#4D96FF'
  },
  jewelMatch: {
    icon: '💎', name: '宝石消消乐', desc: '点击交换相邻宝石，3个以上相同宝石连线消除！',
    ops: [
      { icon: '👆', text: '<b>点击</b>一个宝石选中' },
      { icon: '🔄', text: '<b>点击</b>相邻宝石交换' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '创造更多匹配可以触发连锁反应，得分翻倍！30秒内没有移动会游戏结束！',
    bg: '#FFD700'
  },
  cookieCut: {
    icon: '🍪', name: '切饼干', desc: '滑动切割飞起的饼干，碎屑四溅超有趣！',
    ops: [
      { icon: '👆', text: '<b>滑动</b>手指切割饼干' },
      { icon: '🔥', text: '<b>连击</b>切割得分翻倍' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '饼干从底部飞起，碰到墙壁会反弹！连续切割触发连击加成！',
    bg: '#D2691E'
  },
  starCatcher: {
    icon: '🧚', name: '星星捕手', desc: '控制小精灵收集星星，躲避乌云袭击！',
    ops: [
      { icon: '👆', text: '<b>移动鼠标</b>控制小精灵' },
      { icon: '⭐', text: '收集<b>星星</b>获得积分' },
      { icon: '☁️', text: '<b>躲避</b>乌云！' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '金色星星分值更高！碰到乌云会扣分，连续收集触发连击！',
    bg: '#FFD700'
  },
  bubbleShooter: {
    icon: '🫧', name: '泡泡龙', desc: '经典泡泡龙射击，3个以上相同颜色消除！',
    ops: [
      { icon: '🎯', text: '<b>移动鼠标</b>瞄准方向' },
      { icon: '👆', text: '<b>点击</b>发射泡泡' },
      { icon: '💥', text: '3个以上<b>相同颜色</b>消除' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '泡泡碰到墙壁会反弹！让漂浮的泡泡落下可以获得额外分数！',
    bg: '#4ECDC4'
  },
  slimeJump: {
    icon: '🟢', name: '史莱姆跳', desc: '控制史莱姆不断往上跳，收集星星得高分！',
    ops: [
      { icon: '👆', text: '<b>移动鼠标</b>左右移动' },
      { icon: '⬆️', text: '跳上<b>弹簧</b>跳得更高' },
      { icon: '⭐', text: '收集<b>星星</b>获得积分' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '弹簧平台可以跳得更高！紫色移动平台要小心！',
    bg: '#6BCB77'
  },
  colorTap: {
    icon: '🎨', name: '颜色Tap', desc: '快速点击匹配颜色，测试你的反应力！',
    ops: [
      { icon: '👆', text: '<b>观察</b>顶部颜色' },
      { icon: '👆', text: '<b>点击</b>下方匹配按钮' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '反应越快得分越高！连续正确匹配触发连击加成！',
    bg: '#FF6B6B'
  },
  stack: {
    icon: '🏗️', name: '叠叠乐', desc: '左右摆动的方块从顶部落下，精准对齐堆叠！',
    ops: [
      { icon: '👆', text: '<b>点击屏幕</b>放下方块' },
      { icon: '🎯', text: '<b>对齐越精准</b>，方块越不缩小' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '偏差小于4像素触发"完美对齐"，方块不会缩小！连续完美对齐获得大量奖励分数！',
    bg: '#A8E6CF'
  },
  spaceShooter: {
    icon: '🔫', name: '太空射击', desc: '驾驶战机消灭外星入侵者，收集道具强化火力！',
    ops: [
      { icon: '👆', text: '<b>点击/长按</b>屏幕连续射击' },
      { icon: '👆', text: '<b>移动</b>飞船躲避敌弹' },
      { icon: '🎁', text: '击杀敌人<b>掉落道具</b>（三连发/扩散弹/回血/炸弹）' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '连续击杀触发连击加成！每5波会出现密集敌群，优先收集三连发和炸弹道具！',
    bg: '#0d1b2a'
  },
  towerDefense: {
    icon: '🏰', name: '星际塔防', desc: '在路径旁放置防御塔，自动攻击沿路前进的外星敌人！',
    ops: [
      { icon: '👆', text: '<b>点击顶部</b>选择塔类型' },
      { icon: '👆', text: '<b>点击空地</b>放置防御塔' },
      { icon: '💰', text: '击杀敌人获得<b>金币</b>建造更多塔' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '激光塔射速快、火炮塔伤害高带范围爆炸、冰冻塔减速敌人！每5波会出现BOSS，火力集中消灭！',
    bg: '#0d1b2a'
  },
  memoryMatch: {
    icon: '🃏', name: '翻牌配对', desc: '翻开卡牌找到相同图案，考验你的记忆力！共5个关卡，难度递增。',
    ops: [
      { icon: '👀', text: '开局<b>预览1.5秒</b>，记住牌面位置' },
      { icon: '👆', text: '<b>点击卡牌</b>翻开，每次翻2张' },
      { icon: '🎯', text: '图案相同则<b>配对消除</b>，不同则翻回' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '关卡开始时有1.5秒预览时间！连续配对成功可获得连击加分。剩余时间会转化为奖励分数，越快通关分越高！',
    bg: '#0f0c29'
  },
  snake: {
    icon: '🐍', name: '贪吃蛇', desc: '经典贪吃蛇！控制小蛇吃食物长大，别撞墙和自己的身体！',
    ops: [
      { icon: '👆', text: '<b>点击屏幕四个方向</b>控制蛇的移动方向' },
      { icon: '🍎', text: '吃到食物<b>蛇身变长</b>，得分增加' },
      { icon: '⚡', text: '<b>金色食物</b>额外加分，<b>蓝色食物</b>短暂加速' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '蛇会越吃越长，空间越来越小！沿边缘行走是经典策略，留够转身空间。金色食物分值更高，不要错过！',
    bg: '#2ECC71'
  },
  whackMole: {
    icon: '🔨', name: '打地鼠', desc: '地鼠从洞里冒出来，快速点击砸中得分！60秒内拿到最高分！',
    ops: [
      { icon: '👆', text: '<b>点击/触摸</b>地鼠立即砸中' },
      { icon: '⭐', text: '<b>金色地鼠</b>得30分，普通地鼠得10分' },
      { icon: '☠️', text: '点击<b>炸弹地鼠</b>会扣100分！' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '金色地鼠出现时间短，要眼疾手快！炸弹地鼠出现时间长，仔细辨认再下手！后期地鼠冒出越来越快，注意力要高度集中！',
    bg: '#8B5E3C'
  },
  racingRun: {
    icon: '🏎️', name: '极速赛车', desc: '在高速公路飙车躲避来车！12种超级道具让你爽到飞起：氮气冲刺、护盾、无敌星魂、时间凝固、狂怒毁灭、幽灵穿墙！',
    ops: [
      { icon: '🖱️', text: '<b>鼠标移动/手指拖拽</b>控制赛车左右' },
      { icon: '⬅️➡️', text: '<b>方向键/WASD</b>切换车道' },
      { icon: '🔥', text: '<b>🔥氮气</b>10秒极速冲刺 | <b>🛡️护盾</b>12秒无敌防御' },
      { icon: '⚡', text: '<b>⚡闪电</b>雷霆清屏 | <b>💣炸弹</b>毁灭轰炸' },
      { icon: '🧲', text: '<b>🧲磁铁</b>15秒全屏吸引 | <b>⭐星魂</b>15秒无敌' },
      { icon: '✨', text: '<b>✨双分</b>20秒双倍得分 | <b>❄️时停</b>12秒减速' },
      { icon: '🚀', text: '<b>🚀狂怒</b>10秒自动追踪炸车 | <b>👻幽灵</b>12秒穿墙无视' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '道具持续时间大幅延长！幽灵模式可以无视碰撞，狂怒模式自动炸车！双倍分数期间连击得分翻倍！速度越快得分越高！',
    bg: '#FF6B00'
  },
  rpgShooter: {
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
  },
  dragonShooter: {
    icon: '🐉', name: '打龙小游戏', desc: '国产爆款！国风卡通风格，自动射击，龙体分裂，越打越多越爽！',
    ops: [
      { icon: '👆', text: '<b>滑动/拖拽</b>控制角色左右移动' },
      { icon: '🔫', text: '<b>自动射击</b>，无需手动点击' },
      { icon: '🐉', text: '龙体分裂！击杀龙段生成小龙' },
      { icon: '🎁', text: '拾取道具：⚔️攻击/⚡射速/🔫多重/💥穿透/❤️回血' },
      { icon: '🎁', text: '关卡升级！选择Buff强化自己' },
    ],
    tipsTitle: '💡 小技巧',
    tips: '连击越多得分越高！优先打龙段制造分裂，获得更多击杀机会。升级时选择合适的Buff，强化自己的战斗风格！',
    bg: '#FFD700'
  },
  rpgShooterTD: {
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
}

export const MOCK_RANK_DATA = [
  { name: '小七', score: 9840 },
  { name: '小明', score: 8720 },
  { name: '游戏王', score: 7650 },
  { name: '小红', score: 6430 },
  { name: '随风', score: 5890 },
  { name: '星星', score: 5210 },
  { name: '夜月', score: 4100 },
  { name: '可可', score: 3850 },
  { name: '阿杰', score: 3520 },
  { name: '乐乐', score: 3100 },
  { name: '小雪', score: 2890 },
  { name: '阿明', score: 2650 },
  { name: '小雨', score: 2410 },
  { name: '小杰', score: 2180 },
]
