import Phaser from 'phaser'
import Plant from '../models/plant.js'
import Sunflower from '../models/sunflower.js'
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
    this.createSunDisplay()
    this.createSeedBar()

    // ══════════════════════════════════════════════════
    //  物理组 & 游戏对象
    // ══════════════════════════════════════════════════
    this.plants      = this.physics.add.group()
    this.projectiles = this.physics.add.group({ defaultKey: 'sprites', maxSize: 50 })
    this.zombies     = this.physics.add.group()

    // 定时生成僵尸
    this.time.addEvent({
      delay: 3000,
      callback: this.spawnZombie,
      callbackScope: this,
      loop: true
    })

    // 定时生成天空阳光
    this.time.addEvent({ delay: 10000, callback: () => this.spawnSkySun(), loop: true })
    this.time.delayedCall(2000, () => this.spawnSkySun())

    // 初始化音频
    this.sounds = {
      peaShoot:        this.sound.add('peaShoot'),
      splat:           this.sound.add('splat'),
      zombiesAreComing: this.sound.add('zombiesAreComing')
    }
    this.sounds.zombiesAreComing.play()

    // 全局点击 → 放置植物（卡片栏区域由 SeedCard 内部 stopPropagation 拦截）
    this.input.on('pointerdown', (pointer) => this.handleTap(pointer))

    // 碰撞：子弹 × 僵尸
    this.physics.add.overlap(
      this.projectiles, this.zombies,
      this.handleZombieHit, null, this
    )
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
      { type: 'peashooter', cost: 100, icon: 'ps-idle01.png'       }
    ]

    plants.forEach((plant, index) => {
      // x 从第二列开始（第一列放阳光计数），卡片间距 65px
      // y = UI_H/2 = 32，让卡片垂直居中在卡片栏里
      const x = 70 + index * 65
      const y = Math.floor(this.game.UI_TOP_H / 2)  // 32
      const card = new SeedCard(this, x, y, plant.type, plant.cost, plant.icon)
      this.seedCards.push(card)
    })

    if (this.seedCards.length > 0) this.seedCards[0].select()
  }

  // ──────────────────────────────────────────────────────────────
  //  游戏循环
  // ──────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this.projectiles && this.projectiles.children.size > 0) {
      this.projectiles.children.each((pea) => {
        if (pea.active && pea.body && pea.body.velocity.x === 0) {
          pea.body.velocity.x = 150
        }
      })
    }
  }

  spawnZombie() {
    new Zombie(this)
  }

  handleZombieHit(projectile, zombie) {
    this.sounds.splat.play()
    if (zombie.takeDamage) zombie.takeDamage(1)
    projectile.destroy()
  }

  // ──────────────────────────────────────────────────────────────
  //  点击放置植物
  // ──────────────────────────────────────────────────────────────
  handleTap(pointer) {
    // 卡片栏区域不处理
    if (pointer.y < this.game.UI_TOP_H) return

    const cell = this.getCellOrigin(pointer.x, pointer.y)
    const row  = this.rowForY(pointer.y)
    const col  = this.colForX(pointer.x)

    if (!this.plantAt(row, col)) {
      let plantCost = 100
      let PlantClass = Plant
      if (this.selectedPlantType === 'sunflower') {
        plantCost = 50
        PlantClass = Sunflower
      }
      const selectedCard = this.seedCards.find(c => c.plantType === this.selectedPlantType)

      if (this.spendSun(plantCost)) {
        new PlantClass(this, cell)
        if (selectedCard) selectedCard.startCooldown()
      } else {
        this.showNotEnoughSunWarning()
      }
    }
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
