// === 太空射击游戏入口（Phaser 外部画布 + 框架 destroy / 暂停桥接）===
import type { GameEngine } from '../../services/gameEngine'
import { SpaceShooterScene } from './scene'
import { BASE_W, BASE_H } from './config'
import { getSpaceShooterPerfProfile, resolvePhaserRenderType } from './mobilePerf'

type Teardown = () => void

let teardown: Teardown | null = null

/** index.html CDN 未加载时（内网/离线）回退 npm 包 */
async function ensurePhaserGlobal(): Promise<void> {
  if (typeof Phaser !== 'undefined') return
  const mod = await import('phaser')
  const P = (mod as { default?: typeof Phaser }).default ?? mod
  ;(globalThis as typeof globalThis & { Phaser: typeof Phaser }).Phaser = P as typeof Phaser
}

export function destroySpaceShooter(): void {
  teardown?.()
  teardown = null
}

export async function initSpaceShooter(engine: GameEngine, onEnd: () => void) {
  destroySpaceShooter()

  try {
    await ensurePhaserGlobal()
  } catch (e) {
    console.error('[spaceShooter] Phaser 加载失败', e)
    onEnd()
    return
  }

  const gameContainer = document.getElementById('gameCanvas')
  if (!gameContainer) {
    console.error('[spaceShooter] #gameCanvas 未找到，请先挂载 gameShell')
    onEnd()
    return
  }
  gameContainer.innerHTML = ''
  gameContainer.style.display = 'block'
  gameContainer.style.width = '100%'
  gameContainer.style.height = '100%'
  gameContainer.style.position = 'relative'
  gameContainer.style.flex = '1 1 auto'
  gameContainer.style.minHeight = '0'

  const isMobile =
    /Android|iPhone|iPad|iPod|MicroMessenger/i.test(navigator.userAgent) ||
    (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)

  const phaserParent = document.createElement('div')
  phaserParent.id = 'phaser-space-shooter'
  phaserParent.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background: linear-gradient(to bottom, #0a0a2e 0%, #1a1a3e 50%, #0a0a2e 100%);
    overflow: hidden;
    margin: 0;
    padding: 0;
    touch-action: none;
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
  `
  gameContainer.appendChild(phaserParent)

  /** 桌面端在视口内居中一块竖屏区域，避免 absolute+aspect-ratio 导致父级高度为 0 */
  if (!isMobile) {
    phaserParent.style.left = '50%'
    phaserParent.style.top = '50%'
    phaserParent.style.right = 'auto'
    phaserParent.style.bottom = 'auto'
    phaserParent.style.transform = 'translate(-50%, -50%)'
    phaserParent.style.width = 'min(420px, 100%)'
    phaserParent.style.height = 'min(760px, 100%)'
    phaserParent.style.maxWidth = '420px'
    phaserParent.style.maxHeight = '760px'
  }

  const measureParent = () => {
    const r = phaserParent.getBoundingClientRect()
    if (r.width >= 8 && r.height >= 8) return
    const host = gameContainer.getBoundingClientRect()
    if (host.width < 8 || host.height < 8) return
    if (isMobile) {
      phaserParent.style.width = `${Math.floor(host.width)}px`
      phaserParent.style.height = `${Math.floor(host.height)}px`
    } else {
      const scale = Math.min(host.width / BASE_W, host.height / BASE_H, 1.2)
      const w = Math.max(200, Math.floor(BASE_W * scale))
      const h = Math.max(320, Math.floor(BASE_H * scale))
      phaserParent.style.width = `${w}px`
      phaserParent.style.height = `${h}px`
    }
  }

  let phaserGame: Phaser.Game | null = null
  let resizeObserver: ResizeObserver | null = null

  const handleResize = () => {
    measureParent()
    if (phaserGame?.scale) phaserGame.scale.refresh()
  }

  const wrappedOnEnd = () => {
    destroySpaceShooter()
    onEnd()
  }

  const refreshScale = () => {
    requestAnimationFrame(() => {
      measureParent()
      phaserGame?.scale?.refresh()
    })
  }

  const perf = getSpaceShooterPerfProfile()
  const phaserType = resolvePhaserRenderType(Phaser)

  try {
    measureParent()
    phaserGame = new Phaser.Game({
      type: phaserType,
      width: BASE_W,
      height: BASE_H,
      parent: phaserParent,
      backgroundColor: '#0a0a2e',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: BASE_W,
        height: BASE_H,
        min: { width: BASE_W, height: BASE_H },
        max: { width: BASE_W * 4, height: BASE_H * 4 },
      },
      fps: perf.isMobile ? { target: 60, forceSetTimeOut: false, smoothStep: true } : undefined,
      scene: [new SpaceShooterScene(engine, wrappedOnEnd)],
      input: { touch: { capture: true } },
      render: {
        antialias: !perf.isMobile,
        pixelArt: false,
        roundPixels: true,
        powerPreference: perf.preferWebGL ? 'high-performance' : 'default',
      },
      audio: { noAudio: true },
      banner: false,
    })
    
    phaserGame.events.once('ready', () => {
      refreshScale()
      requestAnimationFrame(refreshScale)
    })

    refreshScale()
    requestAnimationFrame(() => {
      measureParent()
      refreshScale()
    })

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => handleResize())
      resizeObserver.observe(gameContainer)
      resizeObserver.observe(phaserParent)
    }

    for (const delay of [50, 200, 500]) {
      window.setTimeout(() => handleResize(), delay)
    }
  } catch (e) {
    console.error('[spaceShooter] Phaser.Game 创建失败', e)
    phaserParent.remove()
    onEnd()
    return
  }

  window.addEventListener('resize', handleResize)
  window.visualViewport?.addEventListener('resize', handleResize)

  if (isMobile) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
  }

  teardown = () => {
    resizeObserver?.disconnect()
    resizeObserver = null
    window.removeEventListener('resize', handleResize)
    window.visualViewport?.removeEventListener('resize', handleResize)
    if (isMobile) {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
    phaserGame?.destroy(true)
    phaserGame = null
    const phaserDiv = document.getElementById('phaser-space-shooter')
    if (phaserDiv) phaserDiv.remove()
    if (gameContainer) gameContainer.innerHTML = ''
  }
}