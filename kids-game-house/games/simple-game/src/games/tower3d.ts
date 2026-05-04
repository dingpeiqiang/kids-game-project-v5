import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import * as THREE from 'three'
import { app } from '../App'

export function initTower3D(engine: GameEngine, onEnd: () => void) {
  const container = document.getElementById('gameCanvas')!
  container.innerHTML = '<div id="threeContainer2" style="width:100%;height:100%;position:relative"></div>'

  const W = 400, H = 600
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)
  scene.fog = new THREE.Fog(0x0a0a1a, 10, 25)

  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
  camera.position.set(0, 12, 8)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(W, H)
  renderer.setPixelRatio(1)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  document.getElementById('threeContainer2')!.appendChild(renderer.domElement)

  // 灯光
  scene.add(new THREE.AmbientLight(0x404080, 0.6))
  const pLight = new THREE.PointLight(0x4ECDC4, 1.5, 30)
  pLight.position.set(0, 15, 5)
  scene.add(pLight)
  const pLight2 = new THREE.PointLight(0xFF6B6B, 0.8, 25)
  pLight2.position.set(-5, 10, -3)
  scene.add(pLight2)

  // 目标平台
  const platformGeo = new THREE.CylinderGeometry(3, 3.5, 0.5, 32)
  const platformMat = new THREE.MeshPhongMaterial({ 
    color: 0x2a2a4a, 
    emissive: 0x1a1a3a,
    shininess: 100
  })
  const platform = new THREE.Mesh(platformGeo, platformMat)
  platform.position.y = -0.25
  scene.add(platform)

  // 平台边缘发光
  const ringGeo = new THREE.TorusGeometry(3.2, 0.08, 8, 32)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ECDC4 })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.02
  scene.add(ring)

  // 球
  const ballGeo = new THREE.SphereGeometry(0.4, 32, 32)
  const ballMat = new THREE.MeshPhongMaterial({ 
    color: 0x4ECDC4,
    emissive: 0x2a6a6a,
    shininess: 150
  })
  const ball = new THREE.Mesh(ballGeo, ballMat)
  ball.position.set(0, 0.4, 2)
  scene.add(ball)

  // 物理参数
  let vx = 0, vy = 0, vz = 0
  const gravity = 0.015
  const bounce = 0.85
  const friction = 0.99
  let gameStarted = false
  let particles: any[] = []
  let score = 0
  let combo = 0
  let bounceCount = 0
  let trails: THREE.Mesh[] = []
  
  // ====== HTML道具栏（库存模式）======
  let inventory: string[] = [] // 道具库存
  
  // 道具图标映射
  const powerupIcons: Record<string, string> = {
    'slow': '🐌',       // 减速 - 重力减半
    'magnet': '🧲',     // 磁铁 - 自动拉向中心
    'shield': '🛡️',    // 护盾 - 免疫一次掉落
    'score2x': '✨'     // 双倍分数 - 10秒内×2
  }
  
  // 更新 HTML 道具栏
  function updateHTMLPowerupBar() {
    const powerups = Object.keys(powerupIcons).map(id => ({
      id,
      icon: powerupIcons[id],
      name: id
    }))
    
    app.setupCustomPowerupBar('tower3d', powerups, inventory, (powerupId) => {
      if (usePowerup(powerupId)) {
        audioService.collect()
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
      case 'slow':
        // 减速 - 重力减半，持续8秒
        ;(window as any).tower3dSlow = Date.now() + 8000
        audioService.collect()
        console.log('[道具] 减速生效，持续8秒')
        break
        
      case 'magnet':
        // 磁铁 - 自动拉向中心，持续6秒
        ;(window as any).tower3dMagnet = Date.now() + 6000
        audioService.win()
        console.log('[道具] 磁铁生效，持续6秒')
        break
        
      case 'shield':
        // 护盾 - 免疫一次掉落
        ;(window as any).tower3dShield = true
        audioService.win()
        console.log('[道具] 护盾已准备')
        break
        
      case 'score2x':
        // 双倍分数 - 10秒内×2
        ;(window as any).tower3dScore2x = Date.now() + 10000
        audioService.win()
        console.log('[道具] 双倍分数生效，持续10秒')
        break
    }
    
    return true
  }

  // 开始游戏
  function startGame() {
    gameStarted = true
    vx = (Math.random() - 0.5) * 0.15
    vy = 0.1
    vz = -0.15
    engine.startTimer(60)
  }

  // 粒子效果
  function spawnParticles(x: number, y: number, z: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const pGeo = new THREE.SphereGeometry(0.08, 8, 8)
      const pMat = new THREE.MeshBasicMaterial({ color })
      const p = new THREE.Mesh(pGeo, pMat)
      p.position.set(x, y, z)
      scene.add(p)
      particles.push({
        mesh: p,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 0.2,
        vz: (Math.random() - 0.5) * 0.3,
        life: 1
      })
    }
  }

  // 绘制尾迹
  function addTrail() {
    const tGeo = new THREE.SphereGeometry(0.15, 8, 8)
    const tMat = new THREE.MeshBasicMaterial({ 
      color: 0x4ECDC4, 
      transparent: true, 
      opacity: 0.6 
    })
    const t = new THREE.Mesh(tGeo, tMat)
    t.position.copy(ball.position)
    scene.add(t)
    trails.push(t)
    if (trails.length > 8) {
      const old = trails.shift()!
      scene.remove(old)
    }
  }

  // UI层
  const uiDiv = document.createElement('div')
  uiDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none'
  document.getElementById('threeContainer2')!.appendChild(uiDiv)

  const hintDiv = document.createElement('div')
  hintDiv.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:18px;font-weight:bold;text-align:center;text-shadow:0 2px 10px rgba(0,0,0,0.8);pointer-events:none'
  hintDiv.innerHTML = '🎮 点击开始<br><span style="font-size:12px;opacity:0.7">弹球掉落，弹到边缘得分！</span>'
  uiDiv.appendChild(hintDiv)

  const scoreDiv = document.createElement('div')
  scoreDiv.style.cssText = 'position:absolute;top:15px;left:15px;color:#FFD93D;font-size:28px;font-weight:bold;text-shadow:0 2px 8px rgba(0,0,0,0.6)'
  scoreDiv.innerHTML = '0'
  uiDiv.appendChild(scoreDiv)

  const comboDiv = document.createElement('div')
  comboDiv.style.cssText = 'position:absolute;top:50px;left:15px;color:#FF6B6B;font-size:16px;font-weight:bold;text-shadow:0 2px 6px rgba(0,0,0,0.5)'
  comboDiv.innerHTML = ''
  uiDiv.appendChild(comboDiv)

  // 点击开始/发射
  document.getElementById('threeContainer2')!.onclick = () => {
    if (!gameStarted) {
      startGame()
      hintDiv.style.display = 'none'
    }
  }

  let last = 0
  function loop(ts: number) {
    if (!document.getElementById('threeContainer2')) return

    const dt = Math.min((ts - last) / 16.67, 2)
    last = ts

    // 更新球物理
    if (gameStarted) {
      vy -= gravity * dt
      vx *= friction
      vz *= friction

      ball.position.x += vx * dt
      ball.position.y += vy * dt
      ball.position.z += vz * dt

      // 边缘碰撞
      const edgeRadius = 3
      const dist = Math.sqrt(ball.position.x ** 2 + ball.position.z ** 2)
      if (dist > edgeRadius - 0.4) {
        // 反弹
        const nx = ball.position.x / dist
        const nz = ball.position.z / dist
        const dot = vx * nx + vz * nz
        vx -= 2 * dot * nx * bounce
        vz -= 2 * dot * nz * bounce
        
        // 推回边缘内
        ball.position.x = nx * (edgeRadius - 0.5)
        ball.position.z = nz * (edgeRadius - 0.5)
        
        // 得分
        bounceCount++
        combo++
        const baseScore = 10 + combo * 5
        score += baseScore
        scoreDiv.innerHTML = String(score)
        
        if (bounceCount % 3 === 0) {
          comboDiv.innerHTML = `🔥 ${combo} 连击！`
        }
        
        // 边缘闪光
        ring.material.color.setHex(combo >= 5 ? 0xFFD93D : 0x4ECDC4)
        spawnParticles(ball.position.x, ball.position.y, ball.position.z, combo >= 5 ? 0xFFD93D : 0x4ECDC4, 8)
        
        // 播放音效
        if (combo >= 5) {
          audioService.win()
        } else {
          audioService.collect()
        }
        
        // 连击中断
        if (combo >= 10) {
          engine.triggerRandomBuff()
        }
      }
      
      // 底部碰撞（掉落）
      if (ball.position.y < 0.4) {
        ball.position.y = 0.4
        vy = Math.abs(vy) * bounce * 0.8
        
        // 掉落后的连击重置
        if (combo >= 3) {
          combo = 0
          comboDiv.innerHTML = ''
        }
      }
      
      // 超出范围重置
      if (ball.position.y < -2 || dist > 6) {
        ball.position.set(0, 5, 0)
        vx = (Math.random() - 0.5) * 0.1
        vy = 0
        vz = (Math.random() - 0.5) * 0.1
        combo = 0
        comboDiv.innerHTML = ''
      }
      
      // 添加尾迹
      if (Math.floor(ts / 50) % 2 === 0) {
        addTrail()
      }
      
      // 更新尾迹透明度
      trails.forEach((t, i) => {
        const mat = t.material as THREE.MeshBasicMaterial
        mat.opacity = (i + 1) / trails.length * 0.5
        t.scale.setScalar((i + 1) / trails.length)
      })
    }

    // 球旋转
    ball.rotation.x += 0.05 * dt
    ball.rotation.z += 0.03 * dt

    // 相机轻微晃动
    camera.position.x = Math.sin(ts * 0.001) * 0.3
    camera.lookAt(0, 0, 0)

    // 平台光环动画
    ring.rotation.z += 0.01 * dt

    // 更新粒子
    particles.forEach((p, i) => {
      p.mesh.position.x += p.vx * dt
      p.mesh.position.y += p.vy * dt
      p.mesh.position.z += p.vz * dt
      p.vy -= 0.01 * dt
      p.life -= 0.03 * dt
      const mat = p.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = p.life
      if (p.life <= 0) {
        scene.remove(p.mesh)
        particles.splice(i, 1)
      }
    })

    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  
      
  requestAnimationFrame(loop)
}
