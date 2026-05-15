// 游戏核心配置
export const GAME_CONFIG = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  BLOCK_HEIGHT: 28,
  PERFECT_THRESHOLD: 8,
  MIN_WIDTH: 10,
  BASE_SPEED: 0.5,
  SPEED_INCREMENT: 0.002,
  BASE_WIDTH: 0.55,
}

// 彩虹色阶
export const BLOCK_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4ECDC4',
  '#45B7AA', '#4D96FF', '#6C5CE7', '#A29BFE', '#FD79A8',
  '#E17055', '#00CEC9', '#0984E3', '#6C5B7B', '#C44569',
]

// 背景渐变阶段
export const BG_STAGES = [
  { h: 0, top: '#87CEEB', bot: '#E0F7FA' },
  { h: 8, top: '#5DADE2', bot: '#85C1E9' },
  { h: 16, top: '#2E4057', bot: '#5DADE2' },
  { h: 25, top: '#1a1a2e', bot: '#16213e' },
]

// 特殊方块配置
export const SPECIAL_BLOCK_CONFIG: Record<string, { color: string; icon: string; name: string; probability: number }> = {
  bonus: { color: '#FFD700', icon: '⭐', name: '奖励', probability: 0.15 },
  bomb: { color: '#FF4444', icon: '💣', name: '炸弹', probability: 0.05 },
  lucky: { color: '#9B59B6', icon: '🍀', name: '幸运', probability: 0.10 },
  shrink: { color: '#3498DB', icon: '🔻', name: '缩小', probability: 0.08 },
  expand: { color: '#2ECC71', icon: '📐', name: '加宽', probability: 0.10 },
  slow: { color: '#1ABC9C', icon: '🐢', name: '减速', probability: 0.10 },
  freeze: { color: '#00CED1', icon: '❄️', name: '冻结', probability: 0.05 },
  double: { color: '#FF69B4', icon: '💎', name: '双倍', probability: 0.05 },
  shield: { color: '#9400D3', icon: '🛡️', name: '护盾', probability: 0.05 },
  none: { color: '', icon: '', name: '', probability: 0.32 },
}

// 天气配置
export const WEATHER_CONFIG: Record<string, { name: string; icon: string; topColor: string; bottomColor: string }> = {
  sunny: { name: '晴天', icon: '☀️', topColor: '#87CEEB', bottomColor: '#E0F7FA' },
  rainy: { name: '雨天', icon: '🌧️', topColor: '#708090', bottomColor: '#A9A9A9' },
  snowy: { name: '雪天', icon: '❄️', topColor: '#B0C4DE', bottomColor: '#E0E0E0' },
  sunset: { name: '黄昏', icon: '🌅', topColor: '#FF7F50', bottomColor: '#FFB347' },
  night: { name: '夜晚', icon: '🌙', topColor: '#1a1a2e', bottomColor: '#16213e' },
}

// 角色配置
export const CHARACTER_CONFIG: Record<string, { emojis: string[]; name: string }> = {
  cat: { emojis: ['🐱', '😺', '😸', '😻'], name: '猫咪' },
  dog: { emojis: ['🐶', '🐕', '🦮', '🐩'], name: '狗狗' },
  bird: { emojis: ['🐦', '🕊️', '🦅', '🦆'], name: '小鸟' },
  rabbit: { emojis: ['🐰', '🐇', '🐰', '🐇'], name: '兔子' },
  bear: { emojis: ['🐻', '🐻‍❄️', '🐻', '🐻‍❄️'], name: '小熊' },
  fox: { emojis: ['🦊', '🦊', '🦊', '🦊'], name: '狐狸' },
}

// 气泡颜色
export const BUBBLE_COLORS = [
  'rgba(100, 200, 255, 0.5)',
  'rgba(200, 150, 255, 0.5)',
  'rgba(150, 255, 200, 0.5)',
  'rgba(255, 200, 150, 0.5)',
  'rgba(255, 150, 200, 0.5)',
]

// 彩虹颜色
export const RAINBOW_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']