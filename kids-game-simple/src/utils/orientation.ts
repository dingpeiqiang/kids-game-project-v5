export interface OrientationOptions {
  onOrientationChange?: (isLandscape: boolean) => void
  forceLandscape?: boolean
}

export class OrientationManager {
  private isLandscape = false
  private isLocked = false
  private options: OrientationOptions
  private listeners: Set<(isLandscape: boolean) => void> = new Set()
  private resizeHandler: (() => void) | null = null

  constructor(options: OrientationOptions = {}) {
    this.options = options
    this.init()
  }

  private init() {
    this.detectOrientation()
    this.setupResizeListener()
    
    if (this.options.forceLandscape && !this.isLandscape) {
      this.tryLockLandscape()
    }
  }

  private detectOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight
    if (isLandscape !== this.isLandscape) {
      this.isLandscape = isLandscape
      this.notifyListeners(isLandscape)
    }
  }

  private setupResizeListener() {
    this.resizeHandler = () => this.detectOrientation()
    window.addEventListener('resize', this.resizeHandler)
  }

  private notifyListeners(isLandscape: boolean) {
    this.listeners.forEach(listener => listener(isLandscape))
    this.options.onOrientationChange?.(isLandscape)
  }

  public getIsLandscape(): boolean {
    return this.isLandscape
  }

  public addListener(listener: (isLandscape: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public async tryLockLandscape(): Promise<boolean> {
    if (!this.supportsOrientationLock()) {
      return false
    }

    try {
      await screen.orientation.lock('landscape')
      this.isLocked = true
      return true
    } catch {
      return false
    }
  }

  public async tryLockPortrait(): Promise<boolean> {
    if (!this.supportsOrientationLock()) {
      return false
    }

    try {
      await screen.orientation.lock('portrait')
      this.isLocked = true
      return true
    } catch {
      return false
    }
  }

  public unlock(): void {
    if (this.supportsOrientationLock() && this.isLocked) {
      try {
        screen.orientation.unlock()
        this.isLocked = false
      } catch {}
    }
  }

  public supportsOrientationLock(): boolean {
    return !!(screen.orientation && screen.orientation.lock)
  }

  public destroy() {
    this.unlock()
    this.listeners.clear()
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  }

  public static createForceLandscapeOverlay(onConfirm: () => void) {
    const overlay = document.createElement('div')
    overlay.id = 'orientation-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
      box-sizing: border-box;
    `

    const icon = document.createElement('div')
    icon.style.cssText = `
      font-size: 80px;
      margin-bottom: 20px;
      animation: rotateSuggest 2s ease-in-out infinite;
    `
    icon.textContent = '📱'

    const title = document.createElement('h2')
    title.style.cssText = `
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      text-align: center;
    `
    title.textContent = '请将设备旋转至横屏'

    const desc = document.createElement('p')
    desc.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      margin-bottom: 32px;
      text-align: center;
      line-height: 1.6;
    `
    desc.textContent = '游戏体验更佳，请横屏游玩'

    const btn = document.createElement('button')
    btn.style.cssText = `
      padding: 16px 48px;
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #5b9bd5, #8ec5fc);
      border: none;
      border-radius: 40px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(91, 155, 213, 0.4);
      transition: transform 0.15s, box-shadow 0.15s;
      -webkit-tap-highlight-color: transparent;
    `
    btn.textContent = '已横屏，开始游戏'
    btn.addEventListener('click', () => {
      onConfirm()
      overlay.remove()
    })

    btn.addEventListener('touchstart', () => {
      btn.style.transform = 'scale(0.96)'
    })

    btn.addEventListener('touchend', () => {
      btn.style.transform = 'scale(1)'
    })

    const style = document.createElement('style')
    style.textContent = `
      @keyframes rotateSuggest {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-15deg); }
        75% { transform: rotate(15deg); }
      }
    `

    overlay.appendChild(style)
    overlay.appendChild(icon)
    overlay.appendChild(title)
    overlay.appendChild(desc)
    overlay.appendChild(btn)

    return overlay
  }

  public static applyForceLandscapeTransform(): void {
    const layer = document.getElementById('game-layer')
    if (!layer) return

    layer.classList.add('force-landscape')
    layer.style.display = 'block'
  }

  public static removeForceLandscapeTransform(): void {
    const layer = document.getElementById('game-layer')
    if (!layer) return

    layer.classList.remove('force-landscape')
  }
}