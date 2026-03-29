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

/**
 * 游戏场景抽象基类
 *
 * AI 开发者必须：
 *   1. 新建子类继承此类（不要直接修改此文件）
 *   2. 实现三个 abstract 方法（TypeScript 编译强制检查）
 *
 * 框架提供的能力（直接使用，无需重写）：
 *   - initAdapt()           屏幕适配，计算 cellSize / offsetX / offsetY
 *   - addScore(points)      加分（自动同步 store + 触发关卡升级）
 *   - pauseGame()           暂停
 *   - resumeGame()          恢复
 *   - togglePause()         切换暂停
 *   - gridToPixel()         网格坐标 → 像素坐标（左上角）
 *   - gridToPixelCenter()   网格坐标 → 像素坐标（中心）
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

  constructor() {
    super({ key: 'GameScene' })
  }

  // ─── Phaser 生命周期 ─────────────────────────────────────────

  /**
   * 预加载资源（可选覆盖）
   *
   * @example
   *   preload(): void {
   *     this.load.image('player', '/images/my-game/player.png')
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

  // ─── 生命周期清理 ────────────────────────────────────────────

  shutdown(): void {
    this.scale.off('resize', this.onResize, this)
    this.input.keyboard?.off('keydown-ESC', this.togglePause, this)
  }
}
