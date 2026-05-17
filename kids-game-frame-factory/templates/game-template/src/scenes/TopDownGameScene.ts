import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'
import GridEngine from 'grid-engine'

// 定义 NPC 和敌人数据接口
interface NpcData {
  npcKey: string
  movementType: string
  facingDirection: string
  delay: number
  area: number
  x: number
  y: number
}

interface EnemyData {
  x: number
  y: number
  speed: number
  enemyType: string
  enemySpecies: string
  enemyAI: string
  enemyName: string
  health: number
}

export default class TopDownGameScene extends GameScene {
  private gridEngine!: any
  private heroSprite!: Phaser.Physics.Arcade.Sprite & { health: number; maxHealth: number; haveSword: boolean; takeDamage: (d: number) => void }
  private isShowingDialog: boolean = false
  private isTeleporting: boolean = false
  private isAttacking: boolean = false
  
  // 输入相关
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private enterKey!: Phaser.Input.Keyboard.Key
  private spaceKey!: Phaser.Input.Keyboard.Key

  preload(): void {
    this.preloadFromGTRS()
    // 加载地图资源
    this.load.tilemapTiledJSON('map_city', '/themes/top_down/assets/scene/sprites/maps/cities/city.json')
    this.load.image('tileset', '/themes/top_down/assets/scene/sprites/maps/tilesets/tileset.png')
  }

  create(): void {
    super.create()
    
    // 初始化 Grid Engine
    this.gridEngine = new GridEngine(this)
    const map = this.make.tilemap({ key: 'map_city' })
    map.addTilesetImage('tileset', 'tileset')
    
    // 创建地图层
    for (let i = 0; i < map.layers.length; i++) {
      const layer = map.createLayer(i, 'tileset', 0, 0)
      if (layer) {
        this.physics.add.collider(this.heroSprite, layer)
      }
    }

    // 初始化输入
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as any
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // 创建英雄
    this.createHero(map)

    // 配置 Grid Engine
    this.gridEngine.create(map, {
      characters: [
        {
          id: 'hero',
          sprite: this.heroSprite,
          startPosition: { x: 5, y: 5 },
          offsetY: 4,
        },
      ],
    })

    // 监听移动事件以播放动画
    this.setupMovementAnimations()

    // 解析 Tiled 对象层（NPC、敌人等）
    this.parseObjectLayer(map)

    // 相机跟随
    this.cameras.main.startFollow(this.heroSprite, true)
    this.cameras.main.setFollowOffset(-this.heroSprite.width, -this.heroSprite.height)
  }

  private heroActionCollider!: Phaser.GameObjects.Rectangle
  private enemiesSprites: (Phaser.Physics.Arcade.Sprite & { health: number })[] = []

  protected createGameObjects(): void {
    // 创建攻击判定框
    this.heroActionCollider = this.add.rectangle(0, 0, 14, 8, 0xff0000, 0.3)
    this.physics.world.enable(this.heroActionCollider)
    ;(this.heroActionCollider.body as any).setAllowGravity(false)
  }

  protected gameLoop(_time: number, _delta: number): void {
    if (this.isTeleporting || this.isShowingDialog || this.isAttacking) return

    // 更新攻击判定框位置
    this.updateActionCollider()

    // 处理移动输入
    if (!this.gridEngine.isMoving('hero')) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        this.gridEngine.move('hero', 'left')
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        this.gridEngine.move('hero', 'right')
      } else if (this.cursors.up.isDown || this.wasd.up.isDown) {
        this.gridEngine.move('hero', 'up')
      } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
        this.gridEngine.move('hero', 'down')
      }
    }

    // 处理攻击输入
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const direction = this.gridEngine.getFacingDirection('hero')
      this.heroSprite.anims.play(`hero_attack_${direction}`)
      this.isAttacking = true
    }
  }

  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    console.log('💀 游戏结束')
    this.game.events.emit('gameover', this.score)
  }

  private createHero(map: Phaser.Tilemaps.Tilemap): void {
    const sprite = this.physics.add.sprite(0, 0, 'hero', 'hero_idle_down_01') as any
    this.heroSprite = sprite
    this.heroSprite.setDepth(1)
    this.heroSprite.health = 100
    this.heroSprite.maxHealth = 100
    this.heroSprite.haveSword = false
    
    // 设置碰撞体大小
    this.heroSprite.body!.setSize(14, 14)
    this.heroSprite.body!.setOffset(9, 13)

    // 受到伤害逻辑
    this.heroSprite.takeDamage = (damage: number) => {
      this.heroSprite.health -= damage
      if (this.heroSprite.health <= 0) {
        this.handleGameOver()
      } else {
        // 闪烁效果
        this.tweens.add({
          targets: this.heroSprite,
          alpha: 0,
          duration: 70,
          repeat: 1,
          yoyo: true,
        })
      }
    }
  }

  private setupMovementAnimations(): void {
    const directions = ['up', 'right', 'down', 'left']
    directions.forEach(dir => {
      this.anims.create({
        key: `hero_walking_${dir}`,
        frames: this.anims.generateFrameNames('hero', {
          prefix: `hero_walking_${dir}_`,
          start: 1,
          end: 2,
          suffix: '',
          zeroPad: 2,
        }),
        frameRate: 8,
        repeat: -1,
        yoyo: true,
      })
      
      this.anims.create({
        key: `hero_attack_${dir}`,
        frames: this.anims.generateFrameNames('hero', {
          prefix: `hero_attack_${dir}_`,
          start: 1,
          end: 4,
          suffix: '',
          zeroPad: 2,
        }),
        frameRate: 16,
        repeat: 0,
      })
    })

    this.gridEngine.movementStarted().subscribe(({ charId, direction }: any) => {
      if (charId === 'hero') {
        this.heroSprite.anims.play(`hero_walking_${direction}`)
      }
    })

    this.gridEngine.movementStopped().subscribe(({ charId, direction }: any) => {
      if (charId === 'hero') {
        this.heroSprite.anims.stop()
        this.heroSprite.setFrame(`hero_idle_${direction}_01`)
      }
    })

    this.heroSprite.on('animationcomplete', (animation: any) => {
      if (animation.key.includes('attack')) {
        this.isAttacking = false
        const dir = this.gridEngine.getFacingDirection('hero')
        this.heroSprite.setFrame(`hero_idle_${dir}_01`)
      }
    })
  }

  private updateActionCollider(): void {
    const direction = this.gridEngine.getFacingDirection('hero')
    const pos = this.heroSprite
    
    switch (direction) {
      case 'down':
        this.heroActionCollider.setPosition(pos.x + 9, pos.y + 36)
        this.heroActionCollider.setSize(14, 8)
        break
      case 'up':
        this.heroActionCollider.setPosition(pos.x + 9, pos.y + 12)
        this.heroActionCollider.setSize(14, 8)
        break
      case 'left':
        this.heroActionCollider.setPosition(pos.x, pos.y + 21)
        this.heroActionCollider.setSize(8, 14)
        break
      case 'right':
        this.heroActionCollider.setPosition(pos.x + 24, pos.y + 21)
        this.heroActionCollider.setSize(8, 14)
        break
    }

    // 检测攻击碰撞
    if (this.isAttacking) {
      this.enemiesSprites.forEach(enemy => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(
          this.heroActionCollider.getBounds(),
          enemy.getBounds()
        )) {
          enemy.health -= 25
          if (enemy.health <= 0) {
            enemy.destroy()
          } else {
            // 受击闪烁
            this.tweens.add({
              targets: enemy,
              alpha: 0,
              duration: 70,
              repeat: 1,
              yoyo: true
            })
          }
        }
      })
    }
  }

  private parseObjectLayer(map: Phaser.Tilemaps.Tilemap): void {
    const dataLayer = map.getObjectLayer('actions')
    if (!dataLayer) return

    const isDebugMode = this.physics.config.debug

    dataLayer.objects.forEach((data: any) => {
      const { properties, x, y } = data
      properties?.forEach((property: any) => {
        const { name, value } = property
        
        if (name === 'dialog') {
          // 创建对话触发器
          const collider = this.add.rectangle(x, y, 16, 16, 0x00ff00, 0.3)
          this.physics.world.enable(collider)
          ;(collider.body as any).setAllowGravity(false)
          
          this.physics.add.overlap(this.heroSprite, collider, () => {
            if (this.isShowingDialog) return
            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
              this.triggerDialog(value)
            }
          })
        } else if (name === 'npcData') {
          // 解析 NPC: npc_01:random;1000;4;down
          const [npcKey, config] = value.split(':')
          const [movement, delay, area, dir] = config.split(';')
          this.createNPC(x, y, npcKey, dir || 'down', movement, parseInt(delay), parseInt(area))
        } else if (name === 'enemyData') {
          // 解析敌人: slime_red:follow;2;80
          const [type, ai, speed, health] = value.split(':')
          this.createEnemy(x, y, type, parseInt(speed), parseInt(health), ai)
        } else if (name === 'itemData') {
          // 解析物品: coin / heart / sword
          const [itemType] = value.split(':')
          this.createItem(x, y, itemType)
        } else if (name === 'teleportTo') {
          // 解析传送: map_city:5,5
          const [targetMap, pos] = value.split(':')
          const [tx, ty] = pos.split(',').map(Number)
          this.createTeleporter(x, y, targetMap, tx, ty)
        }
      })
    })
  }

  private createEnemy(x: number, y: number, type: string, speed: number, health: number, ai: string): void {
    const enemy = this.physics.add.sprite(x, y, 'slime', 'slime_idle_01') as any
    enemy.setDepth(1)
    enemy.health = health
    enemy.enemyType = type
    
    const id = `enemy_${Math.floor(x)}_${Math.floor(y)}`
    this.gridEngine.addCharacter({
      id,
      sprite: enemy,
      startPosition: { x: Math.floor(x / 16), y: Math.floor(y / 16) - 1 },
      speed: speed,
      offsetY: -4,
    })
    this.enemiesSprites.push(enemy)

    // AI 逻辑
    if (ai === 'random') {
      this.gridEngine.moveRandomly(id, 1000, 4)
    }
  }

  private createNPC(x: number, y: number, key: string, dir: string, moveType: string, delay: number, area: number): void {
    const npc = this.physics.add.sprite(x, y, key, `${key}_idle_${dir}_01`)
    npc.setDepth(1)
    npc.body!.setSize(14, 14)
    npc.body!.setOffset(9, 13)

    const id = key
    this.gridEngine.addCharacter({
      id,
      sprite: npc,
      startPosition: { x: Math.floor(x / 16), y: Math.floor(y / 16) - 1 },
      speed: 1,
      offsetY: 4,
    })

    if (moveType === 'random') {
      this.gridEngine.moveRandomly(id, delay, area)
    }

    // 对话碰撞体
    const dialogCollider = this.add.rectangle(x, y, 16, 16, 0xffff00, 0.1)
    this.physics.world.enable(dialogCollider)
    ;(dialogCollider.body as any).setAllowGravity(false)

    this.physics.add.overlap(this.heroSprite, dialogCollider, () => {
      if (this.isShowingDialog) return
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.triggerDialog(key)
        this.gridEngine.stopMovement(id)
      }
    })
  }

  private createItem(x: number, y: number, type: string): void {
    const item = this.physics.add.sprite(x, y, type === 'coin' ? 'coin_atlas' : type) as any
    item.setDepth(1)
    item.itemType = type

    this.physics.add.overlap(this.heroSprite, item, (_objA, objB: any) => {
      if (objB.itemType === 'coin') {
        this.emitHeroCoin(1)
      } else if (objB.itemType === 'heart') {
        this.heroSprite.health = Math.min(this.heroSprite.health + 20, this.heroSprite.maxHealth)
        this.emitHeroHealth()
      } else if (objB.itemType === 'sword') {
        this.heroSprite.haveSword = true
        this.triggerDialog('sword')
      }
      objB.destroy()
    })
  }

  private createTeleporter(x: number, y: number, map: string, tx: number, ty: number): void {
    const teleporter = this.add.rectangle(x, y, 16, 16, 0xff00ff, 0.3)
    this.physics.world.enable(teleporter)
    ;(teleporter.body as any).setAllowGravity(false)

    this.physics.add.overlap(this.heroSprite, teleporter, () => {
      if (this.isTeleporting) return
      this.isTeleporting = true
      this.cameras.main.fadeOut(500)
      
      this.time.delayedCall(500, () => {
        // 简化处理：仅重启当前场景并传参，实际应切换 Scene
        console.log(`Teleporting to ${map} at ${tx},${ty}`)
        this.isTeleporting = false
        this.cameras.main.fadeIn(500)
      })
    })
  }

  private triggerDialog(characterName: string): void {
    this.isShowingDialog = true
    const messages = characterName === 'sword' ? ['You got a sword!'] : ['Hello!', 'How are you?']
    
    // 发送事件给 Vue UI
    const event = new CustomEvent('new-dialog', {
      detail: { characterName, messages }
    })
    window.dispatchEvent(event)

    // 监听对话结束
    const onFinished = () => {
      window.removeEventListener(`${characterName}-dialog-finished`, onFinished as any)
      this.isShowingDialog = false
    }
    window.addEventListener(`${characterName}-dialog-finished`, onFinished as any)
  }

  private emitHeroHealth(): void {
    const states = []
    for (let i = 0; i < this.heroSprite.maxHealth / 20; i++) {
      const h = Math.max(this.heroSprite.health - (20 * i), 0)
      states.push(h > 10 ? 'full' : h > 0 ? 'half' : 'empty')
    }
    window.dispatchEvent(new CustomEvent('hero-health', { detail: { healthStates: states } }))
  }

  private emitHeroCoin(amount: number): void {
    // 简化：这里需要一个全局变量存金币，暂时用局部模拟
    window.dispatchEvent(new CustomEvent('hero-coin', { detail: { heroCoins: amount } }))
  }
}
