// ============================================================================
// 🧩 快乐拼图屋 - 游戏场景实现
// ============================================================================
//
// 🎯 核心玩法：
//   - 点击选中拼图块，再次点击另一个拼图块交换位置
//   - 所有拼图块归位后获得胜利
//   - 根据完成时间获得星级评价
//
// 📋 实现方法：
//   1. createGameObjects()  — 创建拼图块、UI、计时器
//   2. gameLoop()           — 更新计时器
//   3. handleGameOver()     — 显示胜利和星级评价
// ============================================================================

import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'

/**
 * 拼图块数据接口
 */
interface TileData {
  id: number                          // 拼图块 ID（从 0 开始）
  currentPos: { x: number; y: number } // 当前位置（网格坐标）
  targetPos: { x: number; y: number }  // 目标位置（网格坐标）
  sprite: Phaser.GameObjects.Image     // 拼图块精灵
  isSelected: boolean                  // 是否被选中
}

export default class MyGameScene extends GameScene {

  // ─── 游戏对象声明 ──────────────────────────────────────────────
  private tiles: TileData[] = []              // 所有拼图块
  private selectedTile: TileData | null = null // 当前选中的拼图块
  private gridSize: number = 2                 // 网格大小（2x2, 3x3, 4x4）
  
  // UI 元素
  private timerText!: Phaser.GameObjects.Text  // 计时器文本
  private starText!: Phaser.GameObjects.Text   // 星星评价文本
  private startTime: number = 0                // 游戏开始时间
  
  // 动物主题配置（根据难度选择不同动物）
  private animalThemes = {
    2: 'cat',      // 简单：猫咪
    3: 'dog',      // 普通：小狗
    4: 'rabbit'    // 困难：小兔（未来可扩展熊猫）
  }

  // ─── 预加载资源 ───────────────────────────────────────────────
  preload(): void {
    this.preloadFromGTRS()  // ✅ 从 GTRS.json 自动加载所有资源
  }
  
  // ─── 额外初始化 ───────────────────────────────────────────────
  create(): void {
    super.create()  // ⚠️ 必须调用！框架初始化在这里完成
    
    // 从难度 ID 推断网格大小（easy=2, normal=3, hard=4）
    const gameStore = useGameStore()
    const difficultyId = gameStore.difficulty || 'easy'
    this.gridSize = difficultyId === 'easy' ? 2 : difficultyId === 'medium' ? 3 : 4
    
    // 🎯 修正：根据实际网格大小重新计算 cellSize
    this.cellSize = Math.floor(
      Math.min(
        (this.screenW * 0.9) / this.gridSize,
        (this.screenH * 0.8) / this.gridSize,
      )
    )
    
    // 确保 cellSize 能容纳 256px 的拼图块
    if (this.cellSize < 280) {
      this.cellSize = 280  // 256px 图片 + 边框 + 边距
    }
    
    // 重新计算偏移量
    const gameW = this.gridSize * this.cellSize
    const gameH = this.gridSize * this.cellSize
    this.offsetX = Math.floor((this.screenW - gameW) / 2)
    this.offsetY = Math.floor((this.screenH - gameH) / 2)
    
    console.log(`🧩 拼图游戏启动：${this.gridSize}x${this.gridSize}, 网格尺寸：${this.cellSize}px`)
    console.log(`📐 游戏区域：${gameW}x${gameH}, 偏移：(${this.offsetX}, ${this.offsetY})`)
    this.startTime = Date.now()
  }

  /**
   * ✅ 必须实现：创建游戏对象
   */
  protected createGameObjects(): void {
    // 1. 创建背景
    this.add.image(this.screenW / 2, this.screenH / 2, 'bg_main')
      .setDisplaySize(this.screenW, this.screenH)
    
    // 2. 创建 UI
    this.createUI()
    
    // 3. 创建拼图块
    this.createTiles()
    
    // 4. 🎵 播放背景音乐（延迟到下一帧，避免 AudioContext 未就绪）
    this.time.delayedCall(100, () => {
      try {
        const bgm = this.sound.play('bgm_main', { loop: true, volume: 0.6 })
        if (bgm) {
          console.log('🎵 背景音乐开始播放')
        }
      } catch (error: any) {
        console.warn('⚠️ 背景音乐播放失败:', error.message)
        // 用户交互后重试
        this.input.once('pointerdown', () => {
          this.sound.play('bgm_main', { loop: true, volume: 0.6 })
          console.log('🎵 背景音乐在用户交互后开始播放')
        })
      }
    })
  }
  
  /**
   * 创建 UI 元素
   */
  private createUI(): void {
    // 计时器（左上角）
    this.timerText = this.add.text(50, 50, '⏱️ 00:00', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setDepth(100)
    
    // 星星评价（右上角）
    this.starText = this.add.text(this.screenW - 50, 50, '⭐⭐⭐', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(1, 0).setDepth(100)
  }
  
  /**
   * 创建拼图块
   */
  private createTiles(): void {
    const animal = this.animalThemes[this.gridSize as keyof typeof this.animalThemes] || 'cat'
    
    // 🎯 使用固定的 256px 拼图块尺寸（与生成脚本一致）
    const tileSize = 256
    const gap = 4  // 拼图块之间的缝隙
    const effectiveTileSize = tileSize - gap  // 实际显示尺寸（略小以留出缝隙）
    
    // 计算起始位置（居中）
    const totalWidth = this.gridSize * tileSize + (this.gridSize - 1) * gap
    const startX = this.offsetX + (this.gridSize * this.cellSize - totalWidth) / 2
    const startY = this.offsetY + 100
    
    console.log(`🐾 使用动物主题：${animal}, 网格：${this.gridSize}x${this.gridSize}`)
    console.log(`📏 拼图块尺寸：${tileSize}x${tileSize}, 缝隙：${gap}px, 起始位置：(${startX}, ${startY})`)
    
    // 生成打乱的拼图块位置
    const positions = this.shufflePositions(this.gridSize)
    
    let tileId = 0
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const targetRow = Math.floor(tileId / this.gridSize)
        const targetCol = tileId % this.gridSize
        
        // 当前打乱的位置
        const currentPos = positions[tileId]
        
        // 计算像素坐标（包含缝隙）
        const x = startX + currentPos.col * (tileSize + gap) + tileSize / 2
        const y = startY + currentPos.row * (tileSize + gap) + tileSize / 2
        
        // 创建拼图块精灵（使用对应动物的拼图块）
        const spriteKey = `tile_${animal}_${tileId + 1}`
        const sprite = this.add.image(x, y, spriteKey)
          .setDisplaySize(effectiveTileSize, effectiveTileSize)  // 略小以留出缝隙
          .setInteractive({ draggable: false })
          .setDepth(10)
        
        // 添加白色边框
        const border = this.add.rectangle(x, y, effectiveTileSize, effectiveTileSize, 0xffffff)
          .setStrokeStyle(2, 0x000000)
          .setDepth(9)
        
        // 存储拼图块数据
        const tileData: TileData = {
          id: tileId,
          currentPos: { x: currentPos.col, y: currentPos.row },
          targetPos: { x: targetCol, y: targetRow },
          sprite,
          isSelected: false
        }
        
        this.tiles.push(tileData)
        
        // 绑定点击事件
        sprite.on('pointerdown', () => this.onTileClick(tileData))
        
        tileId++
      }
    }
    
    console.log(`✅ 创建了 ${this.tiles.length} 个拼图块，每个 ${effectiveTileSize}x${effectiveTileSize}px`)
  }
  
  /**
   * 生成打乱的位置数组
   */
  private shufflePositions(gridSize: number): Array<{ row: number; col: number }> {
    const positions: Array<{ row: number; col: number }> = []
    
    // 生成所有位置
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        positions.push({ row, col })
      }
    }
    
    // Fisher-Yates 洗牌算法
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }
    
    return positions
  }
  
  /**
   * 处理拼图块点击
   */
  private onTileClick(tile: TileData): void {
    if (this.selectedTile === null) {
      // 第一次点击：选中
      this.selectedTile = tile
      tile.isSelected = true
      tile.sprite.setAlpha(0.7)
      tile.sprite.setScale(1.05, 1.05)
      
      // 播放选中音效
      this.sound.play('sfx_select', { volume: 0.8 })
    } else {
      // 第二次点击：如果点击的是同一个，取消选中
      if (this.selectedTile === tile) {
        this.deselectTile()
      } else {
        // 交换两个拼图块
        this.swapTiles(this.selectedTile, tile)
        this.deselectTile()
      }
    }
  }
  
  /**
   * 取消选中
   */
  private deselectTile(): void {
    if (this.selectedTile) {
      this.selectedTile.isSelected = false
      this.selectedTile.sprite.setAlpha(1)
      this.selectedTile.sprite.setScale(1, 1)
      this.selectedTile = null
    }
  }
  
  /**
   * 交换两个拼图块
   */
  private swapTiles(tile1: TileData, tile2: TileData): void {
    // 播放交换音效
    this.sound.play('sfx_swap', { volume: 0.8 })
    
    // 交换位置数据
    const tempPos = { ...tile1.currentPos }
    tile1.currentPos = { ...tile2.currentPos }
    tile2.currentPos = tempPos
    
    // 计算新的像素坐标
    const tileSize = Math.min(256, this.cellSize - 16)
    const startX = this.offsetX + (this.gridCols * this.cellSize - this.gridSize * tileSize) / 2
    const startY = this.offsetY + 100
    
    const x1 = startX + tile1.currentPos.x * tileSize
    const y1 = startY + tile1.currentPos.y * tileSize
    const x2 = startX + tile2.currentPos.x * tileSize
    const y2 = startY + tile2.currentPos.y * tileSize
    
    // 添加平滑移动动画
    this.tweens.add({
      targets: tile1.sprite,
      x: x1,
      y: y1,
      duration: 300,
      ease: 'Power2'
    })
    
    this.tweens.add({
      targets: tile2.sprite,
      x: x2,
      y: y2,
      duration: 300,
      ease: 'Power2'
    })
    
    // 动画结束后检查是否归位正确
    this.time.delayedCall(300, () => {
      this.checkCorrectPosition(tile1)
      this.checkCorrectPosition(tile2)
      this.checkWin()
    })
  }
  
  /**
   * 检查拼图块是否在正确位置
   */
  private checkCorrectPosition(tile: TileData): void {
    const isCorrect = tile.currentPos.x === tile.targetPos.x && 
                     tile.currentPos.y === tile.targetPos.y
    
    if (isCorrect) {
      // 播放正确音效
      this.sound.play('sfx_correct', { volume: 0.6 })
      
      // 添加闪光效果
      this.tweens.add({
        targets: tile.sprite,
        alpha: 0.5,
        yoyo: true,
        repeat: 2,
        duration: 150
      })
    }
  }
  
  /**
   * 检查是否胜利
   */
  private checkWin(): void {
    const allCorrect = this.tiles.every(tile => 
      tile.currentPos.x === tile.targetPos.x &&
      tile.currentPos.y === tile.targetPos.y
    )
    
    if (allCorrect) {
      console.log('🎉 游戏胜利!')
      this.handleGameOver()
    }
  }

  /**
   * ✅ 必须实现：游戏主循环
   */
  protected gameLoop(_time: number, _delta: number): void {
    // 更新计时器
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    this.timerText.setText(`⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }

  /**
   * ✅ 必须实现：游戏结束处理
   */
  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    
    // 计算用时
    const elapsed = (Date.now() - this.startTime) / 1000
    
    // 根据用时计算星星评价
    let stars = '⭐'
    const thresholds = {
      2: { star3: 15, star2: 30 },   // 简单难度
      3: { star3: 30, star2: 60 },   // 普通难度
      4: { star3: 60, star2: 120 }   // 困难难度
    }
    
    const threshold = thresholds[this.gridSize as keyof typeof thresholds] || thresholds[2]
    if (elapsed < threshold.star3) stars = '⭐⭐⭐'
    else if (elapsed < threshold.star2) stars = '⭐⭐'
    
    this.starText.setText(stars)
    
    console.log(`🏆 游戏胜利！用时：${elapsed.toFixed(1)}秒，评价：${stars}`)
    
    // 播放胜利音效
    this.sound.play('sfx_win', { volume: 0.8 })
    
    // 添加庆祝粒子效果
    this.createCelebrationParticles()
    
    // 延迟后通知 Vue 层跳转结束页面
    this.time.delayedCall(2000, () => {
      this.game.events.emit('gameover', this.score)
    })
  }
  
  /**
   * 创建庆祝粒子效果
   */
  private createCelebrationParticles(): void {
    // 使用简化的庆祝方式：创建多个星星精灵并添加动画
    const stars: Phaser.GameObjects.Image[] = []
    for (let i = 0; i < 10; i++) {
      const star = this.add.image(
        Math.random() * this.screenW,
        -50 - Math.random() * 200,
        'star_3'
      ).setScale(0.8).setDepth(200)
      
      stars.push(star)
      
      // 添加下落动画
      this.tweens.add({
        targets: star,
        y: this.screenH + 100,
        rotation: Math.PI * 2,
        duration: 2000 + Math.random() * 1000,
        ease: 'Linear',
        delay: i * 200
      })
    }
    
    // 2 秒后销毁所有星星
    this.time.delayedCall(2000, () => {
      stars.forEach(star => star.destroy())
    })
  }
}
