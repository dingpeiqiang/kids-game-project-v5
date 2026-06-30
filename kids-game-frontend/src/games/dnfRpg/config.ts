// ============ 移动端检测 ============
export function isMobileDevice(): boolean {
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function isLandscapeMode(): boolean {
  return document.getElementById('game-layer')?.classList.contains('force-landscape') === true
}

// ============ 画布与布局 - DNF风格宽屏配置 ============
export const CANVAS_WIDTH = 720
export const CANVAS_HEIGHT = 440
export const LEFT_PANEL_WIDTH = 80
export const RIGHT_PANEL_WIDTH = 80
export const TOTAL_WIDTH = CANVAS_WIDTH + LEFT_PANEL_WIDTH + RIGHT_PANEL_WIDTH
export const HUD_HEIGHT = 60

// ============ 物理常量 ============
export const GRAVITY = 0.42
export const FRICTION = 0.93
// DNF风格：增加地面区域，给玩家充足的战斗和移动空间
export const GROUND_Y = CANVAS_HEIGHT * 0.55
export const CEILING_Y = 30
export const WALL_BOUNCE_FACTOR = 0.5

// ============ 玩家基础属性（解压模式）===========
export const PLAYER_WIDTH = 36
export const PLAYER_HEIGHT = 58
export const PLAYER_SPEED = 6
export const PLAYER_JUMP_FORCE = -9
export const PLAYER_MAX_HP = 800  // 更多血量，不容易死
export const PLAYER_MAX_MP = 500  // 大幅增加蓝量
export const PLAYER_MAX_LIVES = 5
export const INVINCIBLE_DURATION = 60
export const DASH_SPEED = 12
export const DASH_DURATION = 150
export const DASH_COOLDOWN = 800

// ============ 攻击系统 ============
export const ATTACK_RANGE = 42
export const ATTACK_DAMAGE = 10
export const ATTACK_COOLDOWN = 250
export const COMBO_WINDOW = 600
export const MAX_COMBO_STEPS = 4
export const JUGGLE_LIMIT = 5
export const JUGGLE_TIMER = 2000

// ============ 技能系统（解压模式）===========
export const SKILL1_COOLDOWN = 500  // 大幅减少冷却
export const SKILL2_COOLDOWN = 1500 // 大幅减少冷却
export const MP_REGEN_RATE = 5     // 蓝量快速回复
export const MP_REGEN_DELAY = 0    // 立即回复
export const SP_PER_LEVEL = 2

// ============ 怪物（增加难度）===========
export const ENEMY_BASE_HP = 60
export const ENEMY_SPEED = 0.85
export const ENEMY_ATTACK_RANGE = 60
export const ENEMY_ATTACK_DAMAGE = 18
export const ENEMY_ATTACK_COOLDOWN = 1500
export const ENEMY_BULLET_SPEED = 6
export const ENEMY_KNOCKBACK_RESIST = 0.85

// ============ 保护系统 ============
export const PROTECTION_DURATION = 2000
export const KNOCKDOWN_DURATION = 300
export const AIRBORN_GRAVITY = 0.5

// ============ 掉落系统 ============
export const GOLD_DROP_CHANCE = 0.7
export const HP_POTION_HEAL = 25
export const MP_POTION_RESTORE = 30
export const DROP_LIFE = 600
export const PICKUP_RANGE = 35

// ============ 经验 ============
export const EXP_PER_NORMAL = 12
export const EXP_PER_ELITE = 40
export const EXP_PER_BOSS = 150
export const EXP_TO_LEVEL = (level: number) => 60 + level * 40

// ============ 关卡 ============
export const ROOM_CLEAR_DELAY = 500
export const LEVEL_TRANSITION_DELAY = 2000
export const FADE_DURATION = 500
export const GAME_OVER_DELAY = 2000
export const VICTORY_DELAY = 3000

// ============ 过渡动画 ============
export const TRANSITION_SLIDE_DURATION = 350 // 滑动过渡动画时长(ms)

// ============ 强化系统 ============
export const ENHANCE_MAX = 10
export const ENHANCE_BASE_COST = 1000
export const ENHANCE_CHANCE = (level: number) => Math.max(0.1, 0.9 - level * 0.08)
export const ENHANCE_STATS_PER = 0.1

// ============ 特效 ============
export const PARTICLE_MAX = 180
export const PARTICLE_MAX_MOBILE = 80
export const COMBO_FONT_BASE = 20

// ============ 技能解锁等级 ============
export const SKILL_UNLOCK_LEVELS = [1, 3, 5, 7]

// ============ 职业解锁条件 ============
export const CLASS_UNLOCK: Record<string, { default: boolean; level: number }> = {
  swordsman: { default: true, level: 1 },
  fighter: { default: true, level: 1 },
  archer: { default: false, level: 3 },
  mage: { default: false, level: 5 },
  gunner: { default: false, level: 7 },
}

// ============ 城镇配置 ============
export const TOWN_WIDTH = CANVAS_WIDTH * 2
export const TOWN_HEIGHT = CANVAS_HEIGHT
export const NPC_INTERACT_RANGE = 50

// ============ 平台系统 ============
export const PLATFORM_HEIGHT = 14
export const PLATFORM_SHADOW_OFFSET = 3