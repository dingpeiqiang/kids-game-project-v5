import type { GameEngine } from '../../../services/gameEngine'
import { gameActions } from '../../../platform/gameBridge'
import { audioService } from '../../../services/audio'
import { applyCanvasMobileStyles, bindCanvasPointerInput } from '../../../utils/canvasMobileUtils'
import { GAME_CONFIG, BLOCK_COLORS, BG_STAGES, SPECIAL_BLOCK_CONFIG, WEATHER_CONFIG, CHARACTER_CONFIG, BUBBLE_COLORS, RAINBOW_COLORS } from '../config/gameConfig'
import { POWERUP_CONFIGS, POWERUP_COMBOS, POWERUP_DROP_CHANCES } from '../config/powerupConfig'
import { ACHIEVEMENTS, ACHIEVEMENT_REWARDS } from '../config/achievementConfig'
import type { Layer, Particle, FloatText, WeatherParticle, Character, Bubble, RainbowParticle, Cloud, SpecialBlockType, WeatherType, CharacterType, PowerupType, Achievement } from '../types'
import { getCachedGTRSTheme } from '../../../services/gtrsThemeLoader'
import { resolveGtrsCanvasStyle } from '../../../utils/gtrsCanvasTheme'
import { readGtrsSceneList, readGtrsSceneMeta } from '../../../utils/gtrsSceneMeta'

export class StackGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private onEnd: () => void

  W = GAME_CONFIG.CANVAS_WIDTH
  H = GAME_CONFIG.CANVAS_HEIGHT

  layers: Layer[] = []
  currentBlock = { x: 0, w: 0, dir: 1, special: 'none' as SpecialBlockType }
  fallingPieces: { x: number; y: number; w: number; color: string; vy: number; vx: number; rot: number; rotSpeed: number }[] = []
  particles: Particle[] = []
  floatTexts: FloatText[] = []
  weatherParticles: WeatherParticle[] = []
  characters: Character[] = []
  bubbles: Bubble[] = []
  rainbowParticles: RainbowParticle[] = []
  clouds: Cloud[] = []

  cameraY = 0
  targetCameraY = 0
  gameStarted = false
  gameEnded = false
  comboPerfect = 0
  shakeAmount = 0

  currentWeather: WeatherType = 'sunny'
  weatherTimer = 0

  nextCharTimer = 0
  seenCharacters: CharacterType[] = []

  inventory: PowerupType[] = []
  activePowerups: { type: PowerupType; endTime: number }[] = []
  powerupCooldowns: Record<PowerupType, number> = {}

  autoPerfect = false
  hasRevive = false
  hasShield = false
  hasMagnet = false
  magnetEndTime = 0
  scoreMultiplier = 1
  scoreMultiplierEndTime = 0
  timeStopped = false
  timeStopEndTime = 0
  rainbowCount = 0

  achievements: Achievement[] = []
  seenWeatherTypes: WeatherType[] = []

  gameStartTime = 0
  lastStackTime = 0
  stackCountIn10Seconds = 0

  private gtrs = resolveGtrsCanvasStyle('stack', {
    primary: '#A8E6CF',
    background: '#87CEEB',
    backgroundDark: '#5DADE2',
    text: '#FFFFFF',
    accent: '#FFD700',
    hudBg: 'rgba(0,0,0,0.45)',
    danger: '#FF6B6B',
    muted: '#B0B0B0',
    palette: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4ECDC4', '#9B59B6', '#FF8E53', '#3498DB', '#E74C3C'],
  })
  private blockColors: string[] = []

  constructor(engine: GameEngine, onEnd: () => void) {
    const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
    if (!canvas) {
      console.error('Canvas not found!')
      throw new Error('Canvas not found')
    }
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Cannot get 2D context!')
      throw new Error('Cannot get 2D context')
    }
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.engine = engine
    this.onEnd = onEnd
    this.init()
  }

  private init() {
    const theme = getCachedGTRSTheme('stack')
    this.blockColors =
      readGtrsSceneList(theme, 'game_palette') ??
      (BLOCK_COLORS.length ? [...BLOCK_COLORS] : [...this.gtrs.palette])
    this.initAchievements()
    this.initClouds()
    this.initBaseLayer()
    this.spawnBlock()
    this.gameStartTime = Date.now()
  }

  private initAchievements() {
    this.achievements = Object.values(ACHIEVEMENTS).map(a => ({ ...a, unlocked: false, progress: 0 }))
  }

  private initClouds() {
    this.clouds = []
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.W,
        y: 50 + Math.random() * 150,
        speed: 0.1 + Math.random() * 0.2,
        size: 40 + Math.random() * 30,
      })
    }
  }

  private initBaseLayer() {
    const baseWidth = this.W * GAME_CONFIG.BASE_WIDTH
    const baseX = (this.W - baseWidth) / 2
    const baseY = this.H - 60
    this.layers.push({ x: baseX, w: baseWidth, y: baseY, color: '#B0B0B0' })
  }

  private spawnBlock() {
    const top = this.layers[this.layers.length - 1]
    const speed = GAME_CONFIG.BASE_SPEED + (this.layers.length - 1) * GAME_CONFIG.SPEED_INCREMENT
    let special: SpecialBlockType = 'none'

    if (this.rainbowCount > 0) {
      special = 'bonus'
      this.rainbowCount--
    } else if (this.layers.length >= 5) {
      special = this.getRandomSpecialBlock()
    }

    this.currentBlock = { x: -top.w, w: top.w, dir: speed, special }
  }

  private getRandomSpecialBlock(): SpecialBlockType {
    const rand = Math.random()
    let cumulative = 0
    for (const [type, config] of Object.entries(SPECIAL_BLOCK_CONFIG)) {
      cumulative += config.probability
      if (rand < cumulative) return type as SpecialBlockType
    }
    return 'none'
  }

  private getBlockColor(layerIndex: number): string {
    return BLOCK_COLORS[layerIndex % BLOCK_COLORS.length]
  }

  private placeBlock() {
    if (this.gameEnded) return

    const top = this.layers[this.layers.length - 1]
    const y = top.y - GAME_CONFIG.BLOCK_HEIGHT
    let color = this.getBlockColor(this.layers.length)

    if (this.currentBlock.special !== 'none') {
      color = SPECIAL_BLOCK_CONFIG[this.currentBlock.special].color
    }

    const overlapLeft = Math.max(this.currentBlock.x, top.x)
    const overlapRight = Math.min(this.currentBlock.x + this.currentBlock.w, top.x + top.w)
    const overlapWidth = overlapRight - overlapLeft

    if (overlapWidth <= 0) {
      this.dropPiece(this.currentBlock.x, y, this.currentBlock.w, color)
      this.endGame()
      return
    }

    let isPerfect = Math.abs(this.currentBlock.x - top.x) < GAME_CONFIG.PERFECT_THRESHOLD

    if (this.autoPerfect) {
      isPerfect = true
      this.autoPerfect = false
    }

    if (isPerfect) {
      this.handlePerfectPlacement(top, y, color)
    } else {
      this.handleNormalPlacement(top, y, color, overlapLeft, overlapWidth, overlapRight)
    }

    this.handleSpecialBlock(this.currentBlock.special)
    this.checkAchievements()
    this.updatePowerupTimers()

    const newBlock = this.layers[this.layers.length - 1]
    if (newBlock.w < GAME_CONFIG.MIN_WIDTH) {
      this.endGame()
      return
    }

    this.targetCameraY = Math.max(0, this.H - 60 - newBlock.y - this.H * 0.55)
    
    if (newBlock.y < -this.H * 2) {
      this.targetCameraY = -newBlock.y - this.H * 0.55
    }
    
    this.spawnBlock()
  }

  private handlePerfectPlacement(top: Layer, y: number, color: string) {
    this.comboPerfect++
    this.layers.push({ x: top.x, w: top.w, y, color, special: this.currentBlock.special })

    const perfectBonus = this.comboPerfect >= 5 ? 200 : this.comboPerfect >= 3 ? 100 : this.comboPerfect >= 2 ? 50 : 25
    const finalScore = perfectBonus * this.comboPerfect * this.scoreMultiplier
    gameActions.addScore(finalScore, this.W / 2, y - this.cameraY)

    let text = '完美!'
    let size = 22
    let textColor = '#FFD700'
    if (this.comboPerfect >= 5) { text = '🔥 无敌!'; size = 32; textColor = '#FF6B6B' }
    else if (this.comboPerfect >= 3) { text = '太棒了!'; size = 28; textColor = '#FF8E53' }
    else if (this.comboPerfect >= 2) { text = '厉害!'; size = 24; textColor = '#6BCB77' }

    this.addFloatText(text, textColor, size)
    this.createPerfectParticles(top.x, top.w, y, this.comboPerfect)
    this.shakeAmount = Math.min(6, 2 + this.comboPerfect)
    audioService.win()

    if (this.comboPerfect >= 3) {
      this.engine.triggerRandomBuff()
      this.tryDropPowerup()
    }
  }

  private handleNormalPlacement(top: Layer, y: number, color: string, overlapLeft: number, overlapWidth: number, overlapRight: number) {
    this.comboPerfect = 0

    const cutLeft = this.currentBlock.x < top.x
    const cutX = cutLeft ? this.currentBlock.x : overlapRight
    const cutW = this.currentBlock.w - overlapWidth

    if (cutW > 0) {
      this.dropPiece(cutX, y, cutW, color)
    }

    this.layers.push({ x: overlapLeft, w: overlapWidth, y, color, special: this.currentBlock.special })
    this.gameActions.addScore(10 * this.scoreMultiplier, overlapLeft + overlapWidth / 2, y - this.cameraY)

    this.createCutParticles(cutLeft ? overlapLeft : overlapRight, y, color)
    audioService.click()
  }

  private handleSpecialBlock(type: SpecialBlockType) {
    switch (type) {
      case 'bonus':
        this.gameActions.addScore(500 * this.scoreMultiplier, this.W / 2, this.layers[this.layers.length - 1].y - this.cameraY)
        this.addFloatText('🎁 奖励+500', '#FFD700', 20)
        this.incrementAchievement('treasureHunter')
        audioService.win()
        break
      case 'bomb':
        if (this.hasShield) {
          this.hasShield = false
          this.addFloatText('🛡️ 护盾抵挡!', '#9400D3', 22)
        } else {
          this.shakeAmount = 15
          if (this.layers.length > 3) {
            const removed = this.layers.pop()!
            this.dropPiece(removed.x, removed.y, removed.w, removed.color)
          }
          this.addFloatText('💥 炸弹！', '#FF4444', 24)
        }
        audioService.lose()
        break
      case 'lucky':
        const luckyScore = Math.floor(Math.random() * 300) + 100
        gameActions.addScore(luckyScore * this.scoreMultiplier, this.W / 2, this.layers[this.layers.length - 1].y - this.cameraY)
        this.addFloatText(`🍀 幸运+${luckyScore}`, '#9B59B6', 20)
        this.incrementAchievement('luckyStar')
        audioService.collect()
        break
      case 'shrink':
        if (this.currentBlock.w > GAME_CONFIG.MIN_WIDTH * 2) {
          this.currentBlock.w *= 0.85
        }
        this.addFloatText('🔻 方块缩小', '#3498DB', 18)
        break
      case 'expand':
        this.currentBlock.w = Math.min(this.currentBlock.w * 1.3, this.W * 0.6)
        this.addFloatText('📐 方块加宽', '#2ECC71', 18)
        audioService.collect()
        break
      case 'slow':
        this.currentBlock.dir *= 0.7
        this.addFloatText('🐢 速度减慢', '#1ABC9C', 18)
        audioService.collect()
        break
      case 'freeze':
        this.timeStopped = true
        this.timeStopEndTime = Date.now() + 2000
        this.addFloatText('❄️ 冻结！', '#00CED1', 22)
        audioService.collect()
        break
      case 'double':
        this.scoreMultiplier = 2
        this.scoreMultiplierEndTime = Date.now() + 10000
        this.addFloatText('💎 双倍分数！', '#FF69B4', 22)
        audioService.win()
        break
      case 'shield':
        this.hasShield = true
        this.addFloatText('🛡️ 获得护盾', '#9400D3', 20)
        audioService.collect()
        break
    }
  }

  private dropPiece(x: number, y: number, w: number, color: string) {
    this.fallingPieces.push({ x, y, w, color, vy: 0, vx: (Math.random() - 0.5) * 2, rot: 0, rotSpeed: (Math.random() - 0.5) * 0.1 })
  }

  private addFloatText(text: string, color: string, size: number) {
    this.floatTexts.push({ text, x: this.W / 2, y: this.H / 2 - this.cameraY, life: 1, color, size })
  }

  private createPerfectParticles(x: number, w: number, y: number, combo: number) {
    for (let i = 0; i < 20 + combo * 5; i++) {
      this.particles.push({
        x: x + Math.random() * w,
        y: y - this.cameraY,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        life: 1,
        color: combo >= 5 ? '#FF6B6B' : '#FFD700',
        size: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      })
    }
    this.createRainbowParticles(this.W / 2, y - this.cameraY, 15)
  }

  private createCutParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y: y - this.cameraY,
        vx: (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 4 + 1),
        vy: -Math.random() * 3,
        life: 1,
        color,
        size: 2 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
      })
    }
  }

  private createRainbowParticles(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.rainbowParticles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 1,
        color: RAINBOW_COLORS[i % RAINBOW_COLORS.length],
        size: 3 + Math.random() * 3,
      })
    }
  }

  private tryDropPowerup() {
    const rand = Math.random()
    let cumulative = 0
    for (const [, config] of Object.entries(POWERUP_DROP_CHANCES)) {
      cumulative += config.chance
      if (rand < cumulative) {
        const powerupsOfRarity = Object.values(POWERUP_CONFIGS).filter(p => p.rarity === config.rarity)
        if (powerupsOfRarity.length > 0) {
          const randomPowerup = powerupsOfRarity[Math.floor(Math.random() * powerupsOfRarity.length)]
          this.inventory.push(randomPowerup.type)
          this.addFloatText(`🎒 获得${randomPowerup.icon} ${randomPowerup.name}`, '#FFD700', 18)
        }
        break
      }
    }
  }

  private usePowerup(type: PowerupType): boolean {
    const index = this.inventory.indexOf(type)
    if (index === -1) return false

    const now = Date.now()
    if (this.powerupCooldowns[type] && now < this.powerupCooldowns[type]) {
      return false
    }

    this.inventory.splice(index, 1)
    this.powerupCooldowns[type] = now + POWERUP_CONFIGS[type].cooldown
    POWERUP_CONFIGS[type].effect(this)

    if (POWERUP_CONFIGS[type].duration > 0) {
      this.activePowerups.push({ type, endTime: now + POWERUP_CONFIGS[type].duration })
    }

    this.checkComboEffects()
    this.incrementAchievement('powerupCollector')
    return true
  }

  private checkComboEffects() {
    for (const [, combo] of Object.entries(POWERUP_COMBOS)) {
      const hasAllPowerups = combo.powerups.every(p => this.activePowerups.some(ap => ap.type === p))
      if (hasAllPowerups) {
        combo.effect(this)
      }
    }
  }

  private updatePowerupTimers() {
    const now = Date.now()
    this.activePowerups = this.activePowerups.filter(ap => now < ap.endTime)

    if (this.hasMagnet && now > this.magnetEndTime) this.hasMagnet = false
    if (this.scoreMultiplier > 1 && now > this.scoreMultiplierEndTime) this.scoreMultiplier = 1
    if (this.timeStopped && now > this.timeStopEndTime) this.timeStopped = false
  }

  private incrementAchievement(id: string) {
    const achievement = this.achievements.find(a => a.id === id)
    if (achievement && !achievement.unlocked) {
      achievement.progress++
      if (achievement.progress >= achievement.target) {
        achievement.unlocked = true
        this.addFloatText(`🏆 ${achievement.name}!`, '#FFD700', 24)
        this.giveAchievementReward(id)
      }
    }
  }

  private giveAchievementReward(id: string) {
    const reward = ACHIEVEMENT_REWARDS[id]
    if (!reward) return

    if (reward.type === 'score') {
      this.engine.addScore(reward.amount, this.W / 2, this.H / 2)
    } else if (reward.type === 'powerup') {
      const powerups = Object.values(POWERUP_CONFIGS)
      for (let i = 0; i < reward.amount; i++) {
        this.inventory.push(powerups[Math.floor(Math.random() * powerups.length)].type)
      }
    }
  }

  private checkAchievements() {
    this.incrementAchievement('firstStack')
    this.incrementAchievement('stackMaster')
    this.incrementAchievement('towerBuilder')
    this.incrementAchievement('skyScraper')
    this.incrementAchievement('spaceStation')

    if (this.comboPerfect >= 3) this.incrementAchievement('perfectStart')
    if (this.comboPerfect >= 5) this.incrementAchievement('perfectCombo')
    if (this.comboPerfect >= 10) this.incrementAchievement('perfectStorm')

    const elapsed = (Date.now() - this.lastStackTime) / 1000
    if (elapsed < 10) {
      this.stackCountIn10Seconds++
      if (this.stackCountIn10Seconds >= 5) this.incrementAchievement('speedDemon')
    } else {
      this.stackCountIn10Seconds = 1
    }
    this.lastStackTime = Date.now()

    const gameDuration = (Date.now() - this.gameStartTime) / 1000
    if (gameDuration >= 300) this.incrementAchievement('chillMaster')

    const totalScore = this.engine.getScore()
    if (totalScore >= 100000) this.incrementAchievement('millionaire')
  }

  private switchWeather() {
    const weathers: WeatherType[] = ['sunny', 'rainy', 'snowy', 'sunset', 'night']
    const currentIndex = weathers.indexOf(this.currentWeather)
    let newWeather = weathers[(currentIndex + 1) % weathers.length]
    if (newWeather === this.currentWeather) {
      newWeather = weathers[(currentIndex + 2) % weathers.length]
    }
    this.currentWeather = newWeather

    if (!this.seenWeatherTypes.includes(newWeather)) {
      this.seenWeatherTypes.push(newWeather)
      if (this.seenWeatherTypes.length >= 5) this.incrementAchievement('weatherWatcher')
    }

    this.initWeatherParticles()
    this.addFloatText(WEATHER_CONFIG[newWeather].icon + ' ' + WEATHER_CONFIG[newWeather].name, '#fff', 24)
  }

  private initWeatherParticles() {
    this.weatherParticles = []
    for (let i = 0; i < 50; i++) {
      this.weatherParticles.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        speed: 2 + Math.random() * 3,
        type: this.currentWeather === 'snowy' ? 'snow' : 'rain',
      })
    }
  }

  private spawnCharacter() {
    if (this.characters.length >= 3) return

    const types: CharacterType[] = ['cat', 'dog', 'bird', 'rabbit', 'bear', 'fox']
    const charType = types[Math.floor(Math.random() * types.length)]
    const side = Math.random() > 0.5 ? 'left' : 'right'

    if (!this.seenCharacters.includes(charType)) {
      this.seenCharacters.push(charType)
      if (this.seenCharacters.length >= 6) this.incrementAchievement('animalFriend')
    }

    this.characters.push({
      x: side === 'left' ? -20 : this.W + 20,
      y: this.layers[this.layers.length - 1].y - Math.random() * 100,
      targetX: this.W * 0.3 + Math.random() * this.W * 0.4,
      type: charType,
      frame: 0,
      frameTimer: 0,
      emotion: 'happy',
    })

    const config = CHARACTER_CONFIG[charType]
    this.addFloatText(config.emojis[0] + ' ' + config.name + '来了!', '#FFD700', 18)
  }

  private spawnBubble() {
    this.bubbles.push({
      x: Math.random() * this.W,
      y: this.H + 20,
      size: 10 + Math.random() * 20,
      speed: 0.5 + Math.random() * 1.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    })
  }

  private endGame() {
    if (this.hasRevive) {
      this.hasRevive = false
      this.addFloatText('💖 复活！', '#FF6B6B', 28)
      this.incrementAchievement('comebackKid')
      return
    }

    this.gameEnded = true
    this.unbindPointer?.()
    this.unbindPointer = null
    gameActions.gameOver({ victory: this.layers.length >= 15, score: this.engine.getScore() })
  }

  /** 由 platform hostCanvas2D 每帧调用 */
  runHostFrame(canTick: boolean): void {
    if (!document.getElementById('mainGameCanvas')) return
    if (this.gameEnded) {
      if (this.fallingPieces.length > 0 || this.particles.length > 0) {
        this.updateFallingPieces()
        this.draw()
      }
      return
    }
    if (!canTick) {
      this.draw()
      return
    }
    if (!this.timeStopped) {
      this.currentBlock.x += this.currentBlock.dir
      if (this.currentBlock.x + this.currentBlock.w > this.W) this.currentBlock.dir = -Math.abs(this.currentBlock.dir)
      if (this.currentBlock.x < 0) this.currentBlock.dir = Math.abs(this.currentBlock.dir)
    }
    if (this.gameStarted) {
      this.weatherTimer++
      if (this.weatherTimer > 1800) {
        this.weatherTimer = 0
        this.switchWeather()
      }
      this.nextCharTimer++
      if (this.nextCharTimer > 900 && Math.random() > 0.7) {
        this.nextCharTimer = 0
        this.spawnCharacter()
      }
      if (Math.random() > 0.95) this.spawnBubble()
      if (Math.random() > 0.98) this.createRainbowParticles(Math.random() * this.W, Math.random() * this.H, 5)
    }
    this.updateFallingPieces()
    this.draw()
  }

  bindInput(): void {
    this.unbindPointer?.()
    this.unbindPointer = bindCanvasPointerInput(this.canvas, () => this.handleTap())
  }

  renderFrame(): void {
    this.draw()
  }

  destroy(): void {
    this.unbindPointer?.()
    this.unbindPointer = null
  }

  private draw() {
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.08
    if (this.shakeAmount > 0) this.shakeAmount *= 0.85
    if (this.shakeAmount < 0.1) this.shakeAmount = 0

    this.ctx.save()
    if (this.shakeAmount > 0) {
      this.ctx.translate(
        (Math.random() - 0.5) * this.shakeAmount * 2,
        (Math.random() - 0.5) * this.shakeAmount * 2,
      )
    }

    this.drawBackground()
    this.drawClouds()
    this.drawLayers()
    this.drawCurrentBlock()
    this.drawFallingPieces()
    this.drawParticles()
    this.drawFloatTexts()
    this.drawWeather()
    this.drawCharacters()
    this.drawBubbles()
    this.drawRainbowParticles()
    this.drawHUD()

    this.ctx.restore()
  }

  private drawBackground() {
    const bg = WEATHER_CONFIG[this.currentWeather]
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.H)
    grad.addColorStop(0, bg.topColor)
    grad.addColorStop(1, bg.bottomColor)
    this.ctx.fillStyle = grad
    this.ctx.fillRect(-10, -10, this.W + 20, this.H + 20)

    if (this.currentWeather === 'night' || this.cameraY > 400) {
      this.drawStars()
    }
  }

  private drawStars() {
    this.ctx.fillStyle = 'rgba(255,255,255,0.6)'
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 137 + 50) % this.W)
      const sy = ((i * 89 + 30 + this.cameraY * 0.3) % (this.H + 40)) - 20
      const ss = 1 + (i % 3)
      this.ctx.beginPath()
      this.ctx.arc(sx, sy, ss, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawClouds() {
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed
      if (cloud.x > this.W + cloud.size) cloud.x = -cloud.size
      const screenY = cloud.y + this.cameraY * 0.2
      if (screenY > -cloud.size && screenY < this.H + cloud.size) {
        this.ctx.save()
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        this.ctx.beginPath()
        const cx = cloud.x, cy = screenY, s = cloud.size
        this.ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2)
        this.ctx.arc(cx + s * 0.3, cy - s * 0.1, s * 0.35, 0, Math.PI * 2)
        this.ctx.arc(cx + s * 0.6, cy, s * 0.3, 0, Math.PI * 2)
        this.ctx.arc(cx - s * 0.3, cy - s * 0.05, s * 0.25, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.restore()
      }
    })
  }

  private drawLayers() {
    for (const layer of this.layers) {
      const screenY = layer.y + this.cameraY
      if (screenY < -GAME_CONFIG.BLOCK_HEIGHT || screenY > this.H + GAME_CONFIG.BLOCK_HEIGHT) continue
      this.drawBlock(layer.x, screenY, layer.w, layer.color)
      if (layer.special && layer.special !== 'none') {
        const icon = SPECIAL_BLOCK_CONFIG[layer.special].icon
        this.ctx.font = '14px sans-serif'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(icon, layer.x + layer.w / 2, screenY + GAME_CONFIG.BLOCK_HEIGHT / 2 + 5)
      }
    }
  }

  private drawCurrentBlock() {
    if (this.gameEnded) return

    const screenY = (this.layers[this.layers.length - 1].y - GAME_CONFIG.BLOCK_HEIGHT) + this.cameraY
    let color = this.getBlockColor(this.layers.length)
    if (this.currentBlock.special !== 'none') {
      color = SPECIAL_BLOCK_CONFIG[this.currentBlock.special].color
    }

    this.ctx.fillStyle = 'rgba(0,0,0,0.1)'
    this.ctx.fillRect(this.currentBlock.x + 3, screenY + 3, this.currentBlock.w, GAME_CONFIG.BLOCK_HEIGHT)
    this.drawBlock(this.currentBlock.x, screenY, this.currentBlock.w, color)

    if (this.currentBlock.special !== 'none') {
      const icon = SPECIAL_BLOCK_CONFIG[this.currentBlock.special].icon
      this.ctx.font = '14px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(icon, this.currentBlock.x + this.currentBlock.w / 2, screenY + GAME_CONFIG.BLOCK_HEIGHT / 2 + 5)
    }
  }

  private drawBlock(x: number, y: number, w: number, color: string) {
    const grad = this.ctx.createLinearGradient(x, y, x, y + GAME_CONFIG.BLOCK_HEIGHT)
    grad.addColorStop(0, this.lightenColor(color, 30))
    grad.addColorStop(0.5, color)
    grad.addColorStop(1, this.darkenColor(color, 20))
    this.ctx.fillStyle = grad
    this.ctx.fillRect(x, y, w, GAME_CONFIG.BLOCK_HEIGHT)

    this.ctx.fillStyle = 'rgba(255,255,255,0.3)'
    this.ctx.fillRect(x, y, w, 3)

    this.ctx.fillStyle = 'rgba(255,255,255,0.15)'
    this.ctx.fillRect(x, y, 2, GAME_CONFIG.BLOCK_HEIGHT)

    this.ctx.fillStyle = 'rgba(0,0,0,0.15)'
    this.ctx.fillRect(x, y + GAME_CONFIG.BLOCK_HEIGHT - 2, w, 2)
  }

  private drawFallingPieces() {
    this.fallingPieces.forEach((piece, i) => {
      piece.vy += 0.5
      piece.y += piece.vy
      piece.x += piece.vx
      piece.rot += piece.rotSpeed

      const screenY = piece.y + this.cameraY
      if (screenY > this.H + 100) {
        this.fallingPieces.splice(i, 1)
        return
      }

      this.ctx.save()
      this.ctx.translate(piece.x + piece.w / 2, screenY + GAME_CONFIG.BLOCK_HEIGHT / 2)
      this.ctx.rotate(piece.rot)
      this.ctx.globalAlpha = Math.max(0, 1 - (screenY / this.H) * 0.5)
      this.drawBlock(-piece.w / 2, -GAME_CONFIG.BLOCK_HEIGHT / 2, piece.w, piece.color)
      this.ctx.globalAlpha = 1
      this.ctx.restore()
    })
  }

  private drawParticles() {
    this.particles.forEach((p, i) => {
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.rot += p.rotSpeed

      if (p.life <= 0) {
        this.particles.splice(i, 1)
        return
      }

      this.ctx.save()
      this.ctx.globalAlpha = p.life
      this.ctx.translate(p.x, p.y)
      this.ctx.rotate(p.rot)
      this.ctx.fillStyle = p.color
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      this.ctx.globalAlpha = 1
      this.ctx.restore()
    })
  }

  private drawFloatTexts() {
    this.floatTexts.forEach((ft, i) => {
      ft.life -= 0.015
      ft.y -= 1.2

      if (ft.life <= 0) {
        this.floatTexts.splice(i, 1)
        return
      }

      this.ctx.save()
      this.ctx.globalAlpha = ft.life
      this.ctx.fillStyle = ft.color
      this.ctx.font = `bold ${ft.size}px sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.shadowColor = ft.color
      this.ctx.shadowBlur = 10
      this.ctx.fillText(ft.text, ft.x, ft.y)
      this.ctx.shadowBlur = 0
      this.ctx.globalAlpha = 1
      this.ctx.restore()
    })
  }

  private drawWeather() {
    if (this.currentWeather === 'rainy') {
      this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)'
      this.ctx.lineWidth = 1
      this.weatherParticles.forEach(p => {
        p.y += p.speed
        if (p.y > this.H) { p.y = -10; p.x = Math.random() * this.W }
        this.ctx.beginPath()
        this.ctx.moveTo(p.x, p.y)
        this.ctx.lineTo(p.x + 2, p.y + 10)
        this.ctx.stroke()
      })
    } else if (this.currentWeather === 'snowy') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      this.weatherParticles.forEach(p => {
        p.y += p.speed
        p.x += Math.sin(p.y * 0.02) * 0.5
        if (p.y > this.H) { p.y = -10; p.x = Math.random() * this.W }
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        this.ctx.fill()
      })
    }
  }

  private drawCharacters() {
    this.characters.forEach((char, i) => {
      char.x += (char.targetX - char.x) * 0.03
      char.frameTimer++
      if (char.frameTimer > 15) { char.frame = (char.frame + 1) % 4; char.frameTimer = 0 }

      if (char.y + this.cameraY < -30 || char.y + this.cameraY > this.H + 30) {
        this.characters.splice(i, 1)
        return
      }

      const screenY = char.y + this.cameraY
      this.ctx.save()
      this.ctx.translate(char.x, screenY)

      const emojis = CHARACTER_CONFIG[char.type].emojis
      const emoji = emojis[char.frame]

      this.ctx.font = '24px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(emoji, 0, 0)
      this.ctx.restore()
    })
  }

  private drawBubbles() {
    this.bubbles.forEach((bubble, i) => {
      bubble.y -= bubble.speed
      bubble.wobble += bubble.wobbleSpeed
      bubble.x += Math.sin(bubble.wobble) * 0.5

      if (bubble.y < -bubble.size) {
        this.bubbles.splice(i, 1)
        return
      }

      this.ctx.save()
      this.ctx.globalAlpha = 0.6
      this.ctx.fillStyle = bubble.color
      this.ctx.beginPath()
      this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      this.ctx.beginPath()
      this.ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.restore()
    })
  }

  private drawRainbowParticles() {
    this.rainbowParticles.forEach((rp, i) => {
      rp.x += rp.vx
      rp.y += rp.vy
      rp.life -= 0.01
      rp.vy += 0.05

      if (rp.life <= 0) {
        this.rainbowParticles.splice(i, 1)
        return
      }

      this.ctx.save()
      this.ctx.globalAlpha = rp.life
      this.ctx.fillStyle = rp.color
      this.ctx.beginPath()
      this.ctx.arc(rp.x, rp.y, rp.size, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.restore()
    })
  }

  private drawHUD() {
    const layers = this.layers.length - 1
    const perfectLabel =
      this.comboPerfect >= 2 ? ` · 连续完美 ${this.comboPerfect}` : ''
    const multLabel = this.scoreMultiplier > 1 ? ` · ⭐×${this.scoreMultiplier}` : ''
    const shieldLabel = this.hasShield ? ' · 🛡️' : ''

    this.ctx.fillStyle = 'rgba(0,0,0,0.45)'
    this.ctx.beginPath()
    this.ctx.roundRect(10, 8, this.W - 20, 40, 10)
    this.ctx.fill()
    this.ctx.fillStyle = '#A8E6CF'
    this.ctx.font = 'bold 16px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      `已叠 ${layers} 层${perfectLabel}${multLabel}${shieldLabel}`,
      this.W / 2,
      28,
    )

    if (!this.gameStarted) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)'
      this.ctx.fillRect(0, this.H / 2 - 60, this.W, 120)
      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 24px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('🏗️ 叠叠乐', this.W / 2, this.H / 2 - 15)
      this.ctx.font = 'bold 20px sans-serif'
      this.ctx.fillText('👆 点击屏幕放置方块', this.W / 2, this.H / 2 + 15)
      this.ctx.font = '14px sans-serif'
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)'
      this.ctx.fillText('⭐ 奖励方块 +500分 | 🍀 幸运方块 | 📐 加宽方块', this.W / 2, this.H / 2 + 45)
    }
  }

  private lightenColor(hex: string, amt: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + amt)
    const g = Math.min(255, ((num >> 8) & 0xFF) + amt)
    const b = Math.min(255, (num & 0xFF) + amt)
    return `rgb(${r},${g},${b})`
  }

  private darkenColor(hex: string, amt: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - amt)
    const g = Math.max(0, ((num >> 8) & 0xFF) - amt)
    const b = Math.max(0, (num & 0xFF) - amt)
    return `rgb(${r},${g},${b})`
  }

  private handleTap() {
    if (this.gameEnded) return
    if (!this.gameStarted) this.gameStarted = true
    this.placeBlock()
  }

  private loop() {
    if (!document.getElementById('mainGameCanvas') || this.gameEnded) {
      if (this.gameEnded && (this.fallingPieces.length > 0 || this.particles.length > 0)) {
        this.updateFallingPieces()
        this.draw()
        requestAnimationFrame(() => this.loop())
      }
      return
    }

    if (!this.engine.canTick()) {
      this.draw()
      requestAnimationFrame(() => this.loop())
      return
    }

    if (!this.timeStopped) {
      this.currentBlock.x += this.currentBlock.dir
      if (this.currentBlock.x + this.currentBlock.w > this.W) this.currentBlock.dir = -Math.abs(this.currentBlock.dir)
      if (this.currentBlock.x < 0) this.currentBlock.dir = Math.abs(this.currentBlock.dir)
    }

    if (this.gameStarted) {
      this.weatherTimer++
      if (this.weatherTimer > 1800) { this.weatherTimer = 0; this.switchWeather() }

      this.nextCharTimer++
      if (this.nextCharTimer > 900 && Math.random() > 0.7) { this.nextCharTimer = 0; this.spawnCharacter() }

      if (Math.random() > 0.95) this.spawnBubble()
      if (Math.random() > 0.98) this.createRainbowParticles(Math.random() * this.W, Math.random() * this.H, 5)
    }

    this.updateFallingPieces()
    this.draw()
    requestAnimationFrame(() => this.loop())
  }

  private updateFallingPieces() {}

  private unbindPointer: (() => void) | null = null

  start() {
    this.unbindPointer?.()
    this.unbindPointer = bindCanvasPointerInput(this.canvas, () => this.handleTap())
    this.engine.start()
    this.draw()
    this.loop()
  }
}