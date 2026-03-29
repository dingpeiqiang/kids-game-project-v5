// ============================================================================
// 🎮 游戏场景模板 - GameScene.ts
// ============================================================================
//
// 📌 使用说明:
//   1. 此文件是游戏逻辑的核心，⭐ 必须根据你的游戏重写
//   2. 继承 Phaser.Scene，重写 create() 和 update()
//   3. 通过 this.game.events.emit() 与 Vue 层通信
//
// 🔗 与 Vue 层的通信约定:
//   - 游戏就绪: this.game.events.emit('ready')
//   - 分数变化: this.game.events.emit('score', score)
//   - 游戏结束: this.game.events.emit('gameover', score)
//   - 暂停/恢复: scene.scene.pause() / scene.scene.resume()
//
// 📖 参考实现:
//   kids-game-house/games/snake/src/scenes/ComponentGameScene.ts
// ============================================================================

import Phaser from 'phaser'
import { useGameStore } from '@/stores/game'

/**
 * 游戏场景
 *
 * ⭐ 开发者需要重写以下方法：
 *   - preload()    加载游戏资源
 *   - create()     创建游戏对象（调用 super.create() 初始化基础功能）
 *   - update()     每帧更新逻辑（调用 super.update() 处理暂停）
 *   - createGameObjects()  创建玩家/敌人/道具等
 *   - gameLoop()           游戏主逻辑（仅在运行时调用）
 *   - handleGameOver()     游戏结束处理
 */
export default class GameScene extends Phaser.Scene {
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

  constructor() {
    super({ key: 'GameScene' })
  }

  // ─── Phaser 生命周期 ─────────────────────────────────────────

  /**
   * 预加载资源
   * ⭐ 在这里加载图片、音频等资源
   * @example
   *   this.load.image('player', '/images/player.png')
   *   this.load.audio('bgm', '/audio/bgm.mp3')
   */
  preload(): void {
    // TODO: 加载游戏资源
    // 参考: https://phaser.io/docs/3.60.0/Phaser.Loader.LoaderPlugin
  }

  /**
   * 场景创建
   * ⭐ 重写此方法时务必调用 super.create()
   */
  create(): void {
    // 1. 初始化屏幕适配
    this.initAdapt()

    // 2. 监听屏幕尺寸变化
    this.scale.on('resize', this.onResize, this)

    // 3. 设置键盘输入（Esc 暂停）
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this)

    // 4. ⭐ 创建游戏特定对象（子类重写）
    this.createGameObjects()

    // 5. 通知 Vue 层游戏已就绪
    this.game.events.emit('ready')
  }

  /**
   * 每帧更新
   * ⭐ 重写此方法时务必调用 super.update(time, delta)
   */
  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return
    this.gameLoop(time, delta)
  }

  // ─── 需要子类重写的方法 ──────────────────────────────────────

  /**
   * ⭐ 创建游戏对象（子类重写）
   *
   * 在这里创建：
   * - 背景/地图
   * - 玩家角色
   * - 敌人
   * - 道具/食物
   * - UI 覆盖层（分数文字等）
   */
  protected createGameObjects(): void {
    // TODO: 创建游戏对象
    // 示例：
    // this.player = this.add.image(100, 100, 'player')
    // this.enemies = this.physics.add.group()
    console.warn('[GameScene] createGameObjects() 未实现，请重写此方法')
  }

  /**
   * ⭐ 游戏主循环（子类重写）
   *
   * 每帧调用（已排除暂停/结束状态）
   * @param time  游戏运行毫秒数
   * @param delta 距上一帧的毫秒数
   */
  protected gameLoop(_time: number, _delta: number): void {
    // TODO: 实现游戏逻辑
    // 示例：
    // this.updatePlayer()
    // this.updateEnemies()
    // this.checkCollisions()
  }

  /**
   * ⭐ 游戏结束处理（子类重写）
   */
  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true

    // TODO: 添加结束动画/效果

    // 延迟 500ms 后通知 Vue 层
    this.time.delayedCall(500, () => {
      this.game.events.emit('gameover', this.score)
    })
  }

  // ─── 分数管理 ────────────────────────────────────────────────

  /**
   * 增加分数（自动应用难度倍率）
   */
  protected addScore(points: number): void {
    const gameStore = useGameStore()
    const multiplier = gameStore.currentDifficultyConfig.scoreMultiplier ?? 1
    this.score += Math.floor(points * multiplier)
    this.game.events.emit('score', this.score)
  }

  /**
   * 获取当前分数
   */
  public getScore(): number {
    return this.score
  }

  // ─── 暂停管理 ────────────────────────────────────────────────

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

  // ─── 屏幕适配 ────────────────────────────────────────────────

  /**
   * 初始化屏幕适配参数
   * 根据难度配置计算格子大小和偏移量
   */
  protected initAdapt(): void {
    const gameStore = useGameStore()
    const config = gameStore.mergedConfig

    this.screenW = this.scale.width
    this.screenH = this.scale.height
    this.gridCols = config.gridCols
    this.gridRows = config.gridRows

    // 计算格子大小（保留 90% 宽度和 85% 高度用于游戏区域）
    this.cellSize = Math.floor(
      Math.min(
        (this.screenW * 0.9) / this.gridCols,
        (this.screenH * 0.85) / this.gridRows
      )
    )

    // 居中偏移
    const gameW = this.gridCols * this.cellSize
    const gameH = this.gridRows * this.cellSize
    this.offsetX = Math.floor((this.screenW - gameW) / 2)
    this.offsetY = Math.floor((this.screenH - gameH) / 2)
  }

  /**
   * 屏幕尺寸变化处理
   */
  private onResize(gameSize: Phaser.Structs.Size): void {
    this.screenW = gameSize.width
    this.screenH = gameSize.height
    // 子类可 override 此方法以响应尺寸变化
  }

  // ─── 坐标工具 ────────────────────────────────────────────────

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

  // ─── 生命周期清理 ────────────────────────────────────────────

  /**
   * 场景销毁时清理
   */
  shutdown(): void {
    this.scale.off('resize', this.onResize, this)
    this.input.keyboard?.off('keydown-ESC', this.togglePause, this)
  }
}
