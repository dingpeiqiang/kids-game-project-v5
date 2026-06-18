// === 太空射击游戏入口（Phaser 外部画布 + 框架 destroy / 暂停桥接）===
import type { GameEngine } from '../../services/gameEngine'
import { SpaceShooterScene } from './scene'
import { BASE_W, BASE_H } from './config'

type Teardown = () => void

let teardown: Teardown | null = null

export function destroySpaceShooter(): void {
  teardown?.()
  teardown = null
}

export function initSpaceShooter(engine: GameEngine, onEnd: () => void) {
  destroySpaceShooter()

  const gameContainer = document.getElementById('gameCanvas')
  if (!gameContainer) {
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
    z-index: 100;
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

  if (!isMobile) {
    phaserParent.style.maxWidth = '420px'
    phaserParent.style.maxHeight = '760px'
    phaserParent.style.margin = '0 auto'
    phaserParent.style.aspectRatio = BASE_W + '/' + BASE_H
  }

  let phaserGame: Phaser.Game | null = null
  const handleResize = () => {
    if (phaserGame?.scale) phaserGame.scale.refresh()
  }

  const wrappedOnEnd = () => {
    destroySpaceShooter()
    onEnd()
  }

  phaserGame = new Phaser.Game({
    type: Phaser.CANVAS,
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
    scene: [new SpaceShooterScene(engine, wrappedOnEnd)],
    input: { touch: { capture: true } },
    render: { antialias: true, pixelArt: false, roundPixels: true },
    audio: { noAudio: true },
    banner: false,
  })

  window.addEventListener('resize', handleResize)

  if (isMobile) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
  }

  teardown = () => {
    window.removeEventListener('resize', handleResize)
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