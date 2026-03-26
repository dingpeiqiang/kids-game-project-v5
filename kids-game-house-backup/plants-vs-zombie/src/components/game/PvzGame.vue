<template>
  <div class="pvz-game-container relative w-full h-screen overflow-hidden bg-green-900">
    <div
      ref="gameContainer"
      class="game-canvas w-full h-full"
    ></div>
    
    <div class="game-ui absolute top-0 left-0 right-0 flex justify-between items-start pointer-events-none px-4 pt-2">
      <ScorePanel 
        :sunCount="gameStore.sunCount" 
        :score="gameStore.score"
        :highScore="gameStore.highScore"
        class="pointer-events-auto"
      />
      
      <div class="flex gap-2 pointer-events-auto">
        <ThemeSelector />
        <SoundToggle />
        <PauseButton />
      </div>
    </div>
    
    <div class="plant-cards absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm px-4 py-3 safe-bottom">
      <div class="flex justify-center gap-2 md:gap-3 max-w-4xl mx-auto">
        <div
          v-for="(plant, index) in plantCards"
          :key="plant.type"
          @click="selectPlantCard(index)"
          :class="[
            'plant-card relative cursor-pointer rounded-xl p-2 transition-all card-hover select-none',
            selectedPlantCard === index 
              ? 'bg-green-500/30 border-2 border-green-400 scale-105' 
              : 'bg-gray-700/50 border-2 border-gray-600 hover:border-gray-500',
            gameStore.sunCount < plant.sunCost ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          <div class="text-3xl md:text-4xl text-center">{{ plant.emoji }}</div>
          <div class="text-xs text-center mt-1 text-yellow-400 font-bold">☀️{{ plant.sunCost }}</div>
          <div class="text-[10px] text-center text-gray-300">{{ plant.nameCN }}</div>
          
          <div 
            v-if="selectedPlantCard === index"
            class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
          >
            {{ plant.description }}
          </div>
        </div>
      </div>
    </div>
    
    <div
      v-if="gameStore.isPaused"
      class="pause-overlay absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div class="text-4xl mb-4">⏸️</div>
        <div class="text-2xl font-bold text-white mb-4">游戏暂停</div>
        <GameButton @click="gameStore.togglePause()" variant="primary">
          继续游戏
        </GameButton>
      </div>
    </div>
    
    <div class="controls-hint absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/60 text-xs pointer-events-none">
      <span>点击卡片选择植物，再点击网格种植</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { PvzPhaserGame } from './PhaserGame'
import ScorePanel from '../ui/ScorePanel.vue'
import PauseButton from '../ui/PauseButton.vue'
import SoundToggle from '../ui/SoundToggle.vue'
import ThemeSelector from '../ui/ThemeSelector.vue'
import GameButton from '../ui/GameButton.vue'
import type { PlantType, Plant, Zombie, Projectile, Sun } from '@/types/game'
import { PLANT_CONFIGS, ZOMBIE_CONFIGS, GAME_CONFIG, type ZombieType } from '@/types/game'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const settingsStore = useSettingsStore()
const themeStore = useThemeStore()

const gameContainer = ref<HTMLElement | null>(null)
let phaserGame: PvzPhaserGame | null = null
let gameLoop: number | null = null
let lastZombieSpawn = 0
let lastSunSpawn = 0
let lastPlantUpdate = 0
let lastProjectileUpdate = 0

const plantCards = computed(() => {
  return Object.entries(PLANT_CONFIGS).map(([type, config]) => ({
    type: type as PlantType,
    ...config
  }))
})

const selectedPlantCard = computed(() => gameStore.selectedPlantCard)

const selectPlantCard = (index: number) => {
  const plant = plantCards.value[index]
  if (gameStore.sunCount >= plant.sunCost) {
    audioStore.playClickSound()
    if (gameStore.selectedPlantCard === index) {
      gameStore.setSelectedPlant(null, null)
    } else {
      gameStore.setSelectedPlant(plant.type as PlantType, index)
    }
  }
}

let zombieIdCounter = 0
let projectileIdCounter = 0
let sunIdCounter = 0
let plantIdCounter = 0
let gameStartTime = 0

onMounted(() => {
  gameStartTime = Date.now()
  audioStore.initAudio()

  // 尝试恢复音频上下文
  if (audioStore.audioContext?.state === 'suspended') {
    audioStore.audioContext.resume().then(() => {
      audioStore.startBGM('game')
    }).catch(() => {})
  } else {
    audioStore.startBGM('game')
  }

  // 用户交互激活音频
  const activateAudio = () => {
    if (audioStore.audioContext?.state === 'suspended') {
      audioStore.audioContext.resume().then(() => {
        if (!audioStore.isBGMPlaying) {
          audioStore.startBGM('game')
        }
      })
    }
    document.removeEventListener('click', activateAudio)
    document.removeEventListener('touchstart', activateAudio)
  }
  document.addEventListener('click', activateAudio)
  document.addEventListener('touchstart', activateAudio)
  
  gameStore.resetGame()
  gameStore.startGame()
  
  if (gameContainer.value) {
    phaserGame = new PvzPhaserGame(gameContainer.value)

    // 先设置回调，再启动游戏
    phaserGame.setPvzCallbacks({
      collectSun: handleSunCollect
    })

    // 应用当前主题
    phaserGame.setTheme(themeStore.getPvZTheme())

    phaserGame.start()

    startGameLoop()

    gameContainer.value.addEventListener('click', handleGameClick)
  }
})

onUnmounted(() => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
  if (phaserGame) {
    phaserGame.destroy()
  }
  if (gameContainer.value) {
    gameContainer.value.removeEventListener('click', handleGameClick)
  }
  audioStore.stopBGM()
})

watch(() => gameStore.isPaused, (paused) => {
  if (paused) {
    audioStore.pauseBGM()
  } else {
    audioStore.resumeBGM()
  }
})

watch(() => gameStore.isGameOver, (gameOver) => {
  if (gameOver) {
    audioStore.stopBGM()
    if (gameStore.isVictory) {
      audioStore.playWinSound()
    } else {
      audioStore.playLoseSound()
    }
    setTimeout(() => {
      router.push('/gameover')
    }, 1000)
  }
})

watch([() => gameStore.plants, () => gameStore.zombies, () => gameStore.projectiles, () => gameStore.suns], () => {
  renderGame()
}, { deep: true })

function startGameLoop() {
  function loop() {
    if (gameStore.isPlaying && !gameStore.isPaused && !gameStore.isGameOver) {
      const now = Date.now()
      const config = gameStore.currentConfig
      const gameTime = now - gameStartTime

      // 随游戏时间增加，僵尸生成速度加快（最快每1.5秒一只）
      const difficultyMultiplier = Math.max(0.3, 1 - gameTime / 180000) // 3分钟后最难
      const spawnInterval = config.zombieSpawnRate * difficultyMultiplier

      if (now - lastZombieSpawn > spawnInterval) {
        spawnZombie()
        // 后期有几率一次生成2只僵尸
        if (gameTime > 60000 && Math.random() < 0.3) {
          setTimeout(spawnZombie, 500)
        }
        lastZombieSpawn = now
      }
      
      if (now - lastSunSpawn > config.sunSpawnRate) {
        spawnNaturalSun()
        lastSunSpawn = now
      }
      
      if (now - lastPlantUpdate > 100) {
        updatePlants(now)
        lastPlantUpdate = now
      }
      
      if (now - lastProjectileUpdate > 50) {
        updateProjectiles()
        updateZombies()
        lastProjectileUpdate = now
      }
      
      gameStore.removeExpiredSuns(now)
      gameStore.updateParticles(0.016)
      
      checkGameEnd()
    }
    
    gameLoop = requestAnimationFrame(loop)
  }
  
  loop()
}

function renderGame() {
  if (!phaserGame) return
  
  phaserGame.renderPlants(gameStore.plants)
  phaserGame.renderZombies(gameStore.zombies)
  phaserGame.renderProjectiles(gameStore.projectiles)
  phaserGame.renderSuns(gameStore.suns)
  phaserGame.renderParticles(gameStore.particles)
}

function handleGameClick(event: MouseEvent) {
  if (!phaserGame || gameStore.isPaused || gameStore.isGameOver) return
  if (!gameStore.selectedPlant) return
  
  const bounds = phaserGame.getGameAreaBounds()
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  
  if (clickX < bounds.x || clickX > bounds.x + bounds.width ||
      clickY < bounds.y || clickY > bounds.y + bounds.height) {
    return
  }
  
  const cellSize = bounds.width / GAME_CONFIG.gridCols
  const col = Math.floor((clickX - bounds.x) / cellSize)
  const row = Math.floor((clickY - bounds.y) / cellSize)
  
  if (row >= 0 && row < GAME_CONFIG.gridRows && col >= 0 && col < GAME_CONFIG.gridCols) {
    placePlant(row, col)
  }
}

function placePlant(row: number, col: number) {
  if (!gameStore.selectedPlant || !gameStore.canPlacePlant(row, col)) return
  
  const plantConfig = PLANT_CONFIGS[gameStore.selectedPlant]
  if (gameStore.sunCount < plantConfig.sunCost) return
  
  plantIdCounter++
  const plant: Plant = {
    id: `plant_${plantIdCounter}`,
    type: gameStore.selectedPlant,
    row,
    col,
    health: plantConfig.health,
    maxHealth: plantConfig.health,
    lastActionTime: Date.now(),
    actionInterval: plantConfig.actionInterval
  }
  
  if (gameStore.placePlant(plant)) {
    audioStore.playPlantSound()
    
    if (gameStore.selectedPlant === 'cherrybomb') {
      setTimeout(() => {
        explodeCherryBomb(plant)
      }, 500)
    }
    
    gameStore.setSelectedPlant(null, null)
  }
}

function explodeCherryBomb(plant: Plant) {
  audioStore.playExplosionSound()
  
  const affectedRows = [plant.row - 1, plant.row, plant.row + 1].filter(r => r >= 0 && r < GAME_CONFIG.gridRows)
  
  gameStore.zombies.forEach(zombie => {
    if (affectedRows.includes(zombie.row)) {
      const bounds = phaserGame!.getGameAreaBounds()
      const cellSize = bounds.width / GAME_CONFIG.gridCols
      const zombieX = bounds.x + zombie.x + cellSize / 2
      const zombieY = bounds.y + zombie.row * cellSize + cellSize / 2
      
      const plantPos = phaserGame!.gridToWorld(plant.row, plant.col)
      const distance = Math.sqrt(Math.pow(zombieX - plantPos.x, 2) + Math.pow(zombieY - plantPos.y, 2))
      
      if (distance < cellSize * 1.5) {
        gameStore.updateZombieHealth(zombie.id, 200)
        gameStore.createParticles(zombieX, zombieY, '#ef4444', 10)
      }
    }
  })
  
  gameStore.removePlant(plant.id)
}

function spawnZombie() {
  zombieIdCounter++
  const row = Math.floor(Math.random() * GAME_CONFIG.gridRows)
  
  const rand = Math.random()
  let type: ZombieType = 'normal'
  if (rand < 0.15) type = 'imp'
  else if (rand < 0.35) type = 'cone'
  else if (rand < 0.5) type = 'bucket'
  
  const config = ZOMBIE_CONFIGS[type]
  const difficultyConfig = gameStore.currentConfig
  
  const zombie: Zombie = {
    id: `zombie_${zombieIdCounter}`,
    type,
    row,
    x: GAME_CONFIG.gridCols * GAME_CONFIG.cellSize,
    health: config.health * difficultyConfig.zombieHealthMultiplier,
    maxHealth: config.health * difficultyConfig.zombieHealthMultiplier,
    speed: config.speed * difficultyConfig.zombieSpeedMultiplier,
    damage: config.damage,
    isFrozen: false,
    freezeTimer: 0
  }
  
  gameStore.addZombie(zombie)
}

function spawnNaturalSun() {
  if (!phaserGame) return
  
  sunIdCounter++
  const bounds = phaserGame.getGameAreaBounds()
  const x = bounds.x + Math.random() * bounds.width * 0.8 + bounds.width * 0.1
  const targetY = bounds.y + Math.random() * bounds.height * 0.6 + bounds.height * 0.2
  
  const sun: Sun = {
    id: `sun_${sunIdCounter}`,
    x,
    y: -50,
    targetY,
    value: GAME_CONFIG.sunValue,
    createdAt: Date.now(),
    expiresAt: Date.now() + GAME_CONFIG.sunLifetime
  }
  
  gameStore.addSunDrop(sun)
}

function updatePlants(now: number) {
  gameStore.plants.forEach(plant => {
    if (plant.type === 'sunflower') {
      if (now - plant.lastActionTime >= plant.actionInterval) {
        produceSun(plant)
        plant.lastActionTime = now
      }
    } else if (plant.type === 'peashooter' || plant.type === 'snowpea') {
      if (now - plant.lastActionTime >= plant.actionInterval) {
        const hasZombieInRow = gameStore.zombies.some(z => z.row === plant.row && z.x > plant.col * GAME_CONFIG.cellSize)
        if (hasZombieInRow) {
          shootPea(plant)
          plant.lastActionTime = now
        }
      }
    }
  })
}

function produceSun(plant: Plant) {
  if (!phaserGame) return
  
  sunIdCounter++
  const pos = phaserGame.gridToWorld(plant.row, plant.col)
  
  const sun: Sun = {
    id: `sun_${sunIdCounter}`,
    x: pos.x,
    y: pos.y - 50,
    targetY: pos.y,
    value: GAME_CONFIG.sunValue,
    createdAt: Date.now(),
    expiresAt: Date.now() + GAME_CONFIG.sunLifetime
  }
  
  gameStore.addSunDrop(sun)
  audioStore.playSunCollectSound()
}

function shootPea(plant: Plant) {
  projectileIdCounter++
  
  const projectile: Projectile = {
    id: `projectile_${projectileIdCounter}`,
    type: plant.type === 'snowpea' ? 'snowpea' : 'pea',
    row: plant.row,
    x: (plant.col + 1) * GAME_CONFIG.cellSize,
    speed: 300,
    damage: 20
  }
  
  gameStore.addProjectile(projectile)
  audioStore.playShootSound()
}

function updateProjectiles() {
  const projectilesToRemove: string[] = []
  
  gameStore.projectiles.forEach(proj => {
    proj.x += proj.speed * 0.016
    
    if (proj.x > GAME_CONFIG.gridCols * GAME_CONFIG.cellSize) {
      projectilesToRemove.push(proj.id)
      return
    }
    
    gameStore.zombies.forEach(zombie => {
      if (zombie.row === proj.row) {
        const zombieLeft = zombie.x
        const zombieRight = zombie.x + GAME_CONFIG.cellSize * 0.8
        
        if (proj.x >= zombieLeft && proj.x <= zombieRight) {
          gameStore.updateZombieHealth(zombie.id, proj.damage)
          audioStore.playZombieHitSound()
          
          if (proj.type === 'snowpea') {
            gameStore.freezeZombie(zombie.id, 2000)
          }
          
          projectilesToRemove.push(proj.id)
          
          const bounds = phaserGame!.getGameAreaBounds()
          const cellSize = bounds.width / GAME_CONFIG.gridCols
          const hitX = bounds.x + proj.x
          const hitY = bounds.y + proj.row * cellSize + cellSize / 2
          gameStore.createParticles(hitX, hitY, proj.type === 'snowpea' ? '#60a5fa' : '#22c55e', 5)
        }
      }
    })
  })
  
  projectilesToRemove.forEach(id => gameStore.removeProjectile(id))
}

function updateZombies() {
  const zombiesToRemove: string[] = []
  
  gameStore.zombies.forEach(zombie => {
    if (zombie.health <= 0) {
      zombiesToRemove.push(zombie.id)
      gameStore.addScore(zombie.type === 'imp' ? 10 : zombie.type === 'normal' ? 20 : zombie.type === 'cone' ? 40 : 60)
      audioStore.playZombieDieSound()
      
      const bounds = phaserGame!.getGameAreaBounds()
      const cellSize = bounds.width / GAME_CONFIG.gridCols
      const zombieX = bounds.x + zombie.x + cellSize / 2
      const zombieY = bounds.y + zombie.row * cellSize + cellSize / 2
      gameStore.createParticles(zombieX, zombieY, ZOMBIE_CONFIGS[zombie.type].color, 8)
      return
    }
    
    let canMove = true
    let moveSpeed = zombie.speed
    
    if (zombie.isFrozen) {
      moveSpeed *= 0.5
      zombie.freezeTimer -= 16
      if (zombie.freezeTimer <= 0) {
        zombie.isFrozen = false
      }
    }
    
    gameStore.plants.forEach(plant => {
      if (plant.row === zombie.row) {
        const plantX = plant.col * GAME_CONFIG.cellSize
        if (zombie.x <= plantX + GAME_CONFIG.cellSize * 0.8 && zombie.x >= plantX - GAME_CONFIG.cellSize * 0.2) {
          canMove = false
          if (Date.now() % 1000 < 100) {
            gameStore.updatePlantHealth(plant.id, zombie.damage)
            if (plant.health <= 0) {
              gameStore.removePlant(plant.id)
            }
          }
        }
      }
    })
    
    if (canMove) {
      zombie.x -= moveSpeed * 0.016
    }
    
    if (zombie.x < 0) {
      gameStore.endGame(false)
    }
  })
  
  zombiesToRemove.forEach(id => gameStore.removeZombie(id))
  
  gameStore.suns.forEach(sun => {
    if (sun.y < sun.targetY) {
      sun.y += 100 * 0.016
      if (sun.y > sun.targetY) {
        sun.y = sun.targetY
      }
    }
  })
}

function checkGameEnd() {
  const zombieCount = gameStore.zombies.length
  if (zombieCount >= 20 && gameStore.score >= 500) {
    gameStore.endGame(true)
  }
}

function handleSunCollect(sunId: string) {
  gameStore.collectSun(sunId)
  audioStore.playSunCollectSound()
}
</script>

<style scoped>
.pvz-game-container {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.game-canvas {
  width: 100%;
  height: 100%;
}

.game-ui {
  z-index: 10;
  background: transparent;
}

.plant-cards {
  z-index: 20;
}

.plant-card {
  min-width: 70px;
}

@media (min-width: 768px) {
  .plant-card {
    min-width: 90px;
  }
}

.pause-overlay {
  z-index: 50;
  animation: fadeIn 0.2s ease;
}

.controls-hint {
  z-index: 10;
  pointer-events: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
