// RPG Shooter 塔防融合版 - 状态管理

import { GameState, Resources, Player, BuildMode } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_INITIAL, getExpToLevel, getPlayerStatsAtLevel } from './config'
import { playSound } from './sounds'

// 创建初始游戏状态
export function createInitialState(): GameState {
  // 生成背景星星
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    speed: 0.2 + Math.random() * 0.5,
    size: 1 + Math.random() * 2,
    bright: 0.3 + Math.random() * 0.7
  }))

  const playerStats = getPlayerStatsAtLevel(1)

  return {
    // 基础信息
    wave: 0,
    waveInProgress: false,
    breakTime: 0,
    timeLeft: 0,
    resources: {
      crystals: 200,
      energy: 60,
      score: 0,
      kills: 0
    },

    // 角色
    player: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      hp: playerStats.hp,
      maxHp: playerStats.hp,
      lives: 5,        // 初始5条命
      level: 1,
      exp: 0,
      expToLevel: getExpToLevel(1),
      atk: playerStats.atk,
      speed: playerStats.speed,
      invincible: 0,
      shootAngle: -Math.PI / 2,
      lastShot: 0,
      hitLock: 0  // 受伤锁定，防止同一帧多次扣命
    },

    // 塔防系统
    turrets: [],
    traps: [],
    projectiles: [],
    enemyBullets: [],  // 敌人子弹数组

    // 敌人
    enemies: [],
    enemySpawnQueue: [],
    spawnTimer: 0,

    // 特效
    particles: [],
    floatTexts: [],

    // UI状态
    buildMode: {
      active: false,
      selectedTurret: null,
      turretType: null,
      previewX: 0,
      previewY: 0,
      canPlace: false,
      buildTab: 'turret'
    },
    selectedTurret: null,

    // 游戏流程
    gameStarted: false,
    gameEnded: false,
    gameEndProcessed: false,
    elapsed: 0,
    difficulty: 1,

    // 连击系统
    combo: {
      count: 0,
      timer: 0,
      maxCombo: 0
    },

    // 屏幕特效
    shakeAmt: 0,
    screenFlash: 0,

    // 背景星星
    stars,

    // == 新增：输入控制 ==
    keys: {},
    joystick: {
      active: false,
      dx: 0, dy: 0,
      baseX: 0, baseY: 0,
      touchId: null
    },

    // == 新增：射击状态 ==
    lastShootTime: 0
  }
}

// 重置游戏状态（重新开始）
export function resetState(state: GameState): void {
  const newState = createInitialState()
  Object.assign(state, newState)
}

// 初始化资源
export function initResources(state: GameState, crystals: number = 150, energy: number = 50): void {
  state.resources.crystals = crystals
  state.resources.energy = energy
}

// 添加水晶
export function addCrystals(state: GameState, amount: number): void {
  state.resources.crystals += amount
  state.floatTexts.push({
    text: `+${amount}💎`,
    x: state.player.x,
    y: state.player.y - 30,
    life: 1.5,
    color: '#00E5FF',
    size: 16,
    vy: -1
  })

  // 播放金币音效（延迟以避免音效过于密集）
  playSound('coin')
}

// 消耗水晶
export function spendCrystals(state: GameState, amount: number): boolean {
  if (state.resources.crystals >= amount) {
    state.resources.crystals -= amount
    return true
  }
  return false
}

// 添加能量
export function addEnergy(state: GameState, amount: number): void {
  state.resources.energy = Math.min(100, state.resources.energy + amount)
}

// 消耗能量
export function spendEnergy(state: GameState, amount: number): boolean {
  if (state.resources.energy >= amount) {
    state.resources.energy -= amount
    return true
  }
  return false
}

// 玩家升级
export function playerLevelUp(state: GameState): void {
  state.player.level++
  state.player.exp -= state.player.expToLevel
  state.player.expToLevel = getExpToLevel(state.player.level)
  
  // 更新属性
  const stats = getPlayerStatsAtLevel(state.player.level)
  state.player.maxHp = stats.hp
  state.player.hp = stats.hp  // 升级回满血
  state.player.atk = stats.atk
  state.player.speed = stats.speed
  
  // 升级特效
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i
    const speed = 3 + Math.random() * 5
    const life = 1.5
    state.particles.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color: i % 2 === 0 ? '#FFD700' : '#FF6B6B',
      size: 5 + Math.random() * 3
    })
  }
  
  state.shakeAmt = 8
  state.screenFlash = 0.3
  
  state.floatTexts.push({
    text: `⬆️ Lv.${state.player.level}!`,
    x: state.player.x,
    y: state.player.y - 50,
    life: 2.5,
    color: '#FFD700',
    size: 24,
    vy: -0.5
  })

  // 播放升级音效
  playSound('levelUp')
}

// 添加经验
export function addExp(state: GameState, amount: number): void {
  state.player.exp += amount
  
  // 检查是否升级
  while (state.player.exp >= state.player.expToLevel && state.player.level < 10) {
    playerLevelUp(state)
  }
}

// 玩家受伤
export function playerHit(state: GameState, damage: number): void {
  // 无敌时间或受伤锁定期内无法受伤
  if (state.player.invincible > 0 || state.player.hitLock > 0) return
  
  // 设置受伤锁定，防止同一帧多次扣命
  state.player.hitLock = 0.1  // 100ms锁定
  
  state.player.hp -= damage
  state.player.invincible = 2.0  // 2秒无敌时间
  state.shakeAmt = 10
  state.screenFlash = 0.4
  
  // 受伤特效
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 4
    const life = 1
    state.particles.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color: '#FF4757',
      size: 4
    })
  }
  
  if (state.player.hp <= 0) {
    state.gameEnded = true  // HP归零，游戏结束
  } else {
    // 播放受伤音效
    playSound('playerHurt')
  }
}

// 增加连击（已废弃，直接使用 state.combo.count++）
export function addCombo(state: GameState): void {
  state.combo.count++
  state.combo.timer = 2.0
}

// 重置连击
export function resetCombo(state: GameState): void {
  if (state.combo.count > 0) {
    state.floatTexts.push({
      text: '连击中断!',
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      life: 1.5,
      color: '#FF6B6B',
      size: 20,
      vy: -0.5
    })
  }
  state.combo.count = 0
  state.combo.timer = 0
}

// 开始新波次
export function startWave(state: GameState, waveNumber: number): void {
  state.wave = waveNumber
  state.waveInProgress = true
  state.timeLeft = getWaveDuration(waveNumber)
  state.difficulty = 1 + (waveNumber - 1) * 0.3
  
  state.floatTexts.push({
    text: `⚔️ 第${waveNumber}波!`,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    life: 3,
    color: '#FF6B6B',
    size: 32,
    vy: -0.5
  })
}

// 获取波次持续时间
function getWaveDuration(waveNumber: number): number {
  const durations = [30, 45, 60, 60, 75, 75, 90, 120]
  return durations[waveNumber - 1] || 60
}

// 进入休息时间
export function startBreak(state: GameState, breakTime: number): void {
  state.waveInProgress = false
  state.breakTime = breakTime
  
  state.floatTexts.push({
    text: `⏸️ 休息 ${breakTime}秒`,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    life: 2,
    color: '#4ECDC4',
    size: 24,
    vy: -0.5
  })
}
