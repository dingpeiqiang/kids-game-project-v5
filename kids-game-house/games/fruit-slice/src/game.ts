// Fruit Slice Game - 独立版本
// 优化了切割声音和果汁喷射效果

import { audioService } from './services/audio'

interface Fruit {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  size: number
  rotation: number
  rotSpeed: number
  emoji: string
  sliced: boolean
  color?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
  type?: 'juice' | 'sparkle' | 'slice'
}

interface Slice {
  x1: number
  y1: number
  x2: number
  y2: number
  life: number
}

export class FruitSliceGame {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private W = 400
  private H = 600
  
  private fruits: Fruit[] = []
  private particles: Particle[] = []
  private slices: Slice[] = []
  
  private score = 0
  private combo = 0
  private maxCombo = 0
  private lastSpawn = Date.now()
  private gameStartTime = Date.now()
  private gameEnded = false
  private missedCount = 0
  private isSlicing = false
  private lastX = 0
  private lastY = 0
  
  // ====== 关卡系统 ======
  private currentLevel = 1
  private readonly MAX_LEVEL = 10
  private levelStartTime = Date.now()
  private fruitsSlicedInLevel = 0
  private screenShake = 0
  private levelTransition = false
  private transitionAlpha = 0
  private transitionText = ''
  
  // 关卡配置
  private readonly LEVEL_CONFIG = [
    { level: 1, duration: 15000, spawnRate: 1800, maxFruits: 2, speed: 1.0, gravity: 0.04, targetScore: 100 },
    { level: 2, duration: 18000, spawnRate: 1500, maxFruits: 3, speed: 1.2, gravity: 0.05, targetScore: 200 },
    { level: 3, duration: 20000, spawnRate: 1200, maxFruits: 3, speed: 1.4, gravity: 0.06, targetScore: 350 },
    { level: 4, duration: 22000, spawnRate: 1000, maxFruits: 4, speed: 1.6, gravity: 0.07, targetScore: 500 },
    { level: 5, duration: 25000, spawnRate: 900, maxFruits: 4, speed: 1.8, gravity: 0.08, targetScore: 700 },
    { level: 6, duration: 25000, spawnRate: 800, maxFruits: 5, speed: 2.0, gravity: 0.09, targetScore: 900 },
    { level: 7, duration: 28000, spawnRate: 700, maxFruits: 5, speed: 2.2, gravity: 0.10, targetScore: 1200 },
    { level: 8, duration: 30000, spawnRate: 600, maxFruits: 6, speed: 2.5, gravity: 0.11, targetScore: 1500 },
    { level: 9, duration: 30000, spawnRate: 500, maxFruits: 6, speed: 2.8, gravity: 0.12, targetScore: 1800 },
    { level: 10, duration: 35000, spawnRate: 400, maxFruits: 8, speed: 3.0, gravity: 0.13, targetScore: 2500 }
  ]
  
  // 道具系统
  private inventory: string[] = []
  private powerupIcons: Record<string, string> = {
    'slow': '🐌',
    'magnet': '🧲',
    'double': '⭐',
    'bomb': '💣'
  }
  
  private FRUITS = [
    { emoji: '🍎', color: '#FF6B6B' },
    { emoji: '🍊', color: '#FFA500' },
    { emoji: '🍋', color: '#FFD93D' },
    { emoji: '🍇', color: '#9B59B6' },
    { emoji: '🍓', color: '#FF4757' },
    { emoji: '🍑', color: '#FFB6C1' },
    { emoji: '🍒', color: '#DC143C' },
    { emoji: '🥝', color: '#8FBC8F' }
  ]
  
  constructor(canvasId: string = 'mainGameCanvas') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!this.canvas) {
      console.error('Canvas not found!')
      return
    }
    
    this.ctx = this.canvas.getContext('2d')
    if (!this.ctx) {
      console.error('Cannot get 2D context!')
      return
    }
    
    this.ctx.imageSmoothingEnabled = false
    this.setupEventListeners()
    this.start()
  }
  
  private setupEventListeners() {
    if (!this.canvas) return
    
    this.canvas.onmousedown = (e) => {
      e.preventDefault()
      this.isSlicing = true
      const pos = this.getPos(e)
      this.lastX = pos.x
      this.lastY = pos.y
      audioService.initOnGesture()
    }
    
    this.canvas.ontouchstart = (e) => {
      e.preventDefault()
      this.isSlicing = true
      const pos = this.getPos(e)
      this.lastX = pos.x
      this.lastY = pos.y
      audioService.initOnGesture()
    }
    
    this.canvas.onmousemove = (e) => {
      if (!this.isSlicing) return
      e.preventDefault()
      
      const pos = this.getPos(e)
      this.slices.push({ x1: this.lastX, y1: this.lastY, x2: pos.x, y2: pos.y, life: 1 })
      this.checkSlice(this.lastX, this.lastY, pos.x, pos.y)
      
      this.lastX = pos.x
      this.lastY = pos.y
    }
    
    this.canvas.ontouchmove = (e) => {
      if (!this.isSlicing) return
      e.preventDefault()
      
      const pos = this.getPos(e)
      this.slices.push({ x1: this.lastX, y1: this.lastY, x2: pos.x, y2: pos.y, life: 1 })
      this.checkSlice(this.lastX, this.lastY, pos.x, pos.y)
      
      this.lastX = pos.x
      this.lastY = pos.y
    }
    
    this.canvas.onmouseup = () => {
      this.isSlicing = false
      this.combo = 0
    }
    
    this.canvas.ontouchend = () => {
      this.isSlicing = false
      this.combo = 0
    }
    
    // 全局事件监听
    const handleGlobalMove = (e: MouseEvent) => {
      if (!this.isSlicing || !this.canvas) return
      
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.W / rect.width
      const scaleY = this.H / rect.height
      const pos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
      
      this.slices.push({ x1: this.lastX, y1: this.lastY, x2: pos.x, y2: pos.y, life: 1 })
      this.checkSlice(this.lastX, this.lastY, pos.x, pos.y)
      
      this.lastX = pos.x
      this.lastY = pos.y
    }
    
    const handleGlobalUp = () => {
      this.isSlicing = false
      this.combo = 0
    }
    
    document.addEventListener('mousemove', handleGlobalMove)
    document.addEventListener('mouseup', handleGlobalUp)
  }
  
  private getPos(e: MouseEvent | TouchEvent) {
    if (!this.canvas) return { x: 0, y: 0 }
    
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.W / rect.width
    const scaleY = this.H / rect.height
    
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    
    const mouseEvent = e as MouseEvent
    return {
      x: (mouseEvent.clientX - rect.left) * scaleX,
      y: (mouseEvent.clientY - rect.top) * scaleY
    }
  }
  
  private spawnFruit() {
    const config = this.LEVEL_CONFIG[this.currentLevel - 1]
    const size = 55
    const x = 60 + Math.random() * (this.W - 120)
    
    // 根据关卡调整抛出角度和速度
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3
    const speed = (5 + Math.random() * 2) * config.speed
    
    const fruitData = this.FRUITS[Math.floor(Math.random() * this.FRUITS.length)]
    
    this.fruits.push({
      x,
      y: this.H + size,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: config.gravity,
      size,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      emoji: fruitData.emoji,
      color: fruitData.color,
      sliced: false
    })
  }
  
  private createJuiceParticles(x: number, y: number, color: string, count: number = 25) {
    // 根据连击数增加粒子数量，效果拉满！
    const comboMultiplier = 1 + (this.combo * 0.3)
    const actualCount = Math.floor(count * comboMultiplier)
    
    // 果汁喷射粒子
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 10
      const particleType = Math.random() > 0.6 ? 'juice' : 'sparkle'
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // 更强烈的向上喷射
        life: 1,
        color: particleType === 'juice' ? color : '#FFFFFF',
        size: particleType === 'juice' ? (5 + Math.random() * 8) : (3 + Math.random() * 4),
        type: particleType
      })
    }
    
    // 屏幕震动效果
    this.screenShake = Math.min(10, 3 + this.combo * 0.5)
  }
  
  private createSliceEffect(x1: number, y1: number, x2: number, y2: number) {
    // 切割轨迹特效
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    
    // 添加闪光粒子
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: midX + (Math.random() - 0.5) * 20,
        y: midY + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.8,
        color: '#FFFFFF',
        size: 2 + Math.random() * 3,
        type: 'slice'
      })
    }
  }
  
  private checkSlice(x1: number, y1: number, x2: number, y2: number) {
    const sliceLen = Math.hypot(x2 - x1, y2 - y1)
    if (sliceLen < 20) return
    
    let slicedCount = 0
    
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i]
      if (f.sliced) continue
      
      const dx = x2 - x1
      const dy = y2 - y1
      const fx = f.x - x1
      const fy = f.y - y1
      const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / (sliceLen * sliceLen || 1)))
      const dist = Math.hypot(f.x - (x1 + t * dx), f.y - (y1 + t * dy))
      
      if (dist < f.size / 2 + 25) {
        f.sliced = true
        slicedCount++
        this.combo++
        if (this.combo > this.maxCombo) this.maxCombo = this.combo
        
        // 计算分数（关卡倍数）
        const levelMultiplier = this.currentLevel
        const scoreMultiplier = (window as any).fruitDoubleScore && Date.now() < (window as any).fruitDoubleScore ? 2 : 1
        const points = 10 * this.combo * levelMultiplier * scoreMultiplier
        this.score += points
        
        // 播放切割音效（根据连击数变化）
        if (this.combo >= 5) {
          audioService.sliceCombo(this.combo)
        } else if (this.combo >= 3) {
          audioService.sliceCombo(this.combo)
        } else {
          audioService.slice()
        }
        
        // 创建果汁喷射效果（增强版）
        const juiceColor = f.color || '#FF6B6B'
        this.createJuiceParticles(f.x, f.y, juiceColor, 30 + this.combo * 8)
        
        // 创建切割特效
        this.createSliceEffect(x1, y1, x2, y2)
        
        // 更新关卡进度
        this.fruitsSlicedInLevel++
        
        // 显示浮动分数
        this.showFloatingText(`+${points}`, x2, y2)
        
        this.fruits.splice(i, 1)
      }
    }
    
    // 检查关卡完成
    this.checkLevelComplete()
  }
  
  private showFloatingText(text: string, x: number, y: number) {
    // 简化版本，实际可以实现更复杂的动画
  }
  
  private checkLevelComplete() {
    const config = this.LEVEL_CONFIG[this.currentLevel - 1]
    const elapsed = Date.now() - this.levelStartTime
    
    // 检查是否达到目标分数或时间到
    if (this.score >= config.targetScore || elapsed >= config.duration) {
      if (this.currentLevel < this.MAX_LEVEL) {
        // 进入下一关
        this.startLevelTransition()
      } else {
        // 游戏通关！
        this.gameWin()
      }
    }
  }
  
  private startLevelTransition() {
    this.levelTransition = true
    this.transitionAlpha = 0
    this.transitionText = `第 ${this.currentLevel + 1} 关`
    audioService.levelUp()
    
    // 过渡动画
    let fadeIn = true
    const transitionInterval = setInterval(() => {
      if (fadeIn) {
        this.transitionAlpha += 0.05
        if (this.transitionAlpha >= 1) {
          fadeIn = false
          // 切换关卡
          this.currentLevel++
          this.levelStartTime = Date.now()
          this.fruitsSlicedInLevel = 0
          this.combo = 0
          this.fruits = [] // 清空当前水果
        }
      } else {
        this.transitionAlpha -= 0.05
        if (this.transitionAlpha <= 0) {
          this.levelTransition = false
          clearInterval(transitionInterval)
        }
      }
    }, 50)
  }
  
  private gameWin() {
    this.gameEnded = true
    audioService.win()
    
    if (this.ctx) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)'
      this.ctx.fillRect(0, 0, this.W, this.H)
      
      // 胜利文字
      this.ctx.fillStyle = '#FFD700'
      this.ctx.font = 'bold 48px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('🎉 通关！', this.W / 2, this.H / 2 - 80)
      
      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 32px sans-serif'
      this.ctx.fillText(`最终分数: ${this.score}`, this.W / 2, this.H / 2 - 20)
      this.ctx.fillText(`最高连击: ${this.maxCombo}`, this.W / 2, this.H / 2 + 30)
      
      this.ctx.font = '20px sans-serif'
      this.ctx.fillText('点击重新开始', this.W / 2, this.H / 2 + 90)
      
      this.canvas!.onclick = () => {
        this.start()
      }
    }
  }
  
  private triggerRandomBuff() {
    // 随机触发道具
    const buffs = ['slow', 'magnet', 'double']
    const randomBuff = buffs[Math.floor(Math.random() * buffs.length)]
    
    if (!this.inventory.includes(randomBuff)) {
      this.inventory.push(randomBuff)
      audioService.buff()
    }
  }
  
  private usePowerup(type: string): boolean {
    const index = this.inventory.indexOf(type)
    if (index === -1) return false
    
    this.inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'slow':
        this.fruits.forEach(f => {
          f.vx *= 0.5
          f.vy *= 0.5
          f.gravity *= 0.3
        })
        audioService.slowMo()
        setTimeout(() => {
          this.fruits.forEach(f => {
            f.vx *= 2
            f.vy *= 2
            f.gravity /= 0.3
          })
        }, 8000)
        break
        
      case 'magnet':
        ;(window as any).fruitMagnet = Date.now() + 6000
        audioService.collect()
        break
        
      case 'double':
        ;(window as any).fruitDoubleScore = Date.now() + 10000
        audioService.win()
        break
        
      case 'bomb':
        let bombCount = 0
        this.fruits.forEach(f => {
          if (!f.sliced) {
            f.sliced = true
            bombCount++
            this.createJuiceParticles(f.x, f.y, f.color || '#FF4444', 15)
          }
        })
        this.score += bombCount * 10
        audioService.explosion()
        break
    }
    
    return true
  }
  
  private update() {
    // 磁铁效果
    const isMagnet = (window as any).fruitMagnet && Date.now() < (window as any).fruitMagnet
    if (isMagnet) {
      const centerX = this.W / 2
      const centerY = this.H / 2
      this.fruits.forEach(f => {
        if (!f.sliced) {
          const dx = centerX - f.x
          const dy = centerY - f.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0) {
            f.vx += (dx / dist) * 0.3
            f.vy += (dy / dist) * 0.3
          }
        }
      })
    }
    
    // 更新水果
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i]
      
      f.vy += f.gravity
      f.x += f.vx
      f.y += f.vy
      f.rotation += f.rotSpeed
      
      // 左右反弹
      if (f.x < f.size / 2) {
        f.x = f.size / 2
        f.vx = Math.abs(f.vx) * 0.8
      }
      if (f.x > this.W - f.size / 2) {
        f.x = this.W - f.size / 2
        f.vx = -Math.abs(f.vx) * 0.8
      }
      
      // 超出屏幕
      if (f.y < -f.size * 2 || f.y > this.H + f.size * 2) {
        if (!f.sliced) {
          this.missedCount++
          this.combo = 0
        }
        this.fruits.splice(i, 1)
      }
    }
    
    // 生成水果（根据关卡配置）
    const config = this.LEVEL_CONFIG[this.currentLevel - 1]
    const now = Date.now()
    if (now - this.lastSpawn > config.spawnRate && this.fruits.length < config.maxFruits) {
      this.spawnFruit()
      this.lastSpawn = now
    }
  }
  
  private draw() {
    if (!this.ctx) return
    
    // 屏幕震动效果
    let shakeX = 0
    let shakeY = 0
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake
      shakeY = (Math.random() - 0.5) * this.screenShake
      this.screenShake *= 0.9 // 震动衰减
      if (this.screenShake < 0.5) this.screenShake = 0
    }
    
    this.ctx.save()
    this.ctx.translate(shakeX, shakeY)
    
    // 背景渐变
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.H)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.W, this.H)
    
    // 绘制切割轨迹
    this.slices.forEach((s, i) => {
      s.life -= 0.06
      if (s.life <= 0) {
        this.slices.splice(i, 1)
        return
      }
      
      this.ctx!.lineCap = 'round'
      this.ctx!.lineWidth = 14 * s.life
      this.ctx!.strokeStyle = `rgba(255,100,100,${s.life * 0.5})`
      this.ctx!.beginPath()
      this.ctx!.moveTo(s.x1, s.y1)
      this.ctx!.lineTo(s.x2, s.y2)
      this.ctx!.stroke()
      
      this.ctx!.lineWidth = 4 * s.life
      this.ctx!.strokeStyle = `rgba(255,255,255,${s.life})`
      this.ctx!.stroke()
    })
    
    // 绘制水果
    this.fruits.forEach(f => {
      if (f.sliced) return
      
      this.ctx!.save()
      this.ctx!.translate(f.x, f.y)
      this.ctx!.rotate(f.rotation)
      this.ctx!.shadowColor = 'rgba(0,0,0,0.4)'
      this.ctx!.shadowBlur = 8
      this.ctx!.shadowOffsetY = 4
      this.ctx!.font = `${f.size}px sans-serif`
      this.ctx!.textAlign = 'center'
      this.ctx!.textBaseline = 'middle'
      this.ctx!.fillText(f.emoji, 0, 0)
      this.ctx!.restore()
    })
    
    // 绘制粒子
    this.particles.forEach((p, i) => {
      p.life -= p.type === 'juice' ? 0.02 : 0.03
      p.x += p.vx
      p.y += p.vy
      p.vy += p.type === 'juice' ? 0.2 : 0.3
      
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        return
      }
      
      this.ctx!.globalAlpha = p.life
      this.ctx!.fillStyle = p.color
      
      if (p.type === 'juice') {
        // 果汁粒子使用圆形
        this.ctx!.beginPath()
        this.ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        this.ctx!.fill()
      } else if (p.type === 'sparkle') {
        // 闪光粒子使用星形
        this.drawStar(p.x, p.y, 5, p.size * p.life, p.size * p.life * 0.5)
      } else {
        // 切割粒子使用小圆点
        this.ctx!.beginPath()
        this.ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        this.ctx!.fill()
      }
      
      this.ctx!.globalAlpha = 1
    })
    
    // 绘制UI
    this.drawUI()
    
    // 关卡过渡效果
    if (this.levelTransition) {
      this.ctx.fillStyle = `rgba(0,0,0,${this.transitionAlpha * 0.8})`
      this.ctx.fillRect(0, 0, this.W, this.H)
      
      this.ctx.fillStyle = '#FFD700'
      this.ctx.font = 'bold 56px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.globalAlpha = this.transitionAlpha
      this.ctx.fillText(this.transitionText, this.W / 2, this.H / 2)
      
      this.ctx.font = '24px sans-serif'
      this.ctx.fillStyle = '#fff'
      this.ctx.fillText('准备开始！', this.W / 2, this.H / 2 + 50)
      this.ctx.globalAlpha = 1
    }
    
    this.ctx.restore()
  }
  
  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    if (!this.ctx) return
    
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes
    
    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy - outerRadius)
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      this.ctx.lineTo(x, y)
      rot += step
      
      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      this.ctx.lineTo(x, y)
      rot += step
    }
    
    this.ctx.lineTo(cx, cy - outerRadius)
    this.ctx.closePath()
    this.ctx.fill()
  }
  
  private drawUI() {
    if (!this.ctx) return
    
    // 关卡显示
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 28px sans-serif'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`第 ${this.currentLevel} 关`, 15, 35)
    
    // 分数
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 38px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(String(this.score), this.W / 2, 55)
    
    // 连击
    if (this.combo >= 2) {
      const comboColor = this.combo >= 10 ? '#FF0000' : this.combo >= 5 ? '#FF6B6B' : '#FFA500'
      this.ctx.fillStyle = comboColor
      this.ctx.font = `bold ${26 + this.combo}px sans-serif`
      this.ctx.fillText(`${this.combo} 连击!`, this.W / 2, 100)
      
      // 高连击特效
      if (this.combo >= 5) {
        this.ctx.shadowColor = comboColor
        this.ctx.shadowBlur = 20
        this.ctx.fillText(`${this.combo} 连击!`, this.W / 2, 100)
        this.ctx.shadowBlur = 0
      }
    }
    
    // 漏掉计数
    if (this.missedCount > 0) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)'
      this.ctx.font = 'bold 18px sans-serif'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(`漏:${this.missedCount}`, 15, 70)
    }
    
    // 时间（关卡剩余）
    const config = this.LEVEL_CONFIG[this.currentLevel - 1]
    const elapsed = Date.now() - this.levelStartTime
    const remaining = Math.max(0, config.duration - elapsed)
    const seconds = Math.ceil(remaining / 1000)
    
    this.ctx.fillStyle = seconds <= 5 ? '#FF4444' : '#fff'
    this.ctx.font = 'bold 24px sans-serif'
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`${seconds}s`, this.W - 15, 50)
    
    // 目标分数进度
    const progress = Math.min(1, this.score / config.targetScore)
    this.ctx.fillStyle = 'rgba(255,255,255,0.2)'
    this.ctx.fillRect(15, this.H - 80, this.W - 30, 10)
    this.ctx.fillStyle = progress >= 1 ? '#00FF00' : '#FFD700'
    this.ctx.fillRect(15, this.H - 80, (this.W - 30) * progress, 10)
    
    // 提示
    this.ctx.fillStyle = 'rgba(255,255,255,0.4)'
    this.ctx.font = '16px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('👆 快速滑动切割水果!', this.W / 2, this.H - 25)
    
    // 道具栏
    if (this.inventory.length > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)'
      this.ctx.fillRect(10, this.H - 110, this.W - 20, 25)
      
      this.inventory.forEach((powerup, index) => {
        const icon = this.powerupIcons[powerup]
        this.ctx!.font = '18px sans-serif'
        this.ctx!.textAlign = 'left'
        this.ctx!.fillText(icon, 20 + index * 30, this.H - 92)
      })
    }
  }
  
  private loop() {
    if (!this.canvas || this.gameEnded) return
    
    const now = Date.now()
    const config = this.LEVEL_CONFIG[this.currentLevel - 1]
    const elapsed = now - this.levelStartTime
    
    // 检查关卡时间是否结束
    if (elapsed >= config.duration && !this.levelTransition) {
      if (this.currentLevel < this.MAX_LEVEL) {
        this.startLevelTransition()
      } else {
        this.gameWin()
      }
      return
    }
    
    this.update()
    this.draw()
    requestAnimationFrame(() => this.loop())
  }
  
  private start() {
    this.currentLevel = 1
    this.levelStartTime = Date.now()
    this.gameStartTime = Date.now()
    this.gameEnded = false
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.missedCount = 0
    this.fruitsSlicedInLevel = 0
    this.fruits = []
    this.particles = []
    this.slices = []
    this.inventory = []
    this.screenShake = 0
    this.levelTransition = false
    
    // 生成初始水果
    this.spawnFruit()
    setTimeout(() => this.spawnFruit(), 400)
    setTimeout(() => this.spawnFruit(), 800)
    
    // 启动游戏循环
    this.loop()
  }
  
  // 公共方法
  public getScore(): number {
    return this.score
  }
  
  public pause() {
    // 暂停游戏逻辑
  }
  
  public resume() {
    // 恢复游戏
  }
}
