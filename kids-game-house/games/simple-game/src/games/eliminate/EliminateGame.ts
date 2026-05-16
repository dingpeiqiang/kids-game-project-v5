import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { storageService } from '../../services/storage'
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
  
  // 游戏常量
  private readonly W = 400
  private readonly H = 600
  private readonly GRID = 8
  private readonly COLS = 6
  private readonly CELL = (400 - 40) / 6
  private readonly TOP = 80
  private readonly ALL_COLORS = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6']
  
  // 关卡系统
  private currentLevel: number = 1
  private levelConfig: LevelConfig | null = null
  private COLORS: string[] = []
  
  // 游戏状态
  private blocks: Block[] = []
  private particleSystem: ParticleSystem
  private comboSystem: ComboSystem
  private powerupSystem: PowerupSystem
  private powerupEffectSystem: PowerupEffectSystem
  
  // 游戏结束标志 - 防止重复调用 endGame
  private isGameOver = false
  
  // 游戏计时器
  private lastActionTime = Date.now()
  private gameStartTime = Date.now()
  private levelStartTime = Date.now() // 关卡开始时间
  
  // 获取当前关卡的时间限制
  private get timeLimit(): number {
    return this.levelConfig?.timeLimit || 15000
  }
  
  // 视觉效果
  private screenShake = 0
  private doubleScoreActive = false
  private flashEffect = 0 // 闪光效果强度
  private comboMultiplier = 1 // 连击倍数
  private powerupFlashColor: string | null = null // 道具闪光颜色
  private powerupFlashIntensity = 0 // 道具闪光强度
  
  // 道具系统
  private inventory: string[] = []
  private itemCharge: Record<string, number> = {}
  private unlockedItems: string[] = []
  
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, engine: GameEngine, onEnd: () => void) {
    this.canvas = canvas
    this.ctx = ctx
    this.engine = engine
    this.onEnd = onEnd
    
    this.particleSystem = new ParticleSystem()
    this.comboSystem = new ComboSystem()
    this.powerupSystem = new PowerupSystem()
    this.powerupEffectSystem = new PowerupEffectSystem()
  }
  
  init() {
    this.isGameOver = false // 重置游戏结束标志
    this.initLevel(1) // 从第1关开始
    this.setupEventListeners()
    this.updateHTMLPowerupBar()
  }
  
  // 初始化关卡
  private initLevel(level: number) {
    this.currentLevel = level
    this.levelConfig = ELIMINATE_LEVELS.find(l => l.level === level) || ELIMINATE_LEVELS[0]
    this.COLORS = getLevelColors(level)
    this.levelStartTime = Date.now()
    this.lastActionTime = Date.now()
    this.isGameOver = false // 重置游戏结束标志
    
    console.log(`[关卡] 进入第 ${level} 关: ${this.levelConfig.name}`)
    console.log(`[关卡] 目标分数: ${this.levelConfig.targetScore}, 时间限制: ${this.levelConfig.timeLimit / 1000}秒`)
    
    // 重新初始化方块
    this.initBlocks()
    
    // 显示关卡提示
    this.showLevelStartHint()
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
    
    const score = this.engine.getScore()
    if (isLevelCompleted(this.currentLevel, score)) {
      console.log(`[关卡] 第 ${this.currentLevel} 关完成！分数: ${score}`)
      
      // 显示通关提示
      this.showLevelCompleteHint()
      
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
  
  // 显示通关提示
  private showLevelCompleteHint() {
    const hint = document.createElement('div')
    hint.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: #fff;
      padding: 25px 35px;
      border-radius: 15px;
      font-size: 18px;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: fadeInScale 0.5s ease-out;
    `
    
    hint.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">关卡完成！</div>
      <div style="font-size: 16px;">准备进入下一关...</div>
    `
    
    document.body.appendChild(hint)
    setTimeout(() => {
      hint.style.transition = 'opacity 0.5s'
      hint.style.opacity = '0'
      setTimeout(() => hint.remove(), 500)
    }, 1500)
  }
  
  // 显示游戏全部完成提示
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
    
    // 5秒后结束游戏
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
    }, 5000)
  }
  
  update(deltaTime: number) {
    // 更新粒子系统
    this.particleSystem.update()
    
    // 更新连击系统
    this.comboSystem.update()
    
    // 更新道具系统
    this.powerupSystem.update()
    
    // 更新道具特效系统
    this.powerupEffectSystem.update()
    
    // 更新方块动画
    this.updateBlockAnimations()
    
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
  }
  
  private spawnItemBlocks() {
    const now = Date.now()
    const elapsed = now - this.gameStartTime
    
    // 更新已解锁道具列表
    this.unlockedItems = GAME_ITEMS
      .filter(item => ITEM_UNLOCK_TIMES[item.id as keyof typeof ITEM_UNLOCK_TIMES] <= elapsed)
      .map(item => item.id)
    
    if (this.unlockedItems.length === 0) return
    
    // 计算总权重
    let totalWeight = 0
    this.unlockedItems.forEach(itemId => {
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
        let selectedItem = this.unlockedItems[0]
        
        for (const itemId of this.unlockedItems) {
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
  
  private setupEventListeners() {
    this.canvas.onclick = null
    this.canvas.onclick = (e) => {
      this.lastActionTime = Date.now()
      
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.W / rect.width
      const scaleY = this.H / rect.height
      const mx = (e.clientX - rect.left) * scaleX
      const my = (e.clientY - rect.top) * scaleY
      
      this.handleClick(mx, my)
    }
  }
  
  private handleClick(mx: number, my: number) {
    const col = Math.floor((mx - 20) / this.CELL)
    const row = Math.floor((my - this.TOP) / this.CELL)
    const idx = row * this.COLS + col
    
    if (idx < 0 || idx >= this.blocks.length || !this.blocks[idx]) return
    
    this.eliminate(idx, mx, my)
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
    
    // 双倍分数效果
    if (this.doubleScoreActive) {
      pts *= 2
      this.doubleScoreActive = false
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
    
    // 收集道具
    const collectedItems: string[] = []
    same.forEach(i => {
      if (this.blocks[i] && this.blocks[i].getItem()) {
        const itemId = this.blocks[i].getItem()!
        if (!collectedItems.includes(itemId)) {
          collectedItems.push(itemId)
          this.itemCharge[itemId] = (this.itemCharge[itemId] || 0) + 1
          
          // 显示收集提示
          const itemData = GAME_ITEMS.find(item => item.id === itemId)
          if (itemData) {
            this.comboSystem.addText(`+1 ${itemData.icon}`, mx, my - 50 - collectedItems.length * 30)
          }
          
          // 触发道具收集特效（光环 + 闪光）
          this.triggerPowerupCollectEffect(itemId, mx, my)
        }
      }
    })
    
    // 更新道具栏显示
    if (collectedItems.length > 0) {
      this.updateItemBar()
      audioService.buff()
    }
    
    // 检查是否有特殊道具效果激活
    if (this.powerupSystem.isEffectActive('double_score')) {
      pts *= 2
    }
    if (this.powerupSystem.isEffectActive('time_freeze')) {
      this.lastActionTime = Date.now() + 5000 // 额外增加5秒
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
      const x = 20 + b.getC() * this.CELL + this.CELL / 2
      const y = this.TOP + b.getR() * this.CELL + this.CELL / 2
      
      this.particleSystem.createExplosion(x, y, b.getColor(), same.length)
    })
    
    // Mega buff - 全屏消除更震撼
    if (this.engine.hasBuff('mega')) {
      setTimeout(() => {
        this.particleSystem.createFullScreenExplosion(this.W, this.H, this.COLORS)
        
        this.blocks.forEach((b, i) => {
          if (b) this.engine.addScore(10, 20 + (i % this.COLS) * this.CELL + this.CELL / 2, this.TOP + Math.floor(i / this.COLS) * this.CELL + this.CELL / 2)
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
    
    // 重新生成道具方块
    this.spawnItemBlocks()
  }
  
  private hasValidMove(): boolean {
    // 检查每个方块是否能形成3个或以上的连接
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
    
    // 绘制关卡信息
    if (this.levelConfig) {
      this.ctx.fillStyle = '#FFD93D'
      this.ctx.font = 'bold 16px sans-serif'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(`关卡 ${this.currentLevel}/10`, 20, 35)
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)'
      this.ctx.font = '12px sans-serif'
      this.ctx.fillText(this.levelConfig.name, 20, 52)
    }
    
    // 绘制倒计时背景条
    const barWidth = (remaining / this.timeLimit) * (this.W - 40)
    const barColor = remaining < 5000 ? '#FF6B6B' : remaining < 10000 ? '#FFD93D' : '#4ECDC4'
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)'
    this.ctx.fillRect(20, 8, this.W - 40, 6)
    
    this.ctx.fillStyle = barColor
    this.ctx.fillRect(20, 8, barWidth, 6)
    
    // 绘制倒计时数字
    if (seconds <= 10) {
      this.ctx.fillStyle = seconds <= 3 ? '#FF6B6B' : '#FFD93D'
      this.ctx.font = 'bold 20px sans-serif'
      this.ctx.textAlign = 'right'
      this.ctx.fillText(`⏱️ ${seconds}s`, this.W - 20, 35)
      
      // 最后3秒闪烁效果
      if (seconds <= 3 && Math.floor(now / 200) % 2 === 0) {
        this.ctx.fillStyle = 'rgba(255,107,107,0.1)'
        this.ctx.fillRect(0, 0, this.W, this.H)
      }
    }
    
    // 绘制分数
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 28px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(String(this.engine.getScore()), this.W / 2, 45)
    this.ctx.font = '13px sans-serif'
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)'
    this.ctx.fillText('极速消除', this.W / 2, 65)
    
    // 绘制连击数
    if (this.engine.getCombo() >= 3) {
      this.ctx.fillStyle = '#FFD93D'
      this.ctx.font = 'bold 16px sans-serif'
      this.ctx.fillText(`🔥 ${this.engine.getCombo()} 连击`, this.W / 2, 72)
    }
    
    // 绘制连击倍数
    if (this.comboMultiplier > 1.1) {
      this.ctx.fillStyle = '#FF6B6B'
      this.ctx.font = 'bold 14px sans-serif'
      this.ctx.fillText(`x${this.comboMultiplier.toFixed(1)} 连击加成`, this.W / 2, 88)
    }
  }
  
  private drawBlocks() {
    this.blocks.forEach((b, i) => {
      if (!b) return
      const x = 20 + b.getC() * this.CELL + this.CELL / 2
      const y = this.TOP + b.getR() * this.CELL + this.CELL / 2
      const size = this.CELL * 0.4 * b.getScale()
      
      this.ctx.globalAlpha = b.getAlpha()
      
      if (b.isRainbow()) {
        const grad = this.ctx.createLinearGradient(x - size, y - size, x + size, y + size)
        this.COLORS.forEach((c, idx) => grad.addColorStop(idx / this.COLORS.length, c))
        this.ctx.fillStyle = grad
      } else {
        this.ctx.fillStyle = b.getColor()
      }
      
      this.ctx.beginPath()
      this.ctx.roundRect(x - size, y - size, size * 2, size * 2, 6)
      this.ctx.fill()
      
      // 添加高光效果
      this.ctx.fillStyle = 'rgba(255,255,255,0.4)'
      this.ctx.beginPath()
      this.ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.35, 0, Math.PI * 2)
      this.ctx.fill()
      
      // 添加边框效果
      this.ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.roundRect(x - size, y - size, size * 2, size * 2, 6)
      this.ctx.stroke()
      
      // 如果方块有道具，显示道具图标
      if (b.getItem()) {
        const itemData = GAME_ITEMS.find(item => item.id === b.getItem())
        if (itemData) {
          this.ctx.font = `${Math.floor(size * 1.2)}px sans-serif`
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          this.ctx.fillText(itemData.icon, x, y)
        }
      }
      
      this.ctx.globalAlpha = 1
    })
  }
  
  private updateHTMLPowerupBar() {
    // 简化道具栏更新逻辑
    const powerupIcons: Record<string, string> = {
      'bomb': '💣',
      'shuffle': '🔀',
      'hammer': '🔨',
      'freeze': '❄️'
    }
    
    // 这里可以添加自定义的道具栏更新逻辑
    console.log('道具栏更新:', this.inventory)
  }
  
  private usePowerup(type: string): boolean {
    const index = this.inventory.indexOf(type)
    if (index === -1) return false
    
    this.inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    // 触发使用道具的华丽特效（屏幕中心）
    this.triggerPowerupUseEffect(type, this.W / 2, this.H / 2)
    
    switch (type) {
      case 'bomb':
        // 炸弹 - 消除最多颜色的所有方块
        this.useBomb()
        audioService.win()
        console.log('[道具] 炸弹已使用')
        break
        
      case 'shuffle':
        // 重排 - 重新排列所有方块
        this.useShuffle()
        audioService.collect()
        console.log('[道具] 重排已使用')
        break
        
      case 'hammer':
        // 锤子 - 下次点击消除单个方块
        ;(window as any).eliminateHammer = true
        audioService.win()
        console.log('[道具] 锤子已准备，请点击方块')
        break
        
      case 'freeze':
        // 冻结 - 暂停计时10秒
        this.lastActionTime = Date.now() + 10000
        audioService.win()
        console.log('[道具] 冻结生效，增加10秒')
        break
    }
    
    return true
  }
  
  private updateItemBar() {
    const items = ['bomb', 'line_h', 'line_v', 'color_bomb', 'hammer', 'shuffle', 'rainbow', 'freeze', 'magnet', 'mega_bomb', 'time_plus', 'double_score']
    items.forEach(itemId => {
      const countEl = document.getElementById(`itemCount_${itemId}`)
      if (countEl) {
        const count = this.itemCharge[itemId] || 0
        countEl.textContent = String(count)
        
        // 根据数量改变样式
        const slot = countEl.parentElement
        if (slot) {
          if (count > 0) {
            slot.style.borderColor = '#FFD93D'
            slot.style.boxShadow = '0 0 15px rgba(255,217,61,0.5)'
          } else {
            slot.style.borderColor = 'rgba(255,255,255,0.2)'
            slot.style.boxShadow = 'none'
          }
        }
      }
    })
  }
  
  // 触发道具收集特效
  private triggerPowerupCollectEffect(itemId: string, x: number, y: number) {
    // 创建光环特效
    this.powerupEffectSystem.createEffect(itemId, x, y)
    
    // 设置闪光颜色（不同道具有不同颜色）
    const colorMap: Record<string, string> = {
      'bomb': 'rgba(255, 107, 107, 0.4)',        // 红色
      'shuffle': 'rgba(155, 89, 182, 0.4)',      // 紫色
      'hammer': 'rgba(255, 142, 83, 0.4)',       // 橙色
      'freeze': 'rgba(78, 205, 196, 0.4)',       // 青色
      'color_bomb': 'rgba(255, 217, 61, 0.4)',   // 黄色
      'line_h': 'rgba(77, 150, 255, 0.4)',       // 蓝色
      'line_v': 'rgba(107, 203, 119, 0.4)',      // 绿色
      'rainbow': 'rgba(255, 105, 180, 0.4)',     // 粉色
      'mega_bomb': 'rgba(255, 0, 0, 0.5)',       // 深红（更强）
      'time_plus': 'rgba(0, 255, 255, 0.4)',     // cyan
      'double_score': 'rgba(255, 215, 0, 0.4)'   // 金色
    }
    
    this.powerupFlashColor = colorMap[itemId] || 'rgba(255, 255, 255, 0.4)'
    this.powerupFlashIntensity = 1.0
    
    // 增强屏幕震动
    this.screenShake = Math.max(this.screenShake, 10)
    
    // 播放特殊音效
    audioService.win()
  }
  
  // 触发道具使用特效（更华丽）
  private triggerPowerupUseEffect(type: string, x: number, y: number) {
    // 创建多个光环特效（更强烈）
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.powerupEffectSystem.createEffect(type, x, y)
      }, i * 100)
    }
    
    // 设置更强的闪光效果
    const colorMap: Record<string, string> = {
      'bomb': 'rgba(255, 107, 107, 0.6)',        // 红色
      'shuffle': 'rgba(155, 89, 182, 0.6)',      // 紫色
      'hammer': 'rgba(255, 142, 83, 0.6)',       // 橙色
      'freeze': 'rgba(78, 205, 196, 0.6)',       // 青色
      'color_bomb': 'rgba(255, 217, 61, 0.6)',   // 黄色
      'line_h': 'rgba(77, 150, 255, 0.6)',       // 蓝色
      'line_v': 'rgba(107, 203, 119, 0.6)',      // 绿色
      'rainbow': 'rgba(255, 105, 180, 0.6)',     // 粉色
      'mega_bomb': 'rgba(255, 0, 0, 0.7)',       // 深红（最强）
      'time_plus': 'rgba(0, 255, 255, 0.6)',     // cyan
      'double_score': 'rgba(255, 215, 0, 0.6)'   // 金色
    }
    
    this.powerupFlashColor = colorMap[type] || 'rgba(255, 255, 255, 0.6)'
    this.powerupFlashIntensity = 1.0
    
    // 强烈屏幕震动
    this.screenShake = 20
    
    // 创建额外的粒子爆炸效果
    this.particleSystem.createFullScreenExplosion(this.W, this.H, this.COLORS)
    
    // 播放胜利音效
    audioService.win()
    
    // 显示浮动文字
    const itemData = GAME_ITEMS.find(item => item.id === type)
    if (itemData) {
      this.comboSystem.addText(`${itemData.icon} ${itemData.name}!`, x, y - 50)
    }
  }
  
  // 炸弹效果 - 消除最多颜色的所有方块
  private useBomb() {
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
    
    if (maxColor && maxCount >= 3) {
      // 消除所有该颜色的方块
      colorCount[maxColor].forEach(idx => {
        if (this.blocks[idx]) {
          const x = 20 + (idx % this.COLS) * this.CELL + this.CELL / 2
          const y = this.TOP + Math.floor(idx / this.COLS) * this.CELL + this.CELL / 2
          
          // 爆炸粒子
          this.particleSystem.createExplosion(x, y, maxColor, 15)
          
          this.blocks[idx] = null as any
        }
      })
      
      this.screenShake = 20
      this.engine.addScore(maxCount * 15, this.W / 2, this.H / 2)
      
      // 下落填充
      setTimeout(() => {
        this.applyGravity()
      }, 200)
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
}
