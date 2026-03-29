// ============================================================================
// 🧩 拼图游戏 - MyGameScene.ts
// ============================================================================
//
// 玩法：
//   图片切割为 N×N 块（简单3×3 / 普通4×4 / 困难5×5）
//   随机打乱后，点击与空白块相邻的拼块，滑入空位
//   全部归位 → 按用时和步数计算得分
//
// ============================================================================

import Phaser from 'phaser'
import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import difficultyConfig from '@/config/difficulty.json'

// ─── 类型 ─────────────────────────────────────────────────────────────────────
interface DifficultyEntry {
  id: string
  gridCols: number
  gridRows: number
  [key: string]: unknown
}

// ─── 拼块数据 ─────────────────────────────────────────────────────────────────
interface Piece {
  col: number          // 当前列
  row: number          // 当前行
  correctCol: number   // 正确列（用于判断完成）
  correctRow: number   // 正确行
  image: Phaser.GameObjects.Image
  isEmpty: boolean     // 是否是空白块
}

export default class PuzzleScene extends GameScene {

  // ─── 棋盘参数 ────────────────────────────────────────────────────────────
  private cols: number = 3
  private rows: number = 3
  private pieceSize: number = 100
  private boardX: number = 0
  private boardY: number = 0

  // ─── 游戏状态 ────────────────────────────────────────────────────────────
  private pieces: Piece[] = []
  private emptyCol: number = 0
  private emptyRow: number = 0
  private isMoving: boolean = false
  private moveCount: number = 0
  private startTime: number = 0
  private completed: boolean = false

  // ─── UI 对象 ─────────────────────────────────────────────────────────────
  private timerText!: Phaser.GameObjects.Text
  private moveText!: Phaser.GameObjects.Text
  private completeBanner!: Phaser.GameObjects.Container

  // ─── Phaser 生命周期 ──────────────────────────────────────────────────────

  preload(): void {
    // 纯 Canvas 生成，无需外部资源
  }

  create(): void {
    super.create()
    // super.create() 内部会调用 createGameObjects()
  }

  // ─── 必须实现：创建游戏对象 ───────────────────────────────────────────────

  protected createGameObjects(): void {
    const gameStore = useGameStore()

    // 从 difficulty.json 按当前难度读取分块数（3/4/5）
    const diff = (difficultyConfig.difficulties as DifficultyEntry[])
      .find(d => d.id === gameStore.difficulty)
      ?? (difficultyConfig.difficulties as DifficultyEntry[])[0]
    this.cols = diff.gridCols ?? 3
    this.rows = diff.gridRows ?? 3

    // 计算拼块大小和棋盘位置（居中，顶部留 HUD 空间）
    const topPad  = 80
    const sidePad = 24
    const botPad  = 40
    const availW  = this.screenW - sidePad * 2
    const availH  = this.screenH - topPad - botPad
    this.pieceSize = Math.floor(Math.min(availW / this.cols, availH / this.rows))

    const boardW   = this.pieceSize * this.cols
    const boardH   = this.pieceSize * this.rows
    this.boardX    = Math.floor((this.screenW - boardW) / 2)
    this.boardY    = topPad + Math.floor((availH - boardH) / 2)

    this.drawBackground()
    this.createPuzzleTexture()
    this.spawnPieces()
    this.shuffle()
    this.createInfoTexts()
    this.createCompleteBanner()

    this.startTime = this.time.now
  }

  // ─── 必须实现：主循环 ──────────────────────────────────────────────────────

  protected gameLoop(time: number, _delta: number): void {
    if (this.completed || !this.timerText) return
    const elapsed = Math.floor((time - this.startTime) / 1000)
    const mm = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const ss = (elapsed % 60).toString().padStart(2, '0')
    this.timerText.setText(`⏱ ${mm}:${ss}`)
  }

  // ─── 必须实现：游戏结束 ────────────────────────────────────────────────────

  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    this.time.delayedCall(1000, () => {
      this.game.events.emit('gameover', this.score)
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 内部实现
  // ══════════════════════════════════════════════════════════════════════════

  /** 绘制棋盘背景框 */
  private drawBackground(): void {
    const g = this.add.graphics()
    const bw = this.pieceSize * this.cols
    const bh = this.pieceSize * this.rows
    g.fillStyle(0x0f172a, 0.9)
    g.fillRoundedRect(this.boardX - 6, this.boardY - 6, bw + 12, bh + 12, 10)
    g.lineStyle(2, 0x334155, 1)
    g.strokeRoundedRect(this.boardX - 6, this.boardY - 6, bw + 12, bh + 12, 10)
  }

  /** 生成拼图纹理，每块单独存为一张 Canvas 纹理 */
  private createPuzzleTexture(): void {
    const totalW = this.pieceSize * this.cols
    const totalH = this.pieceSize * this.rows
    const srcKey = '__puzzle_src__'

    // 若已存在先清理
    if (this.textures.exists(srcKey)) this.textures.remove(srcKey)

    const src = this.textures.createCanvas(srcKey, totalW, totalH)!
    const ctx = src.getContext() as CanvasRenderingContext2D

    // 渐变底色
    const grad = ctx.createLinearGradient(0, 0, totalW, totalH)
    grad.addColorStop(0,   '#6366f1')
    grad.addColorStop(0.5, '#06b6d4')
    grad.addColorStop(1,   '#10b981')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, totalW, totalH)

    // 波纹装饰线
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1.5
    for (let y = 0; y <= totalH + 30; y += 30) {
      ctx.beginPath()
      for (let x = 0; x <= totalW; x += 4) {
        const wy = y + Math.sin(x * 0.07) * 8
        x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 2
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * this.pieceSize, 0)
      ctx.lineTo(c * this.pieceSize, totalH); ctx.stroke()
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * this.pieceSize)
      ctx.lineTo(totalW, r * this.pieceSize); ctx.stroke()
    }

    // 编号文字
    const fontSize = Math.max(14, Math.floor(this.pieceSize * 0.3))
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lastIdx = this.cols * this.rows - 1
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c
        if (idx === lastIdx) continue   // 空白块不显示编号
        const tx = c * this.pieceSize + this.pieceSize / 2
        const ty = r * this.pieceSize + this.pieceSize / 2
        ctx.fillStyle = 'rgba(0,0,0,0.4)'
        ctx.fillText(String(idx + 1), tx + 1, ty + 1)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(String(idx + 1), tx, ty)
      }
    }
    src.refresh()

    // 为每块切出独立纹理
    const srcImg = src.getSourceImage() as HTMLCanvasElement
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const key = this.pieceKey(c, r)
        if (this.textures.exists(key)) this.textures.remove(key)
        const tile = this.textures.createCanvas(key, this.pieceSize, this.pieceSize)!
        const tctx = tile.getContext() as CanvasRenderingContext2D
        tctx.drawImage(srcImg,
          c * this.pieceSize, r * this.pieceSize, this.pieceSize, this.pieceSize,
          0, 0, this.pieceSize, this.pieceSize
        )
        // 立体感内边框
        tctx.strokeStyle = 'rgba(255,255,255,0.25)'
        tctx.lineWidth = 1
        tctx.strokeRect(1, 1, this.pieceSize - 2, this.pieceSize - 2)
        tile.refresh()
      }
    }

    this.textures.remove(srcKey)
  }

  private pieceKey(c: number, r: number): string {
    return `__puzzle_${c}_${r}__`
  }

  /** 创建空白块纹理 */
  private createEmptyKey(): string {
    const key = '__puzzle_empty__'
    if (!this.textures.exists(key)) {
      const canvas = this.textures.createCanvas(key, this.pieceSize, this.pieceSize)!
      const ctx = canvas.getContext() as CanvasRenderingContext2D
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, 0, this.pieceSize, this.pieceSize)
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, this.pieceSize - 4, this.pieceSize - 4)
      canvas.refresh()
    }
    return key
  }

  /** 生成所有 Piece 对象，空白块在右下角 */
  private spawnPieces(): void {
    this.pieces = []
    const emptyIdx = this.cols * this.rows - 1
    const emptyC   = this.cols - 1
    const emptyR   = this.rows - 1

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx     = r * this.cols + c
        const isEmpty = (idx === emptyIdx)
        const texKey  = isEmpty ? this.createEmptyKey() : this.pieceKey(c, r)
        const px      = this.boardX + c * this.pieceSize + this.pieceSize / 2
        const py      = this.boardY + r * this.pieceSize + this.pieceSize / 2
        const img     = this.add.image(px, py, texKey)
          .setDisplaySize(this.pieceSize - 2, this.pieceSize - 2)
        if (isEmpty) img.setAlpha(0.25)

        const piece: Piece = { col: c, row: r, correctCol: c, correctRow: r, image: img, isEmpty }

        if (!isEmpty) {
          img.setInteractive({ cursor: 'pointer' })
          img.on('pointerdown', () => this.onPieceClick(piece))
          img.on('pointerover', () => img.setTint(0xdde8ff))
          img.on('pointerout',  () => img.clearTint())
        }
        this.pieces.push(piece)
      }
    }

    this.emptyCol = emptyC
    this.emptyRow = emptyR
  }

  /**
   * 通过 N*40 次随机合法滑动打乱棋盘（保证有解）
   * 无动画，直接更新数据和视觉坐标
   */
  private shuffle(): void {
    const dirs = [
      { dc:  0, dr: -1, opp: 1 },
      { dc:  0, dr:  1, opp: 0 },
      { dc: -1, dr:  0, opp: 3 },
      { dc:  1, dr:  0, opp: 2 },
    ]
    const steps = this.cols * this.rows * 40
    let lastOpp = -1

    for (let i = 0; i < steps; i++) {
      const valid = dirs.filter((d, idx) => {
        const nc = this.emptyCol + d.dc
        const nr = this.emptyRow + d.dr
        return nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows && idx !== lastOpp
      })
      if (!valid.length) continue
      const d = valid[Math.floor(Math.random() * valid.length)]
      const target = this.getPieceAt(this.emptyCol + d.dc, this.emptyRow + d.dr)
      if (target) this.doSwap(target, false)
      lastOpp = d.opp
    }

    // 刷新所有视觉坐标
    for (const p of this.pieces) {
      p.image.setPosition(
        this.boardX + p.col * this.pieceSize + this.pieceSize / 2,
        this.boardY + p.row * this.pieceSize + this.pieceSize / 2
      )
    }
  }

  /** 点击拼块：检查是否与空白块相邻，是则触发滑动 */
  private onPieceClick(piece: Piece): void {
    if (this.isMoving || piece.isEmpty || this.completed || this.isGameOver) return

    const dc = Math.abs(piece.col - this.emptyCol)
    const dr = Math.abs(piece.row - this.emptyRow)
    if (!((dc === 1 && dr === 0) || (dc === 0 && dr === 1))) return

    useAudioStore().playClickSound()
    this.moveCount++
    this.moveText?.setText(`👆 ${this.moveCount} 步`)
    this.isMoving = true
    this.doSwap(piece, true)
  }

  /**
   * 核心交换逻辑
   * @param piece    要移动的拼块（与空白相邻）
   * @param animated 是否播放滑动动画
   */
  private doSwap(piece: Piece, animated: boolean): void {
    // 保存各方坐标（交换前）
    const pieceOldCol = piece.col
    const pieceOldRow = piece.row
    const emptyOldCol = this.emptyCol
    const emptyOldRow = this.emptyRow

    const empty = this.getPieceAt(emptyOldCol, emptyOldRow)!

    // 更新逻辑位置
    piece.col = emptyOldCol
    piece.row = emptyOldRow
    empty.col = pieceOldCol
    empty.row = pieceOldRow
    this.emptyCol = pieceOldCol
    this.emptyRow = pieceOldRow

    // 目标像素位置
    const toPieceX = this.boardX + emptyOldCol * this.pieceSize + this.pieceSize / 2
    const toPieceY = this.boardY + emptyOldRow * this.pieceSize + this.pieceSize / 2
    const toEmptyX = this.boardX + pieceOldCol * this.pieceSize + this.pieceSize / 2
    const toEmptyY = this.boardY + pieceOldRow * this.pieceSize + this.pieceSize / 2

    if (animated) {
      this.tweens.add({
        targets: piece.image,
        x: toPieceX,
        y: toPieceY,
        duration: 130,
        ease: 'Quad.easeOut',
        onComplete: () => {
          empty.image.setPosition(toEmptyX, toEmptyY)
          this.isMoving = false
          this.checkComplete()
        }
      })
    } else {
      piece.image.setPosition(toPieceX, toPieceY)
      empty.image.setPosition(toEmptyX, toEmptyY)
    }
  }

  /** 获取指定格子上的 Piece（含空白块） */
  private getPieceAt(col: number, row: number): Piece | undefined {
    return this.pieces.find(p => p.col === col && p.row === row)
  }

  /** 检查是否全部归位 */
  private checkComplete(): void {
    const done = this.pieces.every(p => p.col === p.correctCol && p.row === p.correctRow)
    if (!done) return

    this.completed = true
    useAudioStore().playWinSound()

    // 计算得分
    const elapsed    = Math.floor((this.time.now - this.startTime) / 1000)
    const base       = this.cols * this.rows * 100
    const timeBonus  = Math.max(0, 300 - elapsed) * 2
    const stepBonus  = Math.max(0, this.cols * this.rows * 10 - this.moveCount) * 3
    const total      = base + timeBonus + stepBonus
    this.addScore(total)

    this.showCompleteBanner(elapsed)

    this.time.delayedCall(1600, () => this.handleGameOver())
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  private createInfoTexts(): void {
    const y     = this.boardY + this.pieceSize * this.rows + 14
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize : `${Math.max(13, Math.floor(this.pieceSize * 0.15))}px`,
      color    : '#64748b',
      fontFamily: 'Arial, sans-serif',
    }
    this.moveText  = this.add.text(this.boardX, y, '👆 0 步', style)
    this.timerText = this.add.text(
      this.boardX + this.pieceSize * this.cols, y,
      '⏱ 00:00', { ...style }
    ).setOrigin(1, 0)
  }

  private createCompleteBanner(): void {
    this.completeBanner = this.add.container(this.screenW / 2, this.screenH / 2)
    this.completeBanner.setVisible(false).setDepth(50)
  }

  private showCompleteBanner(elapsed: number): void {
    this.completeBanner.removeAll(true)

    const bg = this.add.graphics()
    bg.fillStyle(0x0f172a, 0.93)
    bg.fillRoundedRect(-155, -85, 310, 170, 18)
    bg.lineStyle(2, 0x6366f1, 1)
    bg.strokeRoundedRect(-155, -85, 310, 170, 18)

    const title = this.add.text(0, -50, '🎉 拼图完成！', {
      fontSize: '26px', color: '#facc15',
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5)

    const info = this.add.text(0, 5,
      `用时 ${elapsed} 秒  ·  共 ${this.moveCount} 步`, {
      fontSize: '15px', color: '#94a3b8', fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5)

    const scoreLabel = this.add.text(0, 45, `+${this.score} 分`, {
      fontSize: '24px', color: '#4ade80',
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.completeBanner.add([bg, title, info, scoreLabel])
    this.completeBanner.setVisible(true).setScale(0.5)
    this.tweens.add({
      targets: this.completeBanner,
      scaleX: 1, scaleY: 1,
      duration: 280,
      ease: 'Back.easeOut',
    })
  }
}
