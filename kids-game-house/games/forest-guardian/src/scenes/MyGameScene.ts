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
// 🎯 框架内置能力：
//   - 物理引擎（Arcade）已启用 → addPhysicsSprite / addCollider / addOverlap
//   - 对象池 → import { GameObjectPool } from '@/utils/GameObjectPool'
//   - 输入管理 → import { InputManager } from '@/utils/InputManager'
//   - 碰撞注册 → import { CollisionRegistry } from '@/utils/CollisionRegistry'
//   - 道具系统 → import { PropSystem } from '@/utils/PropSystem'
//
// 📖 完整开发指南: AI_INSTRUCTIONS.md（项目根目录）
// ============================================================================

import GameScene from './GameScene'
// ─── 按需引入框架内置模块 ──────────────────────────────────────
// import { GameObjectPool } from '@/utils/GameObjectPool'
// import { InputManager } from '@/utils/InputManager'
// import { CollisionRegistry } from '@/utils/CollisionRegistry'
// import { PropSystem } from '@/utils/PropSystem'

export default class MyGameScene extends GameScene {

  // ─── 在这里声明你的游戏对象 ──────────────────────────────────
  // 示例：
  // private player!: Phaser.Physics.Arcade.Sprite
  // private bulletPool!: GameObjectPool
  // private inputManager!: InputManager
  // private collisionReg!: CollisionRegistry
  // private propSystem!: PropSystem

  // ─── 预加载资源（可选） ───────────────────────────────────────
  // preload(): void {
  //   this.load.image('player', '/images/my-game/player.png')
  // }
  
  /**
   * ⭐ 推荐：使用 GTRS 规范加载资源
   * 
   * 在 GTRS.json 中配置资源，然后在 preload() 中使用：
   */
  preload(): void {
    this.preloadFromGTRS() // ✅ 框架自动从 GTRS.json 加载所有资源
  }

  // ─── 额外初始化（可选，注意必须调用 super.create()） ─────────
  // create(): void {
  //   super.create()       // ⚠️ 必须保留
  //   // 初始化框架模块
  //   this.inputManager = new InputManager({ scene: this })
  //   this.collisionReg = new CollisionRegistry(this)
  //   this.propSystem = new PropSystem({ scene: this })
  // }

  /**
   * ✅ 必须实现：创建游戏对象
   * 
   * 在这里创建所有游戏对象。此时 cellSize / gridCols / offsetX 已就绪。
   * 
   * 可用方法：
   *   - this.add.image(x, y, key)          普通图片（无物理）
   *   - this.addPhysicsSprite(x, y, key)   带物理体的 Sprite（推荐）
   *   - this.addPhysicsGroup({immovable:true}) 静态物理组
   *   - this.addCollider(objA, objB, cb)   注册碰撞（阻止重叠）
   *   - this.addOverlap(objA, objB, cb)    注册重叠（不阻止）
   *   - this.gridToPixelCenter(col, row)   格子→像素中心坐标
   */
  protected createGameObjects(): void {
    // TODO: 删除下面的 console.warn，替换为你的游戏逻辑实现
    
    // 示例：使用物理 Sprite 创建玩家
    // const pos = this.gridToPixelCenter(Math.floor(this.gridCols / 2), Math.floor(this.gridRows / 2))
    // this.player = this.addPhysicsSprite(pos.x, pos.y, 'player')
    // this.player.setCollideWorldBounds(true)

    // 示例：创建对象池（子弹等高频对象）
    // this.bulletPool = new GameObjectPool({
    //   scene: this,
    //   textureKey: 'bullet',
    //   maxSize: 50,
    // })

    // 示例：创建碰撞组
    // this.collisionReg = new CollisionRegistry(this)
    // this.collisionReg.register({
    //   name: 'player-walls',
    //   objectA: this.player,
    //   objectB: this.walls,
    //   type: 'collider',
    // })
    // this.collisionReg.register({
    //   name: 'player-items',
    //   objectA: this.player,
    //   objectB: this.itemGroup,
    //   type: 'overlap',
    //   callback: (_player, item) => {
    //     item.destroy()
    //     this.addScore(10)
    //   },
    // })
  }

  /**
   * ✅ 必须实现：游戏主循环（每帧调用，delta 单位毫秒）
   * 
   * @param _time  游戏运行总毫秒数
   * @param _delta 距上一帧的毫秒数（用于时间驱动移动）
   */
  protected gameLoop(_time: number, _delta: number): void {
    // TODO: 替换为你的游戏主循环逻辑

    // 示例：使用 InputManager 做持续移动
    // if (this.inputManager?.isDown('left')) {
    //   this.player.setVelocityX(-200)
    // } else if (this.inputManager?.isDown('right')) {
    //   this.player.setVelocityX(200)
    // } else {
    //   this.player.setVelocityX(0)
    // }

    // 示例：使用 InputManager 单次触发
    // if (this.inputManager?.isJustPressed('jump')) {
    //   this.player.setVelocityY(-300)
    // }

    // 示例：更新道具系统（如使用）
    // this.propSystem?.update(_delta)

    // 示例：清理帧状态
    // this.inputManager?.clearFrameState()
  }

  /**
   * ✅ 必须实现：游戏结束处理
   * 
   * 在末尾必须 emit 'gameover' 事件，框架才能跳转结束页面。
   */
  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true

    // TODO: 添加结束动画/效果

    // 延迟后通知 Vue 层跳转结束页面
    this.time.delayedCall(500, () => {
      this.game.events.emit('gameover', this.score)
    })
  }

  // ─── 清理（场景切换时自动调用） ──────────────────────────────
  shutdown(): void {
    // 清理框架模块
    // this.inputManager?.destroy()
    // this.collisionReg?.destroy()
    // this.propSystem?.destroy()
    // this.bulletPool?.destroy()
  }
}
