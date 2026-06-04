// 虚拟摇杆模块 - 参考开源实现
// 设计参考: https://github.com/yoannmoinet/nipplejs

export interface JoystickConfig {
  x: number           // 摇杆底座X位置
  y: number           // 摇杆底座Y位置  
  radius: number      // 摇杆外圈半径
  knobRadius: number  // 摇杆钮半径
  deadZone: number    // 死区比例 (0-1)
}

export interface JoystickOutput {
  x: number  // -1 到 1 (左右)
  y: number  // -1 到 1 (上下)
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
  private touchId: number = -1

  constructor(config: JoystickConfig) {
    this.config = config
    this.state = {
      active: false,
      baseX: config.x,
      baseY: config.y,
      currentX: config.x,
      currentY: config.y,
      output: { x: 0, y: 0, angle: 0, magnitude: 0 }
    }
  }

  // 激活摇杆
  activate(x: number, y: number, touchId: number): void {
    this.state.active = true
    this.touchId = touchId
    this.state.baseX = this.config.x
    this.state.baseY = this.config.y
    this.state.currentX = x
    this.state.currentY = y
    this.updateOutput()
  }

  // 更新摇杆位置
  update(x: number, y: number): void {
    if (!this.state.active) return

    // 计算偏移
    const dx = x - this.state.baseX
    const dy = y - this.state.baseY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 限制在半径范围内
    let limitedDx = dx
    let limitedDy = dy
    if (dist > this.config.radius) {
      const ratio = this.config.radius / dist
      limitedDx = dx * ratio
      limitedDy = dy * ratio
    }

    // 更新当前位置
    this.state.currentX = this.state.baseX + limitedDx
    this.state.currentY = this.state.baseY + limitedDy

    this.updateOutput()
  }

  // 更新输出值
  private updateOutput(): void {
    const dx = this.state.currentX - this.state.baseX
    const dy = this.state.currentY - this.state.baseY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 归一化
    let nx = dx / this.config.radius
    let ny = dy / this.config.radius
    let magnitude = dist / this.config.radius

    // 死区过滤
    if (magnitude < this.config.deadZone) {
      nx = 0
      ny = 0
      magnitude = 0
    } else {
      // 死区外线性映射
      const adjustedMag = (magnitude - this.config.deadZone) / (1 - this.config.deadZone)
      nx = (nx / magnitude) * adjustedMag
      ny = (ny / magnitude) * adjustedMag
      magnitude = adjustedMag
    }

    // 计算角度
    const angle = Math.atan2(ny, nx) * (180 / Math.PI)

    this.state.output = {
      x: nx,
      y: ny,
      angle: angle,
      magnitude: magnitude
    }
  }

  // 释放摇杆
  deactivate(touchId?: number): void {
    if (touchId === undefined || touchId === this.touchId) {
      this.state.active = false
      this.touchId = -1
      this.state.currentX = this.config.x
      this.state.currentY = this.config.y
      this.state.output = { x: 0, y: 0, angle: 0, magnitude: 0 }
    }
  }

  // 获取状态
  getState(): JoystickState {
    return this.state
  }

  // 绘制摇杆
  draw(ctx: CanvasRenderingContext2D): void {
    const { baseX, baseY, currentX, currentY, active } = this.state
    const { radius, knobRadius } = this.config

    if (active) {
      // 激活状态
      // 底座圆环
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
      ctx.stroke()

      // 底座填充
      ctx.fillStyle = 'rgba(78, 205, 196, 0.25)'
      ctx.beginPath()
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
      ctx.fill()

      // 摇杆钮
      ctx.fillStyle = '#4ECDC4'
      ctx.beginPath()
      ctx.arc(currentX, currentY, knobRadius, 0, Math.PI * 2)
      ctx.fill()

      // 摇杆钮边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // 连接线
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(baseX, baseY)
      ctx.lineTo(currentX, currentY)
      ctx.stroke()
    } else {
      // 未激活状态
      ctx.save()

      // 虚线外圈
      ctx.strokeStyle = '#4ECDC4'
      ctx.lineWidth = 2.5
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // 内圈填充
      ctx.fillStyle = 'rgba(78, 205, 196, 0.12)'
      ctx.beginPath()
      ctx.arc(baseX, baseY, radius - 2, 0, Math.PI * 2)
      ctx.fill()

      // 方向标记
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.font = `bold ${Math.round(knobRadius * 0.55)}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('▲', baseX, baseY - radius * 0.5)
      ctx.fillText('▼', baseX, baseY + radius * 0.5)
      ctx.fillText('◀', baseX - radius * 0.5, baseY)
      ctx.fillText('▶', baseX + radius * 0.5, baseY)

      // 中心圆点
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.beginPath()
      ctx.arc(baseX, baseY, knobRadius * 0.6, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }

  // 检查点是否在摇杆区域内
  containsPoint(x: number, y: number): boolean {
    const dx = x - this.config.x
    const dy = y - this.config.y
    return Math.sqrt(dx * dx + dy * dy) <= this.config.radius
  }
}
