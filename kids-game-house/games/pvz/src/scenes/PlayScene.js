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

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' })
  }

  create() {
    const C = window.GAME_CONFIG
    const W = C.BASE_W
    const H = C.BASE_H
    const UI_H = C.UI_H
    const GAME_Y = C.GAME_Y
    const GL = C.GRID_LEFT

    // 传递布局常量
    Object.keys(C).forEach(k => { this.game[k] = C[k] })

    this.physics.world.setBounds(0, 0, W, H)
    this.cameras.main.setSize(W, H)

    // ═══ 草地背景 ═══
    this.add.tileSprite(0, GAME_Y, W, H - GAME_Y, 'grass')
      .setOrigin(0, 0).setDepth(-10)

    // ═══ 网格（交替色棋盘） ═══
    this.drawGrid()

    // ═══ 割草机区域 ═══
    this.drawLawnmowers()

    // ═══ 顶部卡片栏 ═══
    this.add.rectangle(0, 0, W, UI_H, 0x3a1f0d).setOrigin(0, 0).setDepth(98)
    this.add.rectangle(0, UI_H - 2, W, 3, 0x8B4513).setOrigin(0, 0).setDepth(99)

    // ═══ 游戏状态 ═══
    this.sunCount = 150
    this.selectedPlantType = 'peashooter'
    this.shovelMode = false
    this.isPaused = false
    this.gameOver = false
    this.levelComplete = false
    this.gameStarted = false
    this.relaxMode = false

    this.totalWaves = 5
    this.currentWave = 0
    this.zombiesPerWave = [3, 5, 8, 12, 16]
    this.zombiesSpawnedInWave = 0
    this.score = 0
    this.comboCount = 0
    this.lastKillTime = 0

    // ═══ UI ═══
    this.createSunDisplay()
    this.createScoreDisplay()
    this.createSeedBar()
    this.createShovelButton()
    this.createSettingsButton()
    this.createProgressDisplay()

    // ═══ 物理组 ═══
    this.plants = this.physics.add.group()
    this.projectiles = this.physics.add.group({ defaultKey: 'pea', maxSize: 80 })
    this.zombies = this.physics.add.group()

    // ═══ 事件 ═══
    this.physics.add.overlap(this.zombies, this.plants, this.handleZombiePlantCollision, null, this)
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))

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
    if (this.countdownOverlay) {
      this.countdownOverlay.destroy()
      this.countdownText.destroy()
      this.countdownNumber.destroy()
    }

    this.gameStarted = true

    this.sounds = {
      peaShoot: this.sound.add('peaShoot'),
      splat: this.sound.add('splat'),
      zombiesAreComing: this.sound.add('zombiesAreComing')
    }
    this.sounds.zombiesAreComing.play()

    // 僵尸生成定时器
    this.zombieSpawnTimer = this.time.addEvent({
      delay: 3500,
      callback: this.spawnZombie,
      callbackScope: this,
      loop: true
    })

    // 波次 & 阳光
    this.time.delayedCall(5000, () => this.startNextWave())
    this.time.addEvent({ delay: 8000, callback: () => this.spawnSkySun(), loop: true })
    this.time.delayedCall(2000, () => this.spawnSkySun())

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

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isLight = (r + c) % 2 === 0
        grid.fillStyle(isLight ? 0x5a9c3e : 0x4a8c2e, 0.6)
        grid.fillRect(GL + c * CELL, GY + r * CELL, CELL, CELL)
      }
    }

    // 细网格线
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
      const mower = this.add.image(x, y, 'lawnmower').setScale(0.7).setDepth(50)
      this.lawnmowers.push({ sprite: mower, row: r, active: true })
    }
  }

  // ── 阳光 UI ──
  createSunDisplay() {
    // 阳光图标
    this.add.image(35, 25, 'sun').setScale(0.55).setDepth(101)
    // 阳光数量
    this.sunText = this.add.text(60, 18, this.sunCount.toString(), {
      fontSize: '24px', fill: '#FFD700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(101)
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

  // ── 分数 UI ──
  createScoreDisplay() {
    const W = this.game.BASE_W
    this.add.text(W - 130, 15, '分数:', {
      fontSize: '16px', fill: '#AAA', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(100)
    this.scoreText = this.add.text(W - 75, 15, '0', {
      fontSize: '20px', fill: '#00FF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 1
    }).setOrigin(0, 0.5).setDepth(101)
  }

  addScore(amount) {
    this.score += amount
    this.scoreText.setText(this.score.toString())
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

    const cardW = 65
    const cardH = 70
    const startX = 110  // 阳光显示右边开始
    const gap = 72

    plants.forEach((plant, index) => {
      const x = startX + index * gap
      const y = this.game.UI_H / 2
      const card = new SeedCard(this, x, y, plant.type, plant.cost, plant.icon, cardW, cardH)
      this.seedCards.push(card)
    })

    if (this.seedCards.length > 0) this.seedCards[0].select()
  }

  // ── 铲子 ──
  createShovelButton() {
    const W = this.game.BASE_W
    const UI_H = this.game.UI_H

    const shovelBg = this.add.rectangle(W - 55, UI_H / 2, 50, 55, 0x8B4513)
      .setStrokeStyle(2, 0x654321).setDepth(100)

    // 简单铲子图标
    const shovelGfx = this.add.graphics().setDepth(101)
    const sx = W - 55
    const sy = UI_H / 2
    shovelGfx.fillStyle(0x888888, 1)
    shovelGfx.fillRect(sx - 3, sy - 18, 6, 28)
    shovelGfx.fillStyle(0x999999, 1)
    shovelGfx.beginPath()
    shovelGfx.moveTo(sx - 10, sy + 10)
    shovelGfx.lineTo(sx, sy + 22)
    shovelGfx.lineTo(sx + 10, sy + 10)
    shovelGfx.closePath()
    shovelGfx.fill()

    shovelBg.setInteractive({ useHandCursor: true })
    shovelBg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.toggleShovelMode()
    })
    shovelBg.on('pointerover', () => {
      shovelBg.setFillStyle(this.shovelMode ? 0xFFD700 : 0xA0522D)
    })
    shovelBg.on('pointerout', () => {
      shovelBg.setFillStyle(this.shovelMode ? 0xFFD700 : 0x8B4513)
    })

    this.shovelBg = shovelBg
  }

  toggleShovelMode() {
    this.shovelMode = !this.shovelMode
    if (this.shovelMode) {
      this.shovelBg.setFillStyle(0xFFD700)
      this.seedCards.forEach(card => card.deselect())
      this.selectedPlantType = null
    } else {
      this.shovelBg.setFillStyle(0x8B4513)
    }
  }

  removePlant(plant) {
    this.tweens.add({
      targets: plant, alpha: 0, scale: 0.3, duration: 300,
      onComplete: () => plant.destroy()
    })
    this.shovelMode = false
    this.shovelBg.setFillStyle(0x8B4513)
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

  // ── 进度条 ──
  createProgressDisplay() {
    const W = this.game.BASE_W
    const barY = 65

    this.progressBarBg = this.add.rectangle(W / 2, barY, 260, 10, 0x333333, 0.8).setDepth(100)
    this.progressBarFill = this.add.rectangle(W / 2 - 130, barY, 0, 8, 0x00FF00)
      .setOrigin(0, 0.5).setDepth(101)
    this.waveText = this.add.text(W / 2 + 145, barY, `1/${this.totalWaves}`, {
      fontSize: '12px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(100)

    // 旗帜
    this.flags = []
    for (let i = 0; i < this.totalWaves; i++) {
      const flagX = W / 2 - 120 + i * 55
      const flag = this.add.graphics().setDepth(100)
      flag.fillStyle(0x888888, 1)
      flag.fillRect(flagX, barY - 8, 3, 16)
      flag.fillStyle(0x666666, 1)
      flag.beginPath()
      flag.moveTo(flagX + 3, barY - 8)
      flag.lineTo(flagX + 15, barY - 3)
      flag.lineTo(flagX + 3, barY + 2)
      flag.closePath()
      flag.fill()
      this.flags.push(flag)
    }
  }

  startNextWave() {
    if (this.currentWave >= this.totalWaves || this.gameOver) return
    this.currentWave++
    this.zombiesSpawnedInWave = 0
    this.updateProgressDisplay()

    // 波次提示
    const W = this.game.BASE_W
    const waveTexts = ['第 1 波!', '第 2 波 — 路障僵尸来了!', '第 3 波!', '第 4 波 — 铁桶僵尸出现!', '最终波 — 全力防守!']
    const warn = this.add.text(W / 2, this.game.BASE_H / 2 - 50, waveTexts[this.currentWave - 1], {
      fontSize: '28px', fill: '#FF0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({ targets: warn, alpha: 0, y: this.game.BASE_H / 2 - 120, duration: 2500, onComplete: () => warn.destroy() })
  }

  updateProgressDisplay() {
    const progress = this.currentWave / this.totalWaves
    this.progressBarFill.width = 260 * progress
    this.waveText.setText(`${this.currentWave}/${this.totalWaves}`)

    this.flags.forEach((flag, i) => {
      flag.clear()
      const flagX = this.game.BASE_W / 2 - 120 + i * 55
      const barY = 65
      flag.fillStyle(0x888888, 1)
      flag.fillRect(flagX, barY - 8, 3, 16)
      flag.fillStyle(i < this.currentWave ? 0x00FF00 : 0x666666, 1)
      flag.beginPath()
      flag.moveTo(flagX + 3, barY - 8)
      flag.lineTo(flagX + 15, barY - 3)
      flag.lineTo(flagX + 3, barY + 2)
      flag.closePath()
      flag.fill()
    })
  }

  // ── 僵尸生成 ──
  spawnZombie() {
    if (this.gameOver || this.levelComplete || this.currentWave === 0) return

    const needed = this.zombiesPerWave[this.currentWave - 1]
    if (this.zombiesSpawnedInWave < needed) {
      let types = ['normal']
      if (this.currentWave >= 2) types.push('normal', 'conehead')
      if (this.currentWave >= 3) types.push('conehead', 'conehead')
      if (this.currentWave >= 4) types.push('buckethead')
      if (this.currentWave >= 5) types.push('buckethead', 'newspaper', 'conehead')

      const type = types[Phaser.Math.Between(0, types.length - 1)]
      new Zombie(this, type)
      this.zombiesSpawnedInWave++
    } else if (this.zombies.countActive(true) === 0) {
      if (this.currentWave < this.totalWaves) {
        this.time.delayedCall(3000, () => this.startNextWave())
      } else {
        this.checkVictory()
      }
    }
  }

  checkVictory() {
    if (this.currentWave >= this.totalWaves && this.zombies.countActive(true) === 0) {
      this.levelComplete = true
      this.showVictoryScreen()
    }
  }

  showVictoryScreen() {
    const W = this.game.BASE_W
    const H = this.game.BASE_H
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(3000)
    this.add.text(W / 2, H / 2 - 50, '🎉 关卡完成!', {
      fontSize: '44px', fill: '#00FF00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(3001)
    this.add.text(W / 2, H / 2 + 10, `最终得分: ${this.score}`, {
      fontSize: '24px', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3001)
    this.add.text(W / 2, H / 2 + 60, '点击返回标题', {
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
      this.showPauseMenu()
    } else {
      this.physics.world.resume()
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

    // 僵尸出界
    if (this.zombies && this.zombies.children.size > 0) {
      this.zombies.children.each(zombie => {
        if (zombie.active && zombie.x < -30) {
          zombie.destroy()
        }
      })
    }
  }

  // ── 子弹-僵尸碰撞 ──
  handleZombieHit(projectile, zombie) {
    if (!projectile.active || !zombie.active) return
    this.sounds.splat.play()

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

    if (zombie.takeDamage) zombie.takeDamage(1)
    projectile.destroy()

    if (zombie.active && zombie.gameData && zombie.gameData.health <= 0) {
      // 连击
      const now = Date.now()
      if (now - this.lastKillTime < 2000) this.comboCount++
      else this.comboCount = 1
      this.lastKillTime = now

      let baseScore = zombie.gameData.score || 10
      if (this.comboCount > 1) baseScore += this.comboCount * 3
      this.addScore(baseScore)
    }
  }

  // ── 僵尸-植物碰撞 ──
  handleZombiePlantCollision(zombie, plant) {
    if (!this.gameStarted || !zombie.active || !plant.active) return
    if (zombie.setVelocityX) zombie.setVelocityX(0)

    if (!zombie.attackingPlant) {
      zombie.attackingPlant = true
      zombie.attackTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (plant.active && zombie.active) {
            if (plant.takeDamage) {
              plant.takeDamage(1)
              this.tweens.add({ targets: plant, x: plant.x + 5, duration: 100, yoyo: true, repeat: 1 })
            }
          } else {
            if (zombie.active && zombie.gameData) zombie.setVelocityX(zombie.gameData.speed)
            if (zombie.attackTimer) zombie.attackTimer.remove()
            zombie.attackingPlant = false
          }
        },
        callbackScope: this,
        loop: true
      })
    }
  }

  // ── 点击放置 ──
  handleTap(pointer) {
    if (!this.gameStarted || this.isPaused || this.gameOver || this.levelComplete) return
    if (pointer.y < this.game.GAME_Y) return

    const GL = this.game.GRID_LEFT
    const gridRight = GL + this.game.COLS * this.game.CELL
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
}
