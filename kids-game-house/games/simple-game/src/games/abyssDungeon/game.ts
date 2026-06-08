import type { GameEngine } from '../../services/gameEngine'
import { GAME_CONFIG } from './config'
import { generateDungeon, isWalkable as isTileWalkable, updateVisibility } from './logic/dungeonGenerator'
import { createInitialPlayer, updatePlayerPosition, takeDamage, addExperience, equipItem, useSkill, respawnPlayer } from './logic/player'
import { updateEnemy } from './logic/enemy'
import { handlePlayerAttack, handleEnemyAttack, handleTrapCollision, checkStairsCollision, checkChestInteraction, checkSwitchInteraction, checkBossDefeated, checkAllEnemiesDefeated, updateDamageNumbers } from './logic/combat'
import { saveGame, loadGame, hasSave, createNewGamePlayer } from './logic/save'
import { InputManager } from './logic/input'
import { SceneRenderer } from './render/scene'
import { UIRenderer } from './ui/render'
import type { Player, DungeonLevel, DamageNumber, UIState } from './types'

export class AbyssDungeonGame {
  private engine: GameEngine
  private onEnd: () => void
  private canvas3D: HTMLCanvasElement
  private canvasUI: HTMLCanvasElement
  private sceneRenderer: SceneRenderer
  private uiRenderer: UIRenderer
  private inputManager: InputManager
  private player: Player
  private dungeon: DungeonLevel
  private currentLevel: number
  private highestLevel: number
  private totalScore: number
  private totalKills: number
  private totalGold: number
  private damageNumbers: DamageNumber[] = []
  private cameraZoom: number
  private lastTime: number
  private animationId: number
  private destroyed: boolean = false
  private uiState: UIState = {
    showInventory: false,
    showSkills: false,
    showMap: false,
    showLevelUp: false,
    showVictory: false,
    showGameOver: false,
    notification: null,
    notificationType: 'info',
  }

  constructor(engine: GameEngine, onEnd: () => void) {
    this.engine = engine
    this.onEnd = () => {
      this.cleanup()
      onEnd()
    }

    this.canvas3D = document.getElementById('gameCanvas') as HTMLCanvasElement
    this.canvasUI = document.getElementById('uiCanvas') as HTMLCanvasElement
    
    if (!this.canvas3D || !this.canvasUI) {
      this.createCanvasElements()
    }

    this.sceneRenderer = new SceneRenderer(this.canvas3D)
    this.uiRenderer = new UIRenderer(this.canvasUI)
    this.inputManager = new InputManager()

    this.currentLevel = 1
    this.highestLevel = 1
    this.totalScore = 0
    this.totalKills = 0
    this.totalGold = 0
    this.cameraZoom = GAME_CONFIG.CAMERA_MIN_ZOOM

    this.player = this.loadPlayer()
    this.dungeon = generateDungeon(this.currentLevel)
    this.respawnPlayerAtStart()

    this.setupEventListeners()
    this.lastTime = performance.now()
    this.gameLoop()
  }

  private createCanvasElements(): void {
    this.canvas3D = document.createElement('canvas')
    this.canvas3D.id = 'gameCanvas'
    this.canvas3D.style.position = 'absolute'
    this.canvas3D.style.top = '0'
    this.canvas3D.style.left = '0'
    this.canvas3D.width = window.innerWidth
    this.canvas3D.height = window.innerHeight
    document.body.appendChild(this.canvas3D)

    this.canvasUI = document.createElement('canvas')
    this.canvasUI.id = 'uiCanvas'
    this.canvasUI.style.position = 'absolute'
    this.canvasUI.style.top = '0'
    this.canvasUI.style.left = '0'
    this.canvasUI.width = window.innerWidth
    this.canvasUI.height = window.innerHeight
    document.body.appendChild(this.canvasUI)
  }

  private loadPlayer(): Player {
    if (hasSave()) {
      const saveData = loadGame()
      if (saveData) {
        this.currentLevel = saveData.currentLevel
        this.highestLevel = saveData.highestLevel
        this.totalScore = saveData.totalScore
        this.totalKills = saveData.totalKills
        this.totalGold = saveData.totalGold
        return saveData.player
      }
    }
    return createNewGamePlayer()
  }

  private respawnPlayerAtStart(): void {
    this.player.position = { ...this.dungeon.playerStartPosition }
    this.player.hp = this.player.maxHp
    this.player.mp = this.player.maxMp
    this.player.isDead = false
    this.player.invincibleTime = Date.now() + GAME_CONFIG.INVINCIBLE_DURATION
    updateVisibility(this.dungeon.tiles, this.player.position.x, this.player.position.y)
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'KeyI') {
      this.uiState.showInventory = !this.uiState.showInventory
    } else if (e.code === 'KeyK') {
      this.uiState.showSkills = !this.uiState.showSkills
    } else if (e.code === 'KeyM') {
      this.uiState.showMap = !this.uiState.showMap
    } else if (e.code === 'KeyR') {
      if (this.uiState.showGameOver || this.uiState.showVictory) {
        this.restartGame()
      }
    } else if (e.code === 'Escape') {
      this.onEnd()
    }
  }

  private handleResize(): void {
    if (this.canvas3D && this.canvasUI) {
      this.canvas3D.width = window.innerWidth
      this.canvas3D.height = window.innerHeight
      this.canvasUI.width = window.innerWidth
      this.canvasUI.height = window.innerHeight
      this.sceneRenderer.renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }

  private gameLoop = (): void => {
    if (this.destroyed) return

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    if (!this.uiState.showLevelUp && !this.uiState.showGameOver && !this.uiState.showVictory) {
      this.update(deltaTime, currentTime)
    }

    this.render()

    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number, currentTime: number): void {
    const input = this.inputManager.getState()

    if (input.zoomIn) {
      this.cameraZoom = Math.max(GAME_CONFIG.CAMERA_MIN_ZOOM, this.cameraZoom - GAME_CONFIG.CAMERA_ZOOM_SPEED)
    }
    if (input.zoomOut) {
      this.cameraZoom = Math.min(GAME_CONFIG.CAMERA_MAX_ZOOM, this.cameraZoom + GAME_CONFIG.CAMERA_ZOOM_SPEED)
    }

    if (!this.player.isDead) {
      updatePlayerPosition(this.player, input, deltaTime, (x, y) => isTileWalkable(this.dungeon.tiles, x, y))
      updateVisibility(this.dungeon.tiles, this.player.position.x, this.player.position.y)

      if (input.attack) {
        const attackResult = handlePlayerAttack(this.player, this.dungeon, currentTime)
        this.damageNumbers.push(...attackResult.damageNumbers)
        this.totalKills += attackResult.enemiesKilled
        this.totalScore += attackResult.experienceGained
        this.totalGold += attackResult.goldGained

        const expResult = addExperience(this.player, attackResult.experienceGained)
        if (expResult.leveledUp) {
          this.uiState.showLevelUp = true
        }

        if (attackResult.enemiesKilled > 0) {
          this.showNotification(`Killed ${attackResult.enemiesKilled} enemies!`, 'success')
        }
      }

      if (input.skill) {
        useSkill(this.player, 1, currentTime)
      }

      if (input.interact) {
        this.handleInteraction()
      }

      const trapResult = handleTrapCollision(this.player, this.dungeon, currentTime)
      if (trapResult.hit) {
        takeDamage(this.player, trapResult.damage, currentTime)
        this.damageNumbers.push({
          id: `trap_${Date.now()}`,
          position: { ...this.player.position },
          value: trapResult.damage,
          color: '#ff4444',
          life: 1,
          maxLife: 1,
          velocity: { x: 0, y: -2 },
          isCritical: false,
        })
      }

      const allEnemies = [...this.dungeon.enemies, ...(this.dungeon.boss ? [this.dungeon.boss] : [])]
      for (const enemy of allEnemies) {
        if (enemy.isDead) continue

        const enemyUpdate = updateEnemy(enemy, this.player, this.dungeon.tiles, deltaTime, currentTime)
        if (enemyUpdate.shouldAttack) {
          const attackResult = handleEnemyAttack(this.player, enemy, currentTime)
          if (attackResult.playerHit) {
            takeDamage(this.player, attackResult.damage, currentTime)
            this.damageNumbers.push({
              id: `enemy_${Date.now()}_${enemy.id}`,
              position: { ...this.player.position },
              value: attackResult.damage,
              color: '#ff4444',
              life: 1,
              maxLife: 1,
              velocity: { x: 0, y: -2 },
              isCritical: false,
            })
          }
        }
      }

      if (checkStairsCollision(this.player, this.dungeon) && checkBossDefeated(this.dungeon)) {
        this.nextLevel()
      }

      this.player.skills.forEach(skill => {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown -= deltaTime * 1000
          if (skill.currentCooldown < 0) skill.currentCooldown = 0
        }
      })

      this.player.mp += deltaTime * 2
      if (this.player.mp > this.player.maxMp) {
        this.player.mp = this.player.maxMp
      }
    }

    if (this.player.isDead) {
      this.uiState.showGameOver = true
      saveGame(
        this.player,
        this.currentLevel,
        this.highestLevel,
        this.totalScore,
        this.totalKills,
        this.totalGold,
        this.player.inventory
      )
    }

    this.damageNumbers = updateDamageNumbers(this.damageNumbers, deltaTime)

    this.sceneRenderer.updateCamera(this.player.position.x, this.player.position.y, this.cameraZoom)
    this.sceneRenderer.updateVisibility(this.dungeon)
  }

  private handleInteraction(): void {
    const chestId = checkChestInteraction(this.player, this.dungeon)
    if (chestId) {
      const chest = this.dungeon.chests.find(c => c.id === chestId)
      if (chest && !chest.opened) {
        chest.opened = true
        this.showNotification(`Opened chest!`, 'success')
        this.totalScore += chest.rarity === 'rare' ? 100 : 50
      }
      return
    }

    const switchId = checkSwitchInteraction(this.player, this.dungeon)
    if (switchId) {
      const sw = this.dungeon.switches.find(s => s.id === switchId)
      if (sw && !sw.activated) {
        sw.activated = true
        const door = this.dungeon.doors.find(d => d.id === sw.targetDoorId)
        if (door) {
          door.locked = false
          door.opened = true
          this.showNotification('Door unlocked!', 'success')
        }
      }
    }
  }

  private nextLevel(): void {
    if (this.currentLevel >= GAME_CONFIG.MAX_LEVELS) {
      this.uiState.showVictory = true
      saveGame(
        this.player,
        this.currentLevel,
        this.currentLevel,
        this.totalScore,
        this.totalKills,
        this.totalGold,
        this.player.inventory
      )
      return
    }

    this.currentLevel++
    if (this.currentLevel > this.highestLevel) {
      this.highestLevel = this.currentLevel
    }

    this.dungeon = generateDungeon(this.currentLevel)
    this.respawnPlayerAtStart()

    this.showNotification(`Entering Floor ${this.currentLevel}!`, 'info')
    saveGame(
      this.player,
      this.currentLevel,
      this.highestLevel,
      this.totalScore,
      this.totalKills,
      this.totalGold,
      this.player.inventory
    )
  }

  private restartGame(): void {
    this.currentLevel = 1
    this.totalScore = 0
    this.totalKills = 0
    this.totalGold = 0
    this.player = createNewGamePlayer()
    this.dungeon = generateDungeon(this.currentLevel)
    this.respawnPlayerAtStart()
    this.uiState = {
      showInventory: false,
      showSkills: false,
      showMap: false,
      showLevelUp: false,
      showVictory: false,
      showGameOver: false,
      notification: null,
      notificationType: 'info',
    }
    this.damageNumbers = []
  }

  private showNotification(message: string, type: UIState['notificationType']): void {
    this.uiState.notification = message
    this.uiState.notificationType = type
    setTimeout(() => {
      this.uiState.notification = null
    }, 3000)
  }

  private render(): void {
    this.sceneRenderer.renderDungeon(this.dungeon)
    this.sceneRenderer.renderPlayer(this.player)

    const allEnemies = [...this.dungeon.enemies, ...(this.dungeon.boss ? [this.dungeon.boss] : [])]
    for (const enemy of allEnemies) {
      this.sceneRenderer.renderEnemy(enemy)
    }

    this.sceneRenderer.render()

    this.uiRenderer.setState(this.uiState)
    this.uiRenderer.render(this.player, this.dungeon, this.damageNumbers, this.totalScore)
  }

  private cleanup(): void {
    this.destroyed = true
    cancelAnimationFrame(this.animationId)
    this.inputManager.destroy()
    this.sceneRenderer.dispose()
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('resize', this.handleResize.bind(this))
    
    if (this.canvas3D && this.canvas3D.parentNode) {
      this.canvas3D.parentNode.removeChild(this.canvas3D)
    }
    if (this.canvasUI && this.canvasUI.parentNode) {
      this.canvasUI.parentNode.removeChild(this.canvasUI)
    }
  }
}