import type { InputState } from '../types'
import { CONTROLS } from '../config'

export function createInputState(): InputState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    skill: false,
    interact: false,
    reset: false,
    zoomIn: false,
    zoomOut: false,
  }
}

export class InputManager {
  private inputState: InputState
  private keyMap: Map<string, keyof InputState> = new Map()
  private touchStartX = 0
  private touchStartY = 0
  private isJoystickActive = false
  private joystickThreshold = 30

  constructor() {
    this.inputState = createInputState()
    this.setupKeyMap()
    this.setupEventListeners()
  }

  private setupKeyMap(): void {
    CONTROLS.keyboard.up.forEach(key => this.keyMap.set(key, 'up'))
    CONTROLS.keyboard.down.forEach(key => this.keyMap.set(key, 'down'))
    CONTROLS.keyboard.left.forEach(key => this.keyMap.set(key, 'left'))
    CONTROLS.keyboard.right.forEach(key => this.keyMap.set(key, 'right'))
    CONTROLS.keyboard.zoomIn.forEach(key => this.keyMap.set(key, 'zoomIn'))
    CONTROLS.keyboard.zoomOut.forEach(key => this.keyMap.set(key, 'zoomOut'))
    CONTROLS.keyboard.interact.forEach(key => this.keyMap.set(key, 'interact'))
    CONTROLS.keyboard.reset.forEach(key => this.keyMap.set(key, 'reset'))
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    window.addEventListener('mousedown', this.handleMouseDown.bind(this))
    window.addEventListener('mouseup', this.handleMouseUp.bind(this))
    window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    window.addEventListener('touchend', this.handleTouchEnd.bind(this))
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const action = this.keyMap.get(e.code)
    if (action) {
      this.inputState[action] = true
      if (action === 'skill') {
        this.inputState.skill = true
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const action = this.keyMap.get(e.code)
    if (action) {
      this.inputState[action] = false
      if (action === 'skill') {
        this.inputState.skill = false
      }
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    this.inputState.attack = true
  }

  private handleMouseUp(e: MouseEvent): void {
    this.inputState.attack = false
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    
    this.touchStartX = touch.clientX - rect.left
    this.touchStartY = touch.clientY - rect.top

    const canvasWidth = rect.width
    const canvasHeight = rect.height

    if (this.touchStartX < canvasWidth * 0.3) {
      this.isJoystickActive = true
    } else if (this.touchStartX > canvasWidth * 0.7) {
      if (this.touchStartY < canvasHeight * 0.4) {
        this.inputState.attack = true
      } else if (this.touchStartY > canvasHeight * 0.4 && this.touchStartY < canvasHeight * 0.6) {
        this.inputState.skill = true
      } else if (this.touchStartY > canvasHeight * 0.6) {
        this.inputState.interact = true
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault()
    if (!this.isJoystickActive) return

    const touch = e.touches[0]
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const currentX = touch.clientX - rect.left
    const currentY = touch.clientY - rect.top

    const dx = currentX - this.touchStartX
    const dy = currentY - this.touchStartY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > this.joystickThreshold) {
      const angle = Math.atan2(dy, dx)
      const threshold = Math.PI / 4

      this.inputState.up = angle > -threshold && angle < threshold
      this.inputState.down = angle > Math.PI - threshold || angle < -Math.PI + threshold
      this.inputState.left = angle > threshold && angle < Math.PI - threshold
      this.inputState.right = angle < -threshold && angle > -Math.PI + threshold
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.isJoystickActive = false
    this.inputState.up = false
    this.inputState.down = false
    this.inputState.left = false
    this.inputState.right = false
    this.inputState.attack = false
    this.inputState.skill = false
    this.inputState.interact = false
  }

  getState(): InputState {
    return { ...this.inputState }
  }

  reset(): void {
    this.inputState = createInputState()
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    window.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    window.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    window.removeEventListener('touchend', this.handleTouchEnd.bind(this))
  }
}