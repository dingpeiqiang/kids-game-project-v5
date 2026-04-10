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
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height)

    const W         = this.cameras.main.width   // 490
    const H         = this.cameras.main.height  // 290
    const UI_H      = this.game.UI_TOP_H        // 65  卡片栏高度
    const GAME_Y    = this.game.GAME_TOP_Y      // 65  草地起始 y

    // ══════════════════════════════════════════════════
    //  第1层：草地图片 —— 只铺游戏区域（y=GAME_Y 以下）
    // ══════════════════════════════════════════════════
    const grass = this.add.image(0, GAME_Y, 'grass').setOrigin(0, 0)
    grass.setDisplaySize(W, H - GAME_Y)   // 490 × 225
    grass.setDepth(-10)

    // ══════════════════════════════════════════════════
    //  第2层：卡片栏背景 —— 纯色矩形覆盖顶部 UI_H px
    // ══════════════════════════════════════════════════
    this.add.rectangle(0, 0, W, UI_H, 0x3a1f0d)
      .setOrigin(0, 0)
      .setDepth(98)

    // 卡片栏底部分割线
    this.add.rectangle(0, UI_H - 2, W, 3, 0x8B4513)
      .setOrigin(0, 0)
      .setDepth(99)

    // ══════════════════════════════════════════════════
    //  第3层：UI（卡片 / 阳光计数，depth ≥ 100）
    // ══════════════════════════════════════════════════
    this.sunCount = 150
    this.selectedPlantType = 'peashooter'
    this.shovelMode = false
    this.isPaused = false
    this.gameOver = false
    this.levelComplete = false
    this.gameStarted = false
    
    // 游戏模式配置
    this.relaxMode = false // 是否为解压模式
    
    // 关卡配置 - 优化平衡性
    this.totalWaves = 5
    this.currentWave = 0
    this.zombiesPerWave = [2, 3, 5, 7, 10]  // 减少每波僵尸数量
    this.zombiesSpawnedInWave = 0
    this.waveDelay = 15000 // 15秒一波，减少等待时间
    
    this.score = 0
    this.comboCount = 0
    this.lastKillTime = 0
    this.createSunDisplay()
    this.createScoreDisplay()
    this.createComboDisplay()
    this.createSeedBar()
    this.createShovelButton()
    this.createSettingsButton()
    this.createProgressDisplay()

    // ══════════════════════════════════════════════════
    //  物理组 & 游戏对象
    // ══════════════════════════════════════════════════
    this.plants      = this.physics.add.group()
    this.projectiles = this.physics.add.group({ defaultKey: 'sprites', maxSize: 50 })
    this.zombies     = this.physics.add.group()

    // 开始倒计时
    this.startCountdown()

    // 全局点击 → 放置植物（卡片栏区域由 SeedCard 内部 stopPropagation 拦截）
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))

    // 碰撞：子弹 × 僵尸
    this.physics.add.overlap(
      this.zombies, this.plants,
      this.handleZombiePlantCollision, null, this
    )
  }

  // ──────────────────────────────────────────────────────────────
  //  游戏倒计时
  // ──────────────────────────────────────────────────────────────
  startCountdown() {
    const W = this.cameras.main.width
    const H = this.cameras.main.height
    
    // 倒计时遮罩
    this.countdownOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(2000)
    
    // 倒计时文本
    this.countdownText = this.add.text(W / 2, H / 2 - 30, '准备开始!', {
      fontSize: '28px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    
    // 倒计时数字
    this.countdownNumber = this.add.text(W / 2, H / 2 + 20, '3', {
      fontSize: '48px', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    
    let count = 3
    this.countdownNumber.setText(count.toString())
    
    // 倒计时循环
    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        count--
        if (count > 0) {
          this.countdownNumber.setText(count.toString())
          // 数字跳动动画
          this.tweens.add({
            targets: this.countdownNumber,
            scale: 1.5,
            duration: 200,
            yoyo: true
          })
        } else if (count === 0) {
          this.countdownNumber.setText('开始!')
          this.countdownText.setText('保护你的脑子!')
        } else {
          // 倒计时结束，开始游戏
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
    
    // 初始化音频
    this.sounds = {
      peaShoot:        this.sound.add('peaShoot'),
      splat:           this.sound.add('splat'),
      zombiesAreComing: this.sound.add('zombiesAreComing')
    }
    this.sounds.zombiesAreComing.play()

    // 定时生成僵尸 - 增加间隔让游戏更平衡
    this.zombieSpawnTimer = this.time.addEvent({
      delay: 4000, // 从3000增加到4000
      callback: this.spawnZombie,
      callbackScope: this,
      loop: true
    })

    // 波次管理
    this.time.delayedCall(5000, () => this.startNextWave())
    
    // 定时生成天空阳光
    this.time.addEvent({ delay: 10000, callback: () => this.spawnSkySun(), loop: true })
    this.time.delayedCall(2000, () => this.spawnSkySun())

    // 键盘事件：ESC暂停
    this.input.keyboard.on('keydown-ESC', () => this.togglePause(), this)
    
    // 碰撞：子弹 × 僵尸
    this.physics.add.overlap(
      this.projectiles, this.zombies,
      this.handleZombieHit, null, this
    )
  }

  // ──────────────────────────────────────────────────────────────
  //  分数 UI
  // ──────────────────────────────────────────────────────────────
  createScoreDisplay() {
    const W = this.cameras.main.width
    
    // 分数背景
    this.add.rectangle(W - 25, 20, 70, 28, 0x000000, 0.6).setDepth(100)
    
    // 分数文本
    this.scoreText = this.add.text(W - 60, 12, '分数: 0', {
      fontSize: '12px', fill: '#00FF00', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(101)
  }

  addScore(amount) {
    this.score += amount
    this.updateScoreDisplay()
    this.showScoreGainAnimation(amount)
  }

  updateScoreDisplay() {
    this.scoreText.setText(`分数: ${this.score}`)
  }

  showScoreGainAnimation(amount) {
    const text = this.add.text(245, 160, `+${amount} 分!`, {
      fontSize: '16px', fill: '#00FF00', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({
      targets: text, y: 130, alpha: 0, duration: 1000,
      onComplete: () => text.destroy()
    })
  }

  // ──────────────────────────────────────────────────────────────
  //  连击 UI
  // ──────────────────────────────────────────────────────────────
  createComboDisplay() {
    const W = this.cameras.main.width
    
    // 连击文本（初始隐藏）
    this.comboText = this.add.text(W / 2, 80, '', {
      fontSize: '28px', fill: '#FFD700', fontStyle: 'bold', stroke: '#FF0000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(2000).setAlpha(0)
  }

  addCombo() {
    const currentTime = Date.now()
    const COMBO_TIMEOUT = 2000 // 2秒内击杀算连击
    
    if (currentTime - this.lastKillTime < COMBO_TIMEOUT) {
      this.comboCount++
      this.showComboEffect()
    } else {
      this.comboCount = 1
    }
    
    this.lastKillTime = currentTime
    return this.comboCount
  }

  showComboEffect() {
    if (this.comboCount < 2) return
    
    const W = this.cameras.main.width
    
    // 更新连击文本
    const comboTexts = ['不错!', '厉害!', '超棒!', '无敌!', '疯狂!', '暴走!']
    const comboIndex = Math.min(this.comboCount - 2, comboTexts.length - 1)
    const displayText = `${comboTexts[comboIndex]} ${this.comboCount}连击!`
    
    this.comboText.setText(displayText)
    this.comboText.setAlpha(1)
    this.comboText.setScale(0.5)
    
    // 缩放动画
    this.tweens.add({
      targets: this.comboText,
      scale: 1.2,
      duration: 200,
      ease: 'Back.out',
      yoyo: true
    })
    
    // 淡出动画
    this.tweens.add({
      targets: this.comboText,
      alpha: 0,
      duration: 1500,
      delay: 500
    })
    
    // 连击额外加分
    const bonusScore = this.comboCount * 5
    this.addScore(bonusScore)
    
    // 显示加分动画
    const bonusText = this.add.text(W / 2, 110, `连击 +${bonusScore}!`, {
      fontSize: '14px', fill: '#FF6B00', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    
    this.tweens.add({
      targets: bonusText,
      y: 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => bonusText.destroy()
    })
  }

  // ──────────────────────────────────────────────────────────────
  //  屏幕震动效果
  // ──────────────────────────────────────────────────────────────
  shakeScreen(intensity = 5, duration = 100) {
    const cam = this.cameras.main
    const originalX = cam.x
    const originalY = cam.y
    
    let shakeCount = 0
    const maxShakes = Math.floor(duration / 16)
    
    const shakeEvent = this.time.addEvent({
      delay: 16,
      callback: () => {
        shakeCount++
        if (shakeCount >= maxShakes) {
          cam.x = originalX
          cam.y = originalY
          shakeEvent.remove()
          return
        }
        
        const progress = 1 - (shakeCount / maxShakes)
        const currentIntensity = intensity * progress
        
        cam.x = originalX + (Math.random() - 0.5) * 2 * currentIntensity
        cam.y = originalY + (Math.random() - 0.5) * 2 * currentIntensity
      },
      loop: true
    })
  }

  // ──────────────────────────────────────────────────────────────
  //  阳光 UI
  // ──────────────────────────────────────────────────────────────
  createSunDisplay() {
    // 阳光图标背景（左上角，在卡片栏内）
    this.add.rectangle(20, 20, 55, 28, 0x000000, 0.6).setDepth(100)
    this.sunIcon = this.add.image(8, 20, 'sprites', 'sun1.png').setScale(1.1).setDepth(101)
    this.sunText = this.add.text(30, 12, this.sunCount.toString(), {
      fontSize: '16px', fill: '#FFD700', fontStyle: 'bold'
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
    this.tweens.add({ targets: this.sunText, scale: 1.3, duration: 150, yoyo: true })
    if (this.seedCards) {
      this.seedCards.forEach(card => card.updateAvailability(this.sunCount))
    }
  }

  showSunGainAnimation(amount) {
    const text = this.add.text(40, 40, `+${amount}`, {
      fontSize: '20px', fill: '#FFFF00', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({
      targets: text, y: 10, alpha: 0, duration: 1000,
      onComplete: () => text.destroy()
    })
  }

  spawnSkySun() {
    const x = Phaser.Math.Between(80, 420)
    new Sun(this, x, -50, 'sky')
  }

  // ──────────────────────────────────────────────────────────────
  //  卡片栏
  // ──────────────────────────────────────────────────────────────
  createSeedBar() {
    this.seedCards = []
    const plants = [
      { type: 'sunflower',  cost: 50,  icon: 'sunflower-idle.png' },
      { type: 'peashooter', cost: 100, icon: 'ps-idle01.png'       },
      { type: 'iceshooter', cost: 175, icon: 'ps-idle01.png'       },
      { type: 'repeater',   cost: 200, icon: 'ps-idle01.png'       },
      { type: 'cherrybomb', cost: 150, icon: 'ps-idle01.png'       },
      { type: 'potatomine', cost: 25,  icon: 'ps-idle01.png'       },
      { type: 'wallnut',    cost: 50,  icon: 'ps-idle01.png'       }
    ]

    plants.forEach((plant, index) => {
      // x 从第二列开始（第一列放阳光计数），卡片间距 58px
      // y = UI_H/2 = 32，让卡片垂直居中在卡片栏里
      const x = 70 + index * 58
      const y = Math.floor(this.game.UI_TOP_H / 2)  // 32
      const card = new SeedCard(this, x, y, plant.type, plant.cost, plant.icon)
      this.seedCards.push(card)
    })

    if (this.seedCards.length > 0) this.seedCards[0].select()
  }

  // ──────────────────────────────────────────────────────────────
  //  设置按钮
  // ──────────────────────────────────────────────────────────────
  createSettingsButton() {
    const W = this.cameras.main.width
    const UI_H = this.game.UI_TOP_H
    
    // 设置按钮背景（在铲子按钮左边）
    this.settingsBtnBg = this.add.rectangle(W - 95, UI_H / 2, 50, 58, 0x5D4037)
      .setStrokeStyle(2, 0x4E342E)
      .setDepth(100)
    
    // 设置图标（齿轮）
    const settingsIcon = this.add.graphics()
      .setDepth(101)
    
    // 绘制简单的齿轮图标
    settingsIcon.fillStyle(0xFFFFFF, 1)
    settingsIcon.fillCircle(W - 95, UI_H / 2, 12)
    settingsIcon.fillStyle(0x5D4037, 1)
    settingsIcon.fillCircle(W - 95, UI_H / 2, 8)
    settingsIcon.fillStyle(0xFFFFFF, 1)
    settingsIcon.fillCircle(W - 95, UI_H / 2, 4)
    
    this.settingsBtnBg.setInteractive({ useHandCursor: true })
    this.settingsBtnBg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.toggleSettingsPanel()
    })
    this.settingsBtnBg.on('pointerover', () => {
      this.settingsBtnBg.setFillStyle(0x6D4C41)
    })
    this.settingsBtnBg.on('pointerout', () => {
      this.settingsBtnBg.setFillStyle(0x5D4037)
    })
  }

  toggleSettingsPanel() {
    if (this.settingsPanelVisible) {
      this.hideSettingsPanel()
    } else {
      this.showSettingsPanel()
    }
  }

  showSettingsPanel() {
    const W = this.cameras.main.width
    const H = this.cameras.main.height
    
    this.settingsPanelVisible = true
    
    // 半透明遮罩
    this.settingsOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setDepth(2400)
    this.settingsOverlay.setInteractive({ useHandCursor: true })
    this.settingsOverlay.on('pointerdown', () => this.hideSettingsPanel())
    
    // 设置面板
    this.settingsPanel = this.add.rectangle(W / 2, H / 2, 260, 280, 0x2C3E50)
      .setStrokeStyle(3, 0x3498DB)
      .setDepth(2401)
    
    // 标题
    this.settingsTitle = this.add.text(W / 2, H / 2 - 110, '游戏设置', {
      fontSize: '20px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2402)
    
    // 音效开关
    this.soundToggleBg = this.add.rectangle(W / 2, H / 2 - 60, 200, 40, 0x34495E)
      .setInteractive({ useHandCursor: true })
      .setDepth(2401)
    
    this.soundToggleText = this.add.text(W / 2 - 60, H / 2 - 60, '音效:', {
      fontSize: '14px', fill: '#FFFFFF'
    }).setOrigin(0, 0.5).setDepth(2402)
    
    this.soundStatusText = this.add.text(W / 2 + 50, H / 2 - 60, '开启', {
      fontSize: '14px', fill: '#00FF00', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(2402)
    
    this.soundToggleBg.on('pointerdown', () => {
      this.toggleSound()
    })
    
    // 解压模式开关
    this.relaxToggleBg = this.add.rectangle(W / 2, H / 2 - 5, 200, 40, 0x34495E)
      .setInteractive({ useHandCursor: true })
      .setDepth(2401)
    
    this.relaxToggleText = this.add.text(W / 2 - 60, H / 2 - 5, '解压模式:', {
      fontSize: '14px', fill: '#FFFFFF'
    }).setOrigin(0, 0.5).setDepth(2402)
    
    this.relaxStatusText = this.add.text(W / 2 + 50, H / 2 - 5, this.relaxMode ? '开启' : '关闭', {
      fontSize: '14px', fill: this.relaxMode ? '#00FF00' : '#FF0000', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(2402)
    
    this.relaxToggleBg.on('pointerdown', () => {
      this.toggleRelaxMode()
    })
    
    // 关闭按钮
    this.closeSettingsBtn = this.add.rectangle(W / 2, H / 2 + 60, 120, 40, 0xE74C3C)
      .setInteractive({ useHandCursor: true })
      .setDepth(2401)
    
    this.closeSettingsText = this.add.text(W / 2, H / 2 + 60, '关闭', {
      fontSize: '16px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2402)
    
    this.closeSettingsBtn.on('pointerdown', () => this.hideSettingsPanel())
    this.closeSettingsBtn.on('pointerover', () => this.closeSettingsBtn.setFillStyle(0xC0392B))
    this.closeSettingsBtn.on('pointerout', () => this.closeSettingsBtn.setFillStyle(0xE74C3C))
  }

  hideSettingsPanel() {
    this.settingsPanelVisible = false
    if (this.settingsOverlay) {
      this.settingsOverlay.destroy()
      this.settingsPanel.destroy()
      this.settingsTitle.destroy()
      this.soundToggleBg.destroy()
      this.soundToggleText.destroy()
      this.soundStatusText.destroy()
      this.relaxToggleBg.destroy()
      this.relaxToggleText.destroy()
      this.relaxStatusText.destroy()
      this.closeSettingsBtn.destroy()
      this.closeSettingsText.destroy()
    }
  }

  toggleSound() {
    if (this.soundEnabled === undefined) {
      this.soundEnabled = true
    }
    this.soundEnabled = !this.soundEnabled
    
    if (this.soundEnabled) {
      this.soundStatusText.setText('开启')
      this.soundStatusText.setFill('#00FF00')
      this.sound.mute = false
    } else {
      this.soundStatusText.setText('关闭')
      this.soundStatusText.setFill('#FF0000')
      this.sound.mute = true
    }
  }

  toggleRelaxMode() {
    this.relaxMode = !this.relaxMode
    
    if (this.relaxMode) {
      this.relaxStatusText.setText('开启')
      this.relaxStatusText.setFill('#00FF00')
      
      // 解压模式：增加初始阳光
      this.sunCount = 500
      this.updateSunDisplay()
      
      // 提示信息
      const hint = this.add.text(245, 120, '解压模式启动!', {
        fontSize: '20px', fill: '#00FF00', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({
        targets: hint,
        alpha: 0,
        duration: 2000,
        onComplete: () => hint.destroy()
      })
    } else {
      this.relaxStatusText.setText('关闭')
      this.relaxStatusText.setFill('#FF0000')
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  铲子工具
  // ──────────────────────────────────────────────────────────────
  createShovelButton() {
    const W = this.cameras.main.width
    const UI_H = this.game.UI_TOP_H
    
    // 铲子按钮背景（移到更右边，给设置按钮留位置）
    const shovelBg = this.add.rectangle(W - 30, UI_H / 2, 55, 58, 0x8B4513)
      .setStrokeStyle(2, 0x654321)
      .setDepth(100)
    
    // 使用简单的图形作为铲子图标（因为sprites.json中没有铲子）
    const shovelIcon = this.add.graphics()
      .setDepth(101)
    shovelIcon.fillStyle(0x888888, 1)
    // 铲子手柄
    shovelIcon.fillRect(W - 35, UI_H / 2 - 15, 6, 25)
    // 铲子头
    shovelIcon.fillStyle(0x999999, 1)
    shovelIcon.beginPath()
    shovelIcon.moveTo(W - 40, UI_H / 2 + 10)
    shovelIcon.lineTo(W - 32, UI_H / 2 + 20)
    shovelIcon.lineTo(W - 24, UI_H / 2 + 10)
    shovelIcon.closePath()
    shovelIcon.fill()
    
    // 铲子按钮交互
    shovelBg.setInteractive({ useHandCursor: true })
    shovelBg.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.toggleShovelMode()
    })
    shovelBg.on('pointerover', () => {
      if (this.shovelMode) {
        shovelBg.setFillStyle(0xFFD700)
      } else {
        shovelBg.setFillStyle(0xA0522D)
      }
    })
    shovelBg.on('pointerout', () => {
      if (this.shovelMode) {
        shovelBg.setFillStyle(0xFFD700)
      } else {
        shovelBg.setFillStyle(0x8B4513)
      }
    })
    
    this.shovelBg = shovelBg
    this.shovelIcon = shovelIcon
  }

  toggleShovelMode() {
    this.shovelMode = !this.shovelMode
    
    if (this.shovelMode) {
      this.shovelBg.setFillStyle(0xFFD700)
      // 取消植物选择
      this.seedCards.forEach(card => card.deselect())
      this.selectedPlantType = null
    } else {
      this.shovelBg.setFillStyle(0x8B4513)
    }
  }

  removePlant(plant) {
    // 播放铲除动画
    this.tweens.add({
      targets: plant,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        plant.destroy()
      }
    })
    
    // 退出铲子模式
    this.shovelMode = false
    this.shovelBg.setFillStyle(0x8B4513)
  }

  // ──────────────────────────────────────────────────────────────
  //  关卡进度系统
  // ──────────────────────────────────────────────────────────────
  createProgressDisplay() {
    const W = this.cameras.main.width
    
    // 进度条背景
    this.progressBarBg = this.add.rectangle(W / 2, 50, 200, 12, 0x333333, 0.8)
      .setDepth(100)
    
    // 进度条填充
    this.progressBarFill = this.add.rectangle(W / 2 - 100, 50, 0, 10, 0x00FF00)
      .setOrigin(0, 0.5)
      .setDepth(101)
    
    // 波次文本
    this.waveText = this.add.text(W / 2, 60, `波次: 1/${this.totalWaves}`, {
      fontSize: '12px',
      fill: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(100)
    
    // 旗帜指示器
    this.flags = []
    for (let i = 0; i < this.totalWaves; i++) {
      const flagX = W / 2 - 80 + i * 40
      // 使用简单图形作为旗帜
      const flag = this.add.graphics().setDepth(100)
      flag.fillStyle(0x888888, 1)
      flag.fillRect(flagX, 42, 3, 16) // 旗杆
      flag.fillStyle(0x666666, 1)
      flag.beginPath()
      flag.moveTo(flagX + 3, 42)
      flag.lineTo(flagX + 15, 47)
      flag.lineTo(flagX + 3, 52)
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
    
    // 显示新波次提示
    this.showWaveStartWarning()
    
    // 如果是最后一波，显示提示
    if (this.currentWave === this.totalWaves) {
      this.showFinalWaveWarning()
    }
  }

  updateProgressDisplay() {
    const W = this.cameras.main.width
    const progress = this.currentWave / this.totalWaves
    
    // 更新进度条
    this.progressBarFill.width = 200 * progress
    
    // 更新波次文本
    this.waveText.setText(`波次: ${this.currentWave}/${this.totalWaves}`)
    
    // 更新旗帜颜色
    this.flags.forEach((flag, index) => {
      flag.clear()
      if (index < this.currentWave) {
        // 已完成的波次：绿色
        flag.fillStyle(0x888888, 1)
        flag.fillRect(W / 2 - 80 + index * 40, 42, 3, 16)
        flag.fillStyle(0x00FF00, 1)
        flag.beginPath()
        flag.moveTo(W / 2 - 80 + index * 40 + 3, 42)
        flag.lineTo(W / 2 - 80 + index * 40 + 15, 47)
        flag.lineTo(W / 2 - 80 + index * 40 + 3, 52)
        flag.closePath()
        flag.fill()
      } else {
        // 未完成的波次：灰色
        flag.fillStyle(0x888888, 1)
        flag.fillRect(W / 2 - 80 + index * 40, 42, 3, 16)
        flag.fillStyle(0x666666, 1)
        flag.beginPath()
        flag.moveTo(W / 2 - 80 + index * 40 + 3, 42)
        flag.lineTo(W / 2 - 80 + index * 40 + 15, 47)
        flag.lineTo(W / 2 - 80 + index * 40 + 3, 52)
        flag.closePath()
        flag.fill()
      }
    })
  }

  showWaveStartWarning() {
    const warning = this.add.text(245, 100, `第 ${this.currentWave} 波来袭!`, {
      fontSize: '20px', fill: '#FF0000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({
      targets: warning, alpha: 0, y: 70, duration: 2000,
      onComplete: () => warning.destroy()
    })
    
    // 显示本波会出现的僵尸类型
    let zombieTypesText = ''
    if (this.currentWave === 1) {
      zombieTypesText = '普通僵尸'
    } else if (this.currentWave === 2) {
      zombieTypesText = '普通僵尸 + 路障僵尸'
    } else if (this.currentWave === 3) {
      zombieTypesText = '路障僵尸来袭!'
    } else if (this.currentWave === 4) {
      zombieTypesText = '铁桶僵尸出现!'
    } else if (this.currentWave >= 5) {
      zombieTypesText = '所有僵尸都来了!'
    }
    
    const typeWarning = this.add.text(245, 130, zombieTypesText, {
      fontSize: '16px', fill: '#FFA500', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({
      targets: typeWarning, alpha: 0, y: 100, duration: 2500,
      onComplete: () => typeWarning.destroy()
    })
  }

  showFinalWaveWarning() {
    const warning = this.add.text(245, 150, '最后一波!', {
      fontSize: '24px', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({
      targets: warning, alpha: 0, y: 120, duration: 2500,
      onComplete: () => warning.destroy()
    })
  }

  spawnZombie() {
    if (this.gameOver || this.levelComplete) return
    
    if (this.currentWave === 0) return // 第一波还没开始
    
    const zombiesNeeded = this.zombiesPerWave[this.currentWave - 1]
    
    if (this.zombiesSpawnedInWave < zombiesNeeded) {
      // 根据当前波次决定僵尸类型
      let zombieTypes = ['normal']
      
      if (this.currentWave >= 2) {
        zombieTypes.push('normal', 'normal', 'conehead')
      }
      if (this.currentWave >= 3) {
        zombieTypes.push('conehead', 'conehead')
      }
      if (this.currentWave >= 4) {
        zombieTypes.push('buckethead')
      }
      if (this.currentWave >= 5) {
        zombieTypes.push('buckethead', 'newspaper')
      }
      
      // 随机选择僵尸类型
      const randomType = zombieTypes[Phaser.Math.Between(0, zombieTypes.length - 1)]
      new Zombie(this, randomType)
      this.zombiesSpawnedInWave++
    } else if (this.zombies.countActive(true) === 0) {
      // 当前波次完成，检查是否有下一波
      if (this.currentWave < this.totalWaves) {
        this.time.delayedCall(3000, () => this.startNextWave())
      } else {
        // 最后一波完成，游戏胜利
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
    // 显示胜利画面
    const overlay = this.add.rectangle(245, 145, 490, 290, 0x000000, 0.7).setDepth(3000)
    const victoryText = this.add.text(245, 120, '关卡完成!', {
      fontSize: '32px', fill: '#00FF00', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3001)
    const continueText = this.add.text(245, 170, '点击继续', {
      fontSize: '18px', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(3001)
    
    // 点击任意位置返回标题
    this.input.once('pointerdown', () => {
      this.scene.start('TitleScene')
    })
  }

  // ──────────────────────────────────────────────────────────────
  //  暂停系统
  // ──────────────────────────────────────────────────────────────
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
    const W = this.cameras.main.width
    const H = this.cameras.main.height
    
    // 半透明遮罩
    this.pauseOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(2500)
    
    // 暂停面板背景
    this.pausePanel = this.add.rectangle(W / 2, H / 2, 280, 200, 0x2C3E50)
      .setStrokeStyle(3, 0x3498DB)
      .setDepth(2501)
    
    // 暂停文本
    this.pauseText = this.add.text(W / 2, H / 2 - 60, '游戏暂停', {
      fontSize: '26px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2502)
    
    // 按钮样式：带圆角效果的按钮
    const createButton = (x, y, text, color, hoverColor) => {
      const btn = this.add.rectangle(x, y, 180, 42, color)
        .setInteractive({ useHandCursor: true })
        .setDepth(2501)
      
      const btnText = this.add.text(x, y, text, {
        fontSize: '16px', fill: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(2502)
      
      btn.on('pointerover', () => btn.setFillStyle(hoverColor))
      btn.on('pointerout', () => btn.setFillStyle(color))
      
      return { btn, btnText }
    }
    
    // 继续按钮
    const resumeBtnData = createButton(W / 2, H / 2 - 15, '继续游戏', 0x27AE60, 0x2ECC70)
    this.resumeBtn = resumeBtnData.btn
    this.resumeText = resumeBtnData.btnText
    
    // 重新开始按钮
    const restartBtnData = createButton(W / 2, H / 2 + 35, '重新开始', 0xF39C12, 0xE67E22)
    this.restartBtn = restartBtnData.btn
    this.restartText = restartBtnData.btnText
    
    // 返回标题按钮
    const titleBtnData = createButton(W / 2, H / 2 + 85, '返回标题', 0xE74C3C, 0xC0392B)
    this.titleBtn = titleBtnData.btn
    this.titleText = titleBtnData.btnText
    
    // 按钮事件
    this.resumeBtn.on('pointerdown', () => this.togglePause())
    this.restartBtn.on('pointerdown', () => {
      this.scene.restart()
    })
    this.titleBtn.on('pointerdown', () => {
      this.scene.start('TitleScene')
    })
  }

  hidePauseMenu() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy()
      this.pausePanel.destroy()
      this.pauseText.destroy()
      this.resumeBtn.destroy()
      this.resumeText.destroy()
      this.restartBtn.destroy()
      this.restartText.destroy()
      this.titleBtn.destroy()
      this.titleText.destroy()
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  游戏循环
  // ──────────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.gameStarted || this.isPaused) return
    
    if (this.projectiles && this.projectiles.children.size > 0) {
      this.projectiles.children.each((pea) => {
        if (pea.active) {
          // 只更新活跃的豌豆
          if (pea.body && pea.body.velocity.x === 0) {
            pea.body.velocity.x = 150
          }
          
          // 检查是否超出边界，提前清理
          if (pea.x > this.cameras.main.width + 50) {
            pea.destroy()
          }
        }
      })
    }
    
    // 调用特殊植物的update方法
    if (this.plants && this.plants.children.size > 0) {
      this.plants.children.each((plant) => {
        if (plant.active && plant.update) {
          plant.update(time, delta)
        }
      })
    }
    
    // 清理僵尸（超出左边界的）
    if (this.zombies && this.zombies.children.size > 0) {
      this.zombies.children.each((zombie) => {
        if (zombie.active && zombie.x < -50) {
          zombie.destroy()
        }
      })
    }
  }

  handleZombieHit(projectile, zombie) {
    this.sounds.splat.play()
    
    // 寒冰豌豆效果
    if (projectile.isIcePea && zombie.active) {
      // 减速僵尸
      if (!zombie.isSlowed) {
        zombie.isSlowed = true
        zombie.setTint(0x00FFFF) // 冰冻色调
        
        if (zombie.setVelocityX) {
          const currentVelocity = zombie.body.velocity.x
          zombie.setVelocityX(currentVelocity * 0.4) // 减速60%
        }
        
        // 持续4秒
        this.time.delayedCall(4000, () => {
          if (zombie.active) {
            zombie.isSlowed = false
            zombie.clearTint()
            if (zombie.setVelocityX) {
              zombie.setVelocityX(-15) // 恢复正常速度
            }
          }
        })
      }
    }
    
    if (zombie.takeDamage) zombie.takeDamage(1)
    projectile.destroy()
    
    // 检查僵尸是否死亡
    if (zombie.gameData && zombie.gameData.health <= 0) {
      const combo = this.addCombo()
      let baseScore = zombie.gameData.score || 10
      
      // 连击额外加分
      if (combo > 1) {
        baseScore += combo * 2
      }
      
      this.addScore(baseScore)
      this.showZombieDeathEffect(zombie.x, zombie.y, combo)
      
      // 根据连击强度决定屏幕震动
      if (combo >= 5) {
        this.shakeScreen(8, 150) // 强烈震动
      } else if (combo >= 3) {
        this.shakeScreen(5, 100) // 中等震动
      } else {
        this.shakeScreen(3, 60) // 轻微震动
      }
    }
  }

  showZombieDeathEffect(x, y, combo = 1) {
    // 基础爆炸效果 - 简化
    const explosion = this.add.circle(x, y, 10, 0xFF6B00, 0.8)
      .setDepth(1000)
    
    // 缩放和淡出动画
    const explosionScale = 2 + combo * 0.2
    this.tweens.add({
      targets: explosion,
      scale: explosionScale,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    })
    
    // 减少粒子数量 - 性能优化
    const particleCount = Math.min(4 + combo, 10)
    
    for (let i = 0; i < particleCount; i++) {
      const color = (i % 2 === 0) ? 0xFFD700 : 0xFF6B00
      const particle = this.add.circle(x, y, 2 + Math.random() * 2, color)
        .setDepth(1001)
      
      const angle = (i / particleCount) * Math.PI * 2
      const distance = 15 + Math.random() * (15 + combo * 3)
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 5,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Cubic.out',
        onComplete: () => particle.destroy()
      })
    }
    
    // 高连击时显示搞笑文字 - 简化
    if (combo >= 3) {
      const funnyTexts = ['砰!', '啪!', '轰!']
      const textIndex = Math.min(combo - 3, funnyTexts.length - 1)
      const funnyText = this.add.text(x, y - 25, funnyTexts[textIndex], {
        fontSize: `${14 + Math.min(combo, 8)}px`,
        fill: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(1002)
      
      this.tweens.add({
        targets: funnyText,
        y: y - 45,
        alpha: 0,
        duration: 600,
        onComplete: () => funnyText.destroy()
      })
    }
  }

  showPlantPlaceEffect(x, y) {
    // 简化的种植特效
    const placeRing = this.add.circle(x, y, 15, undefined, 0x00FF00, 2)
      .setDepth(500)
    
    placeRing.setScale(0)
    this.tweens.add({
      targets: placeRing,
      scale: 1.2,
      alpha: 0,
      duration: 400,
      onComplete: () => placeRing.destroy()
    })
  }

  handleZombiePlantCollision(zombie, plant) {
    // 游戏未开始时不处理
    if (!this.gameStarted) return
    
    // 僵尸遇到植物时停止移动并攻击
    if (zombie.setVelocityX) {
      zombie.setVelocityX(0)
    }
    
    // 定时攻击植物
    if (!zombie.attackingPlant) {
      zombie.attackingPlant = true
      
      // 创建攻击提示
      const attackText = this.add.text(plant.x, plant.y - 25, '咬!', {
        fontSize: '14px', fill: '#FF0000', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1000)
      
      zombie.attackTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (plant.active && zombie.active) {
            if (plant.takeDamage) {
              plant.takeDamage(1)
              
              // 显示伤害动画
              if (attackText.active) {
                attackText.setAlpha(1)
                this.tweens.add({
                  targets: attackText,
                  alpha: 0,
                  y: attackText.y - 10,
                  duration: 500
                })
              }
              
              // 植物受伤抖动效果
              this.tweens.add({
                targets: plant,
                x: plant.x + 3,
                duration: 100,
                yoyo: true,
                repeat: 1
              })
            }
          } else {
            // 植物或僵尸已死亡，僵尸继续移动
            if (zombie.active && zombie.setVelocityX) {
              zombie.setVelocityX(-20)
            }
            if (zombie.attackTimer) {
              zombie.attackTimer.remove()
            }
            if (attackText.active) {
              attackText.destroy()
            }
            zombie.attackingPlant = false
          }
        },
        callbackScope: this,
        loop: true
      })
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  点击放置植物
  // ──────────────────────────────────────────────────────────────
  handleTap(pointer) {
    // 游戏未开始或已暂停或已结束时不处理
    if (!this.gameStarted || this.isPaused || this.gameOver || this.levelComplete) return
    
    // 卡片栏区域不处理
    if (pointer.y < this.game.UI_TOP_H) return

    const cell = this.getCellOrigin(pointer.x, pointer.y)
    const row  = this.rowForY(pointer.y)
    const col  = this.colForX(pointer.x)

    if (this.shovelMode) {
      // 铲子模式：移除植物
      const plant = this.getPlantAt(row, col)
      if (plant) {
        this.removePlant(plant)
      }
    } else if (this.selectedPlantType && !this.plantAt(row, col)) {
      // 正常模式：放置植物
      let plantCost = 100
      let PlantClass = Plant
      if (this.selectedPlantType === 'sunflower') {
        plantCost = 50
        PlantClass = Sunflower
      } else if (this.selectedPlantType === 'wallnut') {
        plantCost = 50
        PlantClass = Wallnut
      } else if (this.selectedPlantType === 'iceshooter') {
        plantCost = 175
        PlantClass = IceShooter
      } else if (this.selectedPlantType === 'repeater') {
        plantCost = 200
        PlantClass = Repeater
      } else if (this.selectedPlantType === 'cherrybomb') {
        plantCost = 150
        PlantClass = CherryBomb
      } else if (this.selectedPlantType === 'potatomine') {
        plantCost = 25
        PlantClass = PotatoMine
      }
      const selectedCard = this.seedCards.find(c => c.plantType === this.selectedPlantType)

      if (this.spendSun(plantCost)) {
        const newPlant = new PlantClass(this, cell)
        this.showPlantPlaceEffect(cell.x, cell.y)
        if (selectedCard) selectedCard.startCooldown()
      } else {
        this.showNotEnoughSunWarning()
      }
    }
  }

  getPlantAt(row, col) {
    let foundPlant = null
    this.plants.children.each((plant) => {
      if (plant.gameData && plant.gameData.row === row && plant.gameData.col === col) {
        foundPlant = plant
      }
    })
    return foundPlant
  }

  showNotEnoughSunWarning() {
    const warning = this.add.text(245, 145, '阳光不足!', {
      fontSize: '24px', fill: '#FF0000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)
    this.tweens.add({
      targets: warning, alpha: 0, y: 100, duration: 1000,
      onComplete: () => warning.destroy()
    })
  }

  plantAt(row, col) {
    let found = false
    this.plants.children.each((plant) => {
      if (plant.gameData && plant.gameData.row === row && plant.gameData.col === col) found = true
    })
    return found
  }

  // ──────────────────────────────────────────────────────────────
  //  坐标 ↔ 格子 互转（所有计算基于草地区域偏移 GAME_TOP_Y）
  // ──────────────────────────────────────────────────────────────

  /** 像素坐标 → 格子中心像素坐标 */
  getCellOrigin(x, y) {
    const col = this.colForX(x)
    const row = this.rowForY(y)
    return {
      x: col * this.game.CELL_WIDTH  + this.game.CELL_WIDTH  / 2,
      y: this.game.GAME_TOP_Y + row * this.game.CELL_HEIGHT + this.game.CELL_HEIGHT / 2
    }
  }

  /** 像素 x → 列号 */
  colForX(x) {
    return Math.floor(x / this.game.CELL_WIDTH)
  }

  /** 像素 y → 行号（基于草地区域） */
  rowForY(y) {
    const gy = y - this.game.GAME_TOP_Y
    return Phaser.Math.Clamp(Math.floor(gy / this.game.CELL_HEIGHT), 0, this.game.ROWS - 1)
  }

  /** 行号 → 草地区域中心像素 y */
  yForRow(row) {
    return this.game.GAME_TOP_Y + row * this.game.CELL_HEIGHT + this.game.CELL_HEIGHT / 2
  }
}
