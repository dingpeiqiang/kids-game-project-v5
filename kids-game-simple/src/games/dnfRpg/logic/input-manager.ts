/**
 * 输入管理器模块
 * 负责键盘和触屏输入事件的处理
 */

import * as C from '../config'
import type { InputState } from '../types'
import { applyCanvasMobileStyles } from '../../../utils/canvasMobileUtils'

export interface TouchButtonState {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  pressed: boolean
}

export interface JoystickState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export interface InputManagerCallbacks {
  onSelectClass: (classType: 'swordsman' | 'fighter' | 'archer' | 'mage' | 'gunner') => void
  onSelectClassByIndex: (index: number) => void
  onEnd: () => void
  getInCharSelect: () => boolean
  getGameOver: () => boolean
  getVictory: () => boolean
  setHoveredClassIndex: (index: number) => void
}

export class InputManager {
  readonly input: InputState
  readonly touchButtons: TouchButtonState[]
  readonly touchActions: Map<number, string>
  readonly joystick: JoystickState

  private canvas: HTMLCanvasElement
  private callbacks: InputManagerCallbacks
  private joystickRadius = 50

  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null
  private boundTouchStart: ((e: TouchEvent) => void) | null = null
  private boundTouchMove: ((e: TouchEvent) => void) | null = null
  private boundTouchEnd: ((e: TouchEvent) => void) | null = null
  private boundMouseDown: ((e: MouseEvent) => void) | null = null
  private boundMouseUp: ((e: MouseEvent) => void) | null = null
  private boundMouseMove: ((e: MouseEvent) => void) | null = null

  constructor(canvas: HTMLCanvasElement, callbacks: InputManagerCallbacks) {
    this.canvas = canvas
    this.callbacks = callbacks

    this.input = {
      left: false, right: false, up: false, down: false,
      jump: false, attack: false, skill1: false, skill2: false, skill3: false, skill4: false,
      dash: false, interact: false,
      stickX: 0, stickY: 0,
    }

    const rightPanelLeft = C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH
    const panelCenterX = rightPanelLeft + C.RIGHT_PANEL_WIDTH / 2
    const panelCenterY = C.CANVAS_HEIGHT * 0.65

    // 按钮位置：叠加在游戏画面右下角（增大按钮尺寸，提升触控灵敏度）
    const btnBaseX = C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH - 100
    const btnBaseY = C.CANVAS_HEIGHT - 120

    this.touchButtons = [
      { id: 'attack',   x: btnBaseX,       y: btnBaseY + 10,  width: 74, height: 74, label: 'A',  pressed: false },
      { id: 'jump',     x: btnBaseX - 60,   y: btnBaseY + 45,  width: 56, height: 56, label: 'J',  pressed: false },
      { id: 'skill1',   x: btnBaseX - 60,   y: btnBaseY - 45,  width: 56, height: 56, label: 'S1', pressed: false },
      { id: 'skill2',   x: btnBaseX + 10,    y: btnBaseY - 50,  width: 56, height: 56, label: 'S2', pressed: false },
    ]

    this.touchActions = new Map()
    this.joystick = {
      active: false,
      startX: 0, startY: 0,
      currentX: 0, currentY: 0,
    }
  }

  setup(): void {
    const canvas = this.canvas
    const callbacks = this.callbacks

    this.keydownHandler = (e: KeyboardEvent) => {
      if (callbacks.getInCharSelect()) {
        if (e.key === '1') { callbacks.onSelectClass('swordsman'); return }
        if (e.key === '2') { callbacks.onSelectClass('fighter'); return }
        if (e.key === '3') { callbacks.onSelectClass('archer'); return }
        if (e.key === '4') { callbacks.onSelectClass('mage'); return }
        if (e.key === '5') { callbacks.onSelectClass('gunner'); return }
        return
      }
      if (callbacks.getGameOver() || callbacks.getVictory()) {
        if (e.key === 'Enter' || e.key === ' ') {
          callbacks.onEnd()
        }
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = true
      if (e.key === 'ArrowUp' || e.key === 'w') { 
        this.input.up = true
      }
      if (e.key === 'ArrowDown' || e.key === 's') this.input.down = true
      if (e.key === ' ') this.input.jump = true
      if (e.key === 'j') this.input.attack = true
      if (e.key === '1') this.input.skill1 = true
      if (e.key === '2') this.input.skill2 = true
      if (e.key === '3') this.input.skill3 = true
      if (e.key === '4') this.input.skill4 = true
    }
    document.addEventListener('keydown', this.keydownHandler)

    this.keyupHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = false
      if (e.key === 'ArrowUp' || e.key === 'w') {
        this.input.up = false
      }
      if (e.key === 'ArrowDown' || e.key === 's') this.input.down = false
      if (e.key === ' ') this.input.jump = false
      if (e.key === 'j') this.input.attack = false
      if (e.key === '1') this.input.skill1 = false
      if (e.key === '2') this.input.skill2 = false
      if (e.key === '3') this.input.skill3 = false
      if (e.key === '4') this.input.skill4 = false
    }
    document.addEventListener('keyup', this.keyupHandler)

    applyCanvasMobileStyles(canvas)

    this.boundTouchStart = (e) => this.onTouchStart(e)
    this.boundTouchMove = (e) => this.onTouchMove(e)
    this.boundTouchEnd = (e) => this.onTouchEnd(e)
    this.boundMouseDown = (e) => this.onMouseDown(e)
    this.boundMouseUp = (e) => this.onMouseUp(e)
    this.boundMouseMove = (e) => this.onMouseMove(e)

    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', this.boundTouchEnd, { passive: false })
    canvas.addEventListener('mousedown', this.boundMouseDown)
    canvas.addEventListener('mouseup', this.boundMouseUp)
    canvas.addEventListener('mouseleave', this.boundMouseUp)
    canvas.addEventListener('mousemove', this.boundMouseMove)
  }

  cleanup(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }
    if (this.keyupHandler) {
      document.removeEventListener('keyup', this.keyupHandler)
      this.keyupHandler = null
    }
    const canvas = this.canvas
    if (this.boundTouchStart) {
      canvas.removeEventListener('touchstart', this.boundTouchStart)
      this.boundTouchStart = null
    }
    if (this.boundTouchMove) {
      canvas.removeEventListener('touchmove', this.boundTouchMove)
      this.boundTouchMove = null
    }
    if (this.boundTouchEnd) {
      canvas.removeEventListener('touchend', this.boundTouchEnd)
      canvas.removeEventListener('touchcancel', this.boundTouchEnd)
      this.boundTouchEnd = null
    }
    if (this.boundMouseDown) {
      canvas.removeEventListener('mousedown', this.boundMouseDown)
      this.boundMouseDown = null
    }
    if (this.boundMouseUp) {
      canvas.removeEventListener('mouseup', this.boundMouseUp)
      canvas.removeEventListener('mouseleave', this.boundMouseUp)
      this.boundMouseUp = null
    }
    if (this.boundMouseMove) {
      canvas.removeEventListener('mousemove', this.boundMouseMove)
      this.boundMouseMove = null
    }
  }

  private getCardIndexAt(mx: number, my: number): number {
    const cardW = 110
    const cardH = 210
    const gap = 12
    const cols = 5
    const totalCardsW = cols * cardW + (cols - 1) * gap
    // 使用 canvas 实际宽度计算起始位置，与绘制层保持一致
    const canvasW = this.canvas.width
    const startX = (canvasW - totalCardsW) / 2
    const startY = 100

    for (let i = 0; i < cols; i++) {
      const cx = startX + i * (cardW + gap)
      const cy = startY
      if (mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH) {
        return i
      }
    }
    return -1
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.callbacks.getInCharSelect()) {
      const rect = this.canvas.getBoundingClientRect()
      // 使用 canvas 实际像素尺寸做坐标转换，避免硬编码常量不一致
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width)
      const my = (e.clientY - rect.top) * (this.canvas.height / rect.height)
      const idx = this.getCardIndexAt(mx, my)
      if (idx >= 0) this.callbacks.onSelectClassByIndex(idx)
      return
    }
    if (this.callbacks.getGameOver() || this.callbacks.getVictory()) {
      this.callbacks.onEnd()
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    this.releaseInput()
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.callbacks.getInCharSelect()) return
    const rect = this.canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width)
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height)
    this.callbacks.setHoveredClassIndex(this.getCardIndexAt(mx, my))
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault()
    if (this.callbacks.getInCharSelect()) {
      const rect = this.canvas.getBoundingClientRect()
      const t = e.changedTouches[0]
      const mx = (t.clientX - rect.left) * (this.canvas.width / rect.width)
      const my = (t.clientY - rect.top) * (this.canvas.height / rect.height)
      const idx = this.getCardIndexAt(mx, my)
      if (idx >= 0) this.callbacks.onSelectClassByIndex(idx)
      return
    }
    if (this.callbacks.getGameOver() || this.callbacks.getVictory()) {
      this.callbacks.onEnd()
      return
    }
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.handleTouch(e.changedTouches[i].identifier, e.changedTouches[i])
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.handleTouchMove(e.changedTouches[i].identifier, e.changedTouches[i])
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const id = e.changedTouches[i].identifier
      const action = this.touchActions.get(id)
      if (action) {
        if (action === 'joystick') {
          // 摇杆触摸结束，重置摇杆状态和输入
          this.joystick.active = false
          this.joystick.startX = 0
          this.joystick.startY = 0
          this.joystick.currentX = 0
          this.joystick.currentY = 0
          // 重置摇杆相关输入（DNF风格：仅水平方向）
          this.input.stickX = 0
          this.input.stickY = 0
          this.input.left = false
          this.input.right = false
        } else {
          this.setInput(action, false)
          const btn = this.touchButtons.find(b => b.id === action)
          if (btn) btn.pressed = false
        }
        this.touchActions.delete(id)
      }
    }
  }

  private handleTouch(id: number, touch: Touch): void {
    const { tx, ty } = this.getTouchPos(touch)

    // 摇杆区域：移动端左下角 / PC端左侧面板
    const isMobile = C.isMobileDevice()
    const joyCenterX = isMobile ? C.LEFT_PANEL_WIDTH + 60 : C.LEFT_PANEL_WIDTH / 2
    const joyCenterY = isMobile ? C.CANVAS_HEIGHT - 70 : C.CANVAS_HEIGHT * 0.55
    const joyRadius = 60
    const distToJoy = Math.sqrt((tx - joyCenterX) ** 2 + (ty - joyCenterY) ** 2)

    if (!isMobile && tx < C.LEFT_PANEL_WIDTH || isMobile && distToJoy < joyRadius + 30) {
      this.joystick.active = true
      this.joystick.startX = tx
      this.joystick.startY = ty
      this.joystick.currentX = tx
      this.joystick.currentY = ty
      this.touchActions.set(id, 'joystick')
      this.updateJoystickInput()
      return
    }

    // 右侧面板 - 操作按钮（使用精确命中测试）
    const hitBtn = this.hitTestButton(tx, ty)
    if (hitBtn) {
      hitBtn.pressed = true
      this.touchActions.set(id, hitBtn.id)
      this.setInput(hitBtn.id, true)
      return
    }
  }

  private handleTouchMove(id: number, touch: Touch): void {
    const action = this.touchActions.get(id)
    if (action === 'joystick') {
      const { tx, ty } = this.getTouchPos(touch)
      this.joystick.currentX = tx
      this.joystick.currentY = ty
      this.updateJoystickInput()
    }
  }

  private getTouchPos(touch: Touch): { tx: number; ty: number } {
    const rect = this.canvas.getBoundingClientRect()
    const isRotated = C.isLandscapeMode()

    if (isRotated) {
      const tx = (touch.clientY - rect.top) * (C.TOTAL_WIDTH / rect.height)
      const ty = rect.width - (touch.clientX - rect.left) * (C.CANVAS_HEIGHT / rect.width)
      return { tx, ty }
    } else {
      const tx = (touch.clientX - rect.left) * (C.TOTAL_WIDTH / rect.width)
      const ty = (touch.clientY - rect.top) * (C.CANVAS_HEIGHT / rect.height)
      return { tx, ty }
    }
  }

  private getTouchPosFromMove(touch: Touch): { tx: number; ty: number } {
    return this.getTouchPos(touch)
  }

  private hitTestButton(tx: number, ty: number): TouchButtonState | null {
    // 热区扩大 20px（触摸目标 > 视觉尺寸，提升灵敏度）
    const padding = 10
    for (const btn of this.touchButtons) {
      if (tx >= btn.x - padding && tx <= btn.x + btn.width + padding &&
          ty >= btn.y - padding && ty <= btn.y + btn.height + padding) {
        return btn
      }
    }
    return null
  }

  private updateJoystickInput(): void {
    const dx = this.joystick.currentX - this.joystick.startX
    const dy = this.joystick.currentY - this.joystick.startY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 5) {
      this.input.stickX = 0
      this.input.stickY = 0
      this.input.left = false
      this.input.right = false
    } else {
      const normalizedX = dx / distance
      const clampedDistance = Math.min(distance, this.joystickRadius)
      const magnitude = clampedDistance / this.joystickRadius

      this.input.stickX = normalizedX * magnitude
      this.input.stickY = 0 // Y轴输入不再使用

      // DNF风格操作规则：
      // - 向左/向右滑动：水平移动
      // - 跳跃：通过单独的跳跃按钮触发
      // - 上下滑动：保留但不影响移动
      this.input.left = normalizedX < -0.3
      this.input.right = normalizedX > 0.3
    }
  }

  private setInput(action: string, value: boolean): void {
    switch (action) {
      case 'left': this.input.left = value; break
      case 'right': this.input.right = value; break
      case 'up': this.input.up = value; break
      case 'down': this.input.down = value; break
      case 'jump': this.input.jump = value; break
      case 'attack': this.input.attack = value; break
      case 'skill1': this.input.skill1 = value; break
      case 'skill2': this.input.skill2 = value; break
    }
  }

  private releaseInput(): void {
    this.input.left = false
    this.input.right = false
    this.input.jump = false
    this.input.attack = false
    this.input.skill1 = false
    this.input.skill2 = false
  }
}