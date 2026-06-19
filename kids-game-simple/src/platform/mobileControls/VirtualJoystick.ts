/**
 * Canvas 虚拟摇杆（参考 nipplejs 行为）
 * 支持固定底座与随点隐形摇杆（dynamic）
 */

export interface JoystickConfig {
  x: number
  y: number
  radius: number
  knobRadius: number
  deadZone: number
  /** true：按下点作为底座中心（左半屏等由外层路由） */
  dynamic?: boolean
}

export interface JoystickOutput {
  x: number
  y: number
  angle: number
  magnitude: number
}

export interface JoystickState {
  active: boolean
  baseX: number
  baseY: number
  currentX: number
  currentY: number
  output: JoystickOutput
}

export class VirtualJoystick {
  private config: JoystickConfig
  private state: JoystickState
  private touchId = -1

  constructor(config: JoystickConfig) {
    this.config = config
    this.state = this.idleState()
  }

  private idleState(): JoystickState {
    return {
      active: false,
      baseX: this.config.x,
      baseY: this.config.y,
      currentX: this.config.x,
      currentY: this.config.y,
      output: { x: 0, y: 0, angle: 0, magnitude: 0 },
    }
  }

  activate(x: number, y: number, touchId: number): void {
    this.state.active = true
    this.touchId = touchId
    if (this.config.dynamic) {
      this.state.baseX = x
      this.state.baseY = y
    } else {
      this.state.baseX = this.config.x
      this.state.baseY = this.config.y
    }
    this.state.currentX = x
    this.state.currentY = y
    this.updateOutput()
  }

  update(x: number, y: number): void {
    if (!this.state.active) return
    const dx = x - this.state.baseX
    const dy = y - this.state.baseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    let limitedDx = dx
    let limitedDy = dy
    if (dist > this.config.radius) {
      const ratio = this.config.radius / dist
      limitedDx = dx * ratio
      limitedDy = dy * ratio
    }
    this.state.currentX = this.state.baseX + limitedDx
    this.state.currentY = this.state.baseY + limitedDy
    this.updateOutput()
  }

  private updateOutput(): void {
    const dx = this.state.currentX - this.state.baseX
    const dy = this.state.currentY - this.state.baseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    let nx = dx / this.config.radius
    let ny = dy / this.config.radius
    let magnitude = dist / this.config.radius
    if (magnitude < this.config.deadZone) {
      nx = 0
      ny = 0
      magnitude = 0
    } else {
      const adjustedMag = (magnitude - this.config.deadZone) / (1 - this.config.deadZone)
      nx = (nx / magnitude) * adjustedMag
      ny = (ny / magnitude) * adjustedMag
      magnitude = adjustedMag
    }
    const angle = Math.atan2(ny, nx) * (180 / Math.PI)
    this.state.output = { x: nx, y: ny, angle, magnitude }
  }

  getActiveTouchId(): number {
    return this.touchId
  }

  deactivate(touchId?: number): void {
    if (touchId !== undefined && touchId !== this.touchId) return
    this.state.active = false
    this.touchId = -1
    this.state.currentX = this.config.x
    this.state.currentY = this.config.y
    this.state.baseX = this.config.x
    this.state.baseY = this.config.y
    this.state.output = { x: 0, y: 0, angle: 0, magnitude: 0 }
  }

  getState(): JoystickState {
    return this.state
  }

  containsPoint(x: number, y: number): boolean {
    const dx = x - this.config.x
    const dy = y - this.config.y
    return Math.sqrt(dx * dx + dy * dy) <= this.config.radius
  }

  draw(ctx: CanvasRenderingContext2D, options?: { showIdleHint?: boolean }): void {
    const showIdle = options?.showIdleHint ?? !this.config.dynamic
    const { baseX, baseY, currentX, currentY, active } = this.state
    const { radius, knobRadius } = this.config

    if (active) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(78, 205, 196, 0.25)'
      ctx.beginPath()
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#4ECDC4'
      ctx.beginPath()
      ctx.arc(currentX, currentY, knobRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(baseX, baseY)
      ctx.lineTo(currentX, currentY)
      ctx.stroke()
      return
    }

    if (!showIdle) return

    ctx.save()
    ctx.strokeStyle = '#4ECDC4'
    ctx.lineWidth = 2.5
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(78, 205, 196, 0.12)'
    ctx.beginPath()
    ctx.arc(baseX, baseY, radius - 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(baseX, baseY, knobRadius * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}