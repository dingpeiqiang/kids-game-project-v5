import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Difficulty, GameState, Position, Food, Particle } from '@/types/game'
import { DIFFICULTY_CONFIGS } from '@/types/game'
import { getSessionToken, isStandaloneMode, reportGameResult, getGameId } from '@/utils/platformApi'

// 游戏事件类型
export type GameEventType = 'eat' | 'crash' | 'gameover' | 'levelup'
type GameEventCallback = (event: GameEventType, data?: any) => void

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const score = ref(0)
  const highScore = ref(0)
  const playCount = ref(0)
  const difficulty = ref<Difficulty>('medium')
  const snakeLength = ref(3)

  // 独立部署模式相关
  const standaloneMode = ref(isStandaloneMode())
  const sessionToken = ref(getSessionToken())
  const gameId = ref(getGameId())
  const gameStartTime = ref<number | null>(null)  // 游戏开始时间（时间戳）

  // 游戏事件回调
  let eventCallback: GameEventCallback | null = null

  // 设置事件回调
  const setEventCallback = (callback: GameEventCallback) => {
    eventCallback = callback
  }

  // 触发事件
  const emitEvent = (event: GameEventType, data?: any) => {
    if (eventCallback) {
      eventCallback(event, data)
    }
  }

  // 游戏运行时数据
  const snake = ref<Position[]>([
    { x: 16, y: 9 },  // 👈 从中间开始（32/2, 18/2）
    { x: 15, y: 9 },
    { x: 14, y: 9 }
  ])
  const food = ref<Food | null>(null)
  const obstacles = ref<Position[]>([])  // 障碍物位置数组
  const direction = ref<Position>({ x: 1, y: 0 })
  const nextDirection = ref<Position>({ x: 1, y: 0 })
  const particles = ref<Particle[]>([])

  // 从 localStorage 加载
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('snake-game-state')
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

  // 保存到 localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('snake-game-state', JSON.stringify({
        highScore: highScore.value,
        playCount: playCount.value,
        difficulty: difficulty.value
      }))
    } catch (e) {
      console.error('Failed to save game state:', e)
    }
  }

  // 计算游戏时长（秒）
  const getGameDuration = (): number => {
    if (!gameStartTime.value) return 0
    return Math.floor((Date.now() - gameStartTime.value) / 1000)
  }

  // 开始游戏
  const startGame = () => {
    score.value = 0
    snakeLength.value = 3
    isPlaying.value = true
    isPaused.value = false
    isGameOver.value = false
    playCount.value++
    gameStartTime.value = Date.now()  // 记录游戏开始时间
    saveToStorage()
  }

  // 结束游戏
  const endGame = () => {
    isPlaying.value = false
    isGameOver.value = true
    emitEvent('gameover')
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
    
    // 如果是独立部署模式，自动提交成绩到平台
    if (standaloneMode.value && sessionToken.value) {
      submitScoreToPlatform()
    }
  }

  // 提交成绩到平台（独立部署模式）
  const submitScoreToPlatform = async () => {
    const duration = getGameDuration()
    const token = sessionToken.value
    
    if (!token) {
      console.warn('[GameStore] 无 sessionToken，跳过成绩上报')
      return
    }
    
    console.log('[GameStore] 提交成绩到平台:', {
      token: token.substring(0, 8) + '...',
      score: score.value,
      duration
    })
    
    try {
      const result = await reportGameResult({
        sessionToken: token,
        score: score.value,
        duration,
        level: difficulty.value === 'easy' ? 1 : difficulty.value === 'medium' ? 2 : 3,
        isWin: true,
        details: {
          highScore: highScore.value,
          playCount: playCount.value
        }
      })
      
      if (result.success) {
        console.log('✅ 成绩上报成功，消耗疲劳点:', result.consumePoints)
      } else {
        // ⭐ 非致命错误，仅提示不阻断游戏
        console.info('ℹ️ 成绩上报未成功（不影响游戏）:', result.message)
      }
    } catch (error) {
      // ⭐ 网络错误或后端不可用时，给出友好提示
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.warn('⚠️ 成绩上报失败（可能原因：后端未启动或网络问题）:', errorMessage)
    }
  }

  // 暂停/继续
  const togglePause = () => {
    isPaused.value = !isPaused.value
  }

  // 增加分数（带难度智能提升）
  const addScore = (points: number) => {
    score.value += points
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
  }

  // 获取当前难度配置
  const currentConfig = computed(() => DIFFICULTY_CONFIGS[difficulty.value])

  // 设置方向（防止反向）
  const setDirection = (newDir: Position) => {
    // 不能直接反向
    if (newDir.x !== 0 && newDir.x !== -direction.value.x) {
      nextDirection.value = newDir
    }
    if (newDir.y !== 0 && newDir.y !== -direction.value.y) {
      nextDirection.value = newDir
    }
  }

  // 移动蛇
  const moveSnake = () => {
    if (!food.value || isGameOver.value) return

    direction.value = { ...nextDirection.value }
    const head = { ...snake.value[0] }
    head.x += direction.value.x
    head.y += direction.value.y

    // 👉 横屏配置：32 列 × 18 行
    const gridCols = 32
    const gridRows = 18
    if (head.x < 0 || head.x >= gridCols || head.y < 0 || head.y >= gridRows) {
      endGame()
      return
    }

    // 检测碰撞（自身或障碍物）
    if (
      snake.value.some(segment => segment.x === head.x && segment.y === head.y) ||
      obstacles.value.some(obs => obs.x === head.x && obs.y === head.y)  // 障碍物碰撞
    ) {
      endGame()
      return
    }

    snake.value.unshift(head)

    // 检测是否吃到食物
    if (head.x === food.value.position.x && head.y === food.value.position.y) {
      addScore(food.value.score)
      // ⭐ 记录被吃掉的食物位置，用于动画效果
      const eatenPosition = { ...food.value.position }
      emitEvent('eat', { position: eatenPosition, score: food.value.score })
      
      // ⭐ 延迟生成新食物，让玩家看到食物被吃掉的效果（播放声音 + 粒子效果）
      // 延迟时间约 200ms，与 eat 声音时长匹配
      setTimeout(() => {
        generateFood()
      }, 200)
    } else {
      snake.value.pop()
    }
  }

  // 生成食物
  const generateFood = () => {
    // 👉 横屏配置：32 列 × 18 行
    const gridCols = 32
    const gridRows = 18
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * gridCols),
        y: Math.floor(Math.random() * gridRows)
      }
    } while (
      snake.value.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      obstacles.value.some(obs => obs.x === newFood.x && obs.y === newFood.y)  // 避开障碍物
    )

    // 根据概率生成不同类型的食物
    const rand = Math.random()
    let type: 'apple' | 'banana' | 'cherry' | 'coin' = 'apple'
    if (rand < 0.05) type = 'coin'        // 5% 概率
    else if (rand < 0.15) type = 'banana'  // 10% 概率
    else if (rand < 0.30) type = 'cherry'  // 15% 概率

    const foodData = {
      apple: { score: 10, color: '#ef4444' },
      banana: { score: 20, color: '#fbbf24' },
      cherry: { score: 30, color: '#fbbf24' },
      coin: { score: 50, color: '#3b82f6' }
    }

    food.value = {
      position: newFood,
      type,
      score: foodData[type].score,
      color: foodData[type].color
    }
  }

  // 更新粒子
  const updateParticles = () => {
    particles.value = particles.value.filter(p => {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.02
      return p.life > 0
    })
  }

  // 创建粒子效果
  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particles.value.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1,
        color,
        size: Math.random() * 0.5 + 0.3
      })
    }
  }

  // 设置难度
  const setDifficulty = (diff: Difficulty) => {
    difficulty.value = diff
    saveToStorage()
  }

  // 开始游戏时初始化
  const startGameWithInit = () => {
    startGame()
    snake.value = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ]
    direction.value = { x: 1, y: 0 }
    nextDirection.value = { x: 1, y: 0 }
    particles.value = []
    generateObstacles()  // 生成障碍物
    generateFood()
  }

  // 生成障碍物（简单难度不生成，中等 3 个，困难 6 个）
  const generateObstacles = () => {
    obstacles.value = []
    
    const gridCols = 32
    const gridRows = 18
    const obstacleCount = difficulty.value === 'easy' ? 0 : 
                         difficulty.value === 'medium' ? 3 : 6
    
    for (let i = 0; i < obstacleCount; i++) {
      let newObstacle: Position
      do {
        newObstacle = {
          x: Math.floor(Math.random() * gridCols),
          y: Math.floor(Math.random() * gridRows)
        }
      } while (
        snake.value.some(segment => segment.x === newObstacle.x && segment.y === newObstacle.y) ||
        obstacles.value.some(obs => obs.x === newObstacle.x && obs.y === newObstacle.y)
      )
      obstacles.value.push(newObstacle)
    }
    
    console.log(`✅ 生成 ${obstacleCount} 个障碍物`)
  }

  // 重置游戏
  const resetGame = () => {
    isPlaying.value = false
    isPaused.value = false
    isGameOver.value = false
    score.value = 0
    snakeLength.value = 3
    snake.value = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ]
    food.value = null
    obstacles.value = []  // 清空障碍物
    direction.value = { x: 1, y: 0 }
    nextDirection.value = { x: 1, y: 0 }
    particles.value = []
  }

  // 计算属性
  const currentScore = computed(() => score.value)
  const currentHighScore = computed(() => highScore.value)
  const currentPlayCount = computed(() => playCount.value)
  const currentDifficulty = computed(() => difficulty.value)

  // 初始化加载
  loadFromStorage()

  return {
    // 状态
    isPlaying,
    isPaused,
    isGameOver,
    score,
    highScore,
    playCount,
    difficulty,
    snakeLength,
    // 独立部署模式相关
    standaloneMode,
    sessionToken,
    gameId,
    gameStartTime,
    // 游戏运行时数据
    snake,
    food,
    obstacles,  // 导出障碍物
    direction,
    nextDirection,
    particles,
    // 方法
    startGame,
    startGameWithInit,
    endGame,
    getGameDuration,
    submitScoreToPlatform,
    togglePause,
    addScore,
    setDifficulty,
    resetGame,
    saveToStorage,
    setDirection,
    moveSnake,
    generateFood,
    generateObstacles,  // 导出障碍物生成方法
    updateParticles,
    createParticles,
    setEventCallback,
    // 计算属性
    currentScore,
    currentHighScore,
    currentPlayCount,
    currentDifficulty,
    currentConfig
  }
})
