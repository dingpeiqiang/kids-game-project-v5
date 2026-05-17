import Phaser from 'phaser'
import Plant from '../models/plant.js'
import Sunflower from '../models/sunflower.js'
import Wallnut from '../models/wallnut.js'
import IceShooter from '../models/iceshooter.js'
import Repeater from '../models/repeater.js'
import CherryBomb from '../models/cherrybomb.js'
import PotatoMine from '../models/potatomine.js'
import Zombie from '../models/zombie.js'
import Sun from '../models/sun.js'
import SeedCard from '../ui/SeedCard.js'
// 导入道具类
import FreezeItem from '../models/FreezeItem.js'
import DoubleSunItem from '../models/DoubleSunItem.js'
import PlantBoostItem from '../models/PlantBoostItem.js'
import CherryBombItem from '../models/CherryBombItem.js'
import DoomShroomItem from '../models/DoomShroomItem.js'

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' })
  }

  create() {
    // 停止之前可能存在的 BGM（防止重复播放）
    if (this.bgMusic) {
      this.bgMusic.stop()
      this.bgMusic.destroy()
      this.bgMusic = null
    }
    
    const C = window.GAME_CONFIG
    const W = C.BASE_W
    const H = C.BASE_H
    const UI_H = C.UI_H
    const GAME_Y = C.GAME_Y
    const GAME_H = C.GAME_H
    const GL = C.GRID_LEFT
    const COLS = C.COLS
    const CELL = C.CELL
    const GRID_RIGHT = C.GRID_RIGHT

    // 传递布局常量
    Object.keys(C).forEach(k => { this.game[k] = C[k] })

    this.physics.world.setBounds(0, 0, W, H)
    this.cameras.main.setSize(W, H)

    // ═══ 物理组（必须在 drawLawnmowers 之前创建） ═══
    this.plants = this.physics.add.group()
    this.projectiles = this.physics.add.group({ maxSize: 80 })
    this.zombies = this.physics.add.group()
    this.lawnmowerGroup = this.physics.add.group()  // 割草机组

    // ═══ 草地背景 ═══
    // 使用1100x580全屏草地背景图，完美匹配游戏分辨率
    const grassBg = this.add.image(W / 2, H / 2, 'grass')
      .setDepth(-10)
    // 图片尺寸与游戏分辨率一致，无需缩放
    // grass_bg.png 尺寸: 1100 x 580

    // ═══ 网格（交替色棋盘） ═══
    this.drawGrid()

    // ═══ 割草机区域 ═══
    this.drawLawnmowers()

    // ═══ 顶部卡片栏 ═══
    this.add.rectangle(0, 0, W, UI_H, 0x3a1f0d).setOrigin(0, 0).setDepth(98)
    this.add.rectangle(0, UI_H - 2, W, 3, 0x8B4513).setOrigin(0, 0).setDepth(99)

    // ═══ 游戏状态 ═══
    this.sunCount = 150
    this.selectedPlantType = null  // 初始不选择任何植物
    this.shovelMode = false
    this.isPaused = false
    this.gameOver = false
    this.levelComplete = false
    this.gameStarted = false
    this.relaxMode = false
    this.countdownEnded = false  // 防止 endCountdown 重复调用
    
    // 无尽模式配置
    this.endlessMode = true  // 启用无尽模式
    this.survivalTime = 0  // 生存时间（秒）
    this.totalKills = 0  // 总击杀数
    this.difficultyLevel = 1  // 难度等级
    this.zombieSpawnInterval = 3500  // 初始僵尸生成间隔（毫秒）
    this.minSpawnInterval = 800  // 最小生成间隔
    
    // 无尽模式平衡性调整
    this.sunProductionRate = 6000  // 天空阳光生成间隔（比原版快）
    this.sunflowerIncome = 75  // 向日葵产出阳光增加
    
    // 道具系统配置
    this.itemSpawnRate = 45000  // 道具生成间隔（45秒）
    this.doubleSunMode = false  // 双倍阳光模式
    this.itemsCollected = 0  // 收集道具数量
    
    // 植物预览
    this.plantPreview = null

    // ═══ UI ═══
    this.createSunDisplay()
    this.createScoreDisplay()
    this.createSeedBar()
    this.createShovelButton()
    this.createEndlessModeDisplay()  // 无尽模式显示
    this.createItemDisplay()  // 道具显示

    // ═══ 事件 ═══
    this.physics.add.overlap(this.zombies, this.plants, this.handleZombiePlantCollision, null, this)
    this.physics.add.overlap(this.zombies, this.lawnmowerGroup, this.handleZombieMowerCollision, null, this)
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))
    this.input.on('pointermove', (pointer) => this.handlePointerMove(pointer))

    this.startCountdown()
  }

  // ── 倒计时 ──
  startCountdown() {
    const W = this.game.BASE_W
    const H = this.game.BASE_H

    this.countdownOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(2000)
    this.countdownText = this.add.text(W / 2, H / 2 - 40, '准备开始!', {
      fontSize: '32px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    this.countdownNumber = this.add.text(W / 2, H / 2 + 20, '3', {
      fontSize: '72px', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)

    let count = 3
    this.countdownNumber.setText(count.toString())

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        count--
        if (count > 0) {
          this.countdownNumber.setText(count.toString())
          this.tweens.add({ targets: this.countdownNumber, scale: 1.5, duration: 200, yoyo: true })
        } else if (count === 0) {
          this.countdownNumber.setText('开始!')
          this.countdownText.setText('保护你的脑子!')
        } else {
          this.endCountdown()
        }
      },
      callbackScope: this,
      repeat: 4
    })
  }

  endCountdown() {
    // 防止重复调用
    if (this.countdownEnded) {
      console.warn('[PlayScene] endCountdown 已被调用，跳过')
      return
    }
    this.countdownEnded = true
    
    if (this.countdownOverlay) {
      this.countdownOverlay.destroy()
      this.countdownText.destroy()
      this.countdownNumber.destroy()
    }

    this.gameStarted = true

    // 播放背景音乐
    if (this.cache.audio.exists('bgMusic')) {
      // 确保先停止并销毁任何现有的 BGM 实例
      if (this.bgMusic) {
        console.warn('[PlayScene] 检测到已存在的 BGM 实例，正在清理...')
        this.bgMusic.stop()
        this.bgMusic.destroy()
        this.bgMusic = null
      }
      
      // 创建新的 BGM 实例
      this.bgMusic = this.sound.add('bgMusic', { loop: true })
      this.bgMusic.volume = 0.4  // 单独设置音量
      this.bgMusic.play()
      console.log('[PlayScene] ✅ BGM 开始播放 | 时长:', this.bgMusic.duration.toFixed(1), '秒 | 音量:', this.bgMusic.volume)
    } else {
      console.warn('[PlayScene] ❌ bgMusic 音频资源未找到')
    }

    this.sounds = {}
    if (this.cache.audio.exists('peaShoot')) {
      this.sounds.peaShoot = this.sound.add('peaShoot')
    }
    if (this.cache.audio.exists('splat')) {
      this.sounds.splat = this.sound.add('splat')
    }
    if (this.cache.audio.exists('zombiesAreComing')) {
      this.sounds.zombiesAreComing = this.sound.add('zombiesAreComing')
      this.sounds.zombiesAreComing.volume = 0.5  // 单独设置音量
      // 延迟 2 秒播放，让 BGM 先建立氛围
      this.time.delayedCall(2000, () => {
        if (this.sounds.zombiesAreComing && !this.gameOver && !this.levelComplete) {
          this.sounds.zombiesAreComing.play()
        }
      })
    }

    // 僵尸生成定时器（使用动态间隔）
    this.startZombieSpawning()

    // 阳光生成（无尽模式加快频率）
    this.time.addEvent({ 
      delay: this.sunProductionRate, 
      callback: () => this.spawnSkySun(), 
      loop: true 
    })
    this.time.delayedCall(2000, () => this.spawnSkySun())

    // 生存时间计时器
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.gameOver && !this.levelComplete) {
          this.survivalTime++
          this.updateEndlessModeDisplay()
          this.checkDifficultyIncrease()
        }
      },
      loop: true
    })
    
    // 道具生成定时器
    this.time.addEvent({
      delay: this.itemSpawnRate,
      callback: () => this.spawnRandomItem(),
      loop: true
    })
    // 首次道具提前生成（15秒后）
    this.time.delayedCall(15000, () => this.spawnRandomItem())

    this.input.keyboard.on('keydown-ESC', () => this.togglePause(), this)

    // 子弹-僵尸碰撞
    this.physics.add.overlap(this.projectiles, this.zombies, this.handleZombieHit, null, this)
  }

  // ── 网格绘制 ──
  drawGrid() {
    const GL = this.game.GRID_LEFT
    const COLS = this.game.COLS
    const ROWS = this.game.ROWS
    const CELL = this.game.CELL
    const GY = this.game.GAME_Y

    const grid = this.add.graphics().setDepth(-5)

    // 只绘制细网格线，不绘制交替色棋盘（让草地图片完整显示）
    grid.lineStyle(1, 0x3a6c1e, 0.3)
    for (let r = 0; r <= ROWS; r++) {
      grid.moveTo(GL, GY + r * CELL)
      grid.lineTo(GL + COLS * CELL, GY + r * CELL)
    }
    for (let c = 0; c <= COLS; c++) {
      grid.moveTo(GL + c * CELL, GY)
      grid.lineTo(GL + c * CELL, GY + ROWS * CELL)
    }
    grid.strokePath()
  }

  // ── 割草机 ──
  drawLawnmowers() {
    const GL = this.game.GRID_LEFT
    const CELL = this.game.CELL
    const GY = this.game.GAME_Y
    const ROWS = this.game.ROWS

    // 割草机背景条
    this.add.rectangle(GL / 2, GY + (ROWS * CELL) / 2, GL, ROWS * CELL, 0x5a4030, 0.3)
      .setOrigin(0.5).setDepth(-8)

    this.lawnmowers = []
    for (let r = 0; r < ROWS; r++) {
      const x = GL / 2
      const y = GY + r * CELL + CELL / 2
      const mowerSprite = this.add.image(x, y, 'lawnmower').setScale(0.7).setDepth(50)

      // 添加物理碰撞体并加入组
      this.physics.add.existing(mowerSprite)
      mowerSprite.body.setSize(60, 60)
      mowerSprite.body.setAllowGravity(false)
      mowerSprite.body.setImmovable(true)
      mowerSprite.body.enable = true
      
      // 添加到物理组，以便碰撞检测
      this.lawnmowerGroup.add(mowerSprite)

      this.lawnmowers.push({ sprite: mowerSprite, row: r, active: true, isActive: true })
    }
  }

  // ── 阳光 UI（左侧区域，包含积分）──
  createSunDisplay() {
    const UI_H = this.game.UI_H
    const leftX = 20
    const centerX = 60

    // 第一行：阳光图标 + 数量
    this.add.image(leftX + 10, UI_H / 2 - 15, 'sun').setScale(0.4).setDepth(101)
    this.sunText = this.add.text(leftX + 30, UI_H / 2 - 15, this.sunCount.toString(), {
      fontSize: '18px', fill: '#FFD700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(101)

    // 第二行：积分
    this.scoreText = this.add.text(centerX, UI_H / 2 + 8, '0', {
      fontSize: '14px', fill: '#00FF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 1
    }).setOrigin(0.5).setDepth(101)

    // 无尽模式：不显示波次信息，右侧有生存时间和击杀数
  }

  addSun(amount) {
    this.sunCount += amount
    this.updateSunDisplay()
    this.showSunGainAnimation(amount)
  }

  spendSun(amount) {
    if (this.sunCount >= amount) {
      this.sunCount -= amount
      this.updateSunDisplay()
      return true
    }
    return false
  }

  updateSunDisplay() {
    this.sunText.setText(this.sunCount.toString())
    this.tweens.add({ targets: this.sunText, scale: 1.2, duration: 150, yoyo: true })
    if (this.seedCards) {
      this.seedCards.forEach(card => card.updateAvailability(this.sunCount))
    }
  }

  showSunGainAnimation(amount) {
    const text = this.add.text(70, 50, `+${amount}`, {
      fontSize: '20px', fill: '#FFFF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({
      targets: text, y: 10, alpha: 0, duration: 800,
      onComplete: () => text.destroy()
    })
  }

  spawnSkySun() {
    const W = this.game.BASE_W
    const x = Phaser.Math.Between(this.game.GRID_LEFT + 50, W - 100)
    new Sun(this, x, -50, 'sky')
  }

  // ── 分数 UI（已合并到阳光显示区域）──
  createScoreDisplay() {
    // 分数显示已移至 createSunDisplay
  }

  addScore(amount) {
    this.score += amount
    console.log('[PlayScene] 💰 加分:', amount, '| 总分:', this.score)
    if (this.scoreText) this.scoreText.setText(this.score.toString())
    this.tweens.add({ targets: this.scoreText, scale: 1.3, duration: 150, yoyo: true })
  }

  // ── 卡片栏 ──
  createSeedBar() {
    this.seedCards = []
    const plants = [
      { type: 'sunflower',  cost: 50,  icon: 'sunflower' },
      { type: 'peashooter', cost: 100, icon: 'peashooter' },
      { type: 'iceshooter', cost: 175, icon: 'iceshooter' },
      { type: 'repeater',   cost: 200, icon: 'repeater' },
      { type: 'cherrybomb', cost: 150, icon: 'cherrybomb' },
      { type: 'potatomine', cost: 25,  icon: 'potatomine' },
      { type: 'wallnut',    cost: 50,  icon: 'wallnut' }
    ]

    const cardW = 60
    const cardH = 65
    const gap = 65
    // 计算居中起始位置：阳光区(100px) + 卡片区(7*65=455px) + 右侧区(150px) = 705px 总宽度
    // 居中放置：(1100 - 705) / 2 + 100 ≈ 100 (从阳光区后开始)
    const startX = 100 + gap / 2

    plants.forEach((plant, index) => {
      const x = startX + index * gap
      const y = this.game.UI_H / 2
      const card = new SeedCard(this, x, y, plant.type, plant.cost, plant.icon, cardW, cardH)
      this.seedCards.push(card)
    })

    // 初始不默认选择任何卡片
    // if (this.seedCards.length > 0) this.seedCards[0].select()
  }

  // ── 铲子（卡牌样式，使用图片素材）──
  createShovelButton() {
    const W = this.game.BASE_W
    const UI_H = this.game.UI_H

    // 铲子卡牌放在波次进度左边
    const cardW = 50
    const cardH = 55
    const sx = W - 110
    const sy = UI_H / 2

    // 创建容器
    this.shovelCard = this.add.container(sx, sy).setDepth(100)

    // 卡牌背景（棕色系）
    this.shovelBg = this.add.rectangle(0, 0, cardW, cardH, 0x8B4513)
      .setStrokeStyle(2, 0x654321)
    this.shovelCard.add(this.shovelBg)

    // 铲子图片素材
    const shovelIcon = this.add.image(0, -2, 'shovel')
      .setScale(0.4)
    this.shovelCard.add(shovelIcon)

    // 选中边框（默认隐藏）
    this.shovelSelectBorder = this.add.rectangle(0, 0, cardW + 4, cardH + 4)
      .setStrokeStyle(3, 0xFFFF00)
      .setFillStyle()
      .setVisible(false)
    this.shovelCard.add(this.shovelSelectBorder)

    // 交互
    this.shovelBg.setInteractive({ useHandCursor: true })
    this.shovelBg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.toggleShovelMode()
    })
    this.shovelBg.on('pointerover', () => {
      if (!this.shovelMode) this.shovelBg.setFillStyle(0xA0522D)
    })
    this.shovelBg.on('pointerout', () => {
      if (!this.shovelMode) this.shovelBg.setFillStyle(0x8B4513)
    })
  }

  toggleShovelMode() {
    this.shovelMode = !this.shovelMode
    if (this.shovelMode) {
      // 选中铲子，取消植物选择
      this.shovelBg.setFillStyle(0xFFD700)
      this.shovelSelectBorder.setVisible(true)
      this.seedCards.forEach(card => card.deselect())
      this.selectedPlantType = null
    } else {
      // 取消铲子选择
      this.shovelBg.setFillStyle(0x8B4513)
      this.shovelSelectBorder.setVisible(false)
    }
  }

  removePlant(plant) {
    this.tweens.add({
      targets: plant, alpha: 0, scale: 0.3, duration: 300,
      onComplete: () => plant.destroy()
    })
    this.shovelMode = false
    this.shovelBg.setFillStyle(0x8B4513)
    this.shovelSelectBorder.setVisible(false)
  }

  // ── 设置按钮 ──
  createSettingsButton() {
    const W = this.game.BASE_W
    const UI_H = this.game.UI_H

    this.settingsBtnBg = this.add.rectangle(W - 130, UI_H / 2, 45, 45, 0x5D4037)
      .setStrokeStyle(2, 0x4E342E).setDepth(100)

    const sgx = W - 130
    const sgy = UI_H / 2
    const settingsIcon = this.add.graphics().setDepth(101)
    settingsIcon.fillStyle(0xFFFFFF, 1)
    settingsIcon.fillCircle(sgx, sgy, 12)
    settingsIcon.fillStyle(0x5D4037, 1)
    settingsIcon.fillCircle(sgx, sgy, 7)
    settingsIcon.fillStyle(0xFFFFFF, 1)
    settingsIcon.fillCircle(sgx, sgy, 3)

    this.settingsBtnBg.setInteractive({ useHandCursor: true })
    this.settingsBtnBg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.toggleSettingsPanel()
    })
    this.settingsBtnBg.on('pointerover', () => { this.settingsBtnBg.setFillStyle(0x6D4C41) })
    this.settingsBtnBg.on('pointerout', () => { this.settingsBtnBg.setFillStyle(0x5D4037) })
  }

  toggleSettingsPanel() {
    if (this.settingsPanelVisible) this.hideSettingsPanel()
    else this.showSettingsPanel()
  }

  showSettingsPanel() {
    const W = this.game.BASE_W
    const H = this.game.BASE_H
    this.settingsPanelVisible = true

    this.settingsOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(2400)
    this.settingsOverlay.setInteractive()
    this.settingsOverlay.on('pointerdown', () => this.hideSettingsPanel())

    this.settingsPanel = this.add.rectangle(W / 2, H / 2, 360, 300, 0x2C3E50)
      .setStrokeStyle(3, 0x3498DB).setDepth(2401)

    this.add.text(W / 2, H / 2 - 110, '游戏设置', {
      fontSize: '26px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2402)

    // 音效
    const soundBtn = this.add.rectangle(W / 2, H / 2 - 50, 260, 45, 0x34495E)
      .setInteractive({ useHandCursor: true }).setDepth(2401)
    this.add.text(W / 2 - 70, H / 2 - 50, '音效:', {
      fontSize: '18px', fill: '#FFFFFF'
    }).setOrigin(0, 0.5).setDepth(2402)
    this.soundStatusText = this.add.text(W / 2 + 60, H / 2 - 50, '开启', {
      fontSize: '18px', fill: '#00FF00', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(2402)
    soundBtn.on('pointerdown', () => this.toggleSound())

    // 解压模式
    const relaxBtn = this.add.rectangle(W / 2, H / 2 + 10, 260, 45, 0x34495E)
      .setInteractive({ useHandCursor: true }).setDepth(2401)
    this.add.text(W / 2 - 70, H / 2 + 10, '解压模式:', {
      fontSize: '18px', fill: '#FFFFFF'
    }).setOrigin(0, 0.5).setDepth(2402)
    this.relaxStatusText = this.add.text(W / 2 + 60, H / 2 + 10, this.relaxMode ? '开启' : '关闭', {
      fontSize: '18px', fill: this.relaxMode ? '#00FF00' : '#FF0000', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(2402)
    relaxBtn.on('pointerdown', () => this.toggleRelaxMode())

    // 关闭
    const closeBtn = this.add.rectangle(W / 2, H / 2 + 80, 150, 45, 0xE74C3C)
      .setInteractive({ useHandCursor: true }).setDepth(2401)
    this.add.text(W / 2, H / 2 + 80, '关闭', {
      fontSize: '20px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2402)
    closeBtn.on('pointerdown', () => this.hideSettingsPanel())
    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0xC0392B))
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0xE74C3C))
  }

  hideSettingsPanel() {
    this.settingsPanelVisible = false
    ;['settingsOverlay', 'settingsPanel', 'soundStatusText', 'relaxStatusText'].forEach(k => {
      if (this[k]) this[k].destroy()
    })
  }

  toggleSound() {
    if (this.soundEnabled === undefined) this.soundEnabled = true
    this.soundEnabled = !this.soundEnabled
    this.soundStatusText.setText(this.soundEnabled ? '开启' : '关闭')
    this.soundStatusText.setFill(this.soundEnabled ? '#00FF00' : '#FF0000')
    this.sound.mute = !this.soundEnabled
  }

  toggleRelaxMode() {
    this.relaxMode = !this.relaxMode
    this.relaxStatusText.setText(this.relaxMode ? '开启' : '关闭')
    this.relaxStatusText.setFill(this.relaxMode ? '#00FF00' : '#FF0000')
    if (this.relaxMode) {
      this.sunCount = 500
      this.updateSunDisplay()
      const hint = this.add.text(this.game.BASE_W / 2, this.game.BASE_H / 2, '解压模式启动!', {
        fontSize: '28px', fill: '#00FF00', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: hint, alpha: 0, duration: 2000, onComplete: () => hint.destroy() })
    }
  }

  // ── 无尽模式显示 ──
  createEndlessModeDisplay() {
    const W = this.game.BASE_W
    const UI_H = this.game.UI_H
    
    // 右侧显示区域
    const rightX = W - 180
    
    // 生存时间
    this.add.text(rightX, UI_H / 2 - 15, '⏱️', {
      fontSize: '16px'
    }).setOrigin(0, 0.5).setDepth(101)
    
    this.survivalTimeText = this.add.text(rightX + 25, UI_H / 2 - 15, '0s', {
      fontSize: '16px', fill: '#00FFFF', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(101)
    
    // 击杀数
    this.add.text(rightX, UI_H / 2 + 8, '💀', {
      fontSize: '16px'
    }).setOrigin(0, 0.5).setDepth(101)
    
    this.killsText = this.add.text(rightX + 25, UI_H / 2 + 8, '0', {
      fontSize: '16px', fill: '#FF6B6B', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(101)
    
    // 难度等级
    this.add.text(rightX, UI_H / 2 + 28, '📊', {
      fontSize: '14px'
    }).setOrigin(0, 0.5).setDepth(101)
    
    this.difficultyText = this.add.text(rightX + 25, UI_H / 2 + 28, 'Lv.1', {
      fontSize: '14px', fill: '#FFD700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 1
    }).setOrigin(0, 0.5).setDepth(101)
  }
  
  // ── 道具显示 ──
  createItemDisplay() {
    const W = this.game.BASE_W
    const UI_H = this.game.UI_H
    
    // 左侧下方显示道具统计
    this.itemCountText = this.add.text(20, UI_H - 25, '🎁 0', {
      fontSize: '14px', fill: '#FF69B4', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(101)
  }
  
  updateItemDisplay() {
    if (this.itemCountText) {
      this.itemCountText.setText(`🎁 ${this.itemsCollected}`)
    }
  }
  
  updateEndlessModeDisplay() {
    if (this.survivalTimeText) {
      const minutes = Math.floor(this.survivalTime / 60)
      const seconds = this.survivalTime % 60
      const timeStr = minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`
      this.survivalTimeText.setText(timeStr)
    }
    
    if (this.killsText) {
      this.killsText.setText(this.totalKills.toString())
    }
    
    if (this.difficultyText) {
      this.difficultyText.setText(`Lv.${this.difficultyLevel}`)
    }
  }
  
  checkDifficultyIncrease() {
    // 无尽模式：每20秒提升一次难度（更快更刺激）
    const newLevel = Math.floor(this.survivalTime / 20) + 1
    
    if (newLevel > this.difficultyLevel) {
      this.difficultyLevel = newLevel
      
      // 缩短僵尸生成间隔（更激进的递减）
      this.zombieSpawnInterval = Math.max(
        this.minSpawnInterval,
        3500 - (this.difficultyLevel - 1) * 400  // 每级减少400ms
      )
      
      // 重启生成定时器
      this.restartZombieSpawning()
      
      // 显示难度提升提示
      this.showDifficultyUpNotification()
      
      // 高难度时增加视觉特效
      if (this.difficultyLevel >= 10) {
        this.addScreenShake()
      }
    }
  }
  
  showDifficultyUpNotification() {
    const W = this.game.BASE_W
    const H = this.game.BASE_H
    
    const notifyText = this.add.text(W / 2, H / 2 - 100, `⚠️ 难度提升至 Lv.${this.difficultyLevel}!`, {
      fontSize: '32px', fill: '#FF4444', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(2001)
    
    // 震动效果
    if (this.difficultyLevel >= 5) {
      this.cameras.main.shake(300, 0.01)
    }
    if (this.difficultyLevel >= 10) {
      this.cameras.main.shake(500, 0.02)
    }
    
    this.tweens.add({
      targets: notifyText,
      alpha: 0,
      y: H / 2 - 180,
      duration: 2500,
      onComplete: () => notifyText.destroy()
    })
  }
  
  // 屏幕震动效果
  addScreenShake() {
    this.cameras.main.shake(200, 0.005)
  }
  
  startZombieSpawning() {
    if (this.zombieSpawnTimer) {
      this.zombieSpawnTimer.remove()
    }
    
    this.zombieSpawnTimer = this.time.addEvent({
      delay: this.zombieSpawnInterval,
      callback: this.spawnZombie,
      callbackScope: this,
      loop: true
    })
  }
  
  restartZombieSpawning() {
    this.startZombieSpawning()
  }

  // ── 僵尸生成（无尽模式）──
  spawnZombie() {
    if (this.gameOver || this.levelComplete) return

    // 根据难度等级决定僵尸类型（更激进的解锁）
    let types = ['normal']
    
    if (this.difficultyLevel >= 2) {
      types.push('conehead', 'conehead')
    }
    if (this.difficultyLevel >= 3) {
      types.push('buckethead', 'newspaper')
    }
    if (this.difficultyLevel >= 4) {
      types.push('football')  // 橄榄球僵尸
    }
    if (this.difficultyLevel >= 5) {
      types.push('dancer', 'balloon')  // 舞王和气球
    }
    if (this.difficultyLevel >= 6) {
      types.push('miner', 'buckethead', 'buckethead')
    }
    if (this.difficultyLevel >= 8) {
      types.push('gargantuar')  // 巨人僵尸登场！
    }
    if (this.difficultyLevel >= 10) {
      // 高难度时大量高级僵尸
      types.push('gargantuar', 'football', 'football', 'dancer', 'balloon')
    }
    if (this.difficultyLevel >= 15) {
      // 极高难度：僵尸海
      types.push('gargantuar', 'gargantuar', 'football', 'football', 'dancer')
    }

    const type = types[Phaser.Math.Between(0, types.length - 1)]
    new Zombie(this, type)
  }
  
  // ── 道具生成系统 ──
  spawnRandomItem() {
    if (this.gameOver || this.levelComplete) return
    
    const W = this.game.BASE_W
    const H = this.game.BASE_H
    const GL = this.game.GRID_LEFT
    const GY = this.game.GAME_Y
    const GRID_W = this.game.GRID_W
    const GAME_H = this.game.GAME_H
    
    // 在游戏区域内随机位置生成
    const x = Phaser.Math.Between(GL + 50, GL + GRID_W - 50)
    const y = Phaser.Math.Between(GY + 50, GY + GAME_H - 50)
    
    // 随机选择道具类型（加权概率）
    const itemTypes = [
      { type: 'freeze', weight: 20 },       // 20% 概率
      { type: 'double_sun', weight: 25 },   // 25% 概率
      { type: 'plant_boost', weight: 20 },  // 20% 概率
      { type: 'cherry_bomb', weight: 20 },  // 20% 概率
      { type: 'doom_shroom', weight: 15 }   // 15% 概率 - 稀有但强力
    ]
    
    const selectedItem = this.weightedRandom(itemTypes)
    
    // 创建对应道具
    switch (selectedItem.type) {
      case 'freeze':
        new FreezeItem(this, x, y)
        break
      case 'double_sun':
        new DoubleSunItem(this, x, y)
        break
      case 'plant_boost':
        new PlantBoostItem(this, x, y)
        break
      case 'cherry_bomb':
        new CherryBombItem(this, x, y)
        break
      case 'doom_shroom':
        new DoomShroomItem(this, x, y)
        break
    }
    
    console.log(`[PlayScene] 🎁 生成道具: ${selectedItem.type} at (${x}, ${y})`)
  }
  
  // 加权随机选择
  weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const item of items) {
      random -= item.weight
      if (random <= 0) {
        return item
      }
    }
    
    return items[0]
  }

  showVictoryScreen() {
    // 停止背景音乐
    if (this.bgMusic) {
      this.bgMusic.stop()
      console.log('[PlayScene] BGM 已停止')
    }
    
    const W = this.game.BASE_W
    const H = this.game.BASE_H
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(3000)
    this.add.text(W / 2, H / 2 - 80, '🎉 关卡完成!', {
      fontSize: '44px', fill: '#00FF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(3001)
    
    // 无尽模式统计
    const minutes = Math.floor(this.survivalTime / 60)
    const seconds = this.survivalTime % 60
    const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
    
    this.add.text(W / 2, H / 2 - 20, `⏱️ 生存时间: ${timeStr}`, {
      fontSize: '22px', fill: '#00FFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3001)
    
    this.add.text(W / 2, H / 2 + 20, `💀 击杀僵尸: ${this.totalKills}`, {
      fontSize: '22px', fill: '#FF6B6B', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3001)
    
    this.add.text(W / 2, H / 2 + 60, `🏆 最终得分: ${this.score}`, {
      fontSize: '24px', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3001)
    
    this.add.text(W / 2, H / 2 + 110, '点击返回标题', {
      fontSize: '20px', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(3001)
    this.input.once('pointerdown', () => this.scene.start('TitleScene'))
  }

  // ── 暂停 ──
  togglePause() {
    if (this.gameOver || this.levelComplete) return
    this.isPaused = !this.isPaused
    if (this.isPaused) {
      this.physics.world.pause()
      // 暂停 BGM
      if (this.bgMusic) {
        this.bgMusic.pause()
      }
      this.showPauseMenu()
    } else {
      this.physics.world.resume()
      // 恢复 BGM
      if (this.bgMusic) {
        this.bgMusic.resume()
      }
      this.hidePauseMenu()
    }
  }

  showPauseMenu() {
    const W = this.game.BASE_W
    const H = this.game.BASE_H

    this.pauseOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(2500)
    this.pausePanel = this.add.rectangle(W / 2, H / 2, 360, 260, 0x2C3E50)
      .setStrokeStyle(3, 0x3498DB).setDepth(2501)
    this.add.text(W / 2, H / 2 - 80, '游戏暂停', {
      fontSize: '32px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2502)

    const mkBtn = (x, y, text, color) => {
      const btn = this.add.rectangle(x, y, 220, 48, color).setInteractive({ useHandCursor: true }).setDepth(2501)
      this.add.text(x, y, text, { fontSize: '20px', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2502)
      return btn
    }

    const resumeBtn = mkBtn(W / 2, H / 2 - 15, '继续游戏', 0x27AE60)
    const restartBtn = mkBtn(W / 2, H / 2 + 45, '重新开始', 0xF39C12)
    const titleBtn = mkBtn(W / 2, H / 2 + 105, '返回标题', 0xE74C3C)

    resumeBtn.on('pointerdown', () => this.togglePause())
    restartBtn.on('pointerdown', () => this.scene.restart())
    titleBtn.on('pointerdown', () => this.scene.start('TitleScene'))

    this._pauseEls = [this.pauseOverlay, this.pausePanel, resumeBtn, restartBtn, titleBtn]
  }

  hidePauseMenu() {
    if (this._pauseEls) this._pauseEls.forEach(e => e.destroy())
  }

  // ── 游戏循环 ──
  update(time, delta) {
    if (!this.gameStarted || this.isPaused) return

    // 子弹更新
    if (this.projectiles && this.projectiles.children.size > 0) {
      this.projectiles.children.each(pea => {
        if (pea.active) {
          if (pea.body && pea.body.velocity.x === 0) pea.body.velocity.x = 200
          if (pea.x > this.game.BASE_W + 50) pea.destroy()
        }
      })
    }

    // 植物更新
    if (this.plants && this.plants.children.size > 0) {
      this.plants.children.each(plant => {
        if (plant.active && plant.update) plant.update(time, delta)
      })
    }

    // 僵尸更新
    if (this.zombies && this.zombies.children.size > 0 && !this.gameOver) {
      this.zombies.children.each(zombie => {
        if (zombie.active) {
          // 检查是否突破防线
          if (zombie.checkBoundary) {
            zombie.checkBoundary(this)
          }
          // 僵尸出界销毁
          if (zombie.x < -50) {
            zombie.destroy()
          }
          
          // 检查僵尸是否应该恢复移动（如果正在攻击但附近没有植物）
          if (zombie.attackingPlant && !this.isZombieNearPlant(zombie)) {
            console.log('[PlayScene] 🧟 僵尸远离植物，恢复移动')
            if (zombie.gameData) {
              zombie.setVelocityX(zombie.isSlowed ? zombie.gameData.speed * 0.4 : zombie.gameData.speed)
            }
            if (zombie.attackTimer) {
              zombie.attackTimer.remove()
              zombie.attackTimer = null
            }
            zombie.attackingPlant = false
          }
          
          // 确保僵尸有速度（防止卡住）
          if (!zombie.attackingPlant && zombie.body && zombie.body.velocity.x === 0 && zombie.gameData) {
            zombie.setVelocityX(zombie.isSlowed ? zombie.gameData.speed * 0.4 : zombie.gameData.speed)
          }
          
          // 确保僵尸可见（防止隐身）
          if (zombie.alpha < 1 && !zombie.isFlashing) {
            console.warn('[PlayScene] 🧟 检测到僵尸透明度异常，修复中...', zombie.alpha)
            zombie.setAlpha(1)
          }
        }
      })
    }
  }
  
  // 检查僵尸附近是否有植物
  isZombieNearPlant(zombie) {
    if (!this.plants || this.plants.children.size === 0) return false
    
    let nearPlant = false
    this.plants.children.each(plant => {
      if (plant.active) {
        const dx = Math.abs(zombie.x - plant.x)
        const dy = Math.abs(zombie.y - plant.y)
        // 在同一行且水平距离较近（碰撞盒大小约60）
        if (dy < 40 && dx < 50) {
          nearPlant = true
        }
      }
    })
    return nearPlant
  }

  // ── 游戏结束画面 ──
  showGameOverScreen() {
    // 停止背景音乐
    if (this.bgMusic) {
      this.bgMusic.stop()
      console.log('[PlayScene] BGM 已停止')
    }
    
    const W = this.game.BASE_W
    const H = this.game.BASE_H

    // 暗色背景
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(3000)

    // 主标题
    const titleText = this.add.text(W / 2, H / 2 - 100, '💀 游戏结束', {
      fontSize: '52px',
      fill: '#FF4444',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(3001)

    // 副标题
    const subText = this.add.text(W / 2, H / 2 - 40, '僵尸吃掉了你的脑子！', {
      fontSize: '24px',
      fill: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3001)

    // 无尽模式统计
    const minutes = Math.floor(this.survivalTime / 60)
    const seconds = this.survivalTime % 60
    const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
    
    const statsY = H / 2 + 20
    
    // 生存时间
    this.add.text(W / 2, statsY, `⏱️ 生存时间: ${timeStr}`, {
      fontSize: '22px',
      fill: '#00FFFF',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3001)
    
    // 击杀数
    this.add.text(W / 2, statsY + 40, `💀 击杀僵尸: ${this.totalKills}`, {
      fontSize: '22px',
      fill: '#FF6B6B',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3001)
    
    // 难度等级
    this.add.text(W / 2, statsY + 80, `📊 达到难度: Lv.${this.difficultyLevel}`, {
      fontSize: '22px',
      fill: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3001)
    
    // 道具收集
    this.add.text(W / 2, statsY + 120, `🎁 收集道具: ${this.itemsCollected}`, {
      fontSize: '22px',
      fill: '#FF69B4',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3001)
    
    // 分数
    const scoreText = this.add.text(W / 2, statsY + 160, `🏆 最终得分: ${this.score}`, {
      fontSize: '26px',
      fill: '#00FF00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(3001)

    // 按钮容器
    const btnY = H / 2 + 260
    const btnSpacing = 160

    // 重新开始按钮
    const restartBtn = this.add.rectangle(W / 2 - btnSpacing, btnY, 140, 50, 0x27AE60)
      .setInteractive({ useHandCursor: true }).setDepth(3001)
    this.add.text(W / 2 - btnSpacing, btnY, '🔄 重试', {
      fontSize: '20px',
      fill: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3002)
    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x2ECC71))
    restartBtn.on('pointerout', () => restartBtn.setFillStyle(0x27AE60))
    restartBtn.on('pointerdown', () => this.scene.restart())

    // 返回标题按钮
    const titleBtn = this.add.rectangle(W / 2 + btnSpacing, btnY, 140, 50, 0xE74C3C)
      .setInteractive({ useHandCursor: true }).setDepth(3001)
    this.add.text(W / 2 + btnSpacing, btnY, '🏠 标题', {
      fontSize: '20px',
      fill: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3002)
    titleBtn.on('pointerover', () => titleBtn.setFillStyle(0xC0392B))
    titleBtn.on('pointerout', () => titleBtn.setFillStyle(0xE74C3C))
    titleBtn.on('pointerdown', () => this.scene.start('TitleScene'))

    // 标题动画
    this.tweens.add({
      targets: titleText,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    })
  }

  // ── 子弹-僵尸碰撞 ──
  handleZombieHit(projectile, zombie) {
    if (!projectile.active || !zombie.active) return
    if (this.sounds.splat) this.sounds.splat.play()

    // 冰冻效果
    if (projectile.isIcePea && !zombie.isSlowed) {
      zombie.isSlowed = true
      zombie.setTint(0x88CCFF)
      const origSpeed = zombie.gameData.speed
      zombie.setVelocityX(origSpeed * 0.4)
      this.time.delayedCall(4000, () => {
        if (zombie.active) {
          zombie.isSlowed = false
          zombie.clearTint()
          zombie.setVelocityX(origSpeed)
        }
      })
    }

    // 记录僵尸信息（在造成伤害前）
    const zombieScore = zombie.gameData ? zombie.gameData.score : 10
    const wasAlive = zombie.gameData && zombie.gameData.health > 0

    // 造成伤害
    if (zombie.takeDamage) zombie.takeDamage(1)
    projectile.destroy()

    // 检查是否死亡（takeDamage 后 health <= 0）
    if (wasAlive && zombie.gameData && zombie.gameData.health <= 0) {
      console.log('[PlayScene] 🧟 僵尸被消灭! Type:', zombie.zombieType, '| Score:', zombieScore)
      
      // 无尽模式：更新击杀数
      this.totalKills++
      this.updateEndlessModeDisplay()
      
      // 连击
      const now = Date.now()
      if (now - this.lastKillTime < 2000) this.comboCount++
      else this.comboCount = 1
      this.lastKillTime = now

      let baseScore = zombieScore
      if (this.comboCount > 1) baseScore += this.comboCount * 3
      console.log('[PlayScene] 💰 击杀得分:', baseScore, '(连击 x' + this.comboCount + ')')
      this.addScore(baseScore)
      
      // 击杀特效
      this.showKillEffect(zombie, baseScore)
      
      // 高连击时屏幕震动
      if (this.comboCount >= 5) {
        this.cameras.main.shake(100, 0.005)
      }
      if (this.comboCount >= 10) {
        this.cameras.main.shake(200, 0.01)
      }
    }
  }
  
  // 显示击杀特效
  showKillEffect(zombie, score) {
    // 分数飘字
    const scoreText = this.add.text(zombie.x, zombie.y - 30, `+${score}`, {
      fontSize: '20px',
      fill: '#FFFF00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(2001)
    
    // 连击提示
    if (this.comboCount >= 3) {
      const comboText = this.add.text(zombie.x, zombie.y - 60, `${this.comboCount} COMBO!`, {
        fontSize: '24px',
        fill: '#FF6B6B',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(2001)
      
      this.tweens.add({
        targets: comboText,
        scale: 1.5,
        duration: 200,
        yoyo: true,
        onComplete: () => {
          this.tweens.add({
            targets: comboText,
            alpha: 0,
            y: comboText.y - 50,
            duration: 800,
            onComplete: () => comboText.destroy()
          })
        }
      })
    }
    
    // 分数上漂动画
    this.tweens.add({
      targets: scoreText,
      y: scoreText.y - 80,
      alpha: 0,
      scale: 1.3,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => scoreText.destroy()
    })
    
    // 爆炸粒子效果（简单版：使用圆形Graphics）
    const particles = this.add.graphics().setDepth(1999)
    particles.fillStyle(0xFF4444, 0.8)
    particles.fillCircle(zombie.x, zombie.y, 30)
    
    this.tweens.add({
      targets: particles,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => particles.destroy()
    })
  }

  // ── 僵尸-植物碰撞 ──
  handleZombiePlantCollision(zombie, plant) {
    if (!this.gameStarted || !zombie.active || !plant.active) return
    
    // 如果已经在攻击，不要重复设置
    if (zombie.attackingPlant) return
    
    // 停止移动
    const origSpeed = zombie.gameData ? zombie.gameData.speed : -25
    zombie.setVelocityX(0)
    zombie.attackingPlant = true
    
    console.log('[PlayScene] 🧟 僵尸开始攻击植物 | Row:', zombie.gameData?.row)

    // 启动攻击定时器
    zombie.attackTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        // 检查植物是否还存在
        if (!plant.active || !plant.body) {
          // 植物已被摧毁，恢复移动
          console.log('[PlayScene] 🧟 植物被摧毁，僵尸恢复移动')
          if (zombie.active && zombie.gameData) {
            zombie.setVelocityX(zombie.gameData.speed)
          }
          if (zombie.attackTimer) {
            zombie.attackTimer.remove()
            zombie.attackTimer = null
          }
          zombie.attackingPlant = false
          return
        }
        
        // 继续攻击植物
        if (zombie.active && plant.active) {
          if (plant.takeDamage) {
            plant.takeDamage(1)
            // 植物受伤动画
            this.tweens.add({ 
              targets: plant, 
              x: plant.x + 5, 
              duration: 100, 
              yoyo: true, 
              repeat: 1 
            })
          }
        }
      },
      callbackScope: this,
      loop: true
    })
  }

  // ── 僵尸-小车碰撞 ──
  handleZombieMowerCollision(zombie, mowerSprite) {
    if (!this.gameStarted || !zombie.active) return
    
    // 找到对应的 mower 对象
    const mower = this.lawnmowers.find(m => m.sprite === mowerSprite)
    if (!mower || !mower.active || !mower.isActive) return

    console.log('[PlayScene] 🚜 割草机被触发! Row:', mower.row)
    
    // 激活小车！
    mower.isActive = false
    this.activateLawnmower(mower)
  }

  // ── 激活割草机 ──
  activateLawnmower(mower) {
    const mowerSprite = mower.sprite
    const row = mower.row
    const targetX = this.game.BASE_W + 200  // 向右移动到屏幕外

    // 小车加速动画
    this.tweens.add({
      targets: mowerSprite,
      x: targetX,
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        // 完全清理割草机
        mowerSprite.destroy()
        mower.active = false
        mower.isActive = false
        
        // 从数组中移除
        const index = this.lawnmowers.indexOf(mower)
        if (index > -1) {
          this.lawnmowers.splice(index, 1)
        }
        
        console.log('[PlayScene] 割草机已清理 | 剩余:', this.lawnmowers.length)
      }
    })

    // 消灭该行所有僵尸
    this.zombies.children.each(zombie => {
      if (zombie.active && zombie.gameData && zombie.gameData.row === row) {
        const score = zombie.gameData.score || 10
        console.log('[PlayScene] 🚜 割草机消灭僵尸! Type:', zombie.zombieType, '| Score:', score)
        this.addScore(score)
        zombie.takeDamage(999)  // 立即消灭
      }
    })

    // 显示提示
    const hintText = this.add.text(
      this.game.GRID_LEFT / 2,
      mowerSprite.y,
      '🚜 割草机启动！',
      {
        fontSize: '18px',
        fill: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3
      }
    ).setOrigin(0.5).setDepth(1000)

    this.tweens.add({
      targets: hintText,
      alpha: 0,
      y: hintText.y - 50,
      duration: 1500,
      onComplete: () => hintText.destroy()
    })
  }

  // ── 点击放置 ──
  handleTap(pointer) {
    if (!this.gameStarted || this.isPaused || this.gameOver || this.levelComplete) return
    
    // 点击空白处（非网格区域）取消选择
    const GL = this.game.GRID_LEFT
    const gridRight = GL + this.game.COLS * this.game.CELL
    const isOutsideGrid = pointer.x < GL || pointer.x > gridRight || pointer.y < this.game.GAME_Y
    
    if (isOutsideGrid && !this.shovelMode) {
      // 取消植物选择
      this.seedCards.forEach(card => card.deselect())
      this.selectedPlantType = null
      this.hidePlantPreview()
      return
    }
    
    if (pointer.y < this.game.GAME_Y) return
    if (pointer.x < GL || pointer.x > gridRight) return

    const row = this.rowForY(pointer.y)
    const col = this.colForX(pointer.x)
    const cell = this.getCellOrigin(col, row)

    if (this.shovelMode) {
      const plant = this.getPlantAt(row, col)
      if (plant) this.removePlant(plant)
      return
    }

    if (!this.selectedPlantType || this.plantAt(row, col)) return

    const plantMap = {
      sunflower: { cost: 50, Class: Sunflower },
      peashooter: { cost: 100, Class: Plant },
      iceshooter: { cost: 175, Class: IceShooter },
      repeater: { cost: 200, Class: Repeater },
      cherrybomb: { cost: 150, Class: CherryBomb },
      potatomine: { cost: 25, Class: PotatoMine },
      wallnut: { cost: 50, Class: Wallnut }
    }

    const info = plantMap[this.selectedPlantType]
    if (!info) return

    if (this.spendSun(info.cost)) {
      new info.Class(this, cell)
      const card = this.seedCards.find(c => c.plantType === this.selectedPlantType)
      if (card) card.startCooldown()
      
      // 种植后取消选择
      this.seedCards.forEach(c => c.deselect())
      this.selectedPlantType = null
      this.hidePlantPreview()
    } else {
      const txt = this.add.text(this.game.BASE_W / 2, this.game.BASE_H / 2, '阳光不足!', {
        fontSize: '28px', fill: '#FF0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(2001)
      this.tweens.add({
        targets: txt,
        alpha: 0, y: this.game.BASE_H / 2 - 60, duration: 1000,
        onComplete: (tween, targets) => targets[0].destroy()
      })
    }
  }
  
  // ── 鼠标移动处理（显示植物预览）──
  handlePointerMove(pointer) {
    if (!this.selectedPlantType || this.shovelMode) {
      this.hidePlantPreview()
      return
    }
    
    const GL = this.game.GRID_LEFT
    const gridRight = GL + this.game.COLS * this.game.CELL
    const isInsideGrid = pointer.x >= GL && pointer.x <= gridRight && pointer.y >= this.game.GAME_Y
    
    if (isInsideGrid) {
      this.showPlantPreview(pointer)
    } else {
      this.hidePlantPreview()
    }
  }
  
  // 显示植物预览
  showPlantPreview(pointer) {
    const row = this.rowForY(pointer.y)
    const col = this.colForX(pointer.x)
    const cell = this.getCellOrigin(col, row)
    
    // 如果已经有预览，更新位置
    if (this.plantPreview) {
      this.plantPreview.x = cell.x
      this.plantPreview.y = cell.y
      
      // 检查是否可以放置（格子为空且有足够阳光）
      const canPlace = !this.plantAt(row, col) && this.sunCount >= this.getSelectedPlantCost()
      this.plantPreview.setAlpha(canPlace ? 0.3 : 0.15)
      this.plantPreview.setTint(canPlace ? 0xFFFFFF : 0xFF0000)
      return
    }
    
    // 创建新的预览
    const textureMap = {
      sunflower: 'sunflower',
      peashooter: 'peashooter',
      iceshooter: 'iceshooter',
      repeater: 'repeater',
      cherrybomb: 'cherrybomb',
      potatomine: 'potatomine',
      wallnut: 'wallnut'
    }
    
    const texture = textureMap[this.selectedPlantType]
    if (!texture || !this.textures.exists(texture)) return
    
    this.plantPreview = this.add.image(cell.x, cell.y, texture)
      .setScale(0.8)
      .setAlpha(0.3)
      .setDepth(35)  // 在植物层级之上，但在僵尸之下
  }
  
  // 隐藏植物预览
  hidePlantPreview() {
    if (this.plantPreview) {
      this.plantPreview.destroy()
      this.plantPreview = null
    }
  }
  
  // 获取选中植物的阳光消耗
  getSelectedPlantCost() {
    const costs = {
      sunflower: 50,
      peashooter: 100,
      iceshooter: 175,
      repeater: 200,
      cherrybomb: 150,
      potatomine: 25,
      wallnut: 50
    }
    return costs[this.selectedPlantType] || 0
  }

  getPlantAt(row, col) {
    let found = null
    this.plants.children.each(p => {
      if (p.active && p.gameData && p.gameData.row === row && p.gameData.col === col) found = p
    })
    return found
  }

  plantAt(row, col) {
    let found = false
    this.plants.children.each(p => {
      if (p.active && p.gameData && p.gameData.row === row && p.gameData.col === col) found = true
    })
    return found
  }

  // ── 坐标转换 ──
  getCellOrigin(col, row) {
    return {
      x: this.game.GRID_LEFT + col * this.game.CELL + this.game.CELL / 2,
      y: this.game.GAME_Y + row * this.game.CELL + this.game.CELL / 2,
      row, col
    }
  }

  colForX(x) {
    const localX = x - this.game.GRID_LEFT
    if (localX < 0) return 0
    return Phaser.Math.Clamp(Math.floor(localX / this.game.CELL), 0, this.game.COLS - 1)
  }

  rowForY(y) {
    const gy = y - this.game.GAME_Y
    if (gy < 0) return 0
    return Phaser.Math.Clamp(Math.floor(gy / this.game.CELL), 0, this.game.ROWS - 1)
  }

  yForRow(row) {
    return this.game.GAME_Y + row * this.game.CELL + this.game.CELL / 2
  }

  getZombieSpawnX() {
    return this.game.GRID_LEFT + this.game.COLS * this.game.CELL + Phaser.Math.Between(20, this.game.GRID_RIGHT - 20)
  }

  // 场景关闭时清理资源
  shutdown() {
    console.log('[PlayScene] 场景关闭，清理资源...')
    
    // 停止背景音乐
    if (this.bgMusic) {
      this.bgMusic.stop()
      this.bgMusic.destroy()
      this.bgMusic = null
      console.log('[PlayScene] BGM 已清理')
    }
    
    // 清理植物预览
    this.hidePlantPreview()
    
    // 清理割草机
    if (this.lawnmowers) {
      this.lawnmowers.forEach(mower => {
        if (mower && mower.sprite) {
          mower.sprite.destroy()
        }
      })
      this.lawnmowers = []
      console.log('[PlayScene] 割草机已清理')
    }
    
    // 清理割草机组
    if (this.lawnmowerGroup) {
      this.lawnmowerGroup.clear(true, true)  // clear(removeFromScene, destroyChildren)
      console.log('[PlayScene] 割草机组已清理')
    }
    
    // 清理定时器
    if (this.zombieSpawnTimer) {
      this.zombieSpawnTimer.remove()
      this.zombieSpawnTimer = null
    }
    
    // 清理其他音效
    if (this.sounds) {
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.stop()
          sound.destroy()
        }
      })
      this.sounds = {}
    }
  }
}
