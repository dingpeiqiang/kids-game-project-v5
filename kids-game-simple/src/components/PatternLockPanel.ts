/**
 * PatternLockPanel.ts — 图案解锁面板组件
 * 
 * 3x3网格图案解锁界面，支持触摸和鼠标操作
 */

export interface PatternLockOptions {
  title?: string
  subtitle?: string
  confirmText?: string
  cancelText?: string
  showReset?: boolean
  minPoints?: number
  maxPoints?: number
}

export interface PatternLockResult {
  ok: boolean
  pattern?: string
}

export class PatternLockPanel {
  private el: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private points: { x: number; y: number; id: number }[] = []
  private selected: number[] = []
  private isDrawing = false
  private onComplete?: (result: PatternLockResult) => void
  private options: PatternLockOptions

  private readonly DOT_RADIUS = 24
  private readonly LINE_WIDTH = 6

  constructor(options: PatternLockOptions = {}) {
    this.options = {
      title: '绘制图案',
      subtitle: '请连接至少3个点绘制解锁图案',
      confirmText: '确认',
      cancelText: '取消',
      showReset: true,
      minPoints: 3,
      maxPoints: 9,
      ...options,
    }
  }

  open(onComplete?: (result: PatternLockResult) => void) {
    this.onComplete = onComplete
    if (!this.el) this.mount()
    this.reset()
    this.el!.classList.add('show')
    this.draw()
  }

  close() {
    this.el?.classList.remove('show')
  }

  reset() {
    this.selected = []
    this.isDrawing = false
    this.draw()
  }

  private mount() {
    // 创建主容器
    this.el = document.createElement('div')
    this.el.className = 'pl-overlay'
    this.el.id = 'pl-overlay'
    document.body.appendChild(this.el)

    // 点击背景关闭
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) {
        this.handleCancel()
      }
    })

    // 创建内容
    this.el.innerHTML = `
      <div class="pl-container">
        <div class="pl-header">
          <div class="pl-title">${this.options.title}</div>
          <div class="pl-subtitle">${this.options.subtitle}</div>
          <div class="pl-close" id="pl-close">✕</div>
        </div>
        
        <div class="pl-canvas-wrap">
          <canvas id="pl-canvas"></canvas>
        </div>
        
        <div class="pl-info" id="pl-info"></div>
        
        <div class="pl-actions">
          ${this.options.showReset ? `
            <button class="pl-btn pl-btn-secondary" id="pl-reset">重新绘制</button>
          ` : ''}
          <button class="pl-btn pl-btn-primary" id="pl-confirm" disabled>
            ${this.options.confirmText}
          </button>
        </div>
      </div>
    `

    // 获取canvas
    this.canvas = document.getElementById('pl-canvas') as HTMLCanvasElement
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d')
      this.resizeCanvas()
      this.initPoints()
    }

    // 绑定事件
    document.getElementById('pl-close')?.addEventListener('click', () => this.handleCancel())
    document.getElementById('pl-reset')?.addEventListener('click', () => this.reset())
    document.getElementById('pl-confirm')?.addEventListener('click', () => this.handleConfirm())

    // 绑定canvas事件
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e))
      this.canvas.addEventListener('mousemove', (e) => this.drawPattern(e))
      this.canvas.addEventListener('mouseup', () => this.stopDrawing())
      this.canvas.addEventListener('mouseleave', () => this.stopDrawing())

      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault()
        this.startDrawing(e)
      })
      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault()
        this.drawPattern(e)
      })
      this.canvas.addEventListener('touchend', () => this.stopDrawing())
    }

    // 窗口resize时重绘
    window.addEventListener('resize', () => {
      this.resizeCanvas()
      this.initPoints()
      this.draw()
    })
  }

  private resizeCanvas() {
    if (!this.canvas) return
    const wrap = this.canvas.parentElement
    if (!wrap) return

    const size = Math.min(wrap.clientWidth - 40, 300)
    this.canvas.width = size
    this.canvas.height = size
  }

  private initPoints() {
    if (!this.canvas) return
    const size = this.canvas.width
    const gap = size / 4 // 分成4份，3个点之间有4个间隔

    this.points = []
    let id = 0
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        this.points.push({
          x: gap * (col + 1),
          y: gap * (row + 1),
          id: id++,
        })
      }
    }
  }

  private startDrawing(e: MouseEvent | TouchEvent) {
    this.isDrawing = true
    const pos = this.getEventPos(e)
    const point = this.getNearestPoint(pos.x, pos.y)
    if (point !== null && !this.selected.includes(point)) {
      this.selected.push(point)
    }
    this.draw()
  }

  private drawPattern(e: MouseEvent | TouchEvent) {
    if (!this.isDrawing || this.selected.length === 0) return
    
    const pos = this.getEventPos(e)
    const point = this.getNearestPoint(pos.x, pos.y)
    
    if (point !== null && !this.selected.includes(point)) {
      // 检查是否可以跳过中间点
      const lastPoint = this.selected[this.selected.length - 1]
      const midPoint = this.getMiddlePoint(lastPoint, point)
      if (midPoint !== null && !this.selected.includes(midPoint)) {
        this.selected.push(midPoint)
      }
      this.selected.push(point)
    }
    this.draw(pos.x, pos.y)
  }

  private stopDrawing() {
    this.isDrawing = false
    this.draw()
    this.updateConfirmButton()
  }

  private getEventPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 }
    
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    } else if ('clientX' in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
    return { x: 0, y: 0 }
  }

  private getNearestPoint(x: number, y: number): number | null {
    const threshold = this.DOT_RADIUS * 1.5
    
    for (const point of this.points) {
      const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      if (dist < threshold) {
        return point.id
      }
    }
    return null
  }

  private getMiddlePoint(p1: number, p2: number): number | null {
    // 获取两个点的坐标
    const pt1 = this.points.find(p => p.id === p1)
    const pt2 = this.points.find(p => p.id === p2)
    if (!pt1 || !pt2) return null

    // 检查是否在同一行或同一列
    const sameRow = Math.floor(p1 / 3) === Math.floor(p2 / 3)
    const sameCol = p1 % 3 === p2 % 3
    
    // 检查是否是对角线
    const rowDiff = Math.abs(Math.floor(p1 / 3) - Math.floor(p2 / 3))
    const colDiff = Math.abs(p1 % 3 - p2 % 3)
    const isDiagonal = rowDiff === 2 && colDiff === 2

    if ((sameRow || sameCol) && Math.abs(p1 - p2) === 2) {
      // 同一行或列且间隔一个点
      return (p1 + p2) / 2
    } else if (isDiagonal) {
      // 对角线且间隔一个点（如0和8，中间是4）
      return (p1 + p2) / 2
    }
    
    return null
  }

  private draw(cursorX?: number, cursorY?: number) {
    if (!this.ctx || !this.canvas) return
    
    const ctx = this.ctx
    const size = this.canvas.width
    
    // 清空画布
    ctx.clearRect(0, 0, size, size)
    
    // 绘制网格背景
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i <= 2; i++) {
      const pos = (size / 4) * (i + 1)
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, size)
      ctx.moveTo(0, pos)
      ctx.lineTo(size, pos)
    }
    ctx.stroke()
    
    // 绘制连接线
    if (this.selected.length > 1) {
      ctx.beginPath()
      ctx.strokeStyle = '#5b9bd5'
      ctx.lineWidth = this.LINE_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      let firstPoint = this.points.find(p => p.id === this.selected[0])
      if (firstPoint) {
        ctx.moveTo(firstPoint.x, firstPoint.y)
        
        for (let i = 1; i < this.selected.length; i++) {
          const point = this.points.find(p => p.id === this.selected[i])
          if (point) {
            ctx.lineTo(point.x, point.y)
          }
        }
        
        // 如果正在绘制，连接到当前光标位置
        if (this.isDrawing && cursorX !== undefined && cursorY !== undefined) {
          ctx.lineTo(cursorX, cursorY)
        }
      }
      ctx.stroke()
    }
    
    // 绘制圆点
    for (const point of this.points) {
      const isSelected = this.selected.includes(point.id)
      
      // 外圆
      ctx.beginPath()
      ctx.arc(point.x, point.y, this.DOT_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = isSelected ? '#5b9bd5' : '#fff'
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#5b9bd5' : '#ccc'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()
      
      // 内圆（选中时）
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, this.DOT_RADIUS / 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
      }
    }
    
    // 绘制选中序号
    for (let i = 0; i < this.selected.length; i++) {
      const point = this.points.find(p => p.id === this.selected[i])
      if (point) {
        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText((i + 1).toString(), point.x, point.y)
      }
    }
  }

  private updateConfirmButton() {
    const btn = document.getElementById('pl-confirm') as HTMLButtonElement
    const info = document.getElementById('pl-info')
    
    if (this.selected.length < (this.options.minPoints || 3)) {
      btn.disabled = true
      info!.textContent = `至少连接${this.options.minPoints}个点`
      info!.className = 'pl-info pl-info-warning'
    } else if (this.selected.length > (this.options.maxPoints || 9)) {
      btn.disabled = true
      info!.textContent = `最多连接${this.options.maxPoints}个点`
      info!.className = 'pl-info pl-info-warning'
    } else {
      btn.disabled = false
      info!.textContent = `已连接 ${this.selected.length} 个点`
      info!.className = 'pl-info pl-info-success'
    }
  }

  private handleConfirm() {
    if (this.selected.length < (this.options.minPoints || 3)) return
    
    const pattern = this.selected.join('')
    this.close()
    this.onComplete?.({ ok: true, pattern })
  }

  private handleCancel() {
    this.close()
    this.onComplete?.({ ok: false })
  }

  // ── 静态方法：显示设置图案弹窗 ──────────────
  static async showSetPattern(title?: string): Promise<PatternLockResult> {
    return new Promise((resolve) => {
      const panel = new PatternLockPanel({
        title: title || '设置图案解锁',
        subtitle: '请绘制您的解锁图案（至少连接3个点）',
      })
      panel.open(resolve)
    })
  }

  // ── 静态方法：显示验证图案弹窗 ──────────────
  static async showVerifyPattern(title?: string): Promise<PatternLockResult> {
    return new Promise((resolve) => {
      const panel = new PatternLockPanel({
        title: title || '图案解锁',
        subtitle: '请绘制解锁图案',
        showReset: true,
      })
      panel.open(resolve)
    })
  }
}

// 注入CSS样式
export function injectPatternLockStyles() {
  if (document.getElementById('pl-styles')) return
  
  const style = document.createElement('style')
  style.id = 'pl-styles'
  style.textContent = `
/* ===== 图案解锁面板 ===== */
.pl-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1001;
  display:none;align-items:center;justify-content:center;backdrop-filter:blur(8px)}
.pl-overlay.show{display:flex}

.pl-container{background:#fff;border-radius:24px;width:min(340px,90vw);padding:24px;
  box-shadow:0 20px 60px rgba(0,0,0,0.25);animation:plSlideUp 0.3s ease}

.pl-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px}
.pl-title{font-size:20px;font-weight:700;color:#333}
.pl-subtitle{font-size:13px;color:#888;margin-top:4px}
.pl-close{width:30px;height:30px;border-radius:50%;background:#f5f5f5;display:flex;
  align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#888}

.pl-canvas-wrap{display:flex;justify-content:center;padding:20px 0;background:#fafafa;
  border-radius:16px;margin-bottom:16px}
#pl-canvas{cursor:pointer}

.pl-info{text-align:center;font-size:13px;padding:8px;border-radius:8px;margin-bottom:16px}
.pl-info-warning{background:#fff3e0;color:#e65100}
.pl-info-success{background:#e8f5e9;color:#2e7d32}

.pl-actions{display:flex;gap:10px}
.pl-btn{flex:1;border:none;outline:none;border-radius:12px;padding:13px;font-size:15px;
  font-weight:600;cursor:pointer;transition:all 0.15s}
.pl-btn:active{transform:scale(0.97)}
.pl-btn-primary{background:#5b9bd5;color:#fff}
.pl-btn-primary:hover{background:#4a8ac4}
.pl-btn-primary:disabled{background:#ccc;cursor:not-allowed}
.pl-btn-secondary{background:#f5f5f5;color:#666}
.pl-btn-secondary:hover{background:#eee}

@keyframes plSlideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
  `
  document.head.appendChild(style)
}
