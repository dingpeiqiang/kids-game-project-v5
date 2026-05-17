import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { GAME_ITEMS, ITEM_UNLOCK_TIMES, ITEM_SPAWN_WEIGHTS } from '../../data/items'
import { app } from '../../App'
import { Block } from './Block'
import { ParticleSystem, Particle } from './ParticleSystem'
import { ComboSystem } from './ComboSystem'
import { PowerupSystem } from './PowerupSystem'
import { PowerupEffectSystem } from './PowerupEffectSystem'
import { ELIMINATE_LEVELS, getLevelColors, getNextLevel, isLevelCompleted, type LevelConfig } from './levelConfig'

export class EliminateGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private onEnd: () => void
  
  // 游戏尺寸（动态计算）
  private W = 400
  private H = 600
  
  // 布局参数（动态计算）
  private GRID = 8
  private COLS = 6
  private CELL = 60
  private TOP = 80
  private PADDING = 15 // 统一的边距值
  private readonly ALL_COLORS = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6']
  
  // 道具颜色配置
  private readonly ITEM_COLORS: Record<string, string> = {
    'time_extend': '#FFD700',    // 金色 - 时间延长
    'hint': '#00BFFF',           // 天蓝色 - 提示
    'double_score': '#FF69B4',   // 粉色 - 双倍分数
    'bomb': '#FF4500'            // 橙红色 - 炸弹
  }
  
  // 道具闪光颜色配置（收集时）
  private readonly ITEM_FLASH_COLORS_COLLECT: Record<string, string> = {
    'time_extend': 'rgba(0, 255, 255, 0.5)',     // 青色
    'hint': 'rgba(255, 215, 0, 0.5)',            // 金色
    'double_score': 'rgba(255, 105, 180, 0.5)',  // 粉色
    'bomb': 'rgba(255, 107, 107, 0.5)'           // 红色
  }
  
  // 道具闪光颜色配置（使用时）
  private readonly ITEM_FLASH_COLORS_USE: Record<string, string> = {
    'time_extend': 'rgba(0, 255, 255, 0.7)',     // 青色
    'hint': 'rgba(255, 215, 0, 0.7)',            // 金色
    'double_score': 'rgba(255, 105, 180, 0.7)',  // 粉色
    'bomb': 'rgba(255, 107, 107, 0.7)'           // 红色
  }
  
  // 关卡系统
  private currentLevel: number = 1
  private levelConfig: LevelConfig | null = null
  private COLORS: string[] = []
  
  // 星星收集系统
  private collectedStars: number = 0 // 已收集的星星数量
  
  // 游戏状态
  private blocks: Block[] = []
  private particleSystem: ParticleSystem
  private comboSystem: ComboSystem
  private powerupEffectSystem: PowerupEffectSystem
  
  // 游戏结束标志 - 防止重复调用 endGame
  private isGameOver = false
  
  // 选中状态（支持拖拽交换）
  private selectedBlock: number | null = null // 选中的方块索引
  private isDragging = false // 是否正在拖拽
  private dragStartX = 0
  private dragStartY = 0
  
  // 动画状态
  private isAnimating = false // 是否正在执行动画
  
  // 游戏计时器
  private lastActionTime = Date.now()
  private gameStartTime = Date.now()
  private levelStartTime = Date.now() // 关卡开始时间
  
  // 触摸防抖
  private lastTouchTime = 0
  private readonly TOUCH_DEBOUNCE_MS = 200 // 触摸防抖时间
  
  // 触摸滑动检测
  private touchStartX = 0
  private touchStartY = 0
  private readonly SWIPE_THRESHOLD = 30 // 滑动阈值（像素）- 增加到30避免误触
  private hasSwiped = false // 标记是否已经执行过滑动交换
  
  // 获取当前关卡的时间限制
  private get timeLimit(): number {
    return this.levelConfig?.timeLimit || 15000
  }
  
  // 视觉效果
  private screenShake = 0
  private doubleScoreActive = false
  private doubleScoreEndTime = 0 // 双倍分数结束时间
  private flashEffect = 0 // 闪光效果强度
  private comboMultiplier = 1 // 连击倍数
  private powerupFlashColor: string | null = null // 道具闪光颜色
  private powerupFlashIntensity = 0 // 道具闪光强度
  private hintActive = false // 提示高亮激活状态
  private hintBlocks: number[] = [] // 需要高亮的方块索引
  

  
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, engine: GameEngine, onEnd: () => void) {
    this.canvas = canvas
    this.ctx = ctx
    this.engine = engine
    this.onEnd = onEnd
    
    this.particleSystem = new ParticleSystem()
    this.comboSystem = new ComboSystem()
    this.powerupEffectSystem = new PowerupEffectSystem()
  }
  
  // 根据Canvas实际尺寸计算布局参数
  private calculateLayout() {
    // 使用Canvas的实际尺寸
    this.W = this.canvas.width
    this.H = this.canvas.height
    
    // 根据屏幕宽高比调整网格大小
    const aspectRatio = this.W / this.H
    
    // 移动端适配：调整列数和网格大小
    if (this.W < 350) {
      // 小屏幕手机
      this.COLS = 5
      this.GRID = 7
    } else if (this.W < 450) {
      // 中等屏幕
      this.COLS = 6
      this.GRID = 8
    } else {
      // 大屏幕
      this.COLS = 6
      this.GRID = 8
    }
    
    // 计算单元格大小，留出边距
    this.CELL = (this.W - this.PADDING * 2) / this.COLS
    
    // 根据单元格大小调整顶部区域
    this.TOP = Math.max(60, Math.floor(this.CELL * 1.8))
    
    console.log(`[消除游戏] 布局计算完成: W=${this.W}, H=${this.H}, COLS=${this.COLS}, GRID=${this.GRID}, CELL=${this.CELL.toFixed(1)}, TOP=${this.TOP}`)
  }
  
  init() {
    this.isGameOver = false // 重置游戏结束标志
    
    // 确保 Canvas 尺寸正确（移动端适配关键）
    this.ensureCanvasSize()
    
    // 计算布局参数（必须在 initLevel 之前调用）
    this.calculateLayout()
    
    this.initLevel(1) // 从第1关开始
    this.setupEventListeners()
  }
  
  // 确保 Canvas 尺寸正确 - 解决移动端适配问题
  private ensureCanvasSize() {
    const rect = this.canvas.getBoundingClientRect()
    
    // 如果 Canvas 的逻辑尺寸与显示尺寸不一致，进行调整
    if (this.canvas.width !== rect.width || this.canvas.height !== rect.height) {
      // 保持 400x600 的设计比例
      const targetRatio = 400 / 600
      const rectRatio = rect.width / rect.height
      
      let logicalWidth = 400
      let logicalHeight = 600
      
      // 根据实际显示尺寸调整逻辑尺寸
      if (rectRatio > targetRatio) {
        // 宽度受限
        logicalWidth = Math.round(rect.width)
        logicalHeight = Math.round(rect.width / targetRatio)
      } else {
        // 高度受限
        logicalHeight = Math.round(rect.height)
        logicalWidth = Math.round(rect.height * targetRatio)
      }
      
      this.canvas.width = logicalWidth
      this.canvas.height = logicalHeight
      
      console.log(`[消除游戏] Canvas 尺寸已调整: ${logicalWidth}x${logicalHeight}`)
    }
  }
  
  // 初始化关卡
  private initLevel(level: number) {
    this.currentLevel = level
    this.levelConfig = ELIMINATE_LEVELS.find(l => l.level === level) || ELIMINATE_LEVELS[0]
    this.COLORS = getLevelColors(level)
    this.levelStartTime = Date.now()
    this.lastActionTime = Date.now()
    this.isGameOver = false // 重置游戏结束标志
    this.collectedStars = 0 // 重置星星收集
    
    console.log(`[关卡] 进入第 ${level} 关: ${this.levelConfig.name}`)
    console.log(`[关卡] 目标星星: ${this.levelConfig.targetStars}, 时间限制: ${this.levelConfig.timeLimit / 1000}秒`)
    
    // 重新初始化方块
    this.initBlocks()
    
    // ⭐ 移除关卡提示弹窗，直接进入游戏
    // this.showLevelStartHint()
  }
  
  // 显示关卡开始提示
  private showLevelStartHint() {
    if (!this.levelConfig) return
    
    const hint = document.createElement('div')
    hint.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 30px 40px;
      border-radius: 20px;
      font-size: 18px;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: fadeInScale 0.5s ease-out;
    `
    
    hint.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">第 ${this.currentLevel} 关</div>
      <div style="font-size: 20px; margin-bottom: 15px;">${this.levelConfig.name}</div>
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 10px;">${this.levelConfig.description}</div>
      <div style="font-size: 16px; margin-top: 15px;">
        <span style="margin-right: 20px;">🎯 目标: ${this.levelConfig.targetScore}分</span>
        <span>⏱️ 时间: ${this.levelConfig.timeLimit / 1000}秒</span>
      </div>
    `
    
    document.body.appendChild(hint)
    
    // 添加动画样式
    if (!document.getElementById('level-animation-style')) {
      const style = document.createElement('style')
      style.id = 'level-animation-style'
      style.textContent = `
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `
      document.head.appendChild(style)
    }
    
    // 2秒后自动消失
    setTimeout(() => {
      hint.style.transition = 'opacity 0.5s'
      hint.style.opacity = '0'
      setTimeout(() => hint.remove(), 500)
    }, 2000)
  }
  
  // 检查是否通关并升级到下一关
  private checkLevelComplete() {
    if (!this.levelConfig) return false
    
    // ⭐ 基于星星收集数量判断是否通关
    if (isLevelCompleted(this.currentLevel, this.collectedStars)) {
      console.log(`[关卡] 第 ${this.currentLevel} 关完成！星星: ${this.collectedStars}/${this.levelConfig.targetStars}`)
      
      // 尝试进入下一关
      const nextLevel = getNextLevel(this.currentLevel)
      if (nextLevel) {
        // 延迟播放胜利音效，避免与提示音重叠
        setTimeout(() => {
          audioService.win()
        }, 300)
        
        setTimeout(() => {
          this.initLevel(nextLevel.level)
        }, 1500)
        return true
      } else {
        // 所有关卡完成 - 只播放一次胜利音效
        setTimeout(() => {
          audioService.win()
          this.showGameCompleteHint()
        }, 300)
        return true
      }
    }
    
    return false
  }
  
  // 显示游戏全部完成提示（仅在全部通关时显示）
  private showGameCompleteHint() {
    const hint = document.createElement('div')
    hint.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: #fff;
      padding: 30px 40px;
      border-radius: 20px;
      font-size: 18px;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: fadeInScale 0.5s ease-out;
    `
    
    hint.innerHTML = `
      <div style="font-size: 56px; margin-bottom: 10px;">🏆</div>
      <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">恭喜通关！</div>
      <div style="font-size: 18px; margin-bottom: 15px;">你已完成所有10个关卡</div>
      <div style="font-size: 20px;">最终分数: ${this.engine.getScore()}</div>
    `
    
    document.body.appendChild(hint)
    
    // 3秒后结束游戏（缩短时间，让游戏结束弹窗更快显示）
    setTimeout(() => {
      // 关闭 AudioContext 以停止所有音效，避免杂音
      try {
        const audioCtx = (audioService as any).ctx
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close()
        }
      } catch (e) {
        console.warn('Failed to close audio context:', e)
      }
      
      // 防止重复调用 endGame
      if (!this.isGameOver) {
        this.isGameOver = true
        this.engine.endGame()
        this.onEnd()
      }
    }, 3000)
  }
  
  update(deltaTime: number) {
    // 更新粒子系统
    this.particleSystem.update()
    
    // 更新连击系统
    this.comboSystem.update()
    
    // 更新道具特效系统
    this.powerupEffectSystem.update()
    
    // 更新方块动画
    this.updateBlockAnimations()
    
    // 检查双倍分数是否过期
    if (this.doubleScoreActive && Date.now() > this.doubleScoreEndTime) {
      this.doubleScoreActive = false
      this.comboSystem.addText('双倍分数结束', this.W / 2, this.H / 2 - 50)
    }
    
    // 检查超时
    const now = Date.now()
    if (now - this.lastActionTime > this.timeLimit) {
      // 防止重复调用 endGame
      if (!this.isGameOver) {
        this.isGameOver = true
        this.engine.endGame()
        audioService.lose()
        this.onEnd()
      }
      return
    }
    
    // 屏幕震动衰减
    if (this.screenShake > 0) {
      this.screenShake *= 0.9
      if (this.screenShake < 0.5) this.screenShake = 0
    }
    
    // 闪光效果衰减
    if (this.flashEffect > 0) {
      this.flashEffect *= 0.95
      if (this.flashEffect < 0.01) this.flashEffect = 0
    }
    
    // 道具闪光效果衰减
    if (this.powerupFlashIntensity > 0) {
      this.powerupFlashIntensity *= 0.92
      if (this.powerupFlashIntensity < 0.01) {
        this.powerupFlashIntensity = 0
        this.powerupFlashColor = null
      }
    }
    
    // 连击倍数衰减（如果没有连续消除）
    if (this.comboMultiplier > 1) {
      this.comboMultiplier *= 0.995
      if (this.comboMultiplier < 1.01) this.comboMultiplier = 1
    }
  }
  
  render() {
    this.ctx.save()
    
    // 应用屏幕震动
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake
      const shakeY = (Math.random() - 0.5) * this.screenShake
      this.ctx.translate(shakeX, shakeY)
    }
    
    // 绘制背景
    this.drawBackground()
    
    // 绘制UI
    this.drawUI()
    
    // 绘制方块
    this.drawBlocks()
    
    // 绘制粒子效果
    this.particleSystem.render(this.ctx)
    
    // 绘制连击文字
    this.comboSystem.render(this.ctx)
    
    // 绘制道具特效（光环）
    this.powerupEffectSystem.render(this.ctx)
    
    // 绘制闪光效果
    if (this.flashEffect > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashEffect * 0.3})`
      this.ctx.fillRect(0, 0, this.W, this.H)
    }
    
    // 绘制道具闪光效果（带颜色）
    if (this.powerupFlashIntensity > 0 && this.powerupFlashColor) {
      // 直接使用已经包含 alpha 的颜色值
      const baseColor = this.powerupFlashColor.replace(/[\d.]+\)$/, `${this.powerupFlashIntensity * 0.4})`)
      this.ctx.fillStyle = baseColor
      this.ctx.fillRect(0, 0, this.W, this.H)
    }
    
    this.ctx.restore()
  }
  
  private initBlocks() {
    this.blocks = []
    for (let r = 0; r < this.GRID; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this.blocks.push(new Block(r, c, this.COLORS[Math.floor(Math.random() * this.COLORS.length)]))
      }
    }
    
    // 随机在一些方块上放置道具
    this.spawnItemBlocks()
    
    // 随机在一些方块上放置星星
    this.spawnStarBlocks()
  }
  
  private spawnItemBlocks() {
    const now = Date.now()
    const elapsed = now - this.gameStartTime
    
    // 获取已解锁的道具列表
    const unlockedItems = GAME_ITEMS
      .filter(item => ITEM_UNLOCK_TIMES[item.id as keyof typeof ITEM_UNLOCK_TIMES] <= elapsed)
      .map(item => item.id)
    
    if (unlockedItems.length === 0) return
    
    // 计算总权重
    let totalWeight = 0
    unlockedItems.forEach((itemId: string) => {
      totalWeight += ITEM_SPAWN_WEIGHTS[itemId as keyof typeof ITEM_SPAWN_WEIGHTS] || 10
    })
    
    if (totalWeight === 0) return
    
    // 根据关卡配置设置道具生成概率
    const spawnRate = this.levelConfig?.itemSpawnRate || 0.20
    
    // 为每个方块有概率生成道具
    this.blocks.forEach((block) => {
      if (!block || block.getItem()) return
      
      if (Math.random() < spawnRate) {
        // 根据权重随机选择道具
        let random = Math.random() * totalWeight
        let selectedItem = unlockedItems[0]
        
        for (const itemId of unlockedItems) {
          const weight = ITEM_SPAWN_WEIGHTS[itemId as keyof typeof ITEM_SPAWN_WEIGHTS] || 10
          random -= weight
          if (random <= 0) {
            selectedItem = itemId
            break
          }
        }
        
        block.setItem(selectedItem)
      }
    })
  }
  
  // 生成带星星的方块
  private spawnStarBlocks() {
    if (!this.levelConfig) return
    
    const starSpawnRate = this.levelConfig.starSpawnRate || 0.10
    
    // 为每个方块有概率生成星星
    this.blocks.forEach((block) => {
      if (!block || block.getItem() || block.hasStar()) return
      
      if (Math.random() < starSpawnRate) {
        block.setStar(true)
      }
    })
  }
  
  private setupEventListeners() {
    // 清除旧的事件监听器
    this.canvas.onclick = null
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchmove', this.handleTouchMove)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)
    
    // 绑定点击事件（桌面端）
    this.canvas.onclick = (e: MouseEvent) => {
      this.lastActionTime = Date.now()
      
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.W / rect.width
      const scaleY = this.H / rect.height
      const mx = (e.clientX - rect.left) * scaleX
      const my = (e.clientY - rect.top) * scaleY
      
      this.handleClick(mx, my)
    }
    
    // 绑定触摸事件（移动端）
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false })
  }
  
  // 触摸事件处理 - touchstart 记录起始位置和选中宝石
  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    this.lastActionTime = Date.now()
    
    const touch = e.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.hasSwiped = false // 重置滑动标记
    
    // 如果没有选中任何宝石，尝试选中触摸位置的宝石
    if (!this.selectedBlock && !this.isAnimating) {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      
      const mx = (touch.clientX - rect.left) * scaleX
      const my = (touch.clientY - rect.top) * scaleY
      
      const col = Math.floor((mx - this.PADDING) / this.CELL)
      const row = Math.floor((my - this.TOP) / this.CELL)
      const idx = row * this.COLS + col
      
      // 边界检查
      if (row >= 0 && row < this.GRID && col >= 0 && col < this.COLS && 
          idx >= 0 && idx < this.blocks.length && this.blocks[idx]) {
        this.selectedBlock = idx
        audioService.collect()
        console.log(`[选中] 方块 ${idx}`)
      }
    }
  }
  
  // 触摸事件处理 - touchmove 处理拖拽交换
  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    
    // 如果没有选中宝石、正在动画或已经执行过滑动，不处理
    if (this.selectedBlock === null || this.isAnimating || this.hasSwiped) {
      return
    }
    
    const touch = e.touches[0]
    
    // 计算滑动距离
    const dx = touch.clientX - this.touchStartX
    const dy = touch.clientY - this.touchStartY
    
    // 判断滑动方向和距离
    const threshold = this.SWIPE_THRESHOLD
    
    const selectedRow = Math.floor(this.selectedBlock / this.COLS)
    const selectedCol = this.selectedBlock % this.COLS
    
    let targetIdx: number | null = null
    
    // 检测滑动方向（只触发一次）
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      // 判断是水平还是垂直滑动
      if (Math.abs(dx) > Math.abs(dy)) {
        // 水平滑动
        const direction = dx > 0 ? 1 : -1
        const targetCol = selectedCol + direction
        if (targetCol >= 0 && targetCol < this.COLS) {
          targetIdx = selectedRow * this.COLS + targetCol
        }
      } else {
        // 垂直滑动
        const direction = dy > 0 ? 1 : -1
        const targetRow = selectedRow + direction
        if (targetRow >= 0 && targetRow < this.GRID) {
          targetIdx = targetRow * this.COLS + selectedCol
        }
      }
      
      // 如果检测到有效的拖拽交换
      if (targetIdx !== null && this.blocks[targetIdx]) {
        // 获取触摸位置用于显示特效
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height
        const mx = (touch.clientX - rect.left) * scaleX
        const my = (touch.clientY - rect.top) * scaleY
        
        // 标记已执行滑动
        this.hasSwiped = true
        
        // 执行交换
        this.trySwap(this.selectedBlock, targetIdx, mx, my)
        this.selectedBlock = null // 重置选中状态
      }
    }
  }
  
  // 触摸事件处理 - touchend 处理点击逻辑
  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    
    const touch = e.changedTouches[0]
    
    // 如果已经通过拖拽处理了交换，不再处理点击
    if (this.hasSwiped || !this.selectedBlock) {
      this.selectedBlock = null
      this.hasSwiped = false
      return
    }
    
    // 判断是否为点击（滑动距离很小）
    const dx = Math.abs(touch.clientX - this.touchStartX)
    const dy = Math.abs(touch.clientY - this.touchStartY)
    
    // 如果滑动距离很小，视为点击
    if (dx < this.SWIPE_THRESHOLD && dy < this.SWIPE_THRESHOLD) {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      
      const mx = (touch.clientX - rect.left) * scaleX
      const my = (touch.clientY - rect.top) * scaleY
      
      this.handleClick(mx, my)
    }
    
    // 重置状态
    this.selectedBlock = null
    this.hasSwiped = false
  }
  
  private handleClick(mx: number, my: number) {
    // 触摸防抖：避免快速连续点击导致频繁播放音效
    const now = Date.now()
    if (now - this.lastTouchTime < this.TOUCH_DEBOUNCE_MS) {
      return
    }
    this.lastTouchTime = now
    
    // 动画期间不响应点击
    if (this.isAnimating) return
    
    const col = Math.floor((mx - this.PADDING) / this.CELL)
    const row = Math.floor((my - this.TOP) / this.CELL)
    const idx = row * this.COLS + col
    
    // 边界检查
    if (row < 0 || row >= this.GRID || col < 0 || col >= this.COLS) {
      return
    }
    
    if (idx < 0 || idx >= this.blocks.length || !this.blocks[idx]) {
      return
    }
    
    // ⭐ 恢复连通块消除玩法：点击即消除相连的同色方块
    this.eliminate(idx, mx, my)
  }
  
  // 处理宝石选中和交换逻辑
  private handleGemSelect(idx: number, mx: number, my: number) {
    if (!this.blocks[idx]) return
    
    // 如果没有选中任何宝石，选中当前宝石
    if (this.selectedBlock === null) {
      this.selectedBlock = idx
      audioService.collect()
      console.log(`[选中] 方块 ${idx}`)
      return
    }
    
    // 如果点击的是同一个宝石，取消选中
    if (this.selectedBlock === idx) {
      this.selectedBlock = null
      return
    }
    
    // 检查是否是相邻宝石（上下左右）
    const selectedRow = Math.floor(this.selectedBlock / this.COLS)
    const selectedCol = this.selectedBlock % this.COLS
    const targetRow = Math.floor(idx / this.COLS)
    const targetCol = idx % this.COLS
    
    const rowDiff = Math.abs(selectedRow - targetRow)
    const colDiff = Math.abs(selectedCol - targetCol)
    
    // 只有相邻的宝石才能交换（上下左右）
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      // 尝试交换
      this.trySwap(this.selectedBlock, idx, mx, my)
    } else {
      // 选中新的宝石（非相邻）
      this.selectedBlock = idx
      audioService.collect()
      console.log(`[选中] 方块 ${idx}`)
    }
  }
  
  // 尝试交换两个宝石
  private async trySwap(idx1: number, idx2: number, mx: number, my: number) {
    this.isAnimating = true
    
    // 交换方块
    this.swapBlocks(idx1, idx2)
    
    // 等待交换动画
    await this.wait(200)
    
    // 检查是否有匹配
    const matches = this.findMatches()
    
    if (matches.length >= 3) {
      // 有匹配，执行消除
      this.selectedBlock = null
      this.processMatches(matches, mx, my)
    } else {
      // 没有匹配，交换回来
      await this.wait(100)
      this.swapBlocks(idx1, idx2)
      await this.wait(200)
      this.selectedBlock = null
      this.isAnimating = false
      audioService.lose() // 播放失败音效
    }
  }
  
  // 交换两个方块
  private swapBlocks(idx1: number, idx2: number) {
    const temp = this.blocks[idx1]
    this.blocks[idx1] = this.blocks[idx2]
    this.blocks[idx2] = temp
    
    // 更新方块的行列位置
    if (this.blocks[idx1]) {
      const row = Math.floor(idx1 / this.COLS)
      const col = idx1 % this.COLS
      this.blocks[idx1].setR(row)
      this.blocks[idx1].setC(col)
    }
    if (this.blocks[idx2]) {
      const row = Math.floor(idx2 / this.COLS)
      const col = idx2 % this.COLS
      this.blocks[idx2].setR(row)
      this.blocks[idx2].setC(col)
    }
  }
  
  // 查找所有匹配的方块
  private findMatches(): number[] {
    const matches = new Set<number>()
    
    // 检查横向匹配
    for (let r = 0; r < this.GRID; r++) {
      for (let c = 0; c < this.COLS - 2; c++) {
        const idx = r * this.COLS + c
        const color = this.blocks[idx]?.getColor()
        if (!color) continue
        
        if (this.blocks[idx + 1]?.getColor() === color && 
            this.blocks[idx + 2]?.getColor() === color) {
          matches.add(idx)
          matches.add(idx + 1)
          matches.add(idx + 2)
          // 检查更长的匹配
          let nextC = c + 3
          while (nextC < this.COLS && this.blocks[r * this.COLS + nextC]?.getColor() === color) {
            matches.add(r * this.COLS + nextC)
            nextC++
          }
        }
      }
    }
    
    // 检查纵向匹配
    for (let c = 0; c < this.COLS; c++) {
      for (let r = 0; r < this.GRID - 2; r++) {
        const idx = r * this.COLS + c
        const color = this.blocks[idx]?.getColor()
        if (!color) continue
        
        if (this.blocks[idx + this.COLS]?.getColor() === color && 
            this.blocks[idx + this.COLS * 2]?.getColor() === color) {
          matches.add(idx)
          matches.add(idx + this.COLS)
          matches.add(idx + this.COLS * 2)
          // 检查更长的匹配
          let nextR = r + 3
          while (nextR < this.GRID && this.blocks[nextR * this.COLS + c]?.getColor() === color) {
            matches.add(nextR * this.COLS + c)
            nextR++
          }
        }
      }
    }
    
    return Array.from(matches)
  }
  
  // 处理匹配消除
  private async processMatches(matches: number[], mx: number, my: number) {
    // 标记消除
    matches.forEach(i => {
      if (this.blocks[i]) {
        this.blocks[i].setExploding(true)
      }
    })
    
    // 计算分数
    const basePoints = matches.length * 10
    const comboMultiplier = 1 + (matches.length - 3) * 0.5
    let pts = Math.round(basePoints * comboMultiplier * this.comboMultiplier)
    
    if (this.doubleScoreActive) {
      pts *= 2
    }
    
    this.comboMultiplier += 0.1
    if (this.comboMultiplier > 3) this.comboMultiplier = 3
    
    this.engine.addScore(pts, mx, my)
    this.engine.triggerRandomBuff()
    
    // 触发闪光效果
    this.flashEffect = Math.min(matches.length * 0.1, 0.8)
    
    // 播放音效
    if (matches.length >= 8) {
      audioService.win()
    } else if (matches.length >= 5) {
      audioService.buff()
    } else {
      audioService.collect()
    }
    
    // 收集道具和星星
    const collectedItems: string[] = []
    matches.forEach(i => {
      if (this.blocks[i] && this.blocks[i].getItem()) {
        const itemId = this.blocks[i]!.getItem()!
        if (!collectedItems.includes(itemId)) {
          collectedItems.push(itemId)
          const itemData = GAME_ITEMS.find(item => item.id === itemId)
          if (itemData) {
            this.comboSystem.addText(`${itemData.icon} ${itemData.name}!`, mx, my - 50 - collectedItems.length * 30)
          }
          this.triggerPowerupCollectEffect(itemId, mx, my)
          this.usePowerupImmediately(itemId, mx, my)
        }
      }
      
      if (this.blocks[i] && this.blocks[i].hasStar()) {
        this.collectedStars++
        this.comboSystem.addText(`💎 +1 (${this.collectedStars}/${this.levelConfig?.targetStars})`, mx, my - 80)
        audioService.collect()
      }
    })
    
    // 震动效果
    this.screenShake = Math.min(matches.length * 1.5, 15)
    
    // 连击文字
    if (matches.length >= 4) {
      this.comboSystem.addText(`${matches.length} 连消!`, mx, my - 30)
    }
    
    // 创建粒子效果
    matches.forEach(i => {
      const b = this.blocks[i]
      if (!b) return
      const x = this.PADDING + b.getC() * this.CELL + this.CELL / 2
      const y = this.TOP + b.getR() * this.CELL + this.CELL / 2
      this.particleSystem.createExplosion(x, y, b.getColor(), matches.length)
    })
    
    // Mega buff
    if (this.engine.hasBuff('mega')) {
      setTimeout(() => {
        this.particleSystem.createFullScreenExplosion(this.W, this.H, this.COLORS)
        this.blocks.forEach((b, i) => {
          if (b) this.engine.addScore(10, this.PADDING + (i % this.COLS) * this.CELL + this.CELL / 2, this.TOP + Math.floor(i / this.COLS) * this.CELL + this.CELL / 2)
        })
        this.blocks.forEach((_, i) => this.blocks[i] = null as any)
        audioService.win()
      }, 200)
    }
    
    // 延迟消除
    await this.wait(150)
    
    // 移除匹配的方块
    matches.forEach(i => { this.blocks[i] = null as any })
    
    // 应用重力
    this.applyGravity()
    
    // 等待重力动画
    await this.wait(300)
    
    // 检查新的匹配（连锁反应）
    const newMatches = this.findMatches()
    if (newMatches.length >= 3) {
      this.processMatches(newMatches, mx, my)
    } else {
      // 检查是否有有效移动
      if (!this.hasValidMove()) {
        this.resetBoard()
      }
      
      // 检查通关
      this.checkLevelComplete()
      
      this.isAnimating = false
    }
  }
  
  // 等待辅助函数
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  private eliminate(idx: number, mx: number, my: number) {
    const block = this.blocks[idx]
    if (!block || block.isExploding()) return
    
    const color = block.getColor()
    const same: number[] = []
    const vis = new Set<number>()
    
    // 洪水填充算法查找相同颜色的连通块
    const flood = (i: number) => {
      if (vis.has(i) || !this.blocks[i] || this.blocks[i].getColor() !== color) return
      if (this.blocks[i].isRainbow() && color !== this.blocks[i].getColor()) return
      
      vis.add(i)
      same.push(i)
      
      const r = Math.floor(i / this.COLS), c = i % this.COLS
      if (r > 0) flood(i - this.COLS)
      if (r < this.GRID - 1) flood(i + this.COLS)
      if (c > 0) flood(i - 1)
      if (c < this.COLS - 1) flood(i + 1)
    }
    
    flood(idx)
    
    if (same.length < 3) {
      this.engine.breakCombo()
      // 错误反馈动画
      same.forEach(i => {
        if (this.blocks[i]) {
          this.blocks[i].shake()
        }
      })
      audioService.lose() // 播放失败音效
      return
    }
    
    // 标记消除
    same.forEach(i => {
      if (this.blocks[i]) this.blocks[i].setExploding(true)
    })
    
    // 计算分数和连击倍数
    const basePoints = same.length * 10
    const comboMultiplier = 1 + (same.length - 3) * 0.5
    let pts = Math.round(basePoints * comboMultiplier * this.comboMultiplier)
    
    // 双倍分数效果（道具）
    if (this.doubleScoreActive) {
      pts *= 2
    }
    
    // 增加连击倍数
    this.comboMultiplier += 0.1
    if (this.comboMultiplier > 3) this.comboMultiplier = 3
    
    this.engine.addScore(pts, mx, my)
    this.engine.triggerRandomBuff()
    
    // 触发闪光效果
    this.flashEffect = Math.min(same.length * 0.1, 0.8)
    
    // 根据消除数量播放不同的音效
    if (same.length >= 8) {
      audioService.win() // 大量消除播放胜利音效
    } else if (same.length >= 5) {
      audioService.buff() // 中等消除播放增益音效
    } else {
      audioService.collect() // 小量消除播放收集音效
    }
    
    // 收集道具 - 立即自动生效
    const collectedItems: string[] = []
    same.forEach(i => {
      if (this.blocks[i] && this.blocks[i].getItem()) {
        const itemId = this.blocks[i].getItem()!
        if (!collectedItems.includes(itemId)) {
          collectedItems.push(itemId)
          
          // 显示收集提示
          const itemData = GAME_ITEMS.find(item => item.id === itemId)
          if (itemData) {
            this.comboSystem.addText(`${itemData.icon} ${itemData.name}!`, mx, my - 50 - collectedItems.length * 30)
          }
          
          // 触发道具收集特效（光环 + 闪光）
          this.triggerPowerupCollectEffect(itemId, mx, my)
          
          // ⭐ 立即使用道具效果（自动生效）
          this.usePowerupImmediately(itemId, mx, my)
        }
      }
      
      // 收集宝石
      if (this.blocks[i] && this.blocks[i].hasStar()) {
        this.collectedStars++
        this.comboSystem.addText(`💎 +1 (${this.collectedStars}/${this.levelConfig?.targetStars})`, mx, my - 80)
        audioService.collect()
      }
    })
    
    // 更新道具栏显示（仅用于视觉反馈）
    if (collectedItems.length > 0) {
      audioService.buff()
    }

    
    // 根据消除数量设置震动强度
    this.screenShake = Math.min(same.length * 1.5, 15)
    
    // 添加连击文字特效
    if (same.length >= 4) {
      this.comboSystem.addText(`${same.length} 连消!`, mx, my - 30)
    }
    if (same.length >= 6) {
      setTimeout(() => {
        this.comboSystem.addText('太棒了!', mx, my - 60)
      }, 100)
    }
    if (same.length >= 8) {
      setTimeout(() => {
        this.comboSystem.addText('完美!', mx, my - 90)
      }, 200)
    }
    if (same.length >= 10) {
      setTimeout(() => {
        this.comboSystem.addText('超级连消!', mx, my - 120)
      }, 300)
    }
    if (same.length >= 12) {
      setTimeout(() => {
        this.comboSystem.addText('无敌了!', mx, my - 150)
      }, 400)
    }
    
    // 创建华丽的爆炸粒子效果
    same.forEach(i => {
      const b = this.blocks[i]
      if (!b) return
      const x = this.PADDING + b.getC() * this.CELL + this.CELL / 2
      const y = this.TOP + b.getR() * this.CELL + this.CELL / 2
      
      this.particleSystem.createExplosion(x, y, b.getColor(), same.length)
    })
    
    // Mega buff - 全屏消除更震撼
    if (this.engine.hasBuff('mega')) {
      setTimeout(() => {
        this.particleSystem.createFullScreenExplosion(this.W, this.H, this.COLORS)
        
        this.blocks.forEach((b, i) => {
          if (b) this.engine.addScore(10, this.PADDING + (i % this.COLS) * this.CELL + this.CELL / 2, this.TOP + Math.floor(i / this.COLS) * this.CELL + this.CELL / 2)
        })
        this.blocks.forEach((_, i) => this.blocks[i] = null as any)
        audioService.win()
      }, 200)
    }
    
    // 延迟执行消除和下落
    setTimeout(() => {
      same.forEach(i => { this.blocks[i] = null as any })
      this.applyGravity()
      
      // 检查是否有可消除的组合，如果没有则重置棋盘
      setTimeout(() => {
        if (!this.hasValidMove()) {
          this.resetBoard()
        }
        
        // 检查是否通关
        this.checkLevelComplete()
      }, 200)
    }, 150)
  }
  
  private applyGravity() {
    for (let c = 0; c < this.COLS; c++) {
      let write = this.GRID - 1
      for (let r = this.GRID - 1; r >= 0; r--) {
        const cur = r * this.COLS + c
        if (this.blocks[cur]) {
          if (write !== r) { 
            this.blocks[write * this.COLS + c] = this.blocks[cur]
            this.blocks[write * this.COLS + c].setR(write)
            this.blocks[write * this.COLS + c].setScale(0.3)
            this.blocks[cur] = null as any
          }
          write--
        }
      }
      while (write >= 0) {
        this.blocks[write * this.COLS + c] = new Block(
          write, 
          c, 
          this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
          0.1
        )
        write--
      }
    }
    
    // ⭐ 修复：重新生成道具方块（仅对新生成的方块）
    this.spawnItemBlocks()
    
    // ⭐ 修复：重新生成星星方块（仅对新生成的方块）
    this.spawnStarBlocks()
  }
  
  private hasValidMove(): boolean {
    // ⭐ 恢复：检查是否存在3个或以上相连的同色方块
    for (let i = 0; i < this.blocks.length; i++) {
      if (!this.blocks[i]) continue
      
      const color = this.blocks[i].getColor()
      const r = Math.floor(i / this.COLS)
      const c = i % this.COLS
      
      // 使用BFS/DFS检查连通性
      const visited = new Set<number>()
      const queue: number[] = [i]
      visited.add(i)
      let count = 0
      
      while (queue.length > 0 && count < 3) {
        const curr = queue.shift()!
        count++
        
        const cr = Math.floor(curr / this.COLS)
        const cc = curr % this.COLS
        
        // 检查四个方向
        const directions = [
          { r: cr - 1, c: cc }, // 上
          { r: cr + 1, c: cc }, // 下
          { r: cr, c: cc - 1 }, // 左
          { r: cr, c: cc + 1 }  // 右
        ]
        
        for (const dir of directions) {
          if (dir.r >= 0 && dir.r < this.GRID && dir.c >= 0 && dir.c < this.COLS) {
            const idx = dir.r * this.COLS + dir.c
            if (!visited.has(idx) && this.blocks[idx] && this.blocks[idx].getColor() === color) {
              visited.add(idx)
              queue.push(idx)
            }
          }
        }
      }
      
      if (count >= 3) return true
    }
    return false
  }
  
  private resetBoard() {
    // 创建过渡动画
    this.blocks.forEach((b, i) => {
      if (b) {
        b.setScale(0.1)
        b.setAlpha(0.3)
      }
    })
    
    setTimeout(() => {
      this.initBlocks()
      // 新方块从小变大
      this.blocks.forEach(b => {
        if (b) {
          b.setScale(0.1)
          b.setAlpha(1)
        }
      })
    }, 300)
  }
  
  private updateBlockAnimations() {
    this.blocks.forEach(b => {
      if (b && b.getScale() < 1) {
        b.setScale(b.getScale() + 0.08)
        if (b.getScale() > 1) b.setScale(1)
      }
    })
  }
  
  private drawBackground() {
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(-10, -10, this.W + 20, this.H + 20)
  }
  
  private drawUI() {
    // 计算剩余时间
    const now = Date.now()
    const remaining = Math.max(0, this.timeLimit - (now - this.lastActionTime))
    const seconds = Math.ceil(remaining / 1000)
    
    // 根据单元格大小动态调整字体大小
    const fontSize = Math.max(10, Math.floor(this.CELL * 0.4))
    const smallFontSize = Math.max(8, Math.floor(this.CELL * 0.3))
    const mediumFontSize = Math.max(12, Math.floor(this.CELL * 0.35))
    const largeFontSize = Math.max(16, Math.floor(this.CELL * 0.5))
    const hugeFontSize = Math.max(20, Math.floor(this.CELL * 0.65))
    
    const padding = 15
    
    // 绘制关卡信息
    if (this.levelConfig) {
      this.ctx.fillStyle = '#FFD93D'
      this.ctx.font = `bold ${mediumFontSize}px sans-serif`
      this.ctx.textAlign = 'left'
      this.ctx.fillText(`关卡 ${this.currentLevel}/10`, padding, this.TOP / 3)
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)'
      this.ctx.font = `${smallFontSize}px sans-serif`
      this.ctx.fillText(this.levelConfig.name, padding, this.TOP / 3 + mediumFontSize + 2)
    }
    
    // 绘制倒计时背景条
    const barWidth = (remaining / this.timeLimit) * (this.W - padding * 2)
    const barHeight = Math.max(4, Math.floor(this.CELL * 0.12))
    const barColor = remaining < 5000 ? '#FF6B6B' : remaining < 10000 ? '#FFD93D' : '#4ECDC4'
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)'
    this.ctx.fillRect(padding, 4, this.W - padding * 2, barHeight)
    
    this.ctx.fillStyle = barColor
    this.ctx.fillRect(padding, 4, barWidth, barHeight)
    
    // 绘制倒计时数字
    if (seconds <= 10) {
      this.ctx.fillStyle = seconds <= 3 ? '#FF6B6B' : '#FFD93D'
      this.ctx.font = `bold ${largeFontSize}px sans-serif`
      this.ctx.textAlign = 'right'
      this.ctx.fillText(`⏱️ ${seconds}s`, this.W - padding, this.TOP / 3)
      
      // 最后3秒闪烁效果
      if (seconds <= 3 && Math.floor(now / 200) % 2 === 0) {
        this.ctx.fillStyle = 'rgba(255,107,107,0.1)'
        this.ctx.fillRect(0, 0, this.W, this.H)
      }
    }
    
    // 绘制分数
    this.ctx.fillStyle = '#fff'
    this.ctx.font = `bold ${hugeFontSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.fillText(String(this.engine.getScore()), this.W / 2, this.TOP / 2)
    this.ctx.font = `${smallFontSize}px sans-serif`
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)'
    this.ctx.fillText('极速消除', this.W / 2, this.TOP / 2 + hugeFontSize - 4)
    
    // 绘制连击数
    if (this.engine.getCombo() >= 3) {
      this.ctx.fillStyle = '#FFD93D'
      this.ctx.font = `bold ${mediumFontSize}px sans-serif`
      this.ctx.fillText(`🔥 ${this.engine.getCombo()} 连击`, this.W / 2, this.TOP / 2 + hugeFontSize + smallFontSize + 2)
    }
    
    // 绘制连击倍数
    if (this.comboMultiplier > 1.1) {
      this.ctx.fillStyle = '#FF6B6B'
      this.ctx.font = `bold ${smallFontSize}px sans-serif`
      this.ctx.fillText(`x${this.comboMultiplier.toFixed(1)} 连击加成`, this.W / 2, this.TOP / 2 + hugeFontSize + smallFontSize * 2 + 6)
    }
    
    // ⭐ 绘制星星收集进度
    this.drawStarProgress()
    
    // 绘制道具持续时间提示
    this.drawPowerupTimers(now)
  }
  
  private drawBlocks() {
    const padding = 15
    this.blocks.forEach((b, i) => {
      if (!b) return
      const x = padding + b.getC() * this.CELL + this.CELL / 2
      const y = this.TOP + b.getR() * this.CELL + this.CELL / 2
      const size = this.CELL * 0.4 * b.getScale()
      
      this.ctx.globalAlpha = b.getAlpha()
      
      // 检查是否是提示高亮的方块
      const isHinted = this.hintActive && this.hintBlocks.includes(i)
      
      if (b.isRainbow()) {
        const grad = this.ctx.createLinearGradient(x - size, y - size, x + size, y + size)
        this.COLORS.forEach((c, idx) => grad.addColorStop(idx / this.COLORS.length, c))
        this.ctx.fillStyle = grad
      } else {
        this.ctx.fillStyle = b.getColor()
      }
      
      // 检查是否是选中的方块
      const isSelected = this.selectedBlock === i
      
      // 如果是选中状态，添加金色脉冲光晕效果
      if (isSelected) {
        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7
        this.ctx.shadowColor = '#FFD700'
        this.ctx.shadowBlur = 20 * pulse
      } else if (isHinted) {
        // 如果是提示高亮，添加脉冲光晕效果
        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7
        this.ctx.shadowColor = '#FFD700'
        this.ctx.shadowBlur = 15 * pulse
      }
      
      this.ctx.beginPath()
      this.ctx.roundRect(x - size, y - size, size * 2, size * 2, 6)
      this.ctx.fill()
      
      // 重置阴影
      this.ctx.shadowColor = 'transparent'
      this.ctx.shadowBlur = 0
      
      // 添加高光效果
      this.ctx.fillStyle = 'rgba(255,255,255,0.4)'
      this.ctx.beginPath()
      this.ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.35, 0, Math.PI * 2)
      this.ctx.fill()
      
      // 添加边框效果
      if (isSelected) {
        // 选中状态：金色粗边框
        this.ctx.strokeStyle = '#FFD700'
        this.ctx.lineWidth = 4
      } else if (isHinted) {
        // 提示状态：金色边框
        this.ctx.strokeStyle = '#FFD700'
        this.ctx.lineWidth = 3
      } else {
        // 默认状态：白色边框
        this.ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        this.ctx.lineWidth = 2
      }
      this.ctx.beginPath()
      this.ctx.roundRect(x - size, y - size, size * 2, size * 2, 6)
      this.ctx.stroke()
      
      // 🎁 如果方块有道具，显示华丽的道具特效
      if (b.getItem()) {
        const itemData = GAME_ITEMS.find(item => item.id === b.getItem())
        if (itemData) {
          const itemId = b.getItem()!
          const itemColor = this.ITEM_COLORS[itemId] || '#FFFFFF'
          
          // 脉冲光晕效果（比宝石更强烈）
          const itemPulse = Math.sin(Date.now() * 0.012 + i * 0.5) * 0.4 + 0.8
          this.ctx.shadowColor = itemColor
          this.ctx.shadowBlur = 25 * itemPulse
          
          // 绘制彩色光晕背景圆
          const glowRadius = size * 0.7
          const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
          gradient.addColorStop(0, itemColor.replace(')', ', 0.4)').replace('rgb', 'rgba'))
          gradient.addColorStop(0.6, itemColor.replace(')', ', 0.2)').replace('rgb', 'rgba'))
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          
          this.ctx.fillStyle = gradient
          this.ctx.beginPath()
          this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
          this.ctx.fill()
          
          // 绘制白色边框圆（增强对比度）
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + itemPulse * 0.3})`
          this.ctx.lineWidth = 2.5
          this.ctx.beginPath()
          this.ctx.arc(x, y, size * 0.6, 0, Math.PI * 2)
          this.ctx.stroke()
          
          // 绘制道具图标（带旋转和缩放动画）
          this.ctx.font = `bold ${Math.floor(size * 1.5)}px sans-serif`
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          
          // 旋转动画（不同道具旋转速度不同）
          const rotationSpeed = b.getItem() === 'bomb' ? 0.008 : 0.005
          const rotation = Math.sin(Date.now() * rotationSpeed + i) * 0.2
          const scale = 1 + Math.sin(Date.now() * 0.007 + i * 0.8) * 0.1
          
          this.ctx.save()
          this.ctx.translate(x, y)
          this.ctx.rotate(rotation)
          this.ctx.scale(scale, scale)
          this.ctx.fillText(itemData.icon, 0, 0)
          this.ctx.restore()
          
          // 重置阴影
          this.ctx.shadowColor = 'transparent'
          this.ctx.shadowBlur = 0
        }
      }
      
      // 💎 如果方块有宝石，显示华丽的彩色宝石标记
      if (b.hasStar()) {
        // 绘制彩虹色光晕背景
        const gemPulse = Math.sin(Date.now() * 0.01 + i) * 0.3 + 0.7
        const hue = (Date.now() * 0.1 + i * 60) % 360
        this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
        this.ctx.shadowBlur = 20 * gemPulse
        
        // 绘制白色背景圆（增强对比度）
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        this.ctx.beginPath()
        this.ctx.arc(x, y, size * 0.65, 0, Math.PI * 2)
        this.ctx.fill()
        
        // 绘制彩虹色边框
        this.ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc(x, y, size * 0.65, 0, Math.PI * 2)
        this.ctx.stroke()
        
        // 绘制彩色宝石图标（适中尺寸）
        this.ctx.font = `bold ${Math.floor(size * 1.6)}px sans-serif`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        
        // 添加宝石轻微旋转和缩放效果
        const rotation = Math.sin(Date.now() * 0.004 + i) * 0.15
        const scale = 1 + Math.sin(Date.now() * 0.006 + i) * 0.08
        
        this.ctx.save()
        this.ctx.translate(x, y)
        this.ctx.rotate(rotation)
        this.ctx.scale(scale, scale)
        this.ctx.fillText('💎', 0, 0)
        this.ctx.restore()
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent'
        this.ctx.shadowBlur = 0
      }
      
      this.ctx.globalAlpha = 1
    })
  }
  

  
  // ⭐ 立即使用道具效果（消除道具方块时自动触发）
  private async usePowerupImmediately(type: string, x: number, y: number) {
    console.log('[道具] 自动生效:', type)
    
    // 触发华丽的收集特效
    this.triggerPowerupCollectEffect(type, x, y)
    
    switch (type) {
      case 'time_extend':
        // 时间延长 - 立即增加10秒
        this.lastActionTime = Date.now() + 10000
        audioService.win()
        this.comboSystem.addText('⏰ +10秒!', x, y - 30)
        break
        
      case 'hint':
        // 提示高亮 - 显示可消除的组合
        this.activateHint()
        audioService.buff()
        this.comboSystem.addText('🔍 提示已激活!', x, y - 30)
        break
        
      case 'double_score':
        // 分数加倍 - 20秒内得分翻倍
        this.doubleScoreActive = true
        this.doubleScoreEndTime = Date.now() + 20000
        audioService.win()
        this.comboSystem.addText('✨ 双倍分数 20秒!', x, y - 30)
        break
        
      case 'bomb':
        // 炸弹 - 消除最多颜色的所有方块
        await this.wait(200) // 等待当前消除完成
        await this.useBomb() // ⭐ 必须await，确保填充完成
        // ⭐ 修复：炸弹使用后不需要额外调用 audioService.win()，因为 useBomb 内部已经处理
        break
    }
  }
  

  
  // 触发道具收集特效
  private triggerPowerupCollectEffect(itemId: string, x: number, y: number) {
    // ⭐ 优化：减少光环特效数量
    for (let i = 0; i < 2; i++) { // 从3降到2
      setTimeout(() => {
        this.powerupEffectSystem.createEffect(itemId, x, y)
      }, i * 100) // 增加间隔
    }
    
    this.powerupFlashColor = this.ITEM_FLASH_COLORS_COLLECT[itemId] || 'rgba(255, 255, 255, 0.5)'
    this.powerupFlashIntensity = 1.0
    
    // 增强屏幕震动
    this.screenShake = Math.max(this.screenShake, 12)
    
    // ⭐ 优化：减少额外的粒子爆炸强度
    const particleColor = this.ITEM_COLORS[itemId] || '#FFD700'
    this.particleSystem.createExplosion(x, y, particleColor, 8) // 从15降到8
    
    // 播放特殊音效
    audioService.win()
  }
  
  // 触发道具使用特效（更华丽）
  private triggerPowerupUseEffect(type: string, x: number, y: number) {
    // ⭐ 优化：减少光环特效数量
    for (let i = 0; i < 3; i++) { // 从5降到3
      setTimeout(() => {
        this.powerupEffectSystem.createEffect(type, x, y)
      }, i * 80) // 增加间隔
    }
    
    this.powerupFlashColor = this.ITEM_FLASH_COLORS_USE[type] || 'rgba(255, 255, 255, 0.7)'
    this.powerupFlashIntensity = 1.0
    
    // 强烈屏幕震动
    this.screenShake = 25
    
    // ⭐ 优化：只触发一次全屏爆炸，而不是三次
    this.particleSystem.createFullScreenExplosion(this.W, this.H, this.COLORS)
    
    // 播放胜利音效
    audioService.win()
    
    // 显示浮动文字（更大更醒目）
    const itemData = GAME_ITEMS.find(item => item.id === type)
    if (itemData) {
      this.comboSystem.addText(`${itemData.icon} ${itemData.name}!`, x, y - 50)
      setTimeout(() => {
        this.comboSystem.addText('✨ 激活！ ✨', x, y - 80)
      }, 200)
    }
  }
  
  // 炸弹效果 - 消除最多颜色的所有方块
  private async useBomb() {
    // 设置动画状态，防止其他操作干扰
    this.isAnimating = true
    
    try {
      // 找到数量最多的颜色
      const colorCount: Record<string, number[]> = {}
      this.blocks.forEach((b, i) => {
        if (b && !b.isRainbow()) {
          if (!colorCount[b.getColor()]) colorCount[b.getColor()] = []
          colorCount[b.getColor()].push(i)
        }
      })
      
      let maxColor = ''
      let maxCount = 0
      for (const [color, indices] of Object.entries(colorCount)) {
        if (indices.length > maxCount) {
          maxCount = indices.length
          maxColor = color
        }
      }
      
      // 道具消除应该始终执行填充，不受数量限制
      if (maxColor && maxCount > 0) {
        // 消除所有该颜色的方块
        const bombIndices: number[] = []
        colorCount[maxColor].forEach(idx => {
          if (this.blocks[idx]) {
            bombIndices.push(idx)
            const x = this.PADDING + (idx % this.COLS) * this.CELL + this.CELL / 2
            const y = this.TOP + Math.floor(idx / this.COLS) * this.CELL + this.CELL / 2
            
            // 爆炸粒子（增强版）
            this.particleSystem.createExplosion(x, y, maxColor, 20)
            
            this.blocks[idx] = null as any
          }
        })
        
        // 强烈屏幕震动
        this.screenShake = 30
        this.engine.addScore(maxCount * 15, this.W / 2, this.H / 2)
        
        // 显示连击文字（更大更醒目）
        if (bombIndices.length >= 4) {
          this.comboSystem.addText(`${bombIndices.length} 连消!`, this.W / 2, this.H / 2 - 30)
          setTimeout(() => {
            this.comboSystem.addText(' 炸弹爆发！ 💥', this.W / 2, this.H / 2 - 60)
          }, 150)
        }
        
        // 创建全屏闪光效果
        this.powerupFlashColor = 'rgba(255, 100, 100, 0.8)'
        this.powerupFlashIntensity = 1.0
        
        // 等待爆炸动画
        await this.wait(150)
        
        // 应用重力填充（道具消除必须填充）
        this.applyGravity()
        
        // 等待重力动画
        await this.wait(300)
        
        // 检查新的匹配（连锁反应）
        const newMatches = this.findMatches()
        if (newMatches.length >= 3) {
          // 递归处理连锁消除
          const centerX = this.W / 2
          const centerY = this.H / 2
          await this.processMatches(newMatches, centerX, centerY)
        } else {
          // 检查是否有有效移动
          if (!this.hasValidMove()) {
            this.resetBoard()
          }
          
          // 检查是否通关
          this.checkLevelComplete()
        }
      } else if (!maxColor || maxCount === 0) {
        // 如果没有找到任何可消除的方块，直接重置棋盘
        this.resetBoard()
      }
    } finally {
      // 确保动画状态被重置
      this.isAnimating = false
    }
  }
  
  // 重排效果 - 重新排列所有方块
  private useShuffle() {
    const colors: string[] = []
    this.blocks.forEach(b => {
      if (b) colors.push(b.getColor())
    })
    
    // Fisher-Yates 洗牌算法
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[colors[i], colors[j]] = [colors[j], colors[i]]
    }
    
    let colorIdx = 0
    this.blocks.forEach((b, i) => {
      if (b) {
        b.setColor(colors[colorIdx++])
        b.setScale(0.5) // 缩小再放大动画
      }
    })
    
    this.screenShake = 10
    audioService.buff()
    
    // 创建洗牌特效
    for (let i = 0; i < 50; i++) {
      const p = new Particle(
        Math.random() * this.W,
        Math.random() * this.H,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        0.8,
        this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
        3 + Math.random() * 4
      )
      ;(this.particleSystem as any).particles.push(p)
    }
  }
  
  // 提示高亮 - 查找并高亮显示可消除的方块组合
  private activateHint() {
    this.hintActive = true
    this.hintBlocks = []
    
    // 查找第一个可消除的组合（至少3个相连的同色方块）
    for (let i = 0; i < this.blocks.length; i++) {
      if (!this.blocks[i]) continue
      
      const color = this.blocks[i].getColor()
      const connected = this.findConnectedBlocks(i, color)
      
      if (connected.length >= 3) {
        this.hintBlocks = connected
        break
      }
    }
    
    // 5秒后取消高亮
    setTimeout(() => {
      this.hintActive = false
      this.hintBlocks = []
    }, 5000)
  }
  
  // 查找连通的同色方块
  private findConnectedBlocks(startIndex: number, targetColor: string): number[] {
    const connected: number[] = []
    const visited = new Set<number>()
    const queue: number[] = [startIndex]
    visited.add(startIndex)
    
    while (queue.length > 0) {
      const current = queue.shift()!
      connected.push(current)
      
      const r = Math.floor(current / this.COLS)
      const c = current % this.COLS
      
      // 检查四个方向
      const directions = [
        { r: r - 1, c }, // 上
        { r: r + 1, c }, // 下
        { r, c: c - 1 }, // 左
        { r, c: c + 1 }  // 右
      ]
      
      for (const dir of directions) {
        if (dir.r >= 0 && dir.r < this.GRID && dir.c >= 0 && dir.c < this.COLS) {
          const idx = dir.r * this.COLS + dir.c
          if (!visited.has(idx) && this.blocks[idx] && this.blocks[idx].getColor() === targetColor) {
            visited.add(idx)
            queue.push(idx)
          }
        }
      }
    }
    
    return connected
  }
  
  // 绘制道具持续时间提示
  private drawPowerupTimers(now: number) {
    // 根据单元格大小动态调整字体和位置
    const fontSize = Math.max(12, Math.floor(this.CELL * 0.35))
    const lineSpacing = Math.max(20, Math.floor(this.CELL * 0.5))
    let yPos = this.H - fontSize - 10
    
    // 双倍分数倒计时
    if (this.doubleScoreActive) {
      const remaining = Math.max(0, this.doubleScoreEndTime - now)
      const seconds = Math.ceil(remaining / 1000)
      
      this.ctx.fillStyle = 'rgba(255, 105, 180, 0.9)'
      this.ctx.font = `bold ${fontSize}px sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`✨ 双倍分数 ${seconds}s`, this.W / 2, yPos)
      yPos -= lineSpacing
    }
    
    // 提示高亮倒计时（5秒）
    if (this.hintActive) {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'
      this.ctx.font = `bold ${fontSize}px sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.fillText('🔍 提示中...', this.W / 2, yPos)
    }
  }
  
  // 💎 绘制宝石收集进度（简洁版）
  private drawStarProgress() {
    if (!this.levelConfig) return
    
    const targetStars = this.levelConfig.targetStars
    const isCompleted = this.collectedStars >= targetStars
    
    // 根据单元格大小动态调整UI尺寸
    const fontSize = Math.max(10, Math.floor(this.CELL * 0.35))
    const padding = 15
    
    // 在屏幕右上角显示宝石数量
    const displayX = this.W - padding
    const displayY = this.TOP / 3 + fontSize
    
    // 动态计算背景框尺寸
    const bgWidth = Math.max(80, Math.floor(this.CELL * 2.2))
    const bgHeight = Math.max(28, Math.floor(this.CELL * 0.7))
    const bgRadius = Math.max(6, Math.floor(this.CELL * 0.15))
    
    // 背景圆角矩形
    this.ctx.fillStyle = isCompleted ? 'rgba(138, 43, 226, 0.3)' : 'rgba(0, 0, 0, 0.4)'
    this.ctx.beginPath()
    this.ctx.roundRect(displayX - bgWidth, displayY - bgHeight / 2, bgWidth, bgHeight, bgRadius)
    this.ctx.fill()
    
    // 边框
    this.ctx.strokeStyle = isCompleted ? '#8A2BE2' : 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.roundRect(displayX - bgWidth, displayY - bgHeight / 2, bgWidth, bgHeight, bgRadius)
    this.ctx.stroke()
    
    // 宝石图标和数量
    this.ctx.fillStyle = '#fff'
    this.ctx.font = `bold ${fontSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(`💎${this.collectedStars}/${targetStars}`, displayX - bgWidth / 2, displayY)
    
    // 如果完成，添加闪烁效果
    if (isCompleted) {
      const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7
      const hue = (Date.now() * 0.2) % 360
      this.ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${pulse * 0.2})`
      this.ctx.beginPath()
      this.ctx.roundRect(displayX - bgWidth, displayY - bgHeight / 2, bgWidth, bgHeight, bgRadius)
      this.ctx.fill()
      
      // 完成标记
      this.ctx.fillStyle = '#8A2BE2'
      this.ctx.font = `bold ${Math.floor(fontSize * 0.75)}px sans-serif`
      this.ctx.fillText('✓', displayX - bgWidth * 0.17, displayY)
    }
    
    // 重置 textBaseline
    this.ctx.textBaseline = 'alphabetic'
  }
}
