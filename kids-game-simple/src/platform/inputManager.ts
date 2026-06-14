/**
 * 全局输入：Esc / 壳层返回·暂停 与游戏内 pointer 解耦入口
 */
import { eventBus } from './eventBus'
import { GameEvents } from './gameEvents'

export type ShellInputMode = 'default' | 'hidePlatformPause'

export interface InputManagerOptions {
  shellMode?: ShellInputMode
  onShellBack?: () => void
  onShellPause?: () => void
  onShellEscape?: () => void
}

class InputManager {
  private keyHandler: ((e: KeyboardEvent) => void) | null = null
  private active = false
  private opts: InputManagerOptions = {}

  start(options: InputManagerOptions = {}): void {
    this.stop()
    this.opts = options
    this.active = true
    this.keyHandler = e => this.onKeyDown(e)
    window.addEventListener('keydown', this.keyHandler)
  }

  stop(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler)
      this.keyHandler = null
    }
    this.active = false
  }

  isActive(): boolean {
    return this.active
  }

  /** 壳层按钮调用 */
  notifyBack(): void {
    eventBus.emit(GameEvents.SHELL_BACK, {})
    this.opts.onShellBack?.()
  }

  notifyPause(): void {
    eventBus.emit(GameEvents.SHELL_PAUSE, {})
    this.opts.onShellPause?.()
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.active || e.key !== 'Escape') return
    const layer = document.getElementById('game-layer')
    if (!layer?.classList.contains('show')) return
    e.preventDefault()
    this.opts.onShellEscape?.()
  }
}

export const inputManager = new InputManager()