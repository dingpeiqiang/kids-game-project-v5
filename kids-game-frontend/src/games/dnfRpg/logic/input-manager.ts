/**
 * 输入管理器：选角/结算 tap + 键盘；对局内战斗输入由 platform `joystick_action` 驱动（见 game.ts）。
 */

import * as C from '../config'
import type { InputState } from '../types'
import { applyCanvasMobileStyles } from '@shell/utils/canvasMobileUtils'

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
  /** 兼容 touch-ui 类型；platform 模式下由 overlay 绘制，不再读 pressed */
  readonly touchButtons: TouchButtonState[]
  readonly touchActions: Map<number, string>
  readonly joystick: JoystickState

  private canvas: HTMLCanvasElement
  private callbacks: InputManagerCallbacks
  private joystickRadius = 50
  /** 对局内 true：不注册手写摇杆/按钮 touch */
  private platformCombat = false

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
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      skill1: false,
      skill2: false,
      skill3: false,
      skill4: false,
      dash: false,
      interact: false,
      stickX: 0,
      stickY: 0,
    }

    const btnBaseX = C.LEFT_PANEL_WIDTH + C.CANVAS_WIDTH - 100
    const btnBaseY = C.CANVAS_HEIGHT - 120

    this.touchButtons = [
      { id: 'attack', x: btnBaseX, y: btnBaseY + 10, width: 74, height: 74, label: 'A', pressed: false },
      { id: 'jump', x: btnBaseX - 60, y: btnBaseY + 45, width: 56, height: 56, label: 'J', pressed: false },
      { id: 'skill1', x: btnBaseX - 60, y: btnBaseY - 45, width: 56, height: 56, label: 'S1', pressed: false },
      { id: 'skill2', x: btnBaseX + 10, y: btnBaseY - 50, width: 56, height: 56, label: 'S2', pressed: false },
    ]

    this.touchActions = new Map()
    this.joystick = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    }
  }

  /** 在 bindGameCanvasControls 之后调用 */
  enablePlatformCombat(): void {
    this.platformCombat = true
  }

  applyPlatformMove(stickX: number, _stickY: number): void {
    if (this.callbacks.getInCharSelect()) return
    const sx = stickX
    this.input.stickX = sx
    this.input.stickY = 0
    this.input.left = sx < -0.3
    this.input.right = sx > 0.3
    this.joystick.active = Math.abs(sx) > 0.08
  }

  applyPlatformButton(id: string, down: boolean): void {
    if (this.callbacks.getInCharSelect()) return
    this.setInput(id, down)
    const btn = this.touchButtons.find(b => b.id === id)
    if (btn) btn.pressed = down
  }

  /** 画布逻辑坐标（与 bindGameCanvasControls payload 一致） */
  onCharSelectPointer(logicX: number, logicY: number): void {
    if (!this.callbacks.getInCharSelect()) return
    const idx = this.getCardIndexAt(logicX, logicY)
    if (idx >= 0) this.callbacks.onSelectClassByIndex(idx)
  }

  onCharSelectHover(logicX: number, logicY: number): void {
    if (!this.callbacks.getInCharSelect()) return
    this.callbacks.setHoveredClassIndex(this.getCardIndexAt(logicX, logicY))
  }

  onOverlayPointer(): void {
    if (this.callbacks.getGameOver() || this.callbacks.getVictory()) {
      this.callbacks.onEnd()
    }
  }

  setup(): void {
    const canvas = this.canvas
    const callbacks = this.callbacks

    this.keydownHandler = (e: KeyboardEvent) => {
      if (callbacks.getInCharSelect()) {
        if (e.key === '1') {
          callbacks.onSelectClass('swordsman')
          return
        }
        if (e.key === '2') {
          callbacks.onSelectClass('fighter')
          return
        }
        if (e.key === '3') {
          callbacks.onSelectClass('archer')
          return
        }
        if (e.key === '4') {
          callbacks.onSelectClass('mage')
          return
        }
        if (e.key === '5') {
          callbacks.onSelectClass('gunner')
          return
        }
        return
      }
      if (callbacks.getGameOver() || callbacks.getVictory()) {
        if (e.key === 'Enter' || e.key === ' ') {
          callbacks.onEnd()
        }
        return
      }
      if (this.platformCombat) return

      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = true
      if (e.key === 'ArrowUp' || e.key === 'w') this.input.up = true
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
      if (this.platformCombat && !callbacks.getInCharSelect()) return
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = false
      if (e.key === 'ArrowUp' || e.key === 'w') this.input.up = false
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

    if (this.platformCombat) {
      this.boundMouseMove = (e: MouseEvent) => {
        if (!callbacks.getInCharSelect()) return
        const { mx, my } = this.clientToLogic(e.clientX, e.clientY)
        this.onCharSelectHover(mx, my)
      }
      canvas.addEventListener('mousemove', this.boundMouseMove)
      return
    }

    this.boundTouchStart = e => this.onTouchStart(e)
    this.boundTouchMove = e => this.onTouchMove(e)
    this.boundTouchEnd = e => this.onTouchEnd(e)
    this.boundMouseDown = e => this.onMouseDown(e)
    this.boundMouseUp = e => this.onMouseUp(e)
    this.boundMouseMove = e => this.onMouseMove(e)

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

  private clientToLogic(clientX: number, clientY: number): { mx: number; my: number } {
    const rect = this.canvas.getBoundingClientRect()
    const mx = (clientX - rect.left) * (this.canvas.width / rect.width)
    const my = (clientY - rect.top) * (this.canvas.height / rect.height)
    return { mx, my }
  }

  private getCardIndexAt(mx: number, my: number): number {
    const cardW = 110
    const cardH = 210
    const gap = 12
    const cols = 5
    const totalCardsW = cols * cardW + (cols - 1) * gap
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
    const { mx, my } = this.clientToLogic(e.clientX, e.clientY)
    if (this.callbacks.getInCharSelect()) {
      this.onCharSelectPointer(mx, my)
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
    const { mx, my } = this.clientToLogic(e.clientX, e.clientY)
    this.onCharSelectHover(mx, my)
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault()
    const t = e.changedTouches[0]
    const { tx, ty } = this.getTouchPos(t)
    if (this.callbacks.getInCharSelect()) {
      this.onCharSelectPointer(tx, ty)
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
          this.joystick.active = false
          this.joystick.startX = 0
          this.joystick.startY = 0
          this.joystick.currentX = 0
          this.joystick.currentY = 0
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

    const isMobile = C.isMobileDevice()
    const joyCenterX = isMobile ? C.LEFT_PANEL_WIDTH + 60 : C.LEFT_PANEL_WIDTH / 2
    const joyCenterY = isMobile ? C.CANVAS_HEIGHT - 70 : C.CANVAS_HEIGHT * 0.55
    const joyRadius = 60
    const distToJoy = Math.sqrt((tx - joyCenterX) ** 2 + (ty - joyCenterY) ** 2)

    if ((!isMobile && tx < C.LEFT_PANEL_WIDTH) || (isMobile && distToJoy < joyRadius + 30)) {
      this.joystick.active = true
      this.joystick.startX = tx
      this.joystick.startY = ty
      this.joystick.currentX = tx
      this.joystick.currentY = ty
      this.touchActions.set(id, 'joystick')
      this.updateJoystickInput()
      return
    }

    const hitBtn = this.hitTestButton(tx, ty)
    if (hitBtn) {
      hitBtn.pressed = true
      this.touchActions.set(id, hitBtn.id)
      this.setInput(hitBtn.id, true)
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
    }
    const tx = (touch.clientX - rect.left) * (C.TOTAL_WIDTH / rect.width)
    const ty = (touch.clientY - rect.top) * (C.CANVAS_HEIGHT / rect.height)
    return { tx, ty }
  }

  private hitTestButton(tx: number, ty: number): TouchButtonState | null {
    const padding = 10
    for (const btn of this.touchButtons) {
      if (
        tx >= btn.x - padding &&
        tx <= btn.x + btn.width + padding &&
        ty >= btn.y - padding &&
        ty <= btn.y + btn.height + padding
      ) {
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
      this.input.stickY = 0

      this.input.left = normalizedX < -0.3
      this.input.right = normalizedX > 0.3
    }
  }

  private setInput(action: string, value: boolean): void {
    switch (action) {
      case 'left':
        this.input.left = value
        break
      case 'right':
        this.input.right = value
        break
      case 'up':
        this.input.up = value
        break
      case 'down':
        this.input.down = value
        break
      case 'jump':
        this.input.jump = value
        break
      case 'attack':
        this.input.attack = value
        break
      case 'skill1':
        this.input.skill1 = value
        break
      case 'skill2':
        this.input.skill2 = value
        break
      case 'skill3':
        this.input.skill3 = value
        break
      case 'skill4':
        this.input.skill4 = value
        break
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