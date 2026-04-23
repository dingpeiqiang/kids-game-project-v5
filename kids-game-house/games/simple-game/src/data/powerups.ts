// 各游戏专属道具系统

// ==================== 极速消除 道具 ====================
export const ELIMINATE_POWERUPS = [
  { id: 'bomb', icon: '💣', name: '炸弹', desc: '消除周围9宫格', color: '#FF4757', duration: 0 },
  { id: 'gravity', icon: '⬇️', name: '重力', desc: '所有方块下落一层', color: '#5352ED', duration: 0 },
  { id: 'shuffle', icon: '🔀', name: '洗牌', desc: '随机打乱方块', color: '#FF6B81', duration: 0 },
  { id: 'double', icon: '⭐', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'clearRow', icon: '🧹', name: '清行', desc: '消除一整行', color: '#2ED573', duration: 0 },
  { id: 'rainbow', icon: '🌈', name: '彩虹', desc: '万能色可消除任意', color: '#FFA502', duration: 10 },
]

// ==================== 轻量躲避 道具 ====================
export const DODGE_POWERUPS = [
  { id: 'shield', icon: '🛡️', name: '护盾', desc: '免疫一次碰撞', color: '#4D96FF', duration: 8 },
  { id: 'magnet', icon: '🧲', name: '磁铁', desc: '吸引附近金币', color: '#FF6B6B', duration: 10 },
  { id: 'double', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'freeze', icon: '❄️', name: '冰冻', desc: '障碍减速60%', color: '#74B9FF', duration: 6 },
  { id: 'bomb', icon: '💣', name: '炸弹', desc: '清除所有障碍', color: '#FF4757', duration: 0 },
  { id: 'ghost', icon: '👻', name: '幽灵', desc: '无敌穿墙', color: '#A855F7', duration: 5 },
  { id: 'heart', icon: '❤️', name: '生命', desc: '+1额外生命', color: '#FF6B81', duration: 0 },
  { id: 'star', icon: '🌟', name: '星星', desc: '超长双倍+50分', color: '#FFD700', duration: 15 },
]

// ==================== 色彩排序 道具 ====================
export const SORT_POWERUPS = [
  { id: 'swap', icon: '🔄', name: '交换', desc: '交换两个管子', color: '#5352ED', duration: 0 },
  { id: 'fast', icon: '⬇️', name: '快速', desc: '快速下落', color: '#FF6B81', duration: 5 },
  { id: 'double', icon: '⭐', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'bomb', icon: '💣', name: '清空', desc: '清空一个管子', color: '#FF4757', duration: 0 },
  { id: 'clearTop', icon: '🧹', name: '清顶', desc: '消除顶部颜色', color: '#2ED573', duration: 0 },
  { id: 'pause', icon: '⏸️', name: '暂停', desc: '暂停计时5秒', color: '#4D96FF', duration: 0 },
]

// ==================== 气球砰砰 道具 ====================
export const POP_POWERUPS = [
  { id: 'slow', icon: '⏱️', name: '减速', desc: '气球下降变慢', color: '#74B9FF', duration: 8 },
  { id: 'double', icon: '⭐', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'mega', icon: '💣', name: '核弹', desc: '全部消除小气球', color: '#FF4757', duration: 0 },
  { id: 'fire', icon: '🔥', name: '火焰', desc: '消除范围内气球', color: '#FF6B81', duration: 0 },
  { id: 'freeze', icon: '❄️', name: '冰冻', desc: '暂停所有气球', color: '#A8E6CF', duration: 5 },
  { id: 'magnet', icon: '🧲', name: '磁铁', desc: '吸引附近气球', color: '#A855F7', duration: 8 },
]

// ==================== 3D堆叠乐园 道具 ====================
export const STACK3D_POWERUPS = [
  { id: 'pause', icon: '⏸️', name: '暂停', desc: '暂停下落', color: '#4D96FF', duration: 3 },
  { id: 'shift', icon: '↔️', name: '位移', desc: '改变下落方向', color: '#5352ED', duration: 0 },
  { id: 'rotate', icon: '🔄', name: '旋转', desc: '旋转方块90度', color: '#FF6B81', duration: 0 },
  { id: 'double', icon: '⭐', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'safe', icon: '🛡️', name: '安全', desc: '更大容错空间', color: '#2ED573', duration: 10 },
  { id: 'align', icon: '💣', name: '对齐', desc: '自动对齐方块', color: '#FFD700', duration: 0 },
]

// ==================== 3D光影匹配 道具 ====================
export const TOWER3D_POWERUPS = [
  { id: 'rotate', icon: '🔄', name: '旋转', desc: '自动旋转视角', color: '#5352ED', duration: 5 },
  { id: 'pause', icon: '⏸️', name: '暂停', desc: '暂停计时', color: '#4D96FF', duration: 0 },
  { id: 'double', icon: '⭐', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'hint', icon: '👁️', name: '提示', desc: '高亮正确答案', color: '#2ED573', duration: 0 },
  { id: 'simplify', icon: '🧩', name: '简化', desc: '减少选项', color: '#FF6B81', duration: 0 },
  { id: 'zoom', icon: '💡', name: '放大', desc: '放大形状细节', color: '#FFD700', duration: 8 },
]

// ==================== 贪吃蛇 道具 ====================
export const SNAKE_POWERUPS = [
  { id: 'speed', icon: '⚡', name: '加速', desc: '移动速度提升', color: '#FFD700', duration: 5 },
  { id: 'slow', icon: '🐌', name: '减速', desc: '移动速度降低', color: '#74B9FF', duration: 5 },
  { id: 'shrink', icon: '✂️', name: '缩短', desc: '蛇身缩短3节', color: '#FF6B6B', duration: 0 },
  { id: 'score2x', icon: '✨', name: '双倍分数', desc: '得分翻倍', color: '#FFD93D', duration: 10 },
  { id: 'invincible', icon: '🛡️', name: '无敌', desc: '撞墙不死', color: '#4D96FF', duration: 8 },
  { id: 'magnet', icon: '🧲', name: '磁铁', desc: '吸引食物', color: '#A855F7', duration: 8 },
]

// ==================== 俄罗斯方块 道具 ====================
export const TETRIS_POWERUPS = [
  { id: 'clear_line', icon: '🧹', name: '消行', desc: '消除底部一行', color: '#2ED573', duration: 0 },
  { id: 'clear_4', icon: '💣', name: 'Tetris', desc: '消除四行', color: '#FF4757', duration: 0 },
  { id: 'hold', icon: '📦', name: '暂存', desc: '暂存当前方块', color: '#5352ED', duration: 0 },
  { id: 'preview', icon: '👁️', name: '预览', desc: '显示下一个', color: '#4D96FF', duration: 10 },
  { id: 'slow_drop', icon: '🐌', name: '缓降', desc: '下落速度减慢', color: '#74B9FF', duration: 8 },
  { id: 'score2x', icon: '✨', name: '双倍分数', desc: '得分翻倍', color: '#FFD93D', duration: 10 },
]

// ==================== 宝石匹配 道具 ====================
export const JEWEL_MATCH_POWERUPS = [
  { id: 'bomb', icon: '💣', name: '炸弹', desc: '消除周围宝石', color: '#FF4757', duration: 0 },
  { id: 'line_h', icon: '➡️', name: '横排', desc: '消除整行', color: '#5352ED', duration: 0 },
  { id: 'line_v', icon: '⬇️', name: '竖排', desc: '消除整列', color: '#FF6B81', duration: 0 },
  { id: 'color_bomb', icon: '🎨', name: '彩弹', desc: '消除同色宝石', color: '#FFD93D', duration: 0 },
  { id: 'shuffle', icon: '🔄', name: '重排', desc: '重新排列', color: '#2ED573', duration: 0 },
  { id: 'score2x', icon: '✨', name: '双倍分数', desc: '得分翻倍', color: '#FFD700', duration: 10 },
]

// ==================== 记忆翻牌 道具 ====================
export const MEMORY_MATCH_POWERUPS = [
  { id: 'peek', icon: '👁️', name: '偷看', desc: '查看所有牌3秒', color: '#4D96FF', duration: 3 },
  { id: 'freeze', icon: '⏸️', name: '冻结', desc: '暂停计时5秒', color: '#74B9FF', duration: 5 },
  { id: 'hint', icon: '💡', name: '提示', desc: '显示一对牌', color: '#FFD93D', duration: 0 },
  { id: 'time_plus', icon: '⏰', name: '加时', desc: '增加10秒', color: '#2ED573', duration: 0 },
  { id: 'score2x', icon: '✨', name: '双倍分数', desc: '下次得分翻倍', color: '#FFD700', duration: 0 },
  { id: 'auto_match', icon: '🎯', name: '自动', desc: '自动匹配一对', color: '#FF6B6B', duration: 0 },
]

// ==================== 切水果 道具 ====================
export const FRUIT_SLICE_POWERUPS = [
  { id: 'freeze', icon: '❄️', name: '冰冻', desc: '时间暂停3秒', color: '#74B9FF', duration: 3 },
  { id: 'frenzy', icon: '🔥', name: '狂热', desc: '得分翻倍', color: '#FF6B6B', duration: 8 },
  { id: 'multi', icon: '✌️', name: '多重', desc: '一刀切多个', color: '#FFD93D', duration: 10 },
  { id: 'bomb', icon: '💣', name: '炸弹', desc: '清除屏幕炸弹', color: '#FF4757', duration: 0 },
  { id: 'life', icon: '❤️', name: '生命', desc: '+1生命', color: '#FF69B4', duration: 0 },
  { id: 'magnet', icon: '🧲', name: '磁铁', desc: '吸引水果', color: '#A855F7', duration: 8 },
]

// ==================== 饼干切割 道具 ====================
export const COOKIE_CUT_POWERUPS = [
  { id: 'perfect', icon: '⭐', name: '完美', desc: '自动完美切割', color: '#FFD700', duration: 8 },
  { id: 'slow', icon: '🐌', name: '减速', desc: '饼干移动减速', color: '#74B9FF', duration: 5 },
  { id: 'double', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD93D', duration: 8 },
  { id: 'auto', icon: '🤖', name: '自动', desc: '自动切割3次', color: '#2ED573', duration: 0 },
  { id: 'time_plus', icon: '⏰', name: '加时', desc: '增加5秒', color: '#4D96FF', duration: 0 },
  { id: 'combo', icon: '🔥', name: '连击', desc: '连击数+3', color: '#FF6B6B', duration: 0 },
]

// ==================== 颜色点击 道具 ====================
export const COLOR_TAP_POWERUPS = [
  { id: 'freeze', icon: '⏸️', name: '冻结', desc: '暂停倒计时', color: '#74B9FF', duration: 5 },
  { id: 'hint', icon: '💡', name: '提示', desc: '高亮正确颜色', color: '#FFD93D', duration: 0 },
  { id: 'time_plus', icon: '⏰', name: '加时', desc: '增加5秒', color: '#2ED573', duration: 0 },
  { id: 'score2x', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'clear', icon: '🧹', name: '清除', desc: '清除错误选项', color: '#FF6B6B', duration: 0 },
  { id: 'auto', icon: '🎯', name: '自动', desc: '自动点击3次', color: '#A855F7', duration: 0 },
]

// ==================== 泡泡射击 道具 ====================
export const BUBBLE_SHOOTER_POWERUPS = [
  { id: 'aim', icon: '🎯', name: '瞄准', desc: '显示弹道路线', color: '#4D96FF', duration: 8 },
  { id: 'fire', icon: '🔥', name: '火球', desc: '穿透消除', color: '#FF6B6B', duration: 0 },
  { id: 'rainbow', icon: '🌈', name: '彩虹', desc: '万能颜色', color: '#FFD93D', duration: 0 },
  { id: 'drop', icon: '⬇️', name: '坠落', desc: '消除顶部一行', color: '#2ED573', duration: 0 },
  { id: 'swap', icon: '🔄', name: '交换', desc: '交换当前泡泡', color: '#5352ED', duration: 0 },
  { id: 'bomb', icon: '💣', name: '炸弹', desc: '范围爆炸', color: '#FF4757', duration: 0 },
]

// ==================== 弹跳路径 道具 ====================
export const BOUNCE_PATH_POWERUPS = [
  { id: 'slow', icon: '🐌', name: '减速', desc: '球速减慢', color: '#74B9FF', duration: 5 },
  { id: 'multi', icon: '⚽', name: '多球', desc: '增加一个球', color: '#FFD93D', duration: 0 },
  { id: 'big', icon: '🔵', name: '大球', desc: '球体变大', color: '#4D96FF', duration: 8 },
  { id: 'sticky', icon: '🧲', name: '粘性', desc: '挡板粘球', color: '#A855F7', duration: 8 },
  { id: 'laser', icon: '⚡', name: '激光', desc: '发射激光', color: '#FF6B6B', duration: 5 },
  { id: 'extra_life', icon: '❤️', name: '生命', desc: '+1生命', color: '#FF69B4', duration: 0 },
]

// ==================== 史莱姆跳跃 道具 ====================
export const SLIME_JUMP_POWERUPS = [
  { id: 'jump_boost', icon: '🚀', name: '跳高', desc: '跳跃高度增加', color: '#FFD93D', duration: 8 },
  { id: 'shield', icon: '🛡️', name: '护盾', desc: '免疫一次伤害', color: '#4D96FF', duration: 0 },
  { id: 'magnet', icon: '🧲', name: '磁铁', desc: '吸引金币', color: '#A855F7', duration: 8 },
  { id: 'double', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD700', duration: 8 },
  { id: 'slow_fall', icon: '🪶', name: '轻羽', desc: '缓慢下落', color: '#74B9FF', duration: 5 },
  { id: 'invincible', icon: '⭐', name: '无敌', desc: '短暂无敌', color: '#FF6B6B', duration: 5 },
]

// ==================== 堆叠游戏 道具 ====================
export const STACK_POWERUPS = [
  { id: 'perfect', icon: '⭐', name: '完美', desc: '下次完美对齐', color: '#FFD700', duration: 0 },
  { id: 'widen', icon: '↔️', name: '加宽', desc: '方块变宽', color: '#2ED573', duration: 8 },
  { id: 'slow', icon: '🐌', name: '减速', desc: '移动减速', color: '#74B9FF', duration: 5 },
  { id: 'undo', icon: '↩️', name: '撤销', desc: '撤销上一次', color: '#5352ED', duration: 0 },
  { id: 'double', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD93D', duration: 8 },
  { id: 'stable', icon: '🛡️', name: '稳定', desc: '容错率提升', color: '#4D96FF', duration: 10 },
]

// ==================== 塔防游戏 道具 ====================
export const TOWER_DEFENSE_POWERUPS = [
  { id: 'nuke', icon: '☢️', name: '核弹', desc: '全屏伤害', color: '#FF4757', duration: 0 },
  { id: 'freeze', icon: '❄️', name: '冰冻', desc: '冻结敌人5秒', color: '#74B9FF', duration: 5 },
  { id: 'boost', icon: '⚡', name: '加速', desc: '塔攻速提升', color: '#FFD93D', duration: 10 },
  { id: 'repair', icon: '🔧', name: '修复', desc: '修复所有塔', color: '#2ED573', duration: 0 },
  { id: 'money', icon: '💰', name: '金钱', desc: '+100金币', color: '#FFD700', duration: 0 },
  { id: 'slow', icon: '🕸️', name: '蛛网', desc: '敌人减速', color: '#A855F7', duration: 8 },
]

// ==================== 打地鼠 道具 ====================
export const WHACK_MOLE_POWERUPS = [
  { id: 'hammer', icon: '🔨', name: '金锤', desc: '一击必杀', color: '#FFD700', duration: 8 },
  { id: 'freeze', icon: '⏸️', name: '冻结', desc: '地鼠定住3秒', color: '#74B9FF', duration: 3 },
  { id: 'multi', icon: '✌️', name: '多重', desc: '同时出现更多', color: '#FF6B6B', duration: 8 },
  { id: 'score2x', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD93D', duration: 8 },
  { id: 'auto', icon: '🤖', name: '自动', desc: '自动打击3次', color: '#2ED573', duration: 0 },
  { id: 'time_plus', icon: '⏰', name: '加时', desc: '增加5秒', color: '#4D96FF', duration: 0 },
]

// ==================== 霓虹跑酷 道具 ====================
export const NEON_RUN_POWERUPS = [
  { id: 'shield', icon: '🛡️', name: '护盾', desc: '免疫一次碰撞', color: '#4D96FF', duration: 0 },
  { id: 'magnet', icon: '🧲', name: '磁铁', desc: '吸引金币', color: '#A855F7', duration: 8 },
  { id: 'jetpack', icon: '🚀', name: '喷气', desc: '飞行5秒', color: '#FF6B6B', duration: 5 },
  { id: 'double', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD93D', duration: 8 },
  { id: 'slow', icon: '🐌', name: '减速', desc: '游戏减速', color: '#74B9FF', duration: 5 },
  { id: 'invincible', icon: '⭐', name: '无敌', desc: '短暂无敌', color: '#FFD700', duration: 5 },
]

// ==================== 星星收集 道具 ====================
export const STAR_CATCHER_POWERUPS = [
  { id: 'magnet', icon: '🧲', name: '磁铁', desc: '吸引星星', color: '#A855F7', duration: 8 },
  { id: 'basket', icon: '🧺', name: '大篮', desc: '篮子变大', color: '#2ED573', duration: 8 },
  { id: 'slow', icon: '🐌', name: '减速', desc: '星星减速', color: '#74B9FF', duration: 5 },
  { id: 'double', icon: '✨', name: '双倍', desc: '得分翻倍', color: '#FFD93D', duration: 8 },
  { id: 'life', icon: '❤️', name: '生命', desc: '+1生命', color: '#FF69B4', duration: 0 },
  { id: 'bomb', icon: '💣', name: '炸弹', desc: '清除炸弹', color: '#FF4757', duration: 0 },
]

// ==================== 星际猎手 道具 ====================
export const RPG_SHOOTER_POWERUPS = [
  { id: 'nuke',     icon: '☢️',  name: '核弹',   desc: '全屏爆炸消灭所有敌人', color: '#FF4757', duration: 0 },
  { id: 'laser',    icon: '⚡',  name: '激光弹幕', desc: '3秒内每帧发射8方向子弹', color: '#FFD700', duration: 3 },
  { id: 'freeze',   icon: '❄️',  name: '时间冻结', desc: '冻结所有敌人4秒',       color: '#74B9FF', duration: 4 },
  { id: 'shield',   icon: '🛡️', name: '护盾',    desc: '免疫3次伤害',            color: '#4D96FF', duration: 0 },
  { id: 'score2x',  icon: '✨',  name: '双倍分数', desc: '10秒内所有得分×2',       color: '#FFD93D', duration: 10 },
  { id: 'clone',    icon: '👾',  name: '分身弹',   desc: '每颗子弹额外分裂2颗',    color: '#A855F7', duration: 5 },
]

// ==================== 通用道具映射 ====================
export const GAME_POWERUPS_MAP: Record<string, any[]> = {
  eliminate: ELIMINATE_POWERUPS,
  dodge: DODGE_POWERUPS,
  sort: SORT_POWERUPS,
  pop: POP_POWERUPS,
  stack3d: STACK3D_POWERUPS,
  tower3d: TOWER3D_POWERUPS,
  snake: SNAKE_POWERUPS,
  tetris: TETRIS_POWERUPS,
  jewelMatch: JEWEL_MATCH_POWERUPS,
  memoryMatch: MEMORY_MATCH_POWERUPS,
  fruitSlice: FRUIT_SLICE_POWERUPS,
  cookieCut: COOKIE_CUT_POWERUPS,
  colorTap: COLOR_TAP_POWERUPS,
  bubbleShooter: BUBBLE_SHOOTER_POWERUPS,
  bouncePath: BOUNCE_PATH_POWERUPS,
  slimeJump: SLIME_JUMP_POWERUPS,
  stack: STACK_POWERUPS,
  towerDefense: TOWER_DEFENSE_POWERUPS,
  whackMole: WHACK_MOLE_POWERUPS,
  neonRun: NEON_RUN_POWERUPS,
  starCatcher: STAR_CATCHER_POWERUPS,
  rpgShooter: RPG_SHOOTER_POWERUPS,
}

// ==================== 道具系统工具函数 ====================

/**
 * 获取指定游戏的道具配置
 */
export function getGamePowerups(gameId: string): any[] {
  return GAME_POWERUPS_MAP[gameId] || []
}

/**
 * 根据游戏时间获取已解锁的道具
 */
export function getUnlockedPowerups(gameId: string, elapsedTime: number): any[] {
  const powerups = getGamePowerups(gameId)
  // 简单策略：每15秒解锁一个新道具
  const unlockCount = Math.min(
    2 + Math.floor(elapsedTime / 15000),
    powerups.length
  )
  return powerups.slice(0, unlockCount)
}

/**
 * 随机选择一个已解锁的道具
 */
export function getRandomPowerup(gameId: string, elapsedTime: number): any | null {
  const unlocked = getUnlockedPowerups(gameId, elapsedTime)
  if (unlocked.length === 0) return null
  return unlocked[Math.floor(Math.random() * unlocked.length)]
}
