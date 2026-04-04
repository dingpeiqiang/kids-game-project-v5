/**
 * 塔防游戏场景 - 完全复刻原版实现
 */

import Phaser from 'phaser'
import Enemy from '../entities/Enemy'
import Turret from '../entities/Turret'
import Bullet from '../entities/Bullet'
import { levelConfig } from '../config/levelConfig'
import { cloneMap } from '../config/map'

export default class GameScene extends Phaser.Scene {
  // 游戏状态
  private level: number = 1
  private nextEnemy: number = 0
  private score: number = 0
  private baseHealth: number = levelConfig.initial.baseHealth
  private availableTurrets: number = levelConfig.initial.numOfTurrets
  private roundStarted: boolean = false
  private remainingEnemies: number = 0

  // 游戏对象组（使用物理引擎）
  private enemies!: Phaser.Physics.Arcade.Group
  private turrets!: Phaser.GameObjects.Group
  private bullets!: Phaser.Physics.Arcade.Group

  // 地图和路径
  private map!: number[][]
  private path!: Phaser.Curves.Path
  private cursor!: Phaser.GameObjects.Image

  constructor() {
    super('Game')
  }

  preload(): void {
    // 加载真实的游戏资源
    this.load.image('enemy_red', '/themes/tower_default/assets/scene/level/tank_bigRed.png')
    this.load.image('enemy_sand', '/themes/tower_default/assets/scene/level/tank_sand.png')
    this.load.image('turret', '/themes/tower_default/assets/scene/level/tankBody_darkLarge_outline.png')
    this.load.image('bullet', '/themes/tower_default/assets/scene/level/bulletDark2_outline.png')
    this.load.image('cursor', '/themes/tower_default/assets/scene/ui/cursor.png')
    this.load.image('base', '/themes/tower_default/assets/scene/level/tankBody_darkLarge_outline.png')
    
    // 加载地形瓦片（spritesheet）
    this.load.spritesheet('terrainTiles_default', '/themes/tower_default/assets/scene/level/terrainTiles_default.png', {
      frameWidth: 64,
      frameHeight: 64
    })
    
    // 加载关卡地图JSON
    this.load.tilemapTiledJSON('level1', '/themes/tower_default/assets/scene/level/level1.json')
    
    // 加载UI按钮
    this.load.image('button1', '/themes/tower_default/assets/scene/ui/blue_button02.png')
    this.load.image('button2', '/themes/tower_default/assets/scene/ui/blue_button03.png')
    this.load.image('title', '/themes/tower_default/assets/scene/ui/title.png')
  }

  init(): void {
    // 克隆地图
    this.map = cloneMap()

    // 初始化游戏状态
    this.level = 1
    this.nextEnemy = 0
    this.score = 0
    this.baseHealth = levelConfig.initial.baseHealth
    this.availableTurrets = levelConfig.initial.numOfTurrets
    this.roundStarted = false
    this.remainingEnemies =
      levelConfig.initial.numOfEnemies +
      this.level * levelConfig.incremental.numOfEnemies

    // 发射事件更新 UI
    this.events.emit('displayUI')
    this.events.emit('updateScore', this.score)
    this.events.emit('updateHealth', this.baseHealth)
    this.events.emit('updateTurrets', this.availableTurrets)
    this.events.emit('updateEnemies', this.remainingEnemies)
  }

  create(): void {
    // 开始回合
    this.events.emit('startRound', this.level)

    // 获取UI场景并监听其roundReady事件
    const uiScene = this.scene.get('UI') as Phaser.Scene
    uiScene.events.on('roundReady', () => {
      this.roundStarted = true
    })

    // 创建地图
    this.createMap()

    // 创建路径
    this.createPath()

    // 创建光标
    this.createCursor()

    // 创建对象组
    this.createGroups()

    // 点击放置炮塔
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.placeTurret(pointer)
    })

    // 设置碰撞检测
    this.physics.add.overlap(
      this.enemies,
      this.bullets,
      (enemy: any, bullet: any) => {
        this.damageEnemy(enemy, bullet)
      }
    )
  }

  update(time: number, delta: number): void {
    // 如果到了下一个敌人的时间，并且回合开始了，并且活跃敌人数量小于剩余敌人数量
    if (
      time > this.nextEnemy &&
      this.roundStarted &&
      this.enemies.countActive(true) < this.remainingEnemies
    ) {
      let enemy = this.enemies.getFirstDead(false) as Enemy
      if (!enemy) {
        enemy = new Enemy(this, 0, 0, this.path)
        this.enemies.add(enemy)
      }
      enemy.setActive(true)
      enemy.setVisible(true)

      // 将敌人放在路径起点
      enemy.startOnPath(this.level)

      this.nextEnemy = time + 2000
    }
  }

  updateScore(score: number): void {
    this.score += score
    this.events.emit('updateScore', this.score)
  }

  updateHealth(health: number): void {
    this.baseHealth -= health
    this.events.emit('updateHealth', this.baseHealth)

    if (this.baseHealth < 1) {
      this.events.emit('hideUI')
      this.scene.start('Title')
    }
  }

  levelUp(): void {
    // 停止回合
    this.roundStarted = false

    // 增加关卡
    this.level++

    // 增加炮塔数量
    this.updateTurrets(levelConfig.incremental.numOfTurrets)

    // 增加敌人数量
    this.updateEnemies(
      levelConfig.initial.numOfEnemies +
        this.level * levelConfig.incremental.numOfEnemies
    )

    this.events.emit('startRound', this.level)
  }

  updateEnemies(numberOfEnemies: number): void {
    this.remainingEnemies += numberOfEnemies
    this.events.emit('updateEnemies', this.remainingEnemies)
    if (this.remainingEnemies <= 0) {
      this.levelUp()
    }
  }

  updateTurrets(numberOfTurrets: number): void {
    this.availableTurrets += numberOfTurrets
    this.events.emit('updateTurrets', this.availableTurrets)
  }

  createGroups(): void {
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true
    })

    this.turrets = this.add.group({
      classType: Turret,
      runChildUpdate: true
    })

    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    })
  }

  createCursor(): void {
    this.cursor = this.add.image(32, 32, 'cursor')
    this.cursor.setScale(2)
    this.cursor.alpha = 1

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const i = Math.floor(pointer.y / 64)
      const j = Math.floor(pointer.x / 64)

      if (this.canPlaceTurret(i, j)) {
        this.cursor.setPosition(j * 64 + 32, i * 64 + 32)
        this.cursor.alpha = 0.8
      } else {
        this.cursor.alpha = 0
      }
    })
  }

  canPlaceTurret(i: number, j: number): boolean {
    return this.map[i][j] === 0 && this.availableTurrets > 0
  }

  createPath(): void {
    // 敌人跟随的路径
    this.path = new Phaser.Curves.Path(96, -32)
    this.path.lineTo(96, 163)
    this.path.lineTo(480, 163)
    this.path.lineTo(480, 544)

    // 可视化路径（调试用）
    // const graphics = this.add.graphics()
    // graphics.lineStyle(3, 0xffffff, 1)
    // this.path.draw(graphics)
  }

  createMap(): void {
    // 从 JSON 文件加载瓦片地图
    const bgMap = this.make.tilemap({ key: 'level1' })

    // 添加瓦片图集
    const tiles = bgMap.addTilesetImage('terrainTiles_default', 'terrainTiles_default')

    if (!tiles) {
      console.error('Failed to load tileset')
      return
    }

    // 创建背景层（Phaser 3.60+ 新 API）
    const backgroundLayer = bgMap.createLayer('Background', tiles, 0, 0)
    
    if (backgroundLayer) {
      backgroundLayer.setDepth(0)
    }

    // 添加基地
    this.add.image(480, 480, 'base')
  }

  getEnemy(x: number, y: number, distance: number): Enemy | false {
    const enemyUnits = this.enemies.getChildren()
    for (const enemy of enemyUnits) {
      const e = enemy as Enemy
      if (
        e.active &&
        Phaser.Math.Distance.Between(x, y, e.x, e.y) <= distance
      ) {
        return e
      }
    }
    return false
  }

  addBullet(x: number, y: number, angle: number): void {
    let bullet = this.bullets.getFirstDead(false) as Bullet
    if (!bullet) {
      bullet = new Bullet(this, 0, 0)
      this.bullets.add(bullet)
    }
    bullet.fire(x, y, angle)
  }

  placeTurret(pointer: Phaser.Input.Pointer): void {
    const i = Math.floor(pointer.y / 64)
    const j = Math.floor(pointer.x / 64)

    if (this.canPlaceTurret(i, j)) {
      let turret = this.turrets.getFirstDead(false) as Turret
      if (!turret) {
        turret = new Turret(this, 0, 0, this.map)
        this.turrets.add(turret)
      }
      turret.setActive(true)
      turret.setVisible(true)
      turret.place(i, j)
      this.updateTurrets(-1)
    }
  }

  damageEnemy(enemy: Enemy, bullet: Bullet): void {
    if (enemy.active === true && bullet.active === true) {
      bullet.setActive(false)
      bullet.setVisible(false)

      // 减少敌人生命值
      enemy.recieveDamage(levelConfig.initial.bulletDamage)
    }
  }
}
