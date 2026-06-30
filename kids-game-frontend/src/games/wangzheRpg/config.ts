import type { SkillConfig, LaneType, LanePathPoint } from './types'

/** 分路路径点：小兵沿这些点移动 */
export const LANE_PATHS: Record<LaneType, { player: LanePathPoint[]; enemy: LanePathPoint[] }> = {
  top: {
    player: [
      { x: 50, y: 110 }, { x: 250, y: 110 }, { x: 450, y: 110 },
      { x: 650, y: 110 }, { x: 850, y: 110 }, { x: 950, y: 110 },
    ],
    enemy: [
      { x: 950, y: 110 }, { x: 850, y: 110 }, { x: 650, y: 110 },
      { x: 450, y: 110 }, { x: 250, y: 110 }, { x: 50, y: 110 },
    ],
  },
  mid: {
    player: [
      { x: 50, y: 270 }, { x: 250, y: 270 }, { x: 450, y: 270 },
      { x: 650, y: 270 }, { x: 850, y: 270 }, { x: 950, y: 270 },
    ],
    enemy: [
      { x: 950, y: 270 }, { x: 850, y: 270 }, { x: 650, y: 270 },
      { x: 450, y: 270 }, { x: 250, y: 270 }, { x: 50, y: 270 },
    ],
  },
  bot: {
    player: [
      { x: 50, y: 430 }, { x: 250, y: 430 }, { x: 450, y: 430 },
      { x: 650, y: 430 }, { x: 850, y: 430 }, { x: 950, y: 430 },
    ],
    enemy: [
      { x: 950, y: 430 }, { x: 850, y: 430 }, { x: 650, y: 430 },
      { x: 450, y: 430 }, { x: 250, y: 430 }, { x: 50, y: 430 },
    ],
  },
}

export const GAME_CONFIG = {
  /** 游戏世界参考宽度 */
  WORLD_WIDTH: 1000,
  /** 游戏世界参考高度 */
  WORLD_HEIGHT: 540,

  /** 玩家初始血量 */
  PLAYER_HP: 1000,
  /** 玩家普攻伤害 */
  PLAYER_ATTACK_DAMAGE: 80,
  /** 玩家移动速度 */
  PLAYER_SPEED: 4,
  /** 玩家碰撞体大小 */
  PLAYER_SIZE: 28,
  /** 普攻攻击范围 */
  PLAYER_ATTACK_RANGE: 60,

  /** 敌方初始血量 */
  ENEMY_HP: 1000,
  /** 敌方普攻伤害 */
  ENEMY_ATTACK_DAMAGE: 60,
  /** 敌方移动速度 */
  ENEMY_SPEED: 3,
  /** 敌方碰撞体大小 */
  ENEMY_SIZE: 28,
  /** 敌方攻击间隔 (ms) */
  ENEMY_ATTACK_INTERVAL: 1500,
  /** 敌方巡逻检测范围 */
  ENEMY_CHASE_RANGE: 200,
  /** 敌方攻击范围 */
  ENEMY_ATTACK_RANGE: 60,

  /** 复活时间 (ms) */
  RESPAWN_TIME: 3000,
  /** 受击闪烁时间 (ms) */
  HIT_FLASH_DURATION: 300,
  /** 对局时长 (ms) */
  GAME_DURATION: 300000,
  /** 攻击动画时长 (ms) */
  ATTACK_ANIM_DURATION: 300,

  /** 摇杆外圈半径 */
  JOYSTICK_OUTER_RADIUS: 60,
  /** 摇杆内圈最大滑动半径 */
  JOYSTICK_INNER_MAX_RADIUS: 35,
  /** 摇杆死区 */
  JOYSTICK_DEAD_ZONE: 0.1,

  /** 技能按键半径 */
  SKILL_BTN_RADIUS: 28,
  /** 普攻按键半径 */
  ATTACK_BTN_RADIUS: 34,

  /** 粒子最大数量 */
  PARTICLE_MAX: 200,

  // ========== 小兵配置 ==========
  /** 小兵基础血量 */
  MINION_HP: 300,
  /** 小兵攻击力 */
  MINION_ATTACK_DAMAGE: 25,
  /** 小兵移动速度 */
  MINION_SPEED: 1.2,
  /** 小兵攻击间隔 (ms) */
  MINION_ATTACK_INTERVAL: 1000,
  /** 小兵攻击范围 */
  MINION_ATTACK_RANGE: 40,
  /** 小兵检测范围 */
  MINION_DETECT_RANGE: 120,
  /** 小兵波次间隔 (ms) */
  MINION_WAVE_INTERVAL: 20000,
  /** 每路每波小兵数量 */
  MINION_PER_WAVE: 2,
  /** 小兵碰撞体大小 */
  MINION_SIZE: 16,

  // ========== 防御塔配置 ==========
  /** 外塔(T1)血量 */
  TOWER_T1_HP: 1500,
  /** 内塔(T2)血量 */
  TOWER_T2_HP: 2000,
  /** 高地塔(T3)血量 */
  TOWER_T3_HP: 2500,
  /** 基地血量 */
  TOWER_BASE_HP: 4000,
  /** 防御塔攻击力 */
  TOWER_ATTACK_DAMAGE: 80,
  /** 防御塔攻击范围 */
  TOWER_ATTACK_RANGE: 130,
  /** 防御塔攻击间隔 (ms) */
  TOWER_ATTACK_INTERVAL: 1200,
  /** 防御塔大小 */
  TOWER_SIZE: 32,

  // ========== 野怪配置 ==========
  /** 小型野怪血量 */
  CREEP_SMALL_HP: 400,
  /** 中型野怪血量 */
  CREEP_MEDIUM_HP: 800,
  /** Roshan血量 */
  CREEP_ROSHAN_HP: 3000,
  /** 野怪攻击力 */
  CREEP_ATTACK_DAMAGE: 30,
  /** 野怪攻击间隔 */
  CREEP_ATTACK_INTERVAL: 1500,
  /** 野怪攻击范围 */
  CREEP_ATTACK_RANGE: 50,
  /** 野怪检测范围 */
  CREEP_AGGRO_RANGE: 120,
  /** 野怪重生时间 */
  CREEP_RESPAWN_TIME: 30000,
  /** Roshan重生时间 */
  ROSHAN_RESPAWN_TIME: 120000,

  // ========== 经验/金币配置 ==========
  /** 升级所需经验基数 */
  EXP_BASE: 100,
  /** 每级经验增长系数 */
  EXP_GROWTH: 1.5,
  /** 击杀小兵经验 */
  MINION_EXP: 30,
  /** 击杀小兵金币 */
  MINION_GOLD: 25,
  /** 击杀敌方英雄经验 */
  ENEMY_EXP: 200,
  /** 击杀敌方英雄金币 */
  ENEMY_GOLD: 150,
  /** 击杀小型野怪经验 */
  CREEP_SMALL_EXP: 40,
  /** 击杀小型野怪金币 */
  CREEP_SMALL_GOLD: 30,
  /** 击杀中型野怪经验 */
  CREEP_MEDIUM_EXP: 80,
  /** 击杀中型野怪金币 */
  CREEP_MEDIUM_GOLD: 60,
  /** 击杀Roshan经验 */
  CREEP_ROSHAN_EXP: 300,
  /** 击杀Roshan金币 */
  CREEP_ROSHAN_GOLD: 200,
  /** 摧毁防御塔金币（全队） */
  TOWER_GOLD: 150,
  /** 每级血量成长 */
  LEVEL_HP_BONUS: 100,
  /** 每级攻击力成长 */
  LEVEL_ATK_BONUS: 8,
  /** 最大等级 */
  MAX_LEVEL: 15,

  /** 屏幕震动持续时间 (ms) */
  SCREEN_SHAKE_DURATION: 200,
  /** 屏幕震动强度 */
  SCREEN_SHAKE_INTENSITY: 4,

  /** 1/2技能特效持续时间 (ms) */
  SKILL_EFFECT_DURATION_12: 300,
  /** 3技能特效持续时间 (ms) */
  SKILL_EFFECT_DURATION_3: 500,
  /** 1/2技能特效半径 */
  SKILL_RADIUS_12: 50,
  /** 3技能特效半径 */
  SKILL_RADIUS_3: 100,
}

/** 技能配置 */
export const SKILL_CONFIG: Record<number, SkillConfig> = {
  1: { id: 1, damage: 150, radius: GAME_CONFIG.SKILL_RADIUS_12, duration: GAME_CONFIG.SKILL_EFFECT_DURATION_12, cooldown: 5000, color: '#ffd700', label: '1' },
  2: { id: 2, damage: 150, radius: GAME_CONFIG.SKILL_RADIUS_12, duration: GAME_CONFIG.SKILL_EFFECT_DURATION_12, cooldown: 5000, color: '#ffd700', label: '2' },
  3: { id: 3, damage: 250, radius: GAME_CONFIG.SKILL_RADIUS_3, duration: GAME_CONFIG.SKILL_EFFECT_DURATION_3, cooldown: 15000, color: '#ff8c00', label: '3' },
}

/** 防御塔布局配置 */
export interface TowerLayout {
  x: number
  y: number
  tier: number
  lane: LaneType | 'base'
  team: 'player' | 'enemy'
}

export const TOWER_LAYOUTS: TowerLayout[] = [
  // ===== 玩家方（左下）=====
  // 上路
  { x: 160, y: 110, tier: 1, lane: 'top', team: 'player' },
  { x: 320, y: 110, tier: 2, lane: 'top', team: 'player' },
  { x: 480, y: 110, tier: 3, lane: 'top', team: 'player' },
  // 中路
  { x: 160, y: 270, tier: 1, lane: 'mid', team: 'player' },
  { x: 320, y: 270, tier: 2, lane: 'mid', team: 'player' },
  { x: 480, y: 270, tier: 3, lane: 'mid', team: 'player' },
  // 下路
  { x: 160, y: 430, tier: 1, lane: 'bot', team: 'player' },
  { x: 320, y: 430, tier: 2, lane: 'bot', team: 'player' },
  { x: 480, y: 430, tier: 3, lane: 'bot', team: 'player' },
  // 基地
  { x: 580, y: 270, tier: 4, lane: 'base', team: 'player' },

  // ===== 敌方方（右上）=====
  // 上路
  { x: 840, y: 110, tier: 1, lane: 'top', team: 'enemy' },
  { x: 680, y: 110, tier: 2, lane: 'top', team: 'enemy' },
  { x: 520, y: 110, tier: 3, lane: 'top', team: 'enemy' },
  // 中路
  { x: 840, y: 270, tier: 1, lane: 'mid', team: 'enemy' },
  { x: 680, y: 270, tier: 2, lane: 'mid', team: 'enemy' },
  { x: 520, y: 270, tier: 3, lane: 'mid', team: 'enemy' },
  // 下路
  { x: 840, y: 430, tier: 1, lane: 'bot', team: 'enemy' },
  { x: 680, y: 430, tier: 2, lane: 'bot', team: 'enemy' },
  { x: 520, y: 430, tier: 3, lane: 'bot', team: 'enemy' },
  // 基地
  { x: 420, y: 270, tier: 4, lane: 'base', team: 'enemy' },
]

/** 野怪营地布局 */
export interface CreepCampLayout {
  x: number
  y: number
  type: 'small' | 'medium'
}

export const CREEP_CAMPS: CreepCampLayout[] = [
  // 玩家方野区（左下）
  { x: 100, y: 190, type: 'small' },
  { x: 260, y: 190, type: 'medium' },
  { x: 100, y: 350, type: 'small' },
  { x: 260, y: 350, type: 'medium' },
  // 敌方方野区（右上）
  { x: 900, y: 190, type: 'small' },
  { x: 740, y: 190, type: 'medium' },
  { x: 900, y: 350, type: 'small' },
  { x: 740, y: 350, type: 'medium' },
]

/** Roshan 位置（地图中央河道） */
export const ROSHAN_POS = { x: 500, y: 270 }