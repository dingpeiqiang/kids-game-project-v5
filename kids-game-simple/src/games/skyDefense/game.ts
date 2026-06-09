import * as THREE from 'three'
import type { GameState, Tower, Enemy, Bullet, Particle, GridCell, TowerType, EnemyType } from './types'
import { GAME_CONFIG, WAVE_CONFIGS, TOWER_TYPES, STORAGE_KEYS } from './config'
import { initializeGrid, screenToGrid, canPlaceTower, getCellCenter } from './logic/gridSystem'
import { createTower, calculateUpgradeCost, canUpgrade, upgradeTower, calculateSellValue, updateTower } from './logic/towerManager'
import { createEnemy, updateEnemy, applyDamage, generateWaveEnemies } from './logic/enemyManager'
import { createBullet, updateBullet } from './logic/bulletManager'
import { createExplosion, createSlowEffect, updateParticles } from './logic/particleManager'
import { createScene, createCamera, createRenderer, createLights, createGround, createGrid, createPath, createBase, handleResize } from './render/scene'
import { createTowerMesh, updateTowerMesh, createTowerSelectionIndicator } from './render/towers'
import { createEnemyMesh, updateEnemyMesh } from './render/enemies'
import { createBulletMesh, updateBulletMesh, createExplosionEffect, updateExplosionEffect } from './render/effects'
import { createUI, updateUI, updateTowerButtons, showActionPanel, updateActionPanel, showGameOver, showVictory, showWaveWarning, createStartButton, updateStartButton } from './render/ui'

export class SkyDefenseGame {
  private container: HTMLElement
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  
  private grid: GridCell[][]
  private state: GameState
  
  private towers: Tower[] = []
  private enemies: Enemy[] = []
  private bullets: Bullet[] = []
  private particles: Particle[] = []
  
  private towerMeshes: Map<string, THREE.Group> = new Map()
  private enemyMeshes: Map<string, THREE.Group> = new Map()
  private bulletMeshes: Map<string, THREE.Mesh> = new Map()
  private explosionEffects: THREE.Group[] = []
  
  private selectedTowerType: TowerType | null = null
  private selectedTower: Tower | null = null
  private selectionIndicator: THREE.Mesh | null = null
  
  private waveSpawnTimer: number = 0
  private waveEnemiesToSpawn: EnemyType[] = []
  private warningTimer: number = 0
  private isWarningActive: boolean = false
  
  private animationId: number = 0
  private lastTime: number = 0
  
  constructor(container: HTMLElement) {
    this.container = container
    this.state = this.createInitialState()
    this.grid = initializeGrid()
    
    this.initThreeJS()
    this.initUI()
    this.setupEventListeners()
  }
  
  private createInitialState(): GameState {
    return {
      gold: GAME_CONFIG.INITIAL_GOLD,
      lives: GAME_CONFIG.INITIAL_LIVES,
      wave: 1,
      score: 0,
      totalKills: 0,
      isPlaying: false,
      isGameOver: false,
      isVictory: false,
      selectedTowerType: null,
      selectedTowerId: null,
      waveInProgress: false,
      enemiesRemaining: 0,
      highestWave: parseInt(localStorage.getItem(STORAGE_KEYS.highestWave) || '0'),
      highestScore: parseInt(localStorage.getItem(STORAGE_KEYS.highestScore) || '0'),
      highestKills: parseInt(localStorage.getItem(STORAGE_KEYS.highestKills) || '0')
    }
  }
  
  private initThreeJS(): void {
    this.scene = createScene()
    this.camera = createCamera(this.container)
    this.renderer = createRenderer(this.container)
    
    createLights(this.scene)
    createGround(this.scene)
    createGrid(this.scene)
    createPath(this.scene)
    createBase(this.scene)
    
    this.selectionIndicator = createTowerSelectionIndicator()
    this.scene.add(this.selectionIndicator)
    this.selectionIndicator.visible = false
    
    window.addEventListener('resize', () => handleResize(this.renderer, this.camera))
  }
  
  private initUI(): void {
    createUI(this.container)
    createStartButton(this.container)
    updateUI(this.state)
    updateTowerButtons(this.state.gold)
  }
  
  private setupEventListeners(): void {
    this.container.addEventListener('click', (e) => this.handleClick(e))
    this.container.addEventListener('touchstart', (e) => this.handleTouch(e))
    
    document.addEventListener('tower-select', (e) => {
      const event = e as CustomEvent<{ towerType: TowerType }>
      this.selectedTowerType = event.detail.towerType
      this.selectedTower = null
      showActionPanel(false)
    })
    
    document.addEventListener('tower-upgrade', () => this.handleUpgrade())
    document.addEventListener('tower-sell', () => this.handleSell())
    document.addEventListener('tower-deselect', () => this.handleDeselectTower())
    document.addEventListener('wave-start', () => this.startWave())
    document.addEventListener('game-restart', () => this.restart())
  }
  
  private handleClick(event: MouseEvent): void {
    if (this.state.isGameOver || this.state.isVictory) return
    
    const rect = this.container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const gridPoint = screenToGrid(x, y, this.camera, this.scene)
    
    if (!gridPoint) return
    
    if (this.selectedTowerType) {
      this.attemptPlaceTower(gridPoint.gx, gridPoint.gy)
    } else {
      this.attemptSelectTower(gridPoint.gx, gridPoint.gy)
    }
  }
  
  private handleTouch(event: TouchEvent): void {
    if (this.state.isGameOver || this.state.isVictory) return
    
    const touch = event.touches[0]
    const rect = this.container.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    const gridPoint = screenToGrid(x, y, this.camera, this.scene)
    
    if (!gridPoint) return
    
    if (this.selectedTowerType) {
      this.attemptPlaceTower(gridPoint.gx, gridPoint.gy)
    } else {
      this.attemptSelectTower(gridPoint.gx, gridPoint.gy)
    }
  }
  
  private attemptPlaceTower(gx: number, gy: number): void {
    if (!this.selectedTowerType) return
    if (this.state.gold < this.selectedTowerType.cost) return
    if (!canPlaceTower(this.grid, gx, gy)) return
    
    const cellCenter = getCellCenter(gx, gy)
    const tower = createTower(this.selectedTowerType, gx, gy, cellCenter)
    
    this.towers.push(tower)
    this.grid[gy][gx].towerId = tower.id
    this.state.gold -= tower.type.cost
    
    const mesh = createTowerMesh(tower)
    this.towerMeshes.set(tower.id, mesh)
    this.scene.add(mesh)
    
    this.selectedTowerType = null
    updateTowerButtons(this.state.gold)
    updateUI(this.state)
  }
  
  private attemptSelectTower(gx: number, gy: number): void {
    const cell = this.grid[gy]?.[gx]
    if (!cell || !cell.towerId) {
      this.handleDeselectTower()
      return
    }
    
    const tower = this.towers.find(t => t.id === cell.towerId)
    if (tower) {
      this.selectTower(tower)
    }
  }
  
  private selectTower(tower: Tower): void {
    this.selectedTower = tower
    this.state.selectedTowerId = tower.id
    
    if (this.selectionIndicator) {
      this.selectionIndicator.position.set(tower.x, 0.02, tower.z)
      this.selectionIndicator.visible = true
    }
    
    showActionPanel(true)
    updateActionPanel(tower, this.state.gold)
  }
  
  private handleDeselectTower(): void {
    this.selectedTower = null
    this.state.selectedTowerId = null
    
    if (this.selectionIndicator) {
      this.selectionIndicator.visible = false
    }
    
    showActionPanel(false)
  }
  
  private handleUpgrade(): void {
    if (!this.selectedTower) return
    
    const upgradeCost = calculateUpgradeCost(this.selectedTower)
    if (!canUpgrade(this.selectedTower) || this.state.gold < upgradeCost) return
    
    this.state.gold -= upgradeCost
    upgradeTower(this.selectedTower)
    
    const oldMesh = this.towerMeshes.get(this.selectedTower.id)
    if (oldMesh) {
      this.scene.remove(oldMesh)
    }
    
    const newMesh = createTowerMesh(this.selectedTower)
    this.towerMeshes.set(this.selectedTower.id, newMesh)
    this.scene.add(newMesh)
    
    updateUI(this.state)
    updateTowerButtons(this.state.gold)
    updateActionPanel(this.selectedTower, this.state.gold)
  }
  
  private handleSell(): void {
    const tower = this.selectedTower
    if (!tower) return
    
    const sellValue = calculateSellValue(tower)
    this.state.gold += sellValue
    
    const mesh = this.towerMeshes.get(tower.id)
    if (mesh) {
      this.scene.remove(mesh)
      this.towerMeshes.delete(tower.id)
    }
    
    this.grid[tower.gy][tower.gx].towerId = null
    this.towers = this.towers.filter(t => t.id !== tower.id)
    
    this.handleDeselectTower()
    updateUI(this.state)
    updateTowerButtons(this.state.gold)
  }
  
  private startWave(): void {
    if (this.state.waveInProgress) return
    
    const waveConfig = WAVE_CONFIGS[this.state.wave - 1]
    if (!waveConfig) return
    
    this.state.waveInProgress = true
    this.waveEnemiesToSpawn = generateWaveEnemies(waveConfig)
    this.state.enemiesRemaining = this.waveEnemiesToSpawn.length
    this.waveSpawnTimer = 0
    
    this.isWarningActive = true
    this.warningTimer = 1500
    showWaveWarning(true, this.state.wave)
    
    updateStartButton(this.state.wave, true)
  }
  
  private spawnEnemy(enemyType: EnemyType): void {
    const waveConfig = WAVE_CONFIGS[this.state.wave - 1]
    if (!waveConfig) return
    
    const enemy = createEnemy(enemyType, waveConfig)
    this.enemies.push(enemy)
    
    const mesh = createEnemyMesh(enemy)
    this.enemyMeshes.set(enemy.id, mesh)
    this.scene.add(mesh)
  }
  
  private removeEnemy(enemyId: string): void {
    const mesh = this.enemyMeshes.get(enemyId)
    if (mesh) {
      this.scene.remove(mesh)
      this.enemyMeshes.delete(enemyId)
    }
    
    this.enemies = this.enemies.filter(e => e.id !== enemyId)
  }
  
  private removeBullet(bulletId: string): void {
    const mesh = this.bulletMeshes.get(bulletId)
    if (mesh) {
      this.scene.remove(mesh)
      this.bulletMeshes.delete(bulletId)
    }
    
    this.bullets = this.bullets.filter(b => b.id !== bulletId)
  }
  
  private checkVictory(): void {
    if (this.state.wave >= GAME_CONFIG.MAX_WAVES && !this.state.waveInProgress && this.enemies.length === 0) {
      this.state.isVictory = true
      this.state.isPlaying = false
      
      this.saveHighScores()
      showVictory(true, {
        score: this.state.score,
        kills: this.state.totalKills,
        lives: this.state.lives
      })
    }
  }
  
  private checkGameOver(): void {
    if (this.state.lives <= 0) {
      this.state.isGameOver = true
      this.state.isPlaying = false
      
      this.saveHighScores()
      showGameOver(true, {
        wave: this.state.wave,
        score: this.state.score,
        kills: this.state.totalKills
      })
    }
  }
  
  private saveHighScores(): void {
    if (this.state.wave > this.state.highestWave) {
      localStorage.setItem(STORAGE_KEYS.highestWave, this.state.wave.toString())
    }
    if (this.state.score > this.state.highestScore) {
      localStorage.setItem(STORAGE_KEYS.highestScore, this.state.score.toString())
    }
    if (this.state.totalKills > this.state.highestKills) {
      localStorage.setItem(STORAGE_KEYS.highestKills, this.state.totalKills.toString())
    }
  }
  
  private restart(): void {
    this.state = this.createInitialState()
    this.grid = initializeGrid()
    
    this.towers.forEach(t => {
      const mesh = this.towerMeshes.get(t.id)
      if (mesh) this.scene.remove(mesh)
    })
    this.towers = []
    this.towerMeshes.clear()
    
    this.enemies.forEach(e => {
      const mesh = this.enemyMeshes.get(e.id)
      if (mesh) this.scene.remove(mesh)
    })
    this.enemies = []
    this.enemyMeshes.clear()
    
    this.bullets.forEach(b => {
      const mesh = this.bulletMeshes.get(b.id)
      if (mesh) this.scene.remove(mesh)
    })
    this.bullets = []
    this.bulletMeshes.clear()
    
    this.explosionEffects.forEach(e => this.scene.remove(e))
    this.explosionEffects = []
    this.particles = []
    
    this.selectedTowerType = null
    this.selectedTower = null
    if (this.selectionIndicator) {
      this.selectionIndicator.visible = false
    }
    
    showActionPanel(false)
    updateStartButton(this.state.wave, false)
    updateTowerButtons(this.state.gold)
    updateUI(this.state)
    showGameOver(false, { wave: 0, score: 0, kills: 0 })
    showVictory(false, { score: 0, kills: 0, lives: 0 })
  }
  
  public start(): void {
    this.state.isPlaying = true
    this.lastTime = performance.now()
    this.gameLoop()
  }
  
  public stop(): void {
    this.state.isPlaying = false
    cancelAnimationFrame(this.animationId)
  }
  
  private gameLoop(): void {
    if (!this.state.isPlaying) return
    
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    this.update(deltaTime)
    this.render()
    
    this.animationId = requestAnimationFrame(() => this.gameLoop())
  }
  
  private update(deltaTime: number): void {
    if (this.isWarningActive) {
      this.warningTimer -= deltaTime
      if (this.warningTimer <= 0) {
        this.isWarningActive = false
        showWaveWarning(false, 0)
      }
      return
    }
    
    this.updateWave(deltaTime)
    this.updateEnemies(deltaTime)
    this.updateTowers(deltaTime)
    this.updateBullets(deltaTime)
    this.updateParticles(deltaTime)
    this.updateExplosions(deltaTime)
  }
  
  private updateWave(deltaTime: number): void {
    if (!this.state.waveInProgress) return
    
    const waveConfig = WAVE_CONFIGS[this.state.wave - 1]
    if (!waveConfig) return
    
    this.waveSpawnTimer += deltaTime
    
    if (this.waveSpawnTimer >= waveConfig.spawnInterval && this.waveEnemiesToSpawn.length > 0) {
      const enemyType = this.waveEnemiesToSpawn.shift()
      if (enemyType) {
        this.spawnEnemy(enemyType)
      }
      this.waveSpawnTimer = 0
    }
    
    if (this.waveEnemiesToSpawn.length === 0 && this.enemies.length === 0) {
      this.state.waveInProgress = false
      this.state.wave++
      
      updateStartButton(this.state.wave, false)
      this.checkVictory()
    }
  }
  
  private updateEnemies(deltaTime: number): void {
    for (const enemy of this.enemies) {
      const result = updateEnemy(enemy, deltaTime)
      
      if (result.reachedEnd) {
        const damage = enemy.type.isElite ? 3 : 1
        this.state.lives -= damage
        this.removeEnemy(enemy.id)
        this.state.enemiesRemaining--
        
        updateUI(this.state)
        this.checkGameOver()
      }
      
      const mesh = this.enemyMeshes.get(enemy.id)
      if (mesh) {
        updateEnemyMesh(mesh, enemy)
      }
    }
  }
  
  private updateTowers(deltaTime: number): void {
    for (const tower of this.towers) {
      const result = updateTower(tower, this.enemies, deltaTime)
      
      if (result.shouldFire && result.target) {
        const bullet = createBullet(tower, result.target)
        this.bullets.push(bullet)
        
        const mesh = createBulletMesh(bullet)
        this.bulletMeshes.set(bullet.id, mesh)
        this.scene.add(mesh)
      }
      
      const mesh = this.towerMeshes.get(tower.id)
      if (mesh) {
        if (result.target) {
          const direction = new THREE.Vector3(
            result.target.x - tower.x,
            0,
            result.target.y - tower.z
          )
          updateTowerMesh(mesh, tower, direction)
        } else {
          updateTowerMesh(mesh, tower)
        }
      }
    }
  }
  
  private updateBullets(deltaTime: number): void {
    for (const bullet of this.bullets) {
      const result = updateBullet(bullet, this.enemies)
      
      const mesh = this.bulletMeshes.get(bullet.id)
      if (mesh) {
        updateBulletMesh(mesh, bullet)
      }
      
      if (result.hit && result.target) {
        const damageResult = applyDamage(
          result.target,
          bullet.damage,
          bullet.slowFactor,
          bullet.slowDuration
        )
        
        const hitParticles = createExplosion(result.target.x, result.target.z, bullet.color)
        this.particles.push(...hitParticles)
        
        if (bullet.slowFactor) {
          const slowParticles = createSlowEffect(result.target.x, result.target.y, result.target.z)
          this.particles.push(...slowParticles)
        }
        
        this.removeBullet(bullet.id)
        
        if (damageResult.killed) {
          const explosion = createExplosionEffect(result.target.x, result.target.z, result.target.color)
          this.explosionEffects.push(explosion)
          this.scene.add(explosion)
          
          this.state.gold += result.target.reward
          this.state.score += result.target.reward * 10
          this.state.totalKills++
          this.state.enemiesRemaining--
          
          this.removeEnemy(result.target.id)
          
          updateUI(this.state)
          updateTowerButtons(this.state.gold)
        }
      } else if (!result.target) {
        this.removeBullet(bullet.id)
      }
    }
  }
  
  private updateParticles(deltaTime: number): void {
    this.particles = updateParticles(this.particles, deltaTime)
  }
  
  private updateExplosions(deltaTime: number): void {
    this.explosionEffects = this.explosionEffects.filter(effect => {
      const alive = updateExplosionEffect(effect, deltaTime)
      if (!alive) {
        this.scene.remove(effect)
      }
      return alive
    })
  }
  
  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }
}