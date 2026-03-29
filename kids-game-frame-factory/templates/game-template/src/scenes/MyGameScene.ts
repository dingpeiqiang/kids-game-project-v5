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

  // ─── 额外初始化（可选，注意必须调用 super.create()） ─────────
  // create(): void {
  //   super.create()       // ⚠️ 必须保留
  //   // 额外初始化...
  // }

  /**
   * ✅ 必须实现：创建游戏对象
   */
  protected createGameObjects(): void {
    // TODO: 在这里创建你的游戏对象
    // 可用工具：
    //   this.gridCols / this.gridRows  — 格子数
    //   this.cellSize                  — 格子像素大小
    //   this.gridToPixelCenter(col, row) — 坐标转换
    //
    // 示例：
    //   const pos = this.gridToPixelCenter(Math.floor(this.gridCols / 2), Math.floor(this.gridRows / 2))
    //   this.player = this.add.image(pos.x, pos.y, 'player').setDisplaySize(this.cellSize, this.cellSize)
    console.warn('[MyGameScene] createGameObjects() 待实现')
  }

  /**
   * ✅ 必须实现：游戏主循环（每帧调用，delta 单位毫秒）
   */
  protected gameLoop(_time: number, _delta: number): void {
    // TODO: 实现游戏逻辑
    // 示例（基于时间驱动的移动）：
    //   this.moveTimer += _delta
    //   if (this.moveTimer >= this.moveInterval) {
    //     this.moveTimer = 0
    //     this.movePlayer()
    //     this.checkCollisions()
    //   }
  }

  /**
   * ✅ 必须实现：游戏结束处理
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
}
