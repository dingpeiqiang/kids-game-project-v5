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
    { x: 16 * 50, y: 9 * 50 },  // 👉 从中间开始（像素坐标）
    { x: 15 * 50, y: 9 * 50 },
    { x: 14 * 50, y: 9 * 50 }
  ])
  const food = ref<Food | null>(null)
  const obstacles = ref<Position[]>([])  // 障碍物位置数组
  const direction = ref<Position>({ x: 1, y: 0 })
  const nextDirection = ref<Position>({ x: 1, y: 0 })
  const particles = ref<Particle[]>([])
  
  // 👉 新增：蛇头旋转角度（用于视觉表现，单位：弧度）
  const headRotation = ref(0)

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

  // 设置方向（防止反向，使用点积判断）
  const setDirection = (newDir: Position) => {
    // 不能直接反向（使用点积判断）
    const dot = newDir.x * direction.value.x + newDir.y * direction.value.y
    if (dot !== -1) {  // 只有完全相反才禁止
      nextDirection.value = newDir
      
      // 👉 计算蛇头旋转角度（用于视觉表现）
      if (newDir.x === 1) headRotation.value = 0           // 向右
      else if (newDir.x === -1) headRotation.value = Math.PI  // 向左
      else if (newDir.y === 1) headRotation.value = Math.PI / 2  // 向下
      else if (newDir.y === -1) headRotation.value = -Math.PI / 2  // 向上
    }
  }

  // 移动蛇（平滑版本 - 带距离约束跟随）
  const moveSnake = (deltaTime?: number, cellSize: number = 50) => {
    if (!food.value || isGameOver.value) return

    // 👉 deltaTime 单位为秒，如果未传入则使用默认值（兼容旧代码）
    const dt = deltaTime || (currentConfig.value.speed / 1000) * 0.016

    direction.value = { ...nextDirection.value }
    
    // 👉 计算新头部位置
    const newHead = { ...snake.value[0] }
    newHead.x += direction.value.x * currentConfig.value.speed * dt
    newHead.y += direction.value.y * currentConfig.value.speed * dt

    const gridCols = 32
    const gridRows = 18
    
    // 边界检测（像素级）
    if (
      newHead.x < 0 || 
      newHead.x >= gridCols * cellSize || 
      newHead.y < 0 || 
      newHead.y >= gridRows * cellSize
    ) {
      endGame()
      emitEvent('crash')  // 触发自杀音效
      return
    }
    
    // 👉 更新蛇头位置
    snake.value[0] = newHead
    
    // 👉 关键改进：身体各节跟随前一节，保持固定距离
    const segmentDistance = cellSize * 0.9  // 每节之间的距离（略小于 cellSize）
    
    for (let i = 1; i < snake.value.length; i++) {
      const prevSegment = snake.value[i - 1]
      const currSegment = snake.value[i]
      
      // 计算当前段与前一节的距离
      const dx = prevSegment.x - currSegment.x
      const dy = prevSegment.y - currSegment.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // 👉 如果距离过大，拉回到合适位置
      if (distance > segmentDistance) {
        // 计算角度
        const angle = Math.atan2(dy, dx)
        
        // 将当前段拉到距离前一节 segmentDistance 的位置
        currSegment.x = prevSegment.x - Math.cos(angle) * segmentDistance
        currSegment.y = prevSegment.y - Math.sin(angle) * segmentDistance
      }
    }
    
    // 碰撞检测（圆形碰撞，更精确）
    const snakeRadius = cellSize * 0.4
    
    // 👉 自身碰撞（从第 5 节开始检测，避免误判）
    for (let i = 5; i < snake.value.length; i++) {
      const segment = snake.value[i]
      const head = snake.value[0]
      const dx = head.x - segment.x
      const dy = head.y - segment.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < snakeRadius * 1.5) {  // 稍微放宽判定
        endGame()
        emitEvent('crash')  // 触发碰撞音效
        return
      }
    }
    
    // 👉 障碍物碰撞检测（新增）
    const obstacleRadius = cellSize * 0.45
    for (const obstacle of obstacles.value) {
      const dx = snake.value[0].x - obstacle.x
      const dy = snake.value[0].y - obstacle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < snakeRadius + obstacleRadius) {
        endGame()
        emitEvent('crash')  // 触发撞击音效
        return
      }
    }

    // 检测是否吃到食物（圆形碰撞）
    const foodRadius = cellSize * 0.35
    const head = snake.value[0]
    const dx = head.x - food.value.position.x
    const dy = head.y - food.value.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < snakeRadius + foodRadius) {
      addScore(food.value.score)
      const eatenPosition = { ...food.value.position }
      
      // 👉 关键：立即清空食物，防止连续多帧都判定为吃到
      food.value = null
      
      // 👉 吃到食物：增加一节（在尾巴后面，保持合适距离）
      const lastSegment = snake.value[snake.value.length - 1]
      const secondLastSegment = snake.value[snake.value.length - 2]
      
      // 计算尾巴延伸方向
      if (secondLastSegment) {
        // 从倒数第二节指向最后一节的方向
        const dx = lastSegment.x - secondLastSegment.x
        const dy = lastSegment.y - secondLastSegment.y
        
        // 新节在尾巴后面，距离 segmentDistance
        const newSegment = {
          x: lastSegment.x + dx,
          y: lastSegment.y + dy
        }
        // 👉 直接添加新节
        snake.value.push(newSegment)
      } else {
        // 只有一节时（罕见情况），直接复制
        snake.value.push({ ...lastSegment })
      }
      
      // 👉 延迟触发事件和粒子效果，避免阻塞当前帧
      setTimeout(() => {
        emitEvent('eat', { position: eatenPosition, score: food.value?.score || 0 })
      }, 0)
      
      setTimeout(() => {
        // 👉 使用 requestAnimationFrame 在下一帧生成，避免卡顿
        requestAnimationFrame(() => {
          generateFood(cellSize)
        })
      }, 200)
    }
  }

  // 生成食物（像素坐标版本 - 性能优化）
  const generateFood = (cellSize: number = 50) => {
    // 👉 横屏配置：32 列 × 18 行
    const gridCols = 32
    const gridRows = 18
    let newFood: Position
    
    // 👉 关键优化：限制最大尝试次数（防止蛇很长时无限循环）
    const maxAttempts = 50
    let attempts = 0
    
    do {
      // 👉 生成网格坐标，然后转换为像素坐标（中心点）
      const gridX = Math.floor(Math.random() * gridCols)
      const gridY = Math.floor(Math.random() * gridRows)
      newFood = {
        x: gridX * cellSize + cellSize / 2,  // 网格格中心
        y: gridY * cellSize + cellSize / 2
      }
      
      attempts++
      if (attempts >= maxAttempts) {
        break
      }
    } while (
      snake.value.some(segment => {
        // 👉 性能优化：使用平方距离，避免 Math.sqrt()
        const dx = segment.x - newFood!.x
        const dy = segment.y - newFood!.y
        const distSq = dx * dx + dy * dy
        return distSq < (cellSize * 0.8) ** 2  // 安全距离的平方
      }) ||
      obstacles.value.some(obs => {
        const dx = obs.x - newFood!.x
        const dy = obs.y - newFood!.y
        const distSq = dx * dx + dy * dy
        return distSq < (cellSize * 0.8) ** 2
      })
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

  // 更新粒子（像素坐标版本）
  const updateParticles = () => {
    particles.value = particles.value.filter(p => {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.02
      return p.life > 0
    })
  }

  // 创建粒子效果（像素坐标版本）
  const createParticles = (x: number, y: number, color: string, cellSize: number = 50) => {
    // 👉 根据 cellSize 调整粒子大小和速度
    const particleScale = cellSize / 50
    
    for (let i = 0; i < 8; i++) {
      particles.value.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5 * particleScale,
        vy: (Math.random() - 0.5) * 0.5 * particleScale,
        life: 1,
        color,
        size: (Math.random() * 0.5 + 0.3) * particleScale
      })
    }
  }

  // 设置难度
  const setDifficulty = (diff: Difficulty) => {
    difficulty.value = diff
    saveToStorage()
  }

  // 开始游戏时初始化（像素坐标版本）
  const startGameWithInit = (cellSize: number = 50) => {
    startGame()
    // 👉 初始位置：每个网格的中心点
    snake.value = [
      { x: 16 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 蛇头（中间）
      { x: 15 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 第二节
      { x: 14 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 }   // 第三节
    ]
    direction.value = { x: 1, y: 0 }
    nextDirection.value = { x: 1, y: 0 }
    particles.value = []
    generateObstacles(cellSize)  // 生成障碍物
    generateFood(cellSize)  // 👈 传入 cellSize
    headRotation.value = 0  // 重置旋转角度
  }

  // 生成障碍物（像素坐标版本）
  const generateObstacles = (cellSize: number = 50) => {
    obstacles.value = []
    
    const gridCols = 32
    const gridRows = 18
    const obstacleCount = difficulty.value === 'easy' ? 0 : 
                         difficulty.value === 'medium' ? 3 : 6
    
    for (let i = 0; i < obstacleCount; i++) {
      let newObstacle: Position
      do {
        // 👉 生成网格坐标，转换为像素坐标（中心点）
        const gridX = Math.floor(Math.random() * gridCols)
        const gridY = Math.floor(Math.random() * gridRows)
        newObstacle = {
          x: gridX * cellSize + cellSize / 2,
          y: gridY * cellSize + cellSize / 2
        }
      } while (
        snake.value.some(segment => {
          const dx = segment.x - newObstacle!.x
          const dy = segment.y - newObstacle!.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          return distance < cellSize * 1.5  // 安全距离
        }) ||
        obstacles.value.some(obs => {
          const dx = obs.x - newObstacle!.x
          const dy = obs.y - newObstacle!.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          return distance < cellSize * 1.5
        })
      )
      obstacles.value.push(newObstacle)
    }
    
    console.log(`✅ 生成 ${obstacleCount} 个障碍物`)
  }

  // 重置游戏（像素坐标版本）
  const resetGame = (cellSize: number = 50) => {
    isPlaying.value = false
    isPaused.value = false
    isGameOver.value = false
    score.value = 0
    snakeLength.value = 3
    // 👉 初始位置：每个网格的中心点
    // 第 16 列中心 = 16 * cellSize + cellSize/2
    // 第 15 列中心 = 15 * cellSize + cellSize/2
    snake.value = [
      { x: 16 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 蛇头（中间）
      { x: 15 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 第二节
      { x: 14 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 }   // 第三节
    ]
    food.value = null
    obstacles.value = []  // 清空障碍物
    direction.value = { x: 1, y: 0 }
    nextDirection.value = { x: 1, y: 0 }
    particles.value = []
    headRotation.value = 0  // 重置旋转角度
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
    headRotation,  // 👉 导出蛇头旋转角度
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
