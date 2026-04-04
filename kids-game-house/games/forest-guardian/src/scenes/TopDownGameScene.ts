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
  private isGameObjectsCreated: boolean = false
  
  // 输入相关
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private enterKey!: Phaser.Input.Keyboard.Key
  private spaceKey!: Phaser.Input.Keyboard.Key

  preload(): void {
    this.preloadFromGTRS()
    // 加载地图资源（使用统一的 Key，方便子类覆盖）
    this.load.tilemapTiledJSON('map', '/themes/top_down/assets/scene/sprites/maps/cities/home_page_city.json')
    this.load.image('tileset', '/themes/top_down/assets/scene/sprites/maps/tilesets/tileset.png')
  }

  create(): void {
    // 跳过 GameScene.create() 中的 createGameObjects() 调用
    // 我们会在 gridEngine 初始化后再调用它
    this.initAdapt()
    this.scale.on('resize', this.onResize, this)
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this)
    
    // 初始化 Grid Engine
    this.gridEngine = new GridEngine(this)
    const map = this.make.tilemap({ key: 'map' })
    map.addTilesetImage('tileset', 'tileset')
    
    // 创建地图层（GridEngine 会处理碰撞，这里只负责渲染）
    for (let i = 0; i < map.layers.length; i++) {
      const layer = map.createLayer(i, 'tileset', 0, 0)
      if (layer) {
        layer.setDepth(0)
      }
    }

    // 创建英雄
    this.createHero(map)

    // 配置 Grid Engine
    this.gridEngine.create(map, {
      characters: [
        {
          id: 'hero',
          sprite: this.heroSprite,
          startPosition: { x: 15, y: 15 }, // 恢复到地图较中心的位置
          speed: 8, // 🚀 提升移动速度（原为 4）
          offsetY: 4,
        },
      ],
      // 碰撞配置：禁用网格碰撞，方便测试
      // TODO: 后续根据需要配置具体的可通行/不可通行 tile
      collisionConfig: {
        collidesWithTiles: false, // 临时禁用碰撞
      }
    })

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

    // 监听移动事件以播放动画
    this.setupMovementAnimations()

    // 解析 Tiled 对象层（NPC、敌人等）
    this.parseObjectLayer(map)

    // 创建额外游戏对象（子类可覆盖）
    this.createGameObjects()

    // 📷 标准 RPG 相机设置
    // 设置相机边界：确保相机不会看到地图以外的黑色背景
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    
    // 计算合适的缩放比例
    // 策略：默认放大2倍显示（让像素游戏元素更清晰易见），小屏幕自动缩小适配
    const MIN_ZOOM = 1.5  // 最小缩放（元素太小不好看）
    const scaleX = this.scale.width / map.widthInPixels
    const scaleY = this.scale.height / map.heightInPixels
    const minFit = Math.min(scaleX, scaleY)
    const zoom = Math.max(MIN_ZOOM, minFit) 
    this.cameras.main.setZoom(zoom)
    
    // 开启平滑跟随
    this.cameras.main.startFollow(this.heroSprite, true, 0.1, 0.1)
    
    // 初始化位置：将相机强制拉到主角出生点，防止开局黑屏
    this.cameras.main.centerOn(this.heroSprite.x, this.cameras.main.scrollY + this.scale.height / 2 / zoom)
    
    console.log(`🎮 游戏启动！视窗: ${this.scale.width}x${this.scale.height}, 地图: ${map.widthInPixels}x${map.heightInPixels}, 缩放: ${zoom.toFixed(2)}x`)
  }

  private heroActionCollider!: Phaser.GameObjects.Rectangle
  private enemiesSprites: (Phaser.Physics.Arcade.Sprite & { health: number })[] = []

  protected createGameObjects(): void {
    // 防止重复调用
    if (this.isGameObjectsCreated) return
    this.isGameObjectsCreated = true
    
    // 创建攻击判定框
    this.heroActionCollider = this.add.rectangle(0, 0, 14, 8, 0xff0000, 0.3)
    this.physics.world.enable(this.heroActionCollider)
    ;(this.heroActionCollider.body as any).setAllowGravity(false)
  }

  protected gameLoop(_time: number, _delta: number): void {
    // ⚠️ 关键：每帧更新 GridEngine
    this.gridEngine.update(_time, _delta)

    if (this.isTeleporting || this.isShowingDialog) return

    // 处理攻击输入（优先处理）
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isAttacking) {
      if (!this.heroSprite.haveSword) {
        console.log('🗡️ 你需要一把剑才能攻击！')
        return
      }
      const direction = this.gridEngine.getFacingDirection('hero')
      this.heroSprite.anims.play(`hero_attack_${direction}`)
      this.isAttacking = true
      
      // 攻击持续时间：500ms（确保有足够帧数进行碰撞检测）
      this.time.delayedCall(500, () => {
        this.isAttacking = false
      })
    }

    // ⚠️ 重要：无论是否在攻击，都要更新攻击判定框（用于碰撞检测）
    this.updateActionCollider()

    // 如果正在攻击或传送，则不处理移动
    if (this.isAttacking) return

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

    // 敌人 AI 逻辑：简单的追逐与碰撞伤害
    this.enemiesSprites.forEach((enemy, index) => {
      if (!enemy.active || !enemy.name) return
      
      // 🩸 血条跟随怪物移动
      if ((enemy as any).healthBar) {
        const barY = enemy.y - enemy.height / 2 - 8 // 在敌人头顶
        const barX = enemy.x
        ;(enemy as any).healthBar.setPosition(barX, barY)
        ;(enemy as any).healthBarBg?.setPosition(barX - 20, barY)
      }

      // 简单的追逐逻辑：每帧有极小概率向英雄移动一步
      if (Math.random() < 0.01 && !this.gridEngine.isMoving(enemy.name)) {
        const heroPos = this.gridEngine.getPosition('hero')
        const enemyPos = this.gridEngine.getPosition(enemy.name)
        
        // 只有当距离较近时才追逐（例如 10 个格子以内）
        const dist = Math.abs(heroPos.x - enemyPos.x) + Math.abs(heroPos.y - enemyPos.y)
        if (dist < 10) {
          if (heroPos.x > enemyPos.x) this.gridEngine.move(enemy.name, 'right')
          else if (heroPos.x < enemyPos.x) this.gridEngine.move(enemy.name, 'left')
          else if (heroPos.y > enemyPos.y) this.gridEngine.move(enemy.name, 'down')
          else if (heroPos.y < enemyPos.y) this.gridEngine.move(enemy.name, 'up')
        }
      }

      // 碰撞伤害判定：使用中心点距离，确保只有贴脸才扣血
      const dist = Phaser.Math.Distance.Between(
        this.heroSprite.x, this.heroSprite.y,
        enemy.x, enemy.y
      )
      if (dist < 24) { // 减小判定半径（约 1.5 个格子），模拟怪物的近战攻击范围
        if (!(this.heroSprite as any).isInvincible) {
          ;(this.heroSprite as any).takeDamage(20)
          ;(this.heroSprite as any).isInvincible = true
          
          // 1.5 秒无敌时间
          this.time.delayedCall(1500, () => {
            if (this.heroSprite) (this.heroSprite as any).isInvincible = false
          })
        }
      }
    })

    // 📷 确保相机始终锁定在主角身上（防止 GridEngine 更新导致的延迟）
    if (this.heroSprite && this.heroSprite.active) {
      // 手动更新相机位置，确保视窗跟随
      this.cameras.main.centerOn(this.heroSprite.x, this.heroSprite.y)
    }
  }

  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    console.log('💀 游戏结束')
    this.game.events.emit('gameover', this.score)
  }

  private createHero(map: Phaser.Tilemaps.Tilemap): void {
    // 恢复初始位置为 (15, 15)
    const startX = 15 * 16
    const startY = 15 * 16
    
    // 检查 hero 图集是否存在，如果不存在使用占位符
    const heroTexture = this.textures.exists('hero') ? 'hero' : '__DEFAULT'
    const heroFrame = this.textures.exists('hero') ? 'hero_idle_down_01' : undefined
    
    const sprite = this.physics.add.sprite(startX, startY, heroTexture, heroFrame) as any
    
    this.heroSprite = sprite
    this.heroSprite.setDepth(100) // 确保主角在所有图层之上
    this.heroSprite.health = 100
    this.heroSprite.maxHealth = 100
    this.heroSprite.haveSword = false
    ;(this.heroSprite as any).isInvincible = false
    
    // 设置碰撞体大小
    this.heroSprite.body!.setSize(14, 14)
    this.heroSprite.body!.setOffset(9, 13)

    // 受到伤害逻辑
    this.heroSprite.takeDamage = (damage: number) => {
      if ((this.heroSprite as any).isInvincible) return
      
      this.heroSprite.health -= damage
      this.emitHeroHealth()
      
      if (this.heroSprite.health <= 0) {
        this.handleGameOver()
      } else {
        // 闪烁效果
        this.tweens.add({
          targets: this.heroSprite,
          alpha: 0,
          duration: 70,
          repeat: 3,
          yoyo: true,
        })
      }
    }
    
    console.log('✅ 英雄已创建，位置:', startX, startY)
  }

  private setupMovementAnimations(): void {
    const directions = ['up', 'right', 'down', 'left']
    
    // 尝试加载 hero 动画，如果图集不存在则创建占位符
    if (this.textures.exists('hero')) {
      directions.forEach(dir => {
        // 步行动画（使用 2 帧）
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
        
        // 攻击动画（使用 2 帧简化版）
        this.anims.create({
          key: `hero_attack_${dir}`,
          frames: this.anims.generateFrameNames('hero', {
            prefix: `hero_attack_${dir}_`,
            start: 1,
            end: 2,
            suffix: '',
            zeroPad: 2,
          }),
          frameRate: 10,
          repeat: 0,
        })
        
        // 待机动画
        this.anims.create({
          key: `hero_idle_${dir}`,
          frames: this.anims.generateFrameNames('hero', {
            prefix: `hero_idle_${dir}_`,
            start: 1,
            end: 1,
            suffix: '',
            zeroPad: 2,
          }),
          frameRate: 1,
          repeat: -1,
        })
      })
    } else {
      console.warn('⚠️ hero 图集未加载，跳过动画创建')
      // 创建简单的占位动画
      directions.forEach(dir => {
        this.anims.create({
          key: `hero_walking_${dir}`,
          frames: [{ key: '__DEFAULT', frame: '0' }],
          frameRate: 12, // 🚀 提高动画帧率，减少视觉卡顿感
          repeat: -1,
        })
      })
    }

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
    
    // 根据朝向设置攻击判定框位置（在英雄前方一个格子的距离）
    const reach = 20 // 攻击范围（像素）
    const size = 32  // 判定框大小
    
    switch (direction) {
      case 'down':
        this.heroActionCollider.setPosition(pos.x, pos.y + reach)
        break
      case 'up':
        this.heroActionCollider.setPosition(pos.x, pos.y - reach)
        break
      case 'left':
        this.heroActionCollider.setPosition(pos.x - reach, pos.y)
        break
      case 'right':
        this.heroActionCollider.setPosition(pos.x + reach, pos.y)
        break
    }
    this.heroActionCollider.setSize(size, size)

    // 检测攻击碰撞
    if (this.isAttacking) {
      const attackBounds = this.heroActionCollider.getBounds()
      
      this.enemiesSprites.forEach(enemy => {
        if (!enemy.active) return
        
        // 使用矩形重叠检测
        if (Phaser.Geom.Intersects.RectangleToRectangle(attackBounds, enemy.getBounds())) {
          // 防止一帧内多次扣血
          if (!(enemy as any).isHit) {
            enemy.health -= 25
            ;(enemy as any).isHit = true
            this.time.delayedCall(300, () => { if (enemy.active) (enemy as any).isHit = false })

            console.log(`⚔️ 击中敌人！剩余血量: ${enemy.health}`)
            
            // 🩸 更新血条
            const maxHealth = (enemy as any).maxHealth || 50
            const percent = Math.max(0, enemy.health / maxHealth)
            ;(enemy as any).healthBar.width = 40 * percent // 40是血条总宽度
            
            // 根据血量设置颜色
            if (percent > 0.6) (enemy as any).healthBar.setFillStyle(0x00ff00) // 绿
            else if (percent > 0.3) (enemy as any).healthBar.setFillStyle(0xffff00) // 黄
            else (enemy as any).healthBar.setFillStyle(0xff0000) // 红

            // 闪烁效果
            enemy.setTint(0xff0000)
            this.time.delayedCall(100, () => {
              if (enemy.active) enemy.clearTint()
            })

            if (enemy.health <= 0) {
              // 🎉 敌人死亡掉落
              this.createDrop(enemy.x, enemy.y)

              // 消灭敌人时也销毁血条
              ;(enemy as any).healthBar.destroy()
              ;(enemy as any).healthBarBg?.destroy()
              enemy.destroy()
              this.score += 10
              this.game.events.emit('score', this.score)
              console.log('💀 敌人被消灭！')
            }
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

  protected createEnemy(x: number, y: number, type: string, speed: number, health: number, ai: string): void {
    const enemy = this.physics.add.sprite(x, y, 'slime', 'slime_idle_01') as any
    enemy.setDepth(1)
    enemy.health = health
    enemy.maxHealth = health // 记录最大血量用于计算血条比例
    enemy.enemyType = type
    
    // 为每个敌人分配唯一 ID，并同步到 sprite.name
    const id = `enemy_${this.enemiesSprites.length}`
    enemy.name = id

    // 🩸 创建怪物血条（加大尺寸，更清晰可见）
    const barWidth = 40  // 血条宽度
    const barHeight = 6   // 血条高度
    const barBg = this.add.rectangle(x, y - 20, barWidth, barHeight, 0x333333) // 背景
    const bar = this.add.rectangle(x - barWidth/2 + barWidth/2, y - 20, barWidth, barHeight, 0x00ff00) // 前景
    bar.setOrigin(0, 0.5) // 左对齐，方便缩放
    barBg.setOrigin(0, 0.5)
    bar.setDepth(10)
    barBg.setDepth(9)
    enemy.healthBar = bar
    ;(enemy as any).healthBarBg = barBg

    this.gridEngine.addCharacter({
      id,
      sprite: enemy,
      startPosition: { x: Math.floor(x / 16), y: Math.floor(y / 16) },
      speed: speed,
      offsetY: 4,
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

  protected createItem(x: number, y: number, type: string): void {
    const item = this.physics.add.sprite(x, y, type === 'coin' ? 'coin_atlas' : type) as any
    item.setDepth(1)
    item.itemType = type

    this.physics.add.overlap(this.heroSprite, item, (_objA, objB: any) => {
      if (objB.itemType === 'coin') {
        this.score += 5
        this.game.events.emit('score', this.score)
      } else if (objB.itemType === 'heart') {
        this.heroSprite.health = Math.min(this.heroSprite.health + 20, this.heroSprite.maxHealth)
        this.emitHeroHealth()
      } else if (objB.itemType === 'sword') {
        this.heroSprite.haveSword = true
        // 🗡️ 捡到剑只发提示，不进入阻塞式的对话状态
        console.log('🗡️ 你获得了宝剑！现在可以按空格键攻击了。')
        
        // 发送一个非阻塞的 UI 提示（可选）
        const event = new CustomEvent('new-dialog', {
          detail: { characterName: '系统', messages: ['你获得了宝剑！', '按空格键攻击敌人！'] }
        })
        window.dispatchEvent(event)
        
        // 立即结束对话状态，防止卡住
        setTimeout(() => {
          this.isShowingDialog = false
          window.dispatchEvent(new CustomEvent('system-dialog-finished'))
        }, 2000)
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
    const states: string[] = []
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

  /**
   * 🎉 敌人死亡掉落逻辑
   */
  private createDrop(x: number, y: number): void {
    const rand = Math.random()
    let type = 'coin'
    if (rand > 0.7) type = 'heart' // 30% 概率掉血瓶
    
    this.createItem(x, y, type)
  }
}
