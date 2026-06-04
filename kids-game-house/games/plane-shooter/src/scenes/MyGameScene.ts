// ============================================================================
// 🎮 游戏场景实现 - MyGameScene.ts
// ============================================================================
//
// ⭐ 这是 AI 唯一需要修改的场景文件
//
// 📋 必须实现的三个方法：
//   1. createGameObjects()  — 创建游戏对象（玩家/敌人/地图等）
//   2. gameLoop()           — 游戏主循环（每帧调用）
//   3. handleGameOver()     — 游戏结束处理
//
// 📖 完整开发指南: AI_INSTRUCTIONS.md（项目根目录）
// ============================================================================

import GameScene from './GameScene'

export default class MyGameScene extends GameScene {

  // ─── 在这里声明你的游戏对象 ──────────────────────────────────
  // 示例：
  // private player!: Phaser.GameObjects.Image
  // private enemies: Phaser.GameObjects.Image[] = []

  // ─── 预加载资源（可选） ───────────────────────────────────────
  // preload(): void {
  //   this.load.image('player', '/images/my-game/player.png')
  // }
  
  /**
   * ⭐ 推荐：使用 GTRS 规范加载资源
   * 
   * 在 GTRS.json 中配置：
   * ```json
   * {
   *   "resources": {
   *     "images": {
   *       "scene": {
   *         "player": {
   *           "alias": "玩家角色",
   *           "src": "/themes/your_game/assets/scene/player.png",
   *           "type": "png"
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   * 
   * 然后在 preload() 中使用：
   */
  preload(): void {
    this.preloadFromGTRS() // ✅ 框架自动从 GTRS.json 加载所有资源
  }

  // ─── 额外初始化（可选，注意必须调用 super.create()） ─────────
  // create(): void {
  //   super.create()       // ⚠️ 必须保留
  //   // 额外初始化...
  // }

  /**
   * ✅ 必须实现：创建游戏对象
   * 
   * ⚠️ 重要提示：
   * - 这是抽象方法，由 GameScene 定义，子类必须实现！
   * - 如果不实现，运行时会报错：TypeError: this.createGameObjects is not a function
   * - 所有游戏对象的创建都应该在这里完成，不要在 create() 中直接创建
   * 
   * @example
   * ```typescript
   * protected createGameObjects(): void {
   *   // 创建玩家（从 GTRS.json 加载的 'player' 资源）
   *   const pos = this.gridToPixelCenter(Math.floor(this.gridCols / 2), Math.floor(this.gridRows / 2))
   *   this.player = this.add.image(pos.x, pos.y, 'player').setDisplaySize(this.cellSize, this.cellSize)
   *   
   *   // 创建敌人
   *   this.enemies = []
   *   for (let i = 0; i < 3; i++) {
   *     const enemy = this.add.image(..., 'enemy')
   *     this.enemies.push(enemy)
   *   }
   * }
   * ```
   */
  protected createGameObjects(): void {
    // TODO: 删除下面的 console.warn，替换为你的游戏逻辑实现
    // ⚠️ 注意：不要只保留 console.warn，必须实现实际的创建逻辑！
    console.warn('[MyGameScene] createGameObjects() 待实现 - 请在此处实现你的游戏对象创建逻辑')
    
    // 示例：创建一个中心玩家（需要根据实际游戏修改）
    // const pos = this.gridToPixelCenter(Math.floor(this.gridCols / 2), Math.floor(this.gridRows / 2))
    // this.player = this.add.image(pos.x, pos.y, 'player').setDisplaySize(this.cellSize, this.cellSize)
  }

  /**
   * ✅ 必须实现：游戏主循环（每帧调用，delta 单位毫秒）
   * 
   * ⚠️ 重要提示：
   * - 这是抽象方法，必须实现（即使为空函数）
   * - 每帧都会调用此方法，_delta 是距上一帧的毫秒数
   * - 可用于时间驱动的移动、碰撞检测等实时逻辑
   * 
   * @param _time 游戏运行总毫秒数
   * @param _delta 距上一帧的毫秒数（用于时间驱动移动）
   * 
   * @example
   * ```typescript
   * private moveTimer: number = 0
   * private moveInterval: number = 500 // 每 500ms 移动一次
   * 
   * protected gameLoop(_time: number, _delta: number): void {
   *   this.moveTimer += _delta
   *   if (this.moveTimer >= this.moveInterval) {
   *     this.moveTimer = 0
   *     this.movePlayer()
   *     this.checkCollisions()
   *   }
   * }
   * ```
   */
  protected gameLoop(_time: number, _delta: number): void {
    // TODO: 删除下面的空实现，替换为你的游戏主循环逻辑
    // 如果你的游戏不需要每帧更新，可以保留空函数，但必须实现此方法
  }

  /**
   * ✅ 必须实现：游戏结束处理
   * 
   * ⚠️ 重要提示：
   * - 这是抽象方法，必须实现
   * - 当游戏结束时（玩家失败/胜利），框架会自动调用此方法
   * - 在这里添加结束动画、结算界面等
   * 
   * @example
   * ```typescript
   * protected handleGameOver(): void {
   *   if (this.isGameOver) return
   *   this.isGameOver = true
   *   
   *   // 添加爆炸效果
   *   this.add.particles(this.player.x, this.player.y, 'explosion', {...})
   *   
   *   // 延迟后通知 Vue 层跳转结束页面
   *   this.time.delayedCall(500, () => {
   *     this.game.events.emit('gameover', this.score)
   *   })
   * }
   * ```
   */
  protected handleGameOver(): void {
    // TODO: 删除下面的默认实现，替换为你的游戏结束处理逻辑
    if (this.isGameOver) return
    this.isGameOver = true

    // TODO: 添加结束动画/效果

    // 延迟后通知 Vue 层跳转结束页面
    this.time.delayedCall(500, () => {
      this.game.events.emit('gameover', this.score)
    })
  }
}
