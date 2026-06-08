import type { Plant, Zombie, Sun, Particle, FloatingText, PlantType, Projectile } from './types'
import { GAME_CONFIG, LEVELS, PLANT_CONFIGS, AVAILABLE_PLANTS, generateId } from './config'
import { createPlant, updatePlants, getPlantAt } from './logic/plants'
import { createZombie, updateZombies } from './logic/zombies'
import { updateProjectiles } from './logic/projectiles'
import { WaveManager } from './logic/waveManager'
import { isPointInGrid, isPointInCardArea, getCardIndexAt, isPlantAtGrid } from './logic/collision'
import { drawBackground } from './render/background'
import { drawPlants } from './render/plants'
import { drawZombies } from './render/zombies'
import { drawUI, drawSuns, drawProjectiles, drawParticles, drawFloatingTexts, drawGameOver, drawStartScreen } from './render/ui'
import { createSunPickupEffect, createZombieDeathEffect, updateParticles, createFloatingText, updateFloatingTexts } from './render/effects'

export class PlantsVsZombiesGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private plants: Plant[] = []
  private zombies: Zombie[] = []
  private projectiles: Projectile[] = []
  private suns: Sun[] = []
  private particles: Particle[] = []
  private floatingTexts: FloatingText[] = []
  
  private boundHandleClick!: (e: MouseEvent) => void
  private boundHandleTouch!: (e: TouchEvent) => void
  
  private sun: number = 200
  private lives: number = 5
  private wave: number = 0
  private score: number = 0
  private selectedPlant: PlantType | null = null
  private currentLevel: number = 0
  private isGameOver: boolean = false
  private isVictory: boolean = false
  private isStarted: boolean = false
  
  private lastSunSpawnTime: number = 0
  private waveManager: WaveManager | null = null
  private waveCooldown: number = 0
  
  private animId: number = 0
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')
    this.ctx = ctx
    
    canvas.width = GAME_CONFIG.CANVAS_WIDTH
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT
    
    this.setupEventListeners()
    this.drawStartScreen()
  }
  
  private setupEventListeners() {
    this.boundHandleClick = this.handleClick.bind(this)
    this.boundHandleTouch = this.handleTouch.bind(this)
    this.canvas.addEventListener('click', this.boundHandleClick)
    this.canvas.addEventListener('touchstart', this.boundHandleTouch, { passive: false })
  }
  
  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    this.handleInput(x, y)
  }
  
  private handleTouch(e: TouchEvent) {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = this.canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    this.handleInput(x, y)
  }
  
  private handleInput(x: number, y: number) {
    if (!this.isStarted) {
      this.startGame()
      return
    }
    
    if (this.isGameOver) {
      this.resetGame()
      return
    }
    
    if (isPointInCardArea(x, y)) {
      const cardIndex = getCardIndexAt(x)
      if (cardIndex !== null && cardIndex < AVAILABLE_PLANTS.length) {
        this.selectedPlant = AVAILABLE_PLANTS[cardIndex]
      }
      return
    }
    
    if (isPointInGrid(x, y)) {
      const col = Math.floor(x / GAME_CONFIG.CELL_WIDTH)
      const row = Math.floor((y - GAME_CONFIG.HUD_HEIGHT) / GAME_CONFIG.CELL_HEIGHT)
      
      if (this.selectedPlant && !isPlantAtGrid(this.plants, row, col)) {
        const config = PLANT_CONFIGS[this.selectedPlant]
        if (this.sun >= config.sunCost) {
          const plant = createPlant(this.selectedPlant, { row, col })
          this.plants.push(plant)
          this.sun -= config.sunCost
          
          this.floatingTexts.push(createFloatingText(
            col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2,
            row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT,
            `-${config.sunCost}`,
            '#FFD700'
          ))
        } else {
          this.floatingTexts.push(createFloatingText(x, y, '阳光不足!', '#E53935'))
        }
        this.selectedPlant = null
      }
    }
    
    for (const sun of this.suns) {
      if (!sun.isCollected) {
        const dx = x - sun.x
        const dy = y - sun.y
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          sun.isCollected = true
          this.sun = Math.min(this.sun + 25, LEVELS[this.currentLevel].sunLimit)
          this.particles.push(...createSunPickupEffect(sun.x, sun.y))
          this.floatingTexts.push(createFloatingText(sun.x, sun.y - 20, '+25', '#FFD700'))
        }
      }
    }
  }
  
  private detonateCherryBomb(plant: Plant) {
    this.particles.push(...createZombieDeathEffect(
      plant.gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2,
      plant.gridPos.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2
    ))
    
    const bombX = plant.gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2
    const bombY = plant.gridPos.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2
    
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i]
      const dx = zombie.position.x - bombX
      const dy = zombie.position.y - bombY
      if (Math.sqrt(dx * dx + dy * dy) < 150) {
        this.zombies.splice(i, 1)
        this.applyZombieKillRewards(zombie)
      }
    }
    
    this.floatingTexts.push(createFloatingText(bombX, bombY - 30, '💥 爆炸!', '#FFD700'))
  }
  
  private detonatePotatoMine(plant: Plant) {
    this.particles.push(...createZombieDeathEffect(
      plant.gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2,
      plant.gridPos.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2
    ))
    
    const mineX = plant.gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2
    const mineY = plant.gridPos.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2
    
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i]
      const dx = zombie.position.x - mineX
      const dy = zombie.position.y - mineY
      if (Math.sqrt(dx * dx + dy * dy) < 100) {
        this.zombies.splice(i, 1)
        this.applyZombieKillRewards(zombie)
      }
    }
    
    this.floatingTexts.push(createFloatingText(mineX, mineY - 30, '💥 地雷!', '#FF8C00'))
  }
  
  private startGame() {
    this.isStarted = true
    this.currentLevel = 0
    const levelConfig = LEVELS[this.currentLevel]
    this.waveManager = new WaveManager(levelConfig)
    this.sun = levelConfig.initialSun
    this.waveCooldown = GAME_CONFIG.WAVE_COOLDOWN
    this.gameLoop()
  }
  
  private resetGame() {
    this.plants = []
    this.zombies = []
    this.projectiles = []
    this.suns = []
    this.particles = []
    this.floatingTexts = []
    
    this.sun = 200
    this.lives = 5
    this.wave = 0
    this.score = 0
    this.selectedPlant = null
    this.currentLevel = 0
    this.isGameOver = false
    this.isVictory = false
    this.isStarted = false
    
    cancelAnimationFrame(this.animId)
    
    this.drawStartScreen()
  }
  
  private gameLoop() {
    if (this.isGameOver) return
    
    this.update()
    this.render()
    
    this.animId = requestAnimationFrame(() => this.gameLoop())
  }
  
  private update() {
    const currentTime = Date.now()
    
    this.suns = this.suns.filter(s => !s.isCollected)
    
    if (currentTime - this.lastSunSpawnTime >= GAME_CONFIG.BASE_SUN_INTERVAL) {
      this.spawnSun()
      this.lastSunSpawnTime = currentTime
    }
    
    this.suns.forEach(sun => {
      if (!sun.isCollected) {
        if (sun.y < sun.targetY) {
          sun.vy = 0.5
        } else if (sun.y >= sun.targetY) {
          sun.vy = 0
        }
        sun.y += sun.vy
      }
    })
    
    if (this.waveManager) {
      if (this.waveCooldown > 0) {
        this.waveCooldown -= 16
      } else {
        const spawnResult = this.waveManager.update(16)
        if (spawnResult?.shouldSpawn && spawnResult.zombieType && spawnResult.row !== undefined) {
          const zombie = createZombie(spawnResult.zombieType, spawnResult.row)
          this.zombies.push(zombie)
        }
      }
      
      if (this.waveManager.isWaveComplete() && this.zombies.length === 0) {
        if (this.waveManager.nextWave()) {
          this.wave = this.waveManager.getCurrentWave()
          this.waveCooldown = GAME_CONFIG.WAVE_COOLDOWN
          this.floatingTexts.push(createFloatingText(
            GAME_CONFIG.CANVAS_WIDTH / 2,
            GAME_CONFIG.CANVAS_HEIGHT / 2,
            `第 ${this.wave} 波来袭!`,
            '#FFD700'
          ))
        } else {
          this.isGameOver = true
          this.isVictory = true
        }
      }
    }
    
    const plantUpdate = updatePlants(this.plants, this.zombies, this.projectiles, this.suns, currentTime)
    this.projectiles.push(...plantUpdate.newProjectiles)
    this.plants = plantUpdate.plants
    
    for (const plant of plantUpdate.detonatedPlants) {
      if (plant.type === 'cherry_bomb') {
        this.detonateCherryBomb(plant)
      } else if (plant.type === 'potato_mine') {
        this.detonatePotatoMine(plant)
      }
    }
    
    for (const zombie of plantUpdate.killedZombies) {
      const idx = this.zombies.indexOf(zombie)
      if (idx !== -1) {
        this.zombies.splice(idx, 1)
        this.applyZombieKillRewards(zombie)
      }
    }
    
    const zombieUpdate = updateZombies(this.zombies, this.plants, currentTime)
    this.zombies = zombieUpdate.zombies
    this.plants = zombieUpdate.plants
    
    if (zombieUpdate.zombiesReached > 0) {
      this.lives -= zombieUpdate.zombiesReached
      for (let i = 0; i < zombieUpdate.zombiesReached; i++) {
        this.floatingTexts.push(createFloatingText(
          50,
          GAME_CONFIG.HUD_HEIGHT + 50 + i * 30,
          '-1 ❤️',
          '#E53935'
        ))
      }
      
      if (this.lives <= 0) {
        this.isGameOver = true
        this.isVictory = false
      }
    }
    
    const projUpdate = updateProjectiles(this.projectiles, this.zombies)
    this.projectiles = projUpdate.projectiles
    this.zombies = projUpdate.zombies
    
    projUpdate.killedZombies.forEach(zombie => {
      this.applyZombieKillRewards(zombie)
    })
    
    this.particles = updateParticles(this.particles)
    this.floatingTexts = updateFloatingTexts(this.floatingTexts)
  }
  
  private applyZombieKillRewards(zombie: Zombie) {
    this.score += zombie.reward * 10
    this.sun = Math.min(this.sun + zombie.reward, LEVELS[this.currentLevel].sunLimit)
    
    this.particles.push(...createZombieDeathEffect(zombie.position.x, zombie.position.y))
    this.floatingTexts.push(createFloatingText(
      zombie.position.x,
      zombie.position.y - 30,
      `+${zombie.reward * 10}`,
      '#2ECC71'
    ))
  }
  
  private spawnSun() {
    const x = 100 + Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 200)
    const row = Math.floor(Math.random() * GAME_CONFIG.GRID_ROWS)
    const y = row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2 + 50
    
    this.suns.push({
      id: generateId(),
      x,
      y,
      vy: -2,
      targetY: y - 80,
      isCollected: false,
    })
  }
  
  private render() {
    drawBackground(this.ctx)
    drawPlants(this.ctx, this.plants)
    drawZombies(this.ctx, this.zombies)
    drawProjectiles(this.ctx, this.projectiles)
    drawSuns(this.ctx, this.suns)
    drawParticles(this.ctx, this.particles)
    drawFloatingTexts(this.ctx, this.floatingTexts)
    
    if (this.waveManager) {
      drawUI(
        this.ctx,
        this.sun,
        this.lives,
        this.waveManager.getCurrentWave(),
        this.waveManager.getTotalWaves(),
        this.selectedPlant,
        this.score,
        this.waveManager.getZombiesRemaining() + this.zombies.length
      )
    }
    
    if (this.isGameOver) {
      drawGameOver(this.ctx, this.isVictory, this.score, this.wave)
    }
  }
  
  private drawStartScreen() {
    drawStartScreen(this.ctx)
  }
  
  public destroy() {
    cancelAnimationFrame(this.animId)
    this.canvas.removeEventListener('click', this.boundHandleClick)
    this.canvas.removeEventListener('touchstart', this.boundHandleTouch)
  }
}