import type { Player, UIState, DamageNumber, DungeonLevel } from '../types'
import { GAME_CONFIG, UI_CONFIG, LEVEL_DESIGN } from '../config'

export class UIRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private uiState: UIState

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
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
  }

  render(player: Player, dungeon: DungeonLevel, damageNumbers: DamageNumber[], score: number): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.renderTopBar(player, dungeon, score)
    this.renderDamageNumbers(damageNumbers)
    
    if (this.uiState.showInventory) {
      this.renderInventory(player)
    }
    
    if (this.uiState.showSkills) {
      this.renderSkills(player)
    }
    
    if (this.uiState.showMap) {
      this.renderMap(dungeon, player)
    }
    
    if (this.uiState.showLevelUp) {
      this.renderLevelUp(player)
    }
    
    if (this.uiState.showVictory) {
      this.renderVictory(score)
    }
    
    if (this.uiState.showGameOver) {
      this.renderGameOver(player)
    }
    
    if (this.uiState.notification) {
      this.renderNotification()
    }
    
    this.renderTouchControls()
  }

  private renderTopBar(player: Player, dungeon: DungeonLevel, score: number): void {
    const x = 20
    let y = 20

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(x, y, UI_CONFIG.healthBarWidth + 10, 60)

    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Floor ${dungeon.level} - ${LEVEL_DESIGN[dungeon.level as keyof typeof LEVEL_DESIGN]?.name || 'Unknown'}`, x + 5, y + 15)

    const healthPercent = player.hp / player.maxHp
    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(x + 5, y + 25, UI_CONFIG.healthBarWidth, UI_CONFIG.healthBarHeight)
    this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336'
    this.ctx.fillRect(x + 5, y + 25, UI_CONFIG.healthBarWidth * healthPercent, UI_CONFIG.healthBarHeight)
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x + 5, y + 25, UI_CONFIG.healthBarWidth, UI_CONFIG.healthBarHeight)
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 12px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`${player.hp}/${player.maxHp}`, x + UI_CONFIG.healthBarWidth / 2, y + 40)

    const manaPercent = player.mp / player.maxMp
    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(x + 5, y + 50, UI_CONFIG.manaBarWidth, UI_CONFIG.manaBarHeight)
    this.ctx.fillStyle = '#2196F3'
    this.ctx.fillRect(x + 5, y + 50, UI_CONFIG.manaBarWidth * manaPercent, UI_CONFIG.manaBarHeight)
    this.ctx.strokeStyle = '#fff'
    this.ctx.strokeRect(x + 5, y + 50, UI_CONFIG.manaBarWidth, UI_CONFIG.manaBarHeight)

    y += 70

    const expPercent = player.experience / player.experienceToNextLevel
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(x, y, UI_CONFIG.expBarWidth + 10, 25)
    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(x + 5, y + 5, UI_CONFIG.expBarWidth, UI_CONFIG.expBarHeight)
    this.ctx.fillStyle = '#9C27B0'
    this.ctx.fillRect(x + 5, y + 5, UI_CONFIG.expBarWidth * expPercent, UI_CONFIG.expBarHeight)
    this.ctx.strokeStyle = '#fff'
    this.ctx.strokeRect(x + 5, y + 5, UI_CONFIG.expBarWidth, UI_CONFIG.expBarHeight)
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 10px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Lv.${player.level}`, x + 5, y + 22)
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`${player.experience}/${player.experienceToNextLevel}`, x + UI_CONFIG.expBarWidth + 3, y + 22)

    const rightX = this.canvas.width - 120
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(rightX, 20, 100, 40)
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`💰 ${player.gold}`, rightX + 50, 48)

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(rightX, 70, 100, 40)
    this.ctx.fillStyle = '#fff'
    this.ctx.fillText(`Score: ${score}`, rightX + 50, 98)
  }

  private renderDamageNumbers(damageNumbers: DamageNumber[]): void {
    for (const dmg of damageNumbers) {
      const x = (dmg.position.x / GAME_CONFIG.MAP_WIDTH) * this.canvas.width
      const y = (1 - dmg.position.y / GAME_CONFIG.MAP_HEIGHT) * this.canvas.height
      
      this.ctx.globalAlpha = dmg.life
      this.ctx.fillStyle = dmg.color
      this.ctx.font = `bold ${dmg.isCritical ? '24px' : '18px'} Arial`
      this.ctx.textAlign = 'center'
      this.ctx.fillText(
        dmg.isCritical ? `💥${dmg.value}` : `-${dmg.value}`,
        x,
        y - (1 - dmg.life) * 30
      )
    }
    this.ctx.globalAlpha = 1
  }

  private renderInventory(player: Player): void {
    const panelX = (this.canvas.width - 400) / 2
    const panelY = (this.canvas.height - 400) / 2
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(panelX, panelY, 400, 400)
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(panelX, panelY, 400, 400)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Inventory', panelX + 200, panelY + 30)

    let y = panelY + 60
    
    this.ctx.fillStyle = '#666'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText('Equipped:', panelX + 20, y)
    y += 50

    const slots = [
      { item: player.equippedWeapon, label: 'Weapon' },
      { item: player.equippedArmor, label: 'Armor' },
      { item: player.equippedAccessory, label: 'Accessory' },
    ]

    for (const slot of slots) {
      this.ctx.fillStyle = '#333'
      this.ctx.fillRect(panelX + 20, y, 80, 80)
      this.ctx.strokeStyle = slot.item ? this.getRarityColor(slot.item.rarity) : '#666'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(panelX + 20, y, 80, 80)
      
      if (slot.item) {
        this.ctx.font = '36px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(slot.item.icon, panelX + 60, y + 55)
      }
      
      this.ctx.fillStyle = '#fff'
      this.ctx.font = '10px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(slot.label, panelX + 110, y + 20)
      if (slot.item) {
        this.ctx.fillText(slot.item.name, panelX + 110, y + 40)
      }
      y += 90
    }

    y = panelY + 280
    this.ctx.fillStyle = '#666'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillText('Inventory:', panelX + 20, y)
    y += 30

    const cols = 4
    const rows = Math.ceil(player.inventory.length / cols)
    
    for (let i = 0; i < player.inventory.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const itemX = panelX + 20 + col * 85
      const itemY = y + row * 85
      
      const item = player.inventory[i]
      this.ctx.fillStyle = '#333'
      this.ctx.fillRect(itemX, itemY, 80, 80)
      this.ctx.strokeStyle = this.getRarityColor(item.rarity)
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(itemX, itemY, 80, 80)
      
      this.ctx.font = '36px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(item.icon, itemX + 40, itemY + 55)
    }

    this.ctx.fillStyle = '#fff'
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Press [I] to close', panelX + 200, panelY + 380)
  }

  private renderSkills(player: Player): void {
    const panelX = (this.canvas.width - 400) / 2
    const panelY = (this.canvas.height - 300) / 2
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(panelX, panelY, 400, 300)
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(panelX, panelY, 400, 300)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Skills', panelX + 200, panelY + 30)

    let y = panelY + 60
    
    for (const skill of player.skills) {
      const skillX = panelX + 20
      
      if (!skill.unlocked) {
        this.ctx.fillStyle = '#333'
        this.ctx.fillRect(skillX, y, 60, 60)
        this.ctx.fillStyle = '#666'
        this.ctx.font = '30px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('🔒', skillX + 30, y + 40)
      } else {
        this.ctx.fillStyle = '#444'
        this.ctx.fillRect(skillX, y, 60, 60)
        
        if (skill.currentCooldown > 0) {
          const cdPercent = skill.currentCooldown / skill.cooldown
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          this.ctx.fillRect(skillX, y + 60 * (1 - cdPercent), 60, 60 * cdPercent)
        }
        
        this.ctx.font = '30px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(skill.icon, skillX + 30, y + 40)
      }
      
      this.ctx.fillStyle = skill.unlocked ? '#fff' : '#666'
      this.ctx.font = 'bold 12px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(skill.name, skillX + 70, y + 20)
      this.ctx.font = '10px Arial'
      this.ctx.fillText(skill.description, skillX + 70, y + 35)
      this.ctx.fillText(`MP: ${skill.manaCost} | CD: ${skill.cooldown / 1000}s`, skillX + 70, y + 50)
      
      y += 70
    }

    this.ctx.fillStyle = '#fff'
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Press [K] to close', panelX + 200, panelY + 280)
  }

  private renderMap(dungeon: DungeonLevel, player: Player): void {
    const mapX = this.canvas.width - UI_CONFIG.minimapSize - 20
    const mapY = 120
    const tileSize = UI_CONFIG.minimapSize / Math.max(dungeon.width, dungeon.height)
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(mapX, mapY, UI_CONFIG.minimapSize, UI_CONFIG.minimapSize)
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(mapX, mapY, UI_CONFIG.minimapSize, UI_CONFIG.minimapSize)
    
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.tiles[y][x]
        if (!tile.explored) continue
        
        const px = mapX + x * tileSize
        const py = mapY + y * tileSize
        
        if (tile.type === 'wall') {
          this.ctx.fillStyle = tile.visible ? '#555' : '#333'
        } else if (tile.type === 'floor') {
          this.ctx.fillStyle = tile.visible ? '#444' : '#222'
        } else if (tile.type === 'chest') {
          this.ctx.fillStyle = '#FFD700'
        } else if (tile.type === 'trap') {
          this.ctx.fillStyle = '#ff4444'
        }
        
        this.ctx.fillRect(px, py, tileSize, tileSize)
      }
    }
    
    this.ctx.fillStyle = '#4488ff'
    const playerX = mapX + player.position.x * tileSize
    const playerY = mapY + player.position.y * tileSize
    this.ctx.beginPath()
    this.ctx.arc(playerX + tileSize / 2, playerY + tileSize / 2, tileSize / 2, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.fillStyle = '#8888ff'
    const stairsX = mapX + dungeon.stairsPosition.x * tileSize
    const stairsY = mapY + dungeon.stairsPosition.y * tileSize
    this.ctx.beginPath()
    this.ctx.arc(stairsX + tileSize / 2, stairsY + tileSize / 2, tileSize / 2, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private renderLevelUp(player: Player): void {
    const x = (this.canvas.width - 300) / 2
    const y = (this.canvas.height - 200) / 2
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(x, y, 300, 200)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, 300, 200)
    
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 32px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('LEVEL UP!', x + 150, y + 60)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.fillText(`Level ${player.level}`, x + 150, y + 100)
    
    this.ctx.font = '16px Arial'
    const stats = ['Strength', 'Agility', 'Constitution', 'Perception']
    const values = [player.strength, player.agility, player.constitution, player.perception]
    let statY = y + 130
    
    for (let i = 0; i < stats.length; i++) {
      this.ctx.fillText(`${stats[i]}: +${GAME_CONFIG.LEVEL_UP_STATS[stats[i].toLowerCase() as keyof typeof GAME_CONFIG.LEVEL_UP_STATS]}`, x + 150, statY)
      statY += 20
    }
    
    this.ctx.fillStyle = '#666'
    this.ctx.font = '12px Arial'
    this.ctx.fillText('Press any key to continue', x + 150, y + 180)
  }

  private renderVictory(score: number): void {
    const x = (this.canvas.width - 400) / 2
    const y = (this.canvas.height - 300) / 2
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    this.ctx.fillRect(x, y, 400, 300)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(x, y, 400, 300)
    
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('🏆', x + 200, y + 80)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 36px Arial'
    this.ctx.fillText('VICTORY!', x + 200, y + 140)
    
    this.ctx.font = 'bold 24px Arial'
    this.ctx.fillText('You conquered the Abyss Dungeon!', x + 200, y + 190)
    
    this.ctx.font = 'bold 20px Arial'
    this.ctx.fillStyle = '#FFD700'
    this.ctx.fillText(`Final Score: ${score}`, x + 200, y + 240)
    
    this.ctx.fillStyle = '#666'
    this.ctx.font = '14px Arial'
    this.ctx.fillText('Press R to restart or ESC to exit', x + 200, y + 280)
  }

  private renderGameOver(player: Player): void {
    const x = (this.canvas.width - 400) / 2
    const y = (this.canvas.height - 300) / 2
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    this.ctx.fillRect(x, y, 400, 300)
    this.ctx.strokeStyle = '#F44336'
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(x, y, 400, 300)
    
    this.ctx.fillStyle = '#F44336'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('💀', x + 200, y + 80)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 36px Arial'
    this.ctx.fillText('GAME OVER', x + 200, y + 140)
    
    this.ctx.font = '20px Arial'
    this.ctx.fillText(`You reached Floor ${player.level}`, x + 200, y + 190)
    this.ctx.fillText(`Final Level: ${player.level}`, x + 200, y + 220)
    
    this.ctx.fillStyle = '#666'
    this.ctx.font = '14px Arial'
    this.ctx.fillText('Press R to restart or ESC to exit', x + 200, y + 280)
  }

  private renderNotification(): void {
    const x = (this.canvas.width - 300) / 2
    const y = this.canvas.height / 2 - 50
    
    const colors: Record<string, string> = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    }
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(x, y, 300, 100)
    this.ctx.strokeStyle = colors[this.uiState.notificationType]
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, 300, 100)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 18px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.uiState.notification || '', x + 150, y + 60)
  }

  private renderTouchControls(): void {
    const isTouchDevice = 'ontouchstart' in window
    
    if (!isTouchDevice) return
    
    const btnSize = 70
    const offset = 20
    
    const leftX = offset
    const rightX = this.canvas.width - btnSize - offset
    const bottomY = this.canvas.height - btnSize - offset
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    this.ctx.beginPath()
    this.ctx.arc(leftX + btnSize / 2, bottomY, btnSize / 2, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    this.ctx.fillText('⬆', leftX + btnSize / 2, bottomY - btnSize)
    this.ctx.fillText('⬇', leftX + btnSize / 2, bottomY + btnSize)
    this.ctx.fillText('⬅', leftX, bottomY)
    this.ctx.fillText('➡', leftX + btnSize, bottomY)
    
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    this.ctx.beginPath()
    this.ctx.arc(rightX + btnSize / 2, bottomY - btnSize - offset, btnSize / 2, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = '#fff'
    this.ctx.fillText('⚔️', rightX + btnSize / 2, bottomY - btnSize - offset)
    
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
    this.ctx.beginPath()
    this.ctx.arc(rightX + btnSize / 2, bottomY, btnSize / 2, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = '#fff'
    this.ctx.fillText('💫', rightX + btnSize / 2, bottomY)
    
    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'
    this.ctx.beginPath()
    this.ctx.arc(rightX + btnSize / 2, bottomY + btnSize + offset, btnSize / 2, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = '#fff'
    this.ctx.fillText('✅', rightX + btnSize / 2, bottomY + btnSize + offset)
  }

  private getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      common: '#aaaaaa',
      uncommon: '#00ff88',
      rare: '#4488ff',
    }
    return colors[rarity] || '#ffffff'
  }

  setState(state: Partial<UIState>): void {
    this.uiState = { ...this.uiState, ...state }
  }

  getState(): UIState {
    return { ...this.uiState }
  }
}