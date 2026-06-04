// RPG Shooter 游戏配置常量

export const GAME_CONFIG = {
  // 画布尺寸
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  
  // 游戏时长（秒）
  GAME_DURATION: 120,
  
  // 玩家基础属性
  PLAYER_SPEED: 4.5,
  BULLET_SPEED: 8,
  SHOOT_CD: 200,
  
  // 敌人生成
  ENEMY_BASE_SPEED: 1.2,
  STAR_COUNT: 80,
  
  // 掉落物基础概率（优化后 - 降低掉落率，提高珍贵度）
  DROP_CHANCE_HP: 0.15,      // 25% → 15%
  DROP_CHANCE_EXP: 0.20,     // 30% → 20%
  DROP_CHANCE_POWERUP: 0.12, // 28% → 12%
  // 总掉落率: 83% → 47%
  
  // 连击系统
  COMBO_MAX_MULTIPLIER: 10,
  COMBO_TIMER: 3,
  
  // 能量系统（优化后 - 降低衰减速度）
  MAX_ENERGY: 100,
  AUTO_COLLECT_RADIUS: 60,
  ENERGY_DECAY_RATE: 1, // 2 → 1 (每秒衰减1点，更容易维持满能量)
  
  // 视觉效果
  PARTICLE_LIFE: 1.2,
  SHAKE_DECAY: 0.9,
  FLASH_DECAY: 2,
} as const;

// 玩家等级属性表
export const LEVEL_STATS = [
  { hp: 6, atk: 1, speed: 4.5 },   // Lv1
  { hp: 7, atk: 2, speed: 4.5 },   // Lv2
  { hp: 9, atk: 2, speed: 5 },     // Lv3
  { hp: 11, atk: 3, speed: 5 },    // Lv4
  { hp: 13, atk: 4, speed: 5.5 },  // Lv5
  { hp: 16, atk: 5, speed: 5.5 },  // Lv6
  { hp: 19, atk: 6, speed: 6 },    // Lv7
  { hp: 23, atk: 7, speed: 6 },    // Lv8
  { hp: 27, atk: 9, speed: 6.5 },  // Lv9
  { hp: 32, atk: 11, speed: 7 },   // Lv10 Max
] as const;

// 敌人类型定义
export const ENEMY_TYPES = [
  { w: 22, h: 22, hp: 1, score: 10, exp: 8, color: '#FF6B6B', shape: 'circle', speedMult: 1.2 },
  { w: 26, h: 26, hp: 3, score: 25, exp: 15, color: '#FFA502', shape: 'diamond', speedMult: 1.0 },
  { w: 30, h: 30, hp: 6, score: 60, exp: 35, color: '#FF4757', shape: 'hex', speedMult: 0.8 },
  { w: 38, h: 38, hp: 12, score: 150, exp: 100, color: '#9B59B6', shape: 'boss', speedMult: 0.6 },
  { w: 28, h: 28, hp: 4, score: 40, exp: 25, color: '#00E5FF', shape: 'fast', speedMult: 1.8 },
  { w: 34, h: 34, hp: 8, score: 80, exp: 50, color: '#FFD93D', shape: 'tank', speedMult: 0.5 },
] as const;

// 掉落物类型
export const DROP_TYPES = [
  { type: 'hp', icon: '💚', color: '#00E676', chance: 0.25 },
  { type: 'exp', icon: '✨', color: '#FFD700', chance: 0.30 },
  { type: 'powerup', icon: '📦', color: '#A855F7', chance: 0.28 },
] as const;
