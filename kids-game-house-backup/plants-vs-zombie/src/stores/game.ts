import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Difficulty, 
  Plant, 
  Zombie, 
  Projectile, 
  Sun, 
  Particle,
  PlantType,
  GridPosition
} from '@/types/game'
import { DIFFICULTY_CONFIGS, GAME_CONFIG } from '@/types/game'

export const useGameStore = defineStore('game', () => {
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const isVictory = ref(false)
  const score = ref(0)
  const highScore = ref(0)
  const playCount = ref(0)
  const difficulty = ref<Difficulty>('medium')
  const sunCount = ref(GAME_CONFIG.initialSun)
  
  const plants = ref<Plant[]>([])
  const zombies = ref<Zombie[]>([])
  const projectiles = ref<Projectile[]>([])
  const suns = ref<Sun[]>([])
  const particles = ref<Particle[]>([])
  
  const selectedPlant = ref<PlantType | null>(null)
  const selectedPlantCard = ref<number | null>(null)

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('pvz-game-state')
      if (saved) {
        const data = JSON.parse(saved)
        highScore.value = data.highScore || 0
        playCount.value = data.playCount || 0
        difficulty.value = data.difficulty || 'medium'
      }
    } catch (e) {
      console.error('Failed to load game state:', e)
    }
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem('pvz-game-state', JSON.stringify({
        highScore: highScore.value,
        playCount: playCount.value,
        difficulty: difficulty.value
      }))
    } catch (e) {
      console.error('Failed to save game state:', e)
    }
  }

  const startGame = () => {
    score.value = 0
    sunCount.value = GAME_CONFIG.initialSun
    isPlaying.value = true
    isPaused.value = false
    isGameOver.value = false
    isVictory.value = false
    plants.value = []
    zombies.value = []
    projectiles.value = []
    suns.value = []
    particles.value = []
    selectedPlant.value = null
    selectedPlantCard.value = null
    playCount.value++
    saveToStorage()
  }

  const endGame = (victory: boolean = false) => {
    isPlaying.value = false
    isGameOver.value = true
    isVictory.value = victory
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
  }

  const togglePause = () => {
    isPaused.value = !isPaused.value
  }

  const addScore = (points: number) => {
    score.value += points
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
  }

  const addSun = (amount: number) => {
    sunCount.value = Math.max(0, sunCount.value + amount)
  }

  const spendSun = (amount: number): boolean => {
    if (sunCount.value >= amount) {
      sunCount.value -= amount
      return true
    }
    return false
  }

  const setSelectedPlant = (plantType: PlantType | null, cardIndex: number | null = null) => {
    selectedPlant.value = plantType
    selectedPlantCard.value = cardIndex
  }

  const canPlacePlant = (row: number, col: number): boolean => {
    return !plants.value.some(p => p.row === row && p.col === col)
  }

  const placePlant = (plant: Plant): boolean => {
    if (!selectedPlant.value) return false
    if (!canPlacePlant(plant.row, plant.col)) return false
    
    const plantConfig = getPlantConfig(selectedPlant.value)
    if (!spendSun(plantConfig.sunCost)) return false
    
    plants.value.push(plant)
    return true
  }

  const removePlant = (id: string) => {
    plants.value = plants.value.filter(p => p.id !== id)
  }

  const addZombie = (zombie: Zombie) => {
    zombies.value.push(zombie)
  }

  const removeZombie = (id: string) => {
    zombies.value = zombies.value.filter(z => z.id !== id)
  }

  const addProjectile = (projectile: Projectile) => {
    projectiles.value.push(projectile)
  }

  const removeProjectile = (id: string) => {
    projectiles.value = projectiles.value.filter(p => p.id !== id)
  }

  const addSunDrop = (sun: Sun) => {
    suns.value.push(sun)
  }

  const collectSun = (id: string) => {
    const sun = suns.value.find(s => s.id === id)
    if (sun) {
      addSun(sun.value)
      suns.value = suns.value.filter(s => s.id !== id)
    }
  }

  const removeExpiredSuns = (currentTime: number) => {
    suns.value = suns.value.filter(s => s.expiresAt > currentTime)
  }

  const updatePlantHealth = (id: string, damage: number) => {
    const plant = plants.value.find(p => p.id === id)
    if (plant) {
      plant.health -= damage
    }
  }

  const updateZombieHealth = (id: string, damage: number) => {
    const zombie = zombies.value.find(z => z.id === id)
    if (zombie) {
      zombie.health -= damage
    }
  }

  const freezeZombie = (id: string, duration: number) => {
    const zombie = zombies.value.find(z => z.id === id)
    if (zombie) {
      zombie.isFrozen = true
      zombie.freezeTimer = duration
    }
  }

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      particles.value.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 1,
        color,
        size: Math.random() * 5 + 3
      })
    }
  }

  const updateParticles = (delta: number) => {
    particles.value = particles.value.filter(p => {
      p.x += p.vx * delta
      p.y += p.vy * delta
      p.life -= delta * 2
      return p.life > 0
    })
  }

  const getPlantConfig = (type: PlantType) => {
    const configs = {
      sunflower: { sunCost: 50, health: 100, actionInterval: 5000 },
      peashooter: { sunCost: 100, health: 100, damage: 20, actionInterval: 1500 },
      wallnut: { sunCost: 50, health: 400, actionInterval: 0 },
      cherrybomb: { sunCost: 150, health: 100, damage: 200, actionInterval: 1000 },
      snowpea: { sunCost: 175, health: 100, damage: 20, actionInterval: 1500 }
    }
    return configs[type]
  }

  const currentConfig = computed(() => DIFFICULTY_CONFIGS[difficulty.value])

  const setDifficulty = (diff: Difficulty) => {
    difficulty.value = diff
    saveToStorage()
  }

  const resetGame = () => {
    isPlaying.value = false
    isPaused.value = false
    isGameOver.value = false
    isVictory.value = false
    score.value = 0
    sunCount.value = GAME_CONFIG.initialSun
    plants.value = []
    zombies.value = []
    projectiles.value = []
    suns.value = []
    particles.value = []
    selectedPlant.value = null
    selectedPlantCard.value = null
  }

  loadFromStorage()

  return {
    isPlaying,
    isPaused,
    isGameOver,
    isVictory,
    score,
    highScore,
    playCount,
    difficulty,
    sunCount,
    plants,
    zombies,
    projectiles,
    suns,
    particles,
    selectedPlant,
    selectedPlantCard,
    startGame,
    endGame,
    togglePause,
    addScore,
    addSun,
    spendSun,
    setSelectedPlant,
    canPlacePlant,
    placePlant,
    removePlant,
    addZombie,
    removeZombie,
    addProjectile,
    removeProjectile,
    addSunDrop,
    collectSun,
    removeExpiredSuns,
    updatePlantHealth,
    updateZombieHealth,
    freezeZombie,
    createParticles,
    updateParticles,
    getPlantConfig,
    setDifficulty,
    resetGame,
    currentConfig
  }
})
