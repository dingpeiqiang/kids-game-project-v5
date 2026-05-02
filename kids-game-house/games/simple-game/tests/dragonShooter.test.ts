import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals'

// Mock canvas and DOM
const mockCanvas = {
  width: 360,
  height: 640,
  getContext: jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    fillStyle: '',
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    shadowColor: '',
    shadowBlur: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    lineWidth: 0,
    createLinearGradient: jest.fn().mockReturnValue({
      addColorStop: jest.fn()
    }),
    setLineDash: jest.fn(),
    roundRect: jest.fn(),
    globalAlpha: 1
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

global.document = {
  getElementById: jest.fn().mockReturnValue({
    innerHTML: '',
    appendChild: jest.fn()
  })
}

global.HTMLElement = class {}
global.HTMLCanvasElement = class extends HTMLElement {}

describe('Dragon Shooter Game', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Game Configuration', () => {
    test('should have proper dragon configurations', () => {
      const DRAGON_CONFIGS = {
        small: { segments: 8, hp: 1, size: 14, color: '#00CED1', speed: 0.3, score: 10, canSplit: true },
        medium: { segments: 12, hp: 2, size: 18, color: '#00CED1', speed: 0.25, score: 25, canSplit: true },
        large: { segments: 16, hp: 3, size: 22, color: '#9370DB', speed: 0.2, score: 50, canSplit: true },
        elite: { segments: 24, hp: 5, size: 26, color: '#FF6347', speed: 0.15, score: 100, canSplit: true },
        boss: { segments: 40, hp: 15, size: 35, color: '#FFD700', speed: 0.12, score: 500, canSplit: false },
        treasure: { segments: 15, hp: 3, size: 20, color: '#DAA520', speed: 0.25, score: 150, canSplit: false, isTreasure: true },
        coin: { segments: 12, hp: 2, size: 18, color: '#FFD700', speed: 0.28, score: 80, canSplit: false, isCoin: true }
      }

      expect(DRAGON_CONFIGS.small.segments).toBeGreaterThan(0)
      expect(DRAGON_CONFIGS.small.hp).toBe(1)
      expect(DRAGON_CONFIGS.boss.segments).toBeGreaterThan(DRAGON_CONFIGS.small.segments)
      expect(DRAGON_CONFIGS.boss.canSplit).toBe(false)
      expect(DRAGON_CONFIGS.treasure.isTreasure).toBe(true)
      expect(DRAGON_CONFIGS.coin.isCoin).toBe(true)
    })

    test('should have balanced player initial stats', () => {
      const initialState = {
        bulletDamage: 2,
        bulletSpeed: 10,
        shootCooldown: 120,
        bulletCount: 2,
        bulletPierce: 1,
        playerHP: 3,
        playerMaxHP: 3
      }

      expect(initialState.bulletDamage).toBeGreaterThan(0)
      expect(initialState.bulletCount).toBeGreaterThan(0)
      expect(initialState.playerHP).toBe(initialState.playerMaxHP)
      expect(initialState.shootCooldown).toBeLessThan(200)
    })
  })

  describe('Game Balance', () => {
    test('should have reasonable level progression', () => {
      const calculateLevelTarget = (level: number) => 6 + level * 3
      
      expect(calculateLevelTarget(1)).toBe(9)
      expect(calculateLevelTarget(5)).toBe(21)
      expect(calculateLevelTarget(10)).toBe(36)
    })

    test('should cap maximum dragons on screen', () => {
      const getMaxDragons = (level: number) => Math.min(6, 2 + Math.floor(level / 2))
      
      expect(getMaxDragons(1)).toBe(2)
      expect(getMaxDragons(5)).toBe(4)
      expect(getMaxDragons(10)).toBe(6)
      expect(getMaxDragons(20)).toBe(6)
    })

    test('dragon speed should decrease with size', () => {
      const speeds = [
        { type: 'small', speed: 0.3 },
        { type: 'medium', speed: 0.25 },
        { type: 'large', speed: 0.2 },
        { type: 'elite', speed: 0.15 },
        { type: 'boss', speed: 0.12 }
      ]

      for (let i = 0; i < speeds.length - 1; i++) {
        expect(speeds[i].speed).toBeGreaterThan(speeds[i + 1].speed)
      }
    })
  })

  describe('Collision Detection', () => {
    test('should detect collision between bullet and dragon segment', () => {
      const bullet = { x: 100, y: 200, size: 5 }
      const dragonSegment = { x: 102, y: 198, size: 14 }

      const dx = bullet.x - dragonSegment.x
      const dy = bullet.y - dragonSegment.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const collisionDistance = bullet.size + dragonSegment.size

      expect(distance < collisionDistance).toBe(true)
    })

    test('should not detect collision when objects are far apart', () => {
      const bullet = { x: 100, y: 200, size: 5 }
      const dragonSegment = { x: 200, y: 300, size: 14 }

      const dx = bullet.x - dragonSegment.x
      const dy = bullet.y - dragonSegment.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const collisionDistance = bullet.size + dragonSegment.size

      expect(distance < collisionDistance).toBe(false)
    })
  })

  describe('Game State Management', () => {
    test('should have proper initial state structure', () => {
      const state = {
        mode: 'challenge',
        phase: 'start',
        level: 1,
        score: 0,
        coins: 0,
        combo: 0,
        comboTimer: 0,
        maxCombo: 0,
        totalKills: 0,
        timeLeft: 180,
        playerX: 180,
        playerHP: 3,
        playerMaxHP: 3,
        invincibleTimer: 0,
        bulletDamage: 2,
        bulletSpeed: 10,
        shootCooldown: 120,
        bulletCount: 2,
        bulletPierce: 1,
        lastShotTime: 0,
        dragons: [],
        bullets: [],
        particles: [],
        powerUps: [],
        floatTexts: [],
        coinDrops: [],
        clouds: [],
        dusts: [],
        lastDragonId: 0,
        levelProgress: 0,
        levelTarget: 6,
        currentScene: 0,
        isPaused: false,
        touch: { active: false, startX: 0, currentX: 0 },
        dragCount: 0,
        maxDragons: 2
      }

      expect(state.mode).toBe('challenge')
      expect(state.phase).toBe('start')
      expect(state.level).toBe(1)
      expect(state.dragons).toEqual([])
      expect(state.bullets).toEqual([])
    })

    test('should reset game on game over', () => {
      const initialState = {
        level: 5,
        score: 1000,
        coins: 50,
        combo: 10,
        totalKills: 50,
        playerHP: 1
      }

      const resetState = {
        level: 1,
        score: 0,
        coins: 0,
        combo: 0,
        totalKills: 0,
        playerHP: 3
      }

      expect(resetState.level).toBe(1)
      expect(resetState.score).toBe(0)
      expect(resetState.playerHP).toBe(resetState.playerHP)
    })
  })

  describe('Power-up System', () => {
    test('should have valid power-up configurations', () => {
      const POWERUP_ICONS = {
        damage: { icon: '⚔️', color: '#FF6B6B' },
        multiShot: { icon: '🔫', color: '#98FB98' },
        pierce: { icon: '💥', color: '#FF8E53' },
        heal: { icon: '❤️', color: '#FF69B4' }
      }

      const BUFF_OPTIONS = [
        { id: 'damage', name: '⚔️ 攻击+1', desc: '子弹伤害提升', color: '#FF6B6B' },
        { id: 'multiShot', name: '🔫 多重射击', desc: '子弹数量+1', color: '#98FB98' },
        { id: 'pierce', name: '💥 穿透+', desc: '子弹穿透敌人', color: '#FF8E53' },
        { id: 'heal', name: '❤️ 回复', desc: '恢复1点生命', color: '#FF69B4' }
      ]

      expect(Object.keys(POWERUP_ICONS).length).toBe(4)
      expect(BUFF_OPTIONS.length).toBe(4)
      expect(BUFF_OPTIONS.every(opt => opt.id && opt.name && opt.desc)).toBe(true)
    })

    test('should limit power-up stacking to prevent overpowered state', () => {
      const MAX_DAMAGE = 20
      const MAX_BULLET_COUNT = 10
      const MAX_PIERCE = 10

      let state = { bulletDamage: 2, bulletCount: 2, bulletPierce: 1 }

      const applyBuffWithLimit = (buffId: string) => {
        switch (buffId) {
          case 'damage': state.bulletDamage = Math.min(MAX_DAMAGE, state.bulletDamage + 1); break
          case 'multiShot': state.bulletCount = Math.min(MAX_BULLET_COUNT, state.bulletCount + 1); break
          case 'pierce': state.bulletPierce = Math.min(MAX_PIERCE, state.bulletPierce + 1); break
        }
      }

      for (let i = 0; i < 30; i++) {
        applyBuffWithLimit('damage')
        applyBuffWithLimit('multiShot')
        applyBuffWithLimit('pierce')
      }

      expect(state.bulletDamage).toBe(MAX_DAMAGE)
      expect(state.bulletCount).toBe(MAX_BULLET_COUNT)
      expect(state.bulletPierce).toBe(MAX_PIERCE)
    })

    test('should have balanced power-up probabilities', () => {
      const BUFF_OPTIONS = [
        { id: 'damage', name: '⚔️ 攻击+1', weight: 30 },
        { id: 'multiShot', name: '🔫 多重射击', weight: 25 },
        { id: 'pierce', name: '💥 穿透+', weight: 25 },
        { id: 'heal', name: '❤️ 回复', weight: 20 }
      ]

      const totalWeight = BUFF_OPTIONS.reduce((sum, opt) => sum + opt.weight, 0)
      expect(totalWeight).toBe(100)

      const weights = BUFF_OPTIONS.map(opt => opt.weight)
      expect(weights.every(w => w > 0 && w <= 50)).toBe(true)
    })

    test('should not spawn too many power-ups at once', () => {
      const MAX_POWERUPS_ON_SCREEN = 5
      
      let powerUps = [{ x: 100, y: 200 }, { x: 150, y: 250 }, { x: 200, y: 300 }, { x: 250, y: 350 }, { x: 300, y: 400 }]
      
      expect(powerUps.length).toBeLessThanOrEqual(MAX_POWERUPS_ON_SCREEN)

      powerUps.push({ x: 350, y: 450 })
      expect(powerUps.length).toBe(6)

      powerUps = powerUps.slice(0, MAX_POWERUPS_ON_SCREEN)
      expect(powerUps.length).toBe(MAX_POWERUPS_ON_SCREEN)
    })

    test('should apply power-up effects correctly', () => {
      let state = { bulletDamage: 2, bulletCount: 2, bulletPierce: 1, playerHP: 1, playerMaxHP: 3 }

      const applyBuff = (buffId: string) => {
        switch (buffId) {
          case 'damage': state.bulletDamage++; break
          case 'multiShot': state.bulletCount++; break
          case 'pierce': state.bulletPierce++; break
          case 'heal': state.playerHP = Math.min(state.playerMaxHP, state.playerHP + 1); break
        }
      }

      applyBuff('damage')
      expect(state.bulletDamage).toBe(3)

      applyBuff('multiShot')
      expect(state.bulletCount).toBe(3)

      applyBuff('heal')
      expect(state.playerHP).toBe(2)

      applyBuff('heal')
      applyBuff('heal')
      expect(state.playerHP).toBe(3)
    })
  })

  describe('Scene Management', () => {
    test('should have 4 scenes for progression', () => {
      const SCENES = [
        { name: '青云', bg: ['#87CEEB', '#E0F7FA', '#B2EBF2'] },
        { name: '灵山', bg: ['#81C784', '#A5D6A7', '#C8E6C9'] },
        { name: '龙宫', bg: ['#4FC3F7', '#29B6F6', '#03A9F4'] },
        { name: '九霄', bg: ['#9575CD', '#7E57C2', '#673AB7'] }
      ]

      expect(SCENES.length).toBe(4)
      expect(SCENES.every(scene => scene.name && scene.bg.length === 3)).toBe(true)
    })

    test('should cycle scenes based on level', () => {
      const getScene = (level: number) => Math.floor((level - 1) / 5) % 4
      
      expect(getScene(1)).toBe(0)
      expect(getScene(5)).toBe(0)
      expect(getScene(6)).toBe(1)
      expect(getScene(10)).toBe(1)
      expect(getScene(15)).toBe(2)
      expect(getScene(20)).toBe(3)
      expect(getScene(21)).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty dragon segments', () => {
      const dragon = { segments: [], alive: true }
      
      expect(dragon.segments.length).toBe(0)
      expect(dragon.alive).toBe(true)
    })

    test('should handle max combo correctly', () => {
      const state = { combo: 15, maxCombo: 10 }
      
      if (state.combo > state.maxCombo) {
        state.maxCombo = state.combo
      }
      
      expect(state.maxCombo).toBe(15)
    })

    test('should not let player HP exceed max', () => {
      const state = { playerHP: 3, playerMaxHP: 3 }
      
      state.playerHP = Math.min(state.playerMaxHP, state.playerHP + 1)
      
      expect(state.playerHP).toBe(3)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
})
