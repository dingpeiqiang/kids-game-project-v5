import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import * as THREE from 'three'
import { app } from '../App'

export function initStack3D(engine: GameEngine, onEnd: () => void) {
  const container = document.getElementById('gameCanvas')!
  container.innerHTML = '<div id="threeContainer" style="width:100%;height:100%"></div>'

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  document.getElementById('threeContainer')!.appendChild(renderer.domElement)

  const ambLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambLight)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 5)
  dirLight.castShadow = true
  scene.add(dirLight)

  const baseGeo = new THREE.BoxGeometry(3, 0.3, 3)
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x4ECDC4 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = 0.15
  base.receiveShadow = true
  scene.add(base)

  camera.position.set(6, 5, 6)
  camera.lookAt(0, 2, 0)

  const STACK_COLORS = [0x4ECDC4, 0xFF6B6B, 0xFFD93D, 0x9B59B6, 0xFF8E53, 0x6BCB77, 0x4D96FF, 0xFF69B4, 0x87CEEB]

  let stack: any[] = []
  let currentBlock: any = null
  let gameOver = false
  let colorIdx = 0
  let totalHeight = 0
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'widen': '↔️',      // 加宽 - 方块宽度×1.5
    'slow': '🐌',       // 减速 - 摆动速度减半
    'perfect': '✨',    // 完美 - 下次自动完美对齐
    'revive': '💖'      // 复活 - 游戏结束时恢复一次
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('stack3d', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
        updateHTMLPowerupBar()
      }
    })
  }
  
  // 使用道具
  function usePowerup(type: string): boolean {
    const index = inventory.indexOf(type)
    if (index === -1) return false
    
    inventory.splice(index, 1)
    console.log('[道具] 使用道具:', type)
    
    switch (type) {
      case 'widen':
        // 加宽 - 方块宽度×1.5
        if (currentBlock) {
          currentBlock.mesh.scale.x = Math.min(currentBlock.mesh.scale.x * 1.5, 2)
        }
        audioService.win()
        console.log('[道具] 方块加宽')
        break
        
      case 'slow':
        // 减速 - 摆动速度减半，持续10秒
        ;(window as any).stack3dSlow = Date.now() + 10000
        audioService.collect()
        console.log('[道具] 减速生效，持续10秒')
        break
        
      case 'perfect':
        // 完美 - 下次自动完美对齐
        ;(window as any).stack3dPerfect = true
        audioService.win()
        console.log('[道具] 下次自动完美对齐')
        break
        
      case 'revive':
        // 复活 - 游戏结束时恢复一次
        ;(window as any).stack3dRevive = true
        audioService.win()
        console.log('[道具] 复活已准备')
        break
    }
    
    return true
  }

  function spawnBlock() {
    const col = STACK_COLORS[colorIdx % STACK_COLORS.length]
    const geo = new THREE.BoxGeometry(1, 0.6, 1)
    const mat = new THREE.MeshLambertMaterial({ color: col })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    
    const startX = stack.length === 0 ? 0 : stack[stack.length - 1].mesh.position.x
    mesh.position.set(3, totalHeight + 0.6, 0)
    currentBlock = {
      mesh,
      dir: 1,
      speed: 0.06
    }
    colorIdx++
  }

  function placeBlock() {
    if (!currentBlock) return
    const block = currentBlock
    
    let isValid = false
    let targetX = 0
    let targetZ = 0

    if (stack.length === 0) {
      isValid = Math.abs(block.mesh.position.x) < 1.5
      targetX = 0
      targetZ = 0
    } else {
      const last = stack[stack.length - 1]
      const diff = Math.abs(block.mesh.position.x - last.mesh.position.x)
      isValid = diff < 1.5
      targetX = last.mesh.position.x
      targetZ = last.mesh.position.z
    }

    if (!isValid) {
      gameOver = true
      audioService.lose()
      engine.endGame()
      onEnd()
      return
    }

    block.mesh.position.x = targetX
    block.mesh.position.z = targetZ
    block.mesh.position.y = totalHeight + 0.6
    
    stack.push(block)
    currentBlock = null
    totalHeight += 0.6

    camera.position.y = 5 + totalHeight
    camera.lookAt(0, totalHeight, 0)

    engine.addScore(10, window.innerWidth / 2, window.innerHeight / 2)
    if (engine.getCombo() >= 2) engine.triggerRandomBuff()
    audioService.click()
    
    setTimeout(() => {
      if (!gameOver) {
        spawnBlock()
      }
    }, 300)
  }

  spawnBlock()

  document.getElementById('threeContainer')!.onclick = () => {
    if (gameOver || !currentBlock) return
    placeBlock()
  }

  document.getElementById('threeContainer')!.ontouchend = () => {
    if (gameOver || !currentBlock) return
    placeBlock()
  }

  function loop() {
    if (!document.getElementById('threeContainer')) return

    if (currentBlock) {
      currentBlock.mesh.position.x += currentBlock.dir * currentBlock.speed
      if (currentBlock.mesh.position.x > 3) {
        currentBlock.dir = -1
      } else if (currentBlock.mesh.position.x < -3) {
        currentBlock.dir = 1
      }
      currentBlock.mesh.rotation.y += 0.02
    }

    const t = Date.now() * 0.0005
    camera.position.x = Math.sin(t) * 6
    camera.position.z = Math.cos(t) * 6
    camera.lookAt(0, totalHeight * 0.5 + 1, 0)
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  
  // 初始化 HTML 道具栏
  updateHTMLPowerupBar()
  
  loop()
}
