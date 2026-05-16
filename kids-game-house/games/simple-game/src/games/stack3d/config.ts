export const STACK_COLORS = [
  0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0x9B59B6, 
  0xFF8E53, 0x6BCB77, 0x4D96FF, 0xFF69B4, 
  0x87CEEB, 0xF38181, 0xAA96DA, 0xFCBAD3,
  0xFFE66D, 0x95E1D3, 0xF093FB, 0xF5576C
]

export const GAME_CONFIG = {
  blockSize: { width: 1.5, height: 0.5, depth: 1.5 },
  fallHeight: 2,
  moveSpeed: 0.022,
  perfectThreshold: 0.2,
  validThreshold: 2.8,
  perfectScore: 35,
  normalScore: 12,
  comboMultiplier: 60,
  comboThreshold: 3,
  maxHeight: 10,
  maxStackHeight: 25, // 最大堆叠层数限制
  stabilityThreshold: 0.15, // 稳定性阈值，低于此值会倒塌
  tiltSensitivity: 0.08 // 倾斜敏感度，越高越容易倒
}

export const COLORS = {
  background: 0x0f0f1a,
  base: 0x4ECDC4,
  baseEmissive: 0x2ECDC4,
  star: 0xFFFFFF,
  goldStar: 0xFFFF00
}