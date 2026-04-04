// ============================================================================
// 🎮 游戏场景基类 - GameScene.ts
// ============================================================================
//
// ⚠️  【框架文件，AI 请勿修改此文件】
//
// 📌 正确做法:
//   1. 新建 src/scenes/MyGameScene.ts，继承此类
//   2. 实现三个抽象方法（TypeScript 强制要求）：
//      - createGameObjects()   创建游戏对象
//      - gameLoop()            游戏主循环
//      - handleGameOver()      游戏结束处理
//   3. 在 PhaserGame.vue 中替换 scene 引用
//
// 📖 完整开发指南: AI_INSTRUCTIONS.md
// ============================================================================

import Phaser from 'phaser'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'

/**
 * 游戏场景抽象基类
 *
 * AI 开发者必须：
 *   1. 新建子类继承此类（不要直接修改此文件）
 *   2. 实现三个 abstract 方法（TypeScript 编译强制检查）
 *
 * 框架提供的能力（直接使用，无需重写）：
 *   - preloadFromGTRS()     ⭐ 从 GTRS.json 自动加载所有资源（推荐在 preload() 中调用）
 *   - getImageKey(name)     获取图片的 Phaser key（与 GTRS 对齐）
 *   - getAudioKey(name)     获取音频的 Phaser key（与 GTRS 对齐）
 *   - initAdapt()           屏幕适配，计算 cellSize / offsetX / offsetY
 *   - addScore(points)      加分（自动同步 store + 触发关卡升级）
 *   - pauseGame()           暂停
 *   - resumeGame()          恢复
 *   - togglePause()         切换暂停
 *   - gridToPixel()         网格坐标 → 像素坐标（左上角）
 *   - gridToPixelCenter()   网格坐标 → 像素坐标（中心）
 *   - addPhysicsSprite()    创建带物理体的 Sprite
 *   - addPhysicsGroup()     创建静态物理组
 *   - addCollider()         注册碰撞检测（阻止重叠）
 *   - addOverlap()          注册重叠检测（不阻止移动）
 */
export default abstract class GameScene extends Phaser.Scene {
  // ─── 基础状态 ───────────────────────────────────────────────
  protected score: number = 0
  protected isPaused: boolean = false
  protected isGameOver: boolean = false

  // ─── 屏幕适配参数（由 initAdapt() 计算） ────────────────────
  protected screenW: number = 0
  protected screenH: number = 0
  protected cellSize: number = 40
  protected offsetX: number = 0
  protected offsetY: number = 0
  protected gridCols: number = 20
  protected gridRows: number = 15

  // ─── GTRS 资源索引（由 preloadFromGTRS 填充） ────────────────
  private _gtrsImageKeys: Set<string> = new Set()
  private _gtrsAudioKeys: Set<string> = new Set()

  constructor() {
    super({ key: 'GameScene' })
  }

  // ─── Phaser 生命周期 ─────────────────────────────────────────

  /**
   * 预加载资源（可选覆盖）
   *
   * ⭐ 推荐做法：在子类 preload() 中调用 this.preloadFromGTRS()
   *   框架会自动从 GTRS.json 读取所有资源并加载，无需手动写路径：
   *
   * @example
   *   preload(): void {
   *     this.preloadFromGTRS()   // 自动从 GTRS.json 加载所有资源
   *   }
   *
   * 如需加载 GTRS.json 之外的额外资源，可追加：
   * @example
   *   preload(): void {
   *     this.preloadFromGTRS()
   *     this.load.image('extra', '/images/extra.png')  // 额外资源
   *   }
   */
  preload(): void {
    // 默认不加载任何资源，子类按需覆盖
  }

  /**
   * 场景创建（可选覆盖）
   *
   * ⚠️ 覆盖此方法时，第一行必须调用 super.create()
   *
   * @example
   *   create(): void {
   *     super.create()   // ← 必须保留！
   *     // 你的额外初始化...
   *   }
   */
  create(): void {
    // 1. 初始化屏幕适配
    this.initAdapt()

    // 2. 监听屏幕尺寸变化
    this.scale.on('resize', this.onResize, this)

    // 3. 设置键盘输入（Esc 暂停）
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this)

    // 4. 创建游戏对象（子类必须实现）
    this.createGameObjects()

    // 5. 通知 Vue 层游戏已就绪
    this.game.events.emit('ready')
  }

  /**
   * 每帧更新（可选覆盖）
   *
   * ⚠️ 覆盖此方法时，必须调用 super.update(time, delta)
   */
  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return
    this.gameLoop(time, delta)
  }

  // ─── 抽象方法（子类必须实现） ────────────────────────────────

  /**
   * ⭐ 创建游戏对象【必须实现】
   *
   * 在这里创建：背景/地图、玩家角色、敌人、道具/食物、画布层
   *
   * @example
   *   protected createGameObjects(): void {
   *     const pos = this.gridToPixelCenter(5, 5)
   *     this.player = this.add.image(pos.x, pos.y, 'player')
   *   }
   */
  protected abstract createGameObjects(): void

  /**
   * ⭐ 游戏主循环【必须实现】
   *
   * 每帧调用（已排除暂停/结束状态），实现游戏核心逻辑
   *
   * @param time  游戏运行总毫秒数
   * @param delta 距上一帧毫秒数（用于时间驱动移动）
   *
   * @example
   *   protected gameLoop(time: number, delta: number): void {
   *     this.moveTimer += delta
   *     if (this.moveTimer >= this.moveInterval) {
   *       this.moveTimer = 0
   *       this.movePlayer()
   *     }
   *   }
   */
  protected abstract gameLoop(time: number, delta: number): void

  /**
   * ⭐ 游戏结束处理【必须实现】
   *
   * 必须在末尾 emit 'gameover' 事件，框架才能跳转结束页面
   *
   * @example
   *   protected handleGameOver(): void {
   *     if (this.isGameOver) return
   *     this.isGameOver = true
   *     // 播放结束动画...
   *     this.time.delayedCall(500, () => {
   *       this.game.events.emit('gameover', this.score)
   *     })
   *   }
   */
  protected abstract handleGameOver(): void

  // ─── GTRS 资源管理（框架提供，直接调用） ────────────────────

  /**
   * ⭐ 从 GTRS.json 自动加载全部资源
   *
   * 在子类 preload() 中调用此方法，框架会：
   *   1. 读取 themeStore 中已加载的 GTRS 配置
   *   2. 遍历所有 images.scene / images.ui / images.icon / images.effect
   *   3. 遍历所有 audio.bgm / audio.effect
   *   4. 按 key 名注册到 Phaser loader
   *
   * 加载后在 createGameObjects() 中直接使用 key 名：
   *   this.add.image(x, y, 'bg')          ← key = GTRS.json 中的字段名
   *   this.sound.play('bgm_main')
   *
   * 若 GTRS.json 为空（resources 全是 {}），此方法不报错，只是不加载任何资源。
   *
   * @example
   *   preload(): void {
   *     this.preloadFromGTRS()
   *   }
   */
  protected preloadFromGTRS(): void {
    const themeStore = useThemeStore()
    const resources = themeStore.resources

    if (!resources) {
      console.warn('[GameScene] GTRS 资源尚未加载，preloadFromGTRS() 跳过')
      return
    }

    // ── 加载图片 ───────────────────────────────────────────────
    const imageGroups = resources.images as Record<string, Record<string, any>> | undefined
    if (imageGroups) {
      for (const groupName of Object.keys(imageGroups)) {
        const group = imageGroups[groupName]
        if (!group) continue
        for (const [key, res] of Object.entries(group)) {
          if (!res?.src) continue
          let src = res.src as string
          // 归一化：去除 /public/ 前缀
          if (src.startsWith('/public/')) src = src.replace('/public/', '/')
          if (!this.textures.exists(key)) {
            this.load.image(key, src)
            this._gtrsImageKeys.add(key)
          }
        }
      }
    }

    // ── 加载音频 ───────────────────────────────────────────────
    const audioGroups = resources.audio as Record<string, Record<string, any>> | undefined
    if (audioGroups) {
      for (const groupName of Object.keys(audioGroups)) {
        const group = audioGroups[groupName]
        if (!group) continue
        for (const [key, res] of Object.entries(group)) {
          if (!res?.src) continue
          let src = res.src as string
          if (src.startsWith('/public/')) src = src.replace('/public/', '/')
          if (!this.sound.get(key)) {
            this.load.audio(key, src)
            this._gtrsAudioKeys.add(key)
          }
        }
      }
    }

    // ── 加载图集 (Atlases) ─────────────────────────────────────
    const atlasGroups = resources.atlases as Record<string, Record<string, any>> | undefined
    if (atlasGroups) {
      for (const groupName of Object.keys(atlasGroups)) {
        const group = atlasGroups[groupName]
        if (!group) continue
        for (const [key, res] of Object.entries(group)) {
          if (!res?.atlas || !res?.image) continue
          let atlasSrc = res.atlas as string
          let imageSrc = res.image as string
          if (atlasSrc.startsWith('/public/')) atlasSrc = atlasSrc.replace('/public/', '/')
          if (imageSrc.startsWith('/public/')) imageSrc = imageSrc.replace('/public/', '/')
          
          if (!this.textures.exists(key)) {
            this.load.atlas(key, imageSrc, atlasSrc)
            this._gtrsImageKeys.add(key)
          }
        }
      }
    }

    const imgCount   = this._gtrsImageKeys.size
    const audioCount = this._gtrsAudioKeys.size
    if (imgCount + audioCount > 0) {
      console.log(`[GameScene] preloadFromGTRS: 图片 ${imgCount} 个，音频 ${audioCount} 个`)
    } else {
      console.warn('[GameScene] preloadFromGTRS: GTRS.json 中没有配置任何资源（resources 全为空对象）')
    }
  }

  /**
   * 检查图片 key 是否来自 GTRS.json
   *
   * 用于调试：验证 createGameObjects() 中使用的 key 是否与 GTRS 配置对齐
   *
   * @example
   *   // 开发期断言：确保使用的 key 已在 GTRS.json 中定义
   *   if (!this.isGtrsImageKey('bg')) {
   *     console.warn('bg 不在 GTRS 资源中，可能是硬编码路径或 GTRS.json 未配置')
   *   }
   */
  protected isGtrsImageKey(key: string): boolean {
    return this._gtrsImageKeys.has(key)
  }

  /**
   * 检查音频 key 是否来自 GTRS.json
   */
  protected isGtrsAudioKey(key: string): boolean {
    return this._gtrsAudioKeys.has(key)
  }

  /**
   * 获取所有已从 GTRS 加载的图片 key 列表（调试用）
   */
  protected getGtrsImageKeys(): string[] {
    return Array.from(this._gtrsImageKeys)
  }

  /**
   * 获取所有已从 GTRS 加载的音频 key 列表（调试用）
   */
  protected getGtrsAudioKeys(): string[] {
    return Array.from(this._gtrsAudioKeys)
  }

  // ─── 分数管理（框架提供，直接调用） ─────────────────────────

  /**
   * 增加分数
   * - 自动同步到 gameStore
   * - 自动触发关卡升级检测
   * - 自动 emit 'score' 事件更新 HUD
   */
  protected addScore(points: number): void {
    const gameStore = useGameStore()
    gameStore.addScore(points)
    this.score = gameStore.score
    this.game.events.emit('score', this.score)
  }

  /**
   * 获取当前分数
   */
  public getScore(): number {
    return this.score
  }

  // ─── 暂停管理（框架提供，直接调用） ─────────────────────────

  /**
   * 切换暂停状态
   */
  public togglePause(): void {
    if (this.isGameOver) return
    this.isPaused ? this.resumeGame() : this.pauseGame()
  }

  /**
   * 暂停游戏
   */
  public pauseGame(): void {
    this.isPaused = true
    this.game.events.emit('paused')
  }

  /**
   * 恢复游戏
   */
  public resumeGame(): void {
    this.isPaused = false
    this.game.events.emit('resumed')
  }

  // ─── 屏幕适配（框架提供，直接调用） ─────────────────────────

  /**
   * 初始化屏幕适配参数
   *
   * create() 中自动调用。如需自定义格子数，可在 create() 中
   * 修改 this.gridCols / this.gridRows 后再次调用：
   *
   * @example
   *   create(): void {
   *     super.create()
   *     this.gridCols = 10
   *     this.gridRows = 10
   *     this.initAdapt()   // 重新计算
   *   }
   */
  protected initAdapt(): void {
    this.screenW = this.scale.width
    this.screenH = this.scale.height

    this.cellSize = Math.floor(
      Math.min(
        (this.screenW * 0.9) / this.gridCols,
        (this.screenH * 0.85) / this.gridRows,
      )
    )

    const gameW  = this.gridCols * this.cellSize
    const gameH  = this.gridRows * this.cellSize
    this.offsetX = Math.floor((this.screenW - gameW) / 2)
    this.offsetY = Math.floor((this.screenH - gameH) / 2)
  }

  /**
   * 屏幕尺寸变化处理（可选覆盖以重新布局）
   */
  protected onResize(gameSize: Phaser.Structs.Size): void {
    this.screenW = gameSize.width
    this.screenH = gameSize.height
  }

  // ─── 坐标工具（框架提供，直接调用） ─────────────────────────

  /**
   * 网格坐标 → 像素坐标（格子左上角）
   */
  protected gridToPixel(col: number, row: number): { x: number; y: number } {
    return {
      x: this.offsetX + col * this.cellSize,
      y: this.offsetY + row * this.cellSize
    }
  }

  /**
   * 网格坐标 → 像素坐标（格子中心）
   */
  protected gridToPixelCenter(col: number, row: number): { x: number; y: number } {
    return {
      x: this.offsetX + col * this.cellSize + this.cellSize / 2,
      y: this.offsetY + row * this.cellSize + this.cellSize / 2
    }
  }

  // ─── 物理/碰撞工具（框架提供，直接调用） ────────────────────

  /**
   * 创建带有 Arcade 物理体的 Sprite
   *
   * 相比 this.add.sprite()，额外启用物理碰撞体，适合需要碰撞检测的实体。
   * 可通过 setImmovable(true) 设为静态障碍物。
   *
   * @param x           像素 x 坐标
   * @param y           像素 y 坐标
   * @param textureKey  资源 key（来自 GTRS 或手动加载）
   * @param options     可选配置
   * @returns 带物理体的 Sprite
   *
   * @example
   *   // 创建玩家（动态物理体）
   *   const pos = this.gridToPixelCenter(5, 5)
   *   this.player = this.addPhysicsSprite(pos.x, pos.y, 'player')
   *   this.player.setCollideWorldBounds(true)
   *
   *   // 创建墙壁（静态物理体）
   *   const wall = this.addPhysicsSprite(100, 100, 'wall', { immovable: true })
   */
  protected addPhysicsSprite(
    x: number,
    y: number,
    textureKey: string,
    options?: {
      /** 是否不可移动（默认 false，适合墙壁/障碍物） */
      immovable?: boolean
      /** 是否与世界边界碰撞（默认 false） */
      collideWorldBounds?: boolean
      /** 是否启用物理调试绘制（默认 false） */
      debug?: boolean
    },
  ): Phaser.Physics.Arcade.Sprite {
    const sprite = this.physics.add.sprite(x, y, textureKey)

    if (options?.immovable !== undefined) {
      sprite.setImmovable(options.immovable)
    }
    if (options?.collideWorldBounds) {
      sprite.setCollideWorldBounds(true)
    }
    if (options?.debug) {
      const body = sprite.body as any
      body?.setDebug(options.debug, options.debug, 0x0000ff)
    }

    return sprite
  }

  /**
   * 创建带有 Arcade 物理体的静态图像组
   *
   * 适用于多个静态障碍物（墙壁、方块等），可批量碰撞检测。
   *
   * @param options  可选配置
   * @returns 静态物理组
   *
   * @example
   *   // 创建墙壁组
   *   this.walls = this.addPhysicsGroup({ immovable: true })
   *   const wall = this.addPhysicsSprite(100, 100, 'wall', { immovable: true })
   *   this.walls.add(wall)
   *
   *   // 注册碰撞
   *   this.addCollider(this.player, this.walls)
   */
  protected addPhysicsGroup(options?: {
    immovable?: boolean
    allowGravity?: boolean
  }): Phaser.Physics.Arcade.Group {
    const config: Phaser.Types.Physics.Arcade.PhysicsGroupConfig = {}
    if (options?.immovable) config.immovable = true
    if (options?.allowGravity !== undefined) config.allowGravity = options.allowGravity
    return this.physics.add.staticGroup(config) as unknown as Phaser.Physics.Arcade.Group
  }

  /**
   * 注册碰撞检测（两个物体碰到后阻止重叠）
   *
   * 适用于：玩家↔墙壁、玩家↔敌人、子弹↔墙壁等
   * 回调在碰撞发生时触发，可在此处理伤害/反弹等逻辑。
   *
   * @param object1   物体/组 A
   * @param object2   物体/组 B
   * @param callback  碰撞回调（可选）
   * @param context   回调 this 上下文（默认当前场景）
   * @returns 碰撞器实例
   *
   * @example
   *   this.addCollider(this.player, this.walls)
   *   this.addCollider(this.player, this.enemies, (player, enemy) => {
   *     this.handleGameOver()
   *   })
   */
  protected addCollider(
    object1: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    object2: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    callback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    context?: any,
  ): Phaser.Physics.Arcade.Collider {
    return this.physics.add.collider(
      object1, object2,
      callback as any,
      undefined,
      context ?? this,
    )
  }

  /**
   * 注册重叠检测（两个物体重叠但不阻止移动）
   *
   * 适用于：玩家↔道具/食物/金币（碰到后拾取但不阻挡）
   *
   * @param object1   物体/组 A
   * @param object2   物体/组 B
   * @param callback  重叠回调（可选）
   * @param context   回调 this 上下文（默认当前场景）
   * @returns 重叠器实例
   *
   * @example
   *   this.addOverlap(this.player, this.foods, (player, food) => {
   *     food.destroy()
   *     this.addScore(10)
   *   })
   */
  protected addOverlap(
    object1: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    object2: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    callback?: any,
    context?: any,
  ): Phaser.Physics.Arcade.Collider {
    return this.physics.add.overlap(object1, object2, callback, undefined, context ?? this)
  }

  // ─── 生命周期清理 ────────────────────────────────────────────

  shutdown(): void {
    this.scale.off('resize', this.onResize, this)
    this.input.keyboard?.off('keydown-ESC', this.togglePause, this)
  }
}
