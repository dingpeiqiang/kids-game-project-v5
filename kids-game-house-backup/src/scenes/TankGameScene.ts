// Phaser 通过 CDN 引入，作为全局变量
import { useGameStore, type Tank, type Bullet, type Wall } from '../stores/game'

// GTRS 配置 (在 preload 中动态加载)
let GTRSConfig: any

export class TankGameScene extends Phaser.Scene {
  private gameStore!: ReturnType<typeof useGameStore>
  
  // 精灵组
  private playerSprite!: Phaser.GameObjects.Sprite
  private enemyGroup!: Phaser.GameObjects.Group
  private bulletGroup!: Phaser.GameObjects.Group
  private wallGroup!: Phaser.GameObjects.Group
  private powerUpGroup!: Phaser.GameObjects.Group
  
  // 动画
  private explosionAnims!: string[]
  
  // 控制
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private fireKey!: Phaser.Input.Keyboard.Key
  private lastFireTime: number = 0
  private fireCooldown: number = 500 // 毫秒
  
  constructor() {
    super({ key: 'TankGameScene' })
  }
  
  async preload() {
    // 动态加载 GTRS 配置
    if (!GTRSConfig) {
      const response = await fetch('/src/config/GTRS.json')
      GTRSConfig = await response.json()
    }
    
    // 加载图片资源
    const images = GTRSConfig.resources.images
    
    // 场景图片
    if (images.scene.background) {
      this.load.image('background', images.scene.background.src)
    }
    if (images.scene.grid) {
      this.load.image('grid', images.scene.grid.src)
    }
    if (images.scene.wall_brick) {
      this.load.image('wall_brick', images.scene.wall_brick.src)
    }
    if (images.scene.wall_steel) {
      this.load.image('wall_steel', images.scene.wall_steel.src)
    }
    if (images.scene.grass) {
      this.load.image('grass', images.scene.grass.src)
    }
    if (images.scene.water) {
      this.load.image('water', images.scene.water.src)
    }
    if (images.scene.base) {
      this.load.image('base', images.scene.base.src)
    }
    if (images.scene.base_destroyed) {
      this.load.image('base_destroyed', images.scene.base_destroyed.src)
    }
    
    // 玩家坦克
    if (images.sprite.player_tank_up) {
      this.load.image('player_tank_up', images.sprite.player_tank_up.src)
      this.load.image('player_tank_down', images.sprite.player_tank_down.src)
      this.load.image('player_tank_left', images.sprite.player_tank_left.src)
      this.load.image('player_tank_right', images.sprite.player_tank_right.src)
    }
    
    // 敌方坦克
    if (images.sprite.enemy_basic_up) {
      this.load.image('enemy_basic_up', images.sprite.enemy_basic_up.src)
      this.load.image('enemy_basic_down', images.sprite.enemy_basic_down.src)
      this.load.image('enemy_basic_left', images.sprite.enemy_basic_left.src)
      this.load.image('enemy_basic_right', images.sprite.enemy_basic_right.src)
    }
    
    if (images.sprite.enemy_fast_up) {
      this.load.image('enemy_fast_up', images.sprite.enemy_fast_up.src)
      this.load.image('enemy_fast_down', images.sprite.enemy_fast_down.src)
      this.load.image('enemy_fast_left', images.sprite.enemy_fast_left.src)
      this.load.image('enemy_fast_right', images.sprite.enemy_fast_right.src)
    }
    
    if (images.sprite.enemy_heavy_up) {
      this.load.image('enemy_heavy_up', images.sprite.enemy_heavy_up.src)
      this.load.image('enemy_heavy_down', images.sprite.enemy_heavy_down.src)
      this.load.image('enemy_heavy_left', images.sprite.enemy_heavy_left.src)
      this.load.image('enemy_heavy_right', images.sprite.enemy_heavy_right.src)
    }
    
    // 子弹
    if (images.sprite.bullet_player) {
      this.load.image('bullet_player', images.sprite.bullet_player.src)
    }
    if (images.sprite.bullet_enemy) {
      this.load.image('bullet_enemy', images.sprite.bullet_enemy.src)
    }
    
    // 道具
    if (images.icon.powerup_star) {
      this.load.image('powerup_star', images.icon.powerup_star.src)
    }
    if (images.icon.powerup_clock) {
      this.load.image('powerup_clock', images.icon.powerup_clock.src)
    }
    if (images.icon.powerup_shovel) {
      this.load.image('powerup_shovel', images.icon.powerup_shovel.src)
    }
    if (images.icon.powerup_life) {
      this.load.image('powerup_life', images.icon.powerup_life.src)
    }
    
    // 爆炸特效
    if (images.effect.explosion_1) {
      this.load.image('explosion_1', images.effect.explosion_1.src)
      this.load.image('explosion_2', images.effect.explosion_2.src)
      this.load.image('explosion_3', images.effect.explosion_3.src)
      this.load.image('explosion_4', images.effect.explosion_4.src)
    }
    
    // 加载音频
    const audio = GTRSConfig.resources.audio
    
    // BGM
    if (audio.bgm.bgm_gameplay) {
      this.load.audio('bgm_gameplay', audio.bgm.bgm_gameplay.src)
    }
    
    // 音效
    if (audio.effect.effect_fire) {
      this.load.audio('effect_fire', audio.effect.effect_fire.src)
    }
    if (audio.effect.effect_explosion) {
      this.load.audio('effect_explosion', audio.effect.effect_explosion.src)
    }
    if (audio.effect.effect_hit) {
      this.load.audio('effect_hit', audio.effect.effect_hit.src)
    }
  }
  
  create() {
    // 初始化 Pinia store
    this.gameStore = useGameStore()
    
    // 创建爆炸动画
    this.createExplosionAnimation()
    
    // 绘制背景
    this.createBackground()
    
    // 创建墙壁
    this.createWalls()
    
    // 创建基地
    this.createBase()
    
    // 创建玩家
    this.createPlayer()
    
    // 创建敌人
    this.createEnemies()
    
    // 设置控制
    this.setupControls()
    
    // 播放背景音乐
    this.playBGM()
    
    // 创建碰撞检测
    this.setupCollisions()
  }
  
  update(time: number, delta: number) {
    if (this.gameStore.gameState !== 'playing') return
    
    // 更新玩家移动
    this.updatePlayerMovement()
    
    // 更新子弹
    this.updateBullets()
    
    // 更新敌人 AI
    this.updateEnemyAI()
    
    // 检查道具收集
    this.checkPowerUpCollection()
  }
  
  private createExplosionAnimation() {
    this.anims.create({
      key: 'explosion',
      frames: [
        { key: 'explosion_1' },
        { key: 'explosion_2' },
        { key: 'explosion_3' },
        { key: 'explosion_4' }
      ],
      frameRate: 20,
      repeat: 0
    })
  }
  
  private createBackground() {
    // 添加背景
    const bg = this.add.image(360, 640, 'background')
    bg.setDisplaySize(720, 1280)
    bg.setDepth(-10)
    
    // 添加网格
    const grid = this.add.image(360, 640, 'grid')
    grid.setDisplaySize(720, 1280)
    grid.setAlpha(0.3)
    grid.setDepth(-9)
  }
  
  private createWalls() {
    const gridSize = this.gameStore.gridSize
    
    this.gameStore.walls.forEach(wall => {
      let texture = ''
      switch (wall.type) {
        case 'brick':
          texture = 'wall_brick'
          break
        case 'steel':
          texture = 'wall_steel'
          break
        case 'grass':
          texture = 'grass'
          break
        case 'water':
          texture = 'water'
          break
      }
      
      if (texture) {
        const x = wall.x * gridSize + gridSize / 2
        const y = wall.y * gridSize + gridSize / 2
        
        const sprite = this.add.image(x, y, texture)
        sprite.setDisplaySize(gridSize, gridSize)
        
        if (wall.type === 'grass') {
          sprite.setDepth(5) // 草地在坦克下面
        } else {
          sprite.setDepth(0)
        }
        
        // 添加到组
        this.wallGroup.add(sprite)
        
        // 添加物理身体
        this.physics.add.existing(sprite, true) // 静态物理
        const body = sprite.body as Phaser.Physics.Arcade.StaticBody
        body.setSize(gridSize, gridSize)
      }
    })
  }
  
  private createBase() {
    const pos = this.gameStore.basePosition
    const gridSize = this.gameStore.gridSize
    
    const x = pos.x * gridSize + gridSize
    const y = pos.y * gridSize + gridSize
    
    const base = this.add.image(x, y, 'base')
    base.setDisplaySize(gridSize * 2, gridSize * 2)
    base.setDepth(1)
    
    // 添加物理身体
    this.physics.add.existing(base, true)
    const body = base.body as Phaser.Physics.Arcade.StaticBody
    body.setSize(gridSize * 2, gridSize * 2)
  }
  
  private createPlayer() {
    const player = this.gameStore.player
    if (!player) return
    
    const texture = `player_tank_${player.direction}`
    this.playerSprite = this.add.sprite(player.x + 24, player.y + 24, texture)
    this.playerSprite.setDisplaySize(48, 48)
    this.playerSprite.setDepth(2)
    
    // 添加物理身体
    this.physics.add.existing(this.playerSprite)
    const body = this.playerSprite.body as Phaser.Physics.Arcade.Body
    body.setSize(40, 40)
    body.setCollideWorldBounds(true)
    
    // 添加到场景
    this.physics.world.add(this.playerSprite)
  }
  
  private createEnemies() {
    this.enemyGroup = this.add.group()
    
    this.gameStore.enemies.forEach(enemy => {
      this.spawnEnemySprite(enemy)
    })
  }
  
  private spawnEnemySprite(enemy: Tank) {
    const texture = `${enemy.type}_${enemy.direction}`
    const size = enemy.type === 'enemy_heavy' ? 54 : enemy.type === 'enemy_fast' ? 42 : 48
    
    const sprite = this.add.sprite(enemy.x + size/2, enemy.y + size/2, texture)
    sprite.setDisplaySize(size, size)
    sprite.setDepth(2)
    
    // 添加物理身体
    this.physics.add.existing(sprite)
    const body = sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(size - 8, size - 8)
    body.setCollideWorldBounds(true)
    
    this.enemyGroup.add(sprite)
  }
  
  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
    // 也支持 J 键
    const jKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J)
    this.input.keyboard!.on('keydown-J', () => this.fireBullet())
    this.input.keyboard!.on('keydown-SPACE', () => this.fireBullet())
  }
  
  private updatePlayerMovement() {
    const speed = 180 // 像素/秒
    let moving = false
    let newDirection = ''
    
    this.playerSprite.setVelocity(0, 0)
    
    if (this.cursors.left?.isDown) {
      this.playerSprite.setVelocityX(-speed)
      moving = true
      newDirection = 'left'
    } else if (this.cursors.right?.isDown) {
      this.playerSprite.setVelocityX(speed)
      moving = true
      newDirection = 'right'
    }
    
    if (this.cursors.up?.isDown) {
      this.playerSprite.setVelocityY(-speed)
      moving = true
      newDirection = 'up'
    } else if (this.cursors.down?.isDown) {
      this.playerSprite.setVelocityY(speed)
      moving = true
      newDirection = 'down'
    }
    
    if (moving && newDirection) {
      this.playerSprite.setTexture(`player_tank_${newDirection}`)
      
      // 更新 store 中的方向
      this.gameStore.updatePlayerPosition(
        this.playerSprite.x - 24,
        this.playerSprite.y - 24,
        newDirection as any
      )
    }
  }
  
  private fireBullet() {
    const now = Date.now()
    if (now - this.lastFireTime < this.fireCooldown) return
    
    this.lastFireTime = now
    
    // 播放开火音效
    this.sound.play('effect_fire', { volume: 0.6 })
    
    // 创建子弹
    const direction = this.playerSprite.texture.key.replace('player_tank_', '')
    const offset = 24
    
    let x = this.playerSprite.x
    let y = this.playerSprite.y
    
    switch (direction) {
      case 'up':
        y -= offset
        break
      case 'down':
        y += offset
        break
      case 'left':
        x -= offset
        break
      case 'right':
        x += offset
        break
    }
    
    const bullet = this.add.image(x, y, 'bullet_player')
    bullet.setDisplaySize(12, 12)
    bullet.setDepth(2)
    
    this.physics.add.existing(bullet)
    const body = bullet.body as Phaser.Physics.Arcade.Body
    
    const bulletSpeed = 400
    switch (direction) {
      case 'up':
        body.setVelocityY(-bulletSpeed)
        break
      case 'down':
        body.setVelocityY(bulletSpeed)
        break
      case 'left':
        body.setVelocityX(-bulletSpeed)
        break
      case 'right':
        body.setVelocityX(bulletSpeed)
        break
    }
    
    this.bulletGroup.add(bullet)
  }
  
  private updateBullets() {
    const speed = 400
    
    this.bulletGroup.getChildren().forEach((child) => {
      const bullet = child as Phaser.GameObjects.Image
      const body = bullet.body as Phaser.Physics.Arcade.Body
      
      // 移除超出屏幕的子弹
      if (bullet.x < 0 || bullet.x > 720 || bullet.y < 0 || bullet.y > 1280) {
        this.gameStore.removeBullet(bullet.getData('id') || 0)
        bullet.destroy()
      }
    })
  }
  
  private updateEnemyAI() {
    this.enemyGroup.getChildren().forEach((child) => {
      const enemy = child as Phaser.GameObjects.Image
      const body = enemy.body as Phaser.Physics.Arcade.Body
      
      // 简单的 AI: 随机移动
      if (Math.random() < 0.02) {
        const directions = ['up', 'down', 'left', 'right']
        const dir = directions[Math.floor(Math.random() * directions.length)]
        
        const speed = 100
        switch (dir) {
          case 'up':
            body.setVelocityY(-speed)
            break
          case 'down':
            body.setVelocityY(speed)
            break
          case 'left':
            body.setVelocityX(-speed)
            break
          case 'right':
            body.setVelocityX(speed)
            break
        }
      }
      
      // 随机开火
      if (Math.random() < 0.01) {
        this.fireEnemyBullet(enemy)
      }
    })
  }
  
  private fireEnemyBullet(enemy: Phaser.GameObjects.Image) {
    const bullet = this.add.image(enemy.x, enemy.y, 'bullet_enemy')
    bullet.setDisplaySize(12, 12)
    bullet.setDepth(2)
    
    this.physics.add.existing(bullet)
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(300) // 向下射击
    
    this.bulletGroup.add(bullet)
  }
  
  private setupCollisions() {
    // 子弹与墙壁碰撞
    this.physics.add.collider(this.bulletGroup, this.wallGroup, (bulletObj: any, wallObj: any) => {
      const bullet = bulletObj as Phaser.GameObjects.Image
      bullet.destroy()
      
      // 播放击中音效
      this.sound.play('effect_hit', { volume: 0.5 })
      
      // 如果是砖墙，可以摧毁
      const wall = wallObj as Phaser.GameObjects.Image
      if (wall.texture.key === 'wall_brick') {
        wall.destroy()
      }
    })
    
    // 玩家子弹与敌人碰撞
    this.physics.add.overlap(this.bulletGroup, this.enemyGroup, (bulletObj: any, enemyObj: any) => {
      const bullet = bulletObj as Phaser.GameObjects.Image
      const enemy = enemyObj as Phaser.GameObjects.Image
      
      if (bullet.texture.key === 'bullet_player') {
        // 击中敌人
        this.gameStore.damageEnemy(enemy.getData('id') || 0, 1)
        
        // 播放爆炸动画
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion_1')
        explosion.setDepth(3)
        explosion.play('explosion', true)
        
        // 播放爆炸音效
        this.sound.play('effect_explosion', { volume: 0.7 })
        
        setTimeout(() => explosion.destroy(), 500)
        
        bullet.destroy()
        enemy.destroy()
      }
    })
    
    // 敌人子弹与玩家碰撞
    this.physics.add.overlap(this.bulletGroup, this.playerSprite, (bulletObj: any) => {
      const bullet = bulletObj as Phaser.GameObjects.Image
      
      if (bullet.texture.key === 'bullet_enemy') {
        // 玩家被击中
        this.gameStore.lives--
        
        if (this.gameStore.lives <= 0) {
          this.gameStore.gameOver()
        } else {
          // 重置玩家位置
          this.playerSprite.setPosition(11 * 30 + 24, 34 * 30 + 24)
        }
        
        bullet.destroy()
      }
    })
  }
  
  private checkPowerUpCollection() {
    // 检查玩家是否收集到道具
    this.powerUpGroup.getChildren().forEach((child) => {
      const powerUp = child as Phaser.GameObjects.Image
      const distance = Phaser.Math.Distance.Between(
        this.playerSprite.x,
        this.playerSprite.y,
        powerUp.x,
        powerUp.y
      )
      
      if (distance < 40) {
        // 收集道具
        this.gameStore.collectPowerUp(powerUp.getData('id') || 0)
        powerUp.destroy()
        
        // 播放收集音效
        this.sound.play('effect_powerup_pickup', { volume: 0.6 })
      }
    })
  }
  
  private playBGM() {
    const bgm = this.sound.add('bgm_gameplay', {
      volume: 0.4,
      loop: true
    })
    bgm.play()
  }
}
