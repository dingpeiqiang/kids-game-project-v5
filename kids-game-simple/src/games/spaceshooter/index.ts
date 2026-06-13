// === 太空射击游戏入口 ===
import type { GameEngine } from '../../services/gameEngine'
import Phaser from 'phaser'
import { SpaceShooterScene } from './scene'
import { BASE_W, BASE_H } from './config'

export function initSpaceShooter(engine: GameEngine, onEnd: () => void) {
  const gameContainer = document.getElementById('gameCanvas')!
  gameContainer.innerHTML = ''

  const isMobile = /Android|iPhone|iPad|iPod|MicroMessenger/i.test(navigator.userAgent)
    || (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)

  const phaserParent = document.createElement('div')
  phaserParent.id = 'phaser-space-shooter'
  phaserParent.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    background: linear-gradient(to bottom, #0a0a2e 0%, #1a1a3e 50%, #0a0a2e 100%);
    overflow: hidden;
    margin: 0;
    padding: 0;
    touch-action: none;
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
  `
  document.body.appendChild(phaserParent)

  if (!isMobile) {
    phaserParent.style.maxWidth = '420px'
    phaserParent.style.maxHeight = '760px'
    phaserParent.style.width = '100%'
    phaserParent.style.height = '100%'
    phaserParent.style.aspectRatio = BASE_W + '/' + BASE_H
  }

  let phaserGame: Phaser.Game
  const handleResize = () => { if (phaserGame?.scale) phaserGame.scale.refresh() }

  const wrappedOnEnd = () => {
    window.removeEventListener('resize', handleResize)
    if (isMobile) {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
    phaserGame?.destroy(true)
    const phaserDiv = document.getElementById('phaser-space-shooter')
    if (phaserDiv) phaserDiv.remove()
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

  engine.start()
}