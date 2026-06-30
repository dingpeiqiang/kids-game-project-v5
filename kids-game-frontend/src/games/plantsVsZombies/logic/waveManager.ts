import type { ZombieType, LevelConfig } from '../types'
import { ZOMBIE_CONFIGS } from '../config'

interface WaveState {
  waveNumber: number
  zombiesRemaining: number
  spawnTimer: number
  zombiesPerWave: number
  zombieTypes: ZombieType[]
}

export class WaveManager {
  private waveState: WaveState
  private levelConfig: LevelConfig
  private totalWaves: number
  private currentWave: number

  constructor(levelConfig: LevelConfig) {
    this.levelConfig = levelConfig
    this.totalWaves = levelConfig.waves
    this.currentWave = 0
    this.waveState = this.createWaveState(1)
  }

  private createWaveState(waveNumber: number): WaveState {
    const baseZombies = 3 + Math.floor(waveNumber * 1.5)
    const maxZombies = Math.min(baseZombies, 20)
    
    let availableTypes = this.levelConfig.zombieTypes
    if (waveNumber > this.totalWaves * 0.6) {
      availableTypes = this.levelConfig.zombieTypes
    } else if (waveNumber > this.totalWaves * 0.3) {
      availableTypes = this.levelConfig.zombieTypes.slice(0, Math.min(this.levelConfig.zombieTypes.length, 3))
    } else {
      availableTypes = this.levelConfig.zombieTypes.slice(0, Math.min(this.levelConfig.zombieTypes.length, 2))
    }

    return {
      waveNumber,
      zombiesRemaining: maxZombies,
      spawnTimer: 0,
      zombiesPerWave: maxZombies,
      zombieTypes: availableTypes,
    }
  }

  update(deltaTime: number): { shouldSpawn: boolean; zombieType?: ZombieType; row?: number } | null {
    if (this.waveState.zombiesRemaining <= 0) {
      return null
    }

    this.waveState.spawnTimer += deltaTime
    
    const spawnInterval = Math.max(800, 2500 - this.currentWave * 150)
    
    if (this.waveState.spawnTimer >= spawnInterval) {
      this.waveState.spawnTimer = 0
      this.waveState.zombiesRemaining--
      
      const type = this.waveState.zombieTypes[Math.floor(Math.random() * this.waveState.zombieTypes.length)]
      const row = Math.floor(Math.random() * 5)
      
      return { shouldSpawn: true, zombieType: type, row }
    }
    
    return null
  }

  isWaveComplete(): boolean {
    return this.waveState.zombiesRemaining <= 0
  }

  nextWave(): boolean {
    if (this.currentWave >= this.totalWaves) {
      return false
    }
    
    this.currentWave++
    this.waveState = this.createWaveState(this.currentWave)
    return true
  }

  getCurrentWave(): number {
    return this.currentWave
  }

  getTotalWaves(): number {
    return this.totalWaves
  }

  getZombiesRemaining(): number {
    return this.waveState.zombiesRemaining
  }

  isLastWave(): boolean {
    return this.currentWave >= this.totalWaves
  }
}