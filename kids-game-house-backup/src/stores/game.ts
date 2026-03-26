import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Tank {
  id: number
  type: 'player' | 'enemy_basic' | 'enemy_fast' | 'enemy_heavy'
  x: number
  y: number
  direction: 'up' | 'down' | 'left' | 'right'
  health: number
  speed: number
}

export interface Bullet {
  id: number
  ownerId: number
  x: number
  y: number
  direction: 'up' | 'down' | 'left' | 'right'
  isPlayerBullet: boolean
  speed: number
}

export interface Wall {
  id: number
  type: 'brick' | 'steel' | 'grass' | 'water'
  x: number
  y: number
  health?: number
}

export interface PowerUp {
  id: number
  type: 'star' | 'clock' | 'shovel' | 'life'
  x: number
  y: number
}

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const gameState = ref<'menu' | 'playing' | 'paused' | 'gameover' | 'victory'>('menu')
  
  // 关卡信息
  const currentLevel = ref(1)
  const score = ref(0)
  const lives = ref(3)
  
  // 游戏对象
  const player = ref<Tank | null>(null)
  const enemies = ref<Tank[]>([])
  const bullets = ref<Bullet[]>([])
  const walls = ref<Wall[]>([])
  const powerUps = ref<PowerUp[]>([])
  
  // 基地状态
  const basePosition = ref({ x: 12, y: 34 }) // 网格坐标
  const baseDestroyed = ref(false)
  
  // 敌人剩余数量
  const remainingEnemies = ref(20)
  
  // 游戏设置
  const gridSize = ref(30) // 每格 30px
  const gridWidth = ref(24) // 24 格宽
  const gridHeight = ref(36) // 36 格高
  
  // 动作方法
  function startGame(level: number = 1) {
    currentLevel.value = level
    score.value = 0
    lives.value = 3
    gameState.value = 'playing'
    initLevel(level)
  }
  
  function pauseGame() {
    if (gameState.value === 'playing') {
      gameState.value = 'paused'
    }
  }
  
  function resumeGame() {
    if (gameState.value === 'paused') {
      gameState.value = 'playing'
    }
  }
  
  function gameOver() {
    gameState.value = 'gameover'
  }
  
  function victory() {
    gameState.value = 'victory'
    score.value += 1000 // 通关奖励
  }
  
  function initLevel(level: number) {
    // 初始化玩家坦克
    player.value = {
      id: 1,
      type: 'player',
      x: 11 * gridSize.value, // 中间偏左
      y: 34 * gridSize.value,
      direction: 'up',
      health: 1,
      speed: 3
    }
    
    // 清空敌人
    enemies.value = []
    bullets.value = []
    powerUps.value = []
    baseDestroyed.value = false
    
    // 根据关卡生成敌人和地形
    generateEnemies(level)
    generateWalls(level)
  }
  
  function generateEnemies(level: number) {
    const enemyCount = Math.min(5 + level * 2, 20) // 随关卡增加
    remainingEnemies.value = enemyCount
    
    for (let i = 0; i < Math.min(enemyCount, 4); i++) {
      spawnEnemy(i)
    }
  }
  
  function spawnEnemy(index: number) {
    const types: Array<'enemy_basic' | 'enemy_fast' | 'enemy_heavy'> = ['enemy_basic', 'enemy_fast', 'enemy_heavy']
    const typeIndex = Math.random() < 0.6 ? 0 : Math.random() < 0.8 ? 1 : 2
    
    const enemy: Tank = {
      id: Date.now() + index,
      type: types[typeIndex],
      x: (index % 3) * 8 * gridSize.value, // 顶部三个出生点
      y: 0,
      direction: 'down',
      health: typeIndex === 2 ? 3 : 1,
      speed: typeIndex === 1 ? 4 : typeIndex === 2 ? 1 : 2
    }
    
    enemies.value.push(enemy)
  }
  
  function generateWalls(level: number) {
    walls.value = []
    
    // 基地周围墙
    const baseX = basePosition.value.x
    const baseY = basePosition.value.y
    
    // 砖墙
    for (let i = 0; i < 20 + level * 5; i++) {
      walls.value.push({
        id: Date.now() + i,
        type: 'brick',
        x: Math.floor(Math.random() * gridWidth.value),
        y: Math.floor(Math.random() * (gridHeight.value - 10)) + 5
      })
    }
    
    // 钢墙 (少量)
    for (let i = 0; i < 5 + level; i++) {
      walls.value.push({
        id: Date.now() + 1000 + i,
        type: 'steel',
        x: Math.floor(Math.random() * gridWidth.value),
        y: Math.floor(Math.random() * (gridHeight.value - 10)) + 5
      })
    }
    
    // 草地
    for (let i = 0; i < 10; i++) {
      walls.value.push({
        id: Date.now() + 2000 + i,
        type: 'grass',
        x: Math.floor(Math.random() * gridWidth.value),
        y: Math.floor(Math.random() * gridHeight.value)
      })
    }
    
    // 水域
    for (let i = 0; i < 5; i++) {
      walls.value.push({
        id: Date.now() + 3000 + i,
        type: 'water',
        x: Math.floor(Math.random() * gridWidth.value),
        y: Math.floor(Math.random() * gridHeight.value)
      })
    }
  }
  
  function updatePlayerPosition(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right') {
    if (player.value) {
      player.value.x = x
      player.value.y = y
      player.value.direction = direction
    }
  }
  
  function shootBullet(isPlayer: boolean) {
    const tank = isPlayer ? player.value : enemies.value[0]
    if (!tank) return
    
    const bullet: Bullet = {
      id: Date.now(),
      ownerId: tank.id,
      x: tank.x,
      y: tank.y,
      direction: tank.direction,
      isPlayerBullet: isPlayer,
      speed: isPlayer ? 8 : 6
    }
    
    bullets.value.push(bullet)
  }
  
  function removeBullet(bulletId: number) {
    bullets.value = bullets.value.filter(b => b.id !== bulletId)
  }
  
  function damageEnemy(enemyId: number, damage: number = 1) {
    const enemy = enemies.value.find(e => e.id === enemyId)
    if (enemy) {
      enemy.health -= damage
      if (enemy.health <= 0) {
        removeEnemy(enemyId)
        score.value += enemy.type === 'enemy_heavy' ? 300 : enemy.type === 'enemy_fast' ? 200 : 100
        
        // 生成道具 (10% 概率)
        if (Math.random() < 0.1) {
          spawnPowerUp(enemy.x, enemy.y)
        }
        
        // 检查胜利条件
        if (remainingEnemies.value <= 0 && enemies.value.length === 0) {
          victory()
        }
      }
    }
  }
  
  function removeEnemy(enemyId: number) {
    enemies.value = enemies.value.filter(e => e.id !== enemyId)
    
    // 生成新敌人
    if (remainingEnemies.value > 0 && enemies.value.length < 4) {
      remainingEnemies.value--
      spawnEnemy(enemies.value.length)
    }
  }
  
  function spawnPowerUp(x: number, y: number) {
    const types: Array<'star' | 'clock' | 'shovel' | 'life'> = ['star', 'clock', 'shovel', 'life']
    const type = types[Math.floor(Math.random() * types.length)]
    
    powerUps.value.push({
      id: Date.now(),
      type,
      x,
      y
    })
  }
  
  function collectPowerUp(powerUpId: number) {
    const powerUp = powerUps.value.find(p => p.id === powerUpId)
    if (powerUp) {
      // 根据道具类型生效
      switch (powerUp.type) {
        case 'star':
          // 武器升级
          break
        case 'clock':
          // 时间冻结
          break
        case 'shovel':
          // 基地加固
          break
        case 'life':
          lives.value++
          break
      }
      
      powerUps.value = powerUps.value.filter(p => p.id !== powerUpId)
    }
  }
  
  function destroyBase() {
    baseDestroyed.value = true
    gameOver()
  }
  
  return {
    // State
    gameState,
    currentLevel,
    score,
    lives,
    player,
    enemies,
    bullets,
    walls,
    powerUps,
    basePosition,
    baseDestroyed,
    remainingEnemies,
    gridSize,
    gridWidth,
    gridHeight,
    
    // Actions
    startGame,
    pauseGame,
    resumeGame,
    gameOver,
    victory,
    initLevel,
    updatePlayerPosition,
    shootBullet,
    removeBullet,
    damageEnemy,
    removeEnemy,
    spawnPowerUp,
    collectPowerUp,
    destroyBase
  }
})
