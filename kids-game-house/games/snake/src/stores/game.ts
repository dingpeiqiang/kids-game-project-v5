/**
 * 🎮 贪吃蛇游戏 Store
 * 
 * 本文件包含游戏的所有业务逻辑：
 * - 通用游戏状态管理（分数、难度、存储等）
 * - 贪吃蛇特定逻辑（蛇移动、碰撞检测、食物生成等）
 * - 道具效果系统
 * 
 * 结构说明：
 * - 第 1-100 行：类型定义和配置
 * - 第 100-250 行：通用游戏状态（可复用到其他游戏）
 * - 第 250-600 行：贪吃蛇特定逻辑
 * - 第 600 行以后：游戏控制方法
 */
// 🎮 贪吃蛇游戏 Store
// ============================================================================
// 架构说明：
// - 本文件是贪吃蛇游戏的完整业务逻辑实现
// - 通用状态管理部分（分数、难度、存储）可作为其他游戏的参考
// - 贪吃蛇特定逻辑（蛇移动、碰撞检测）保留在此文件中
// ============================================================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Difficulty, GameState, Position, Food, Particle } from '@/types/game'
import { DIFFICULTY_CONFIGS } from '@/types/game'
import { getSessionToken, isStandaloneMode, reportGameResult, getGameId } from '@/utils/platformApi'
import type { ItemEffectState } from '@/types/game-base.types'

// ============================================================================
// 🎯 第一部分：通用游戏状态（可复用到其他游戏）
// ============================================================================
export type GameEventType = 'eat' | 'crash' | 'gameover' | 'levelup'
type GameEventCallback = (event: GameEventType, data?: any) => void

export const useGameStore = defineStore('game', () => {
  // ─── 通用游戏状态 ───
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const score = ref(0)
  const highScore = ref(0)
  const playCount = ref(0)
  const difficulty = ref<Difficulty>('medium')

  // ─── 独立部署模式相关（通用） ───
  const standaloneMode = ref(isStandaloneMode())
  const sessionToken = ref(getSessionToken())
  const gameId = ref(getGameId())
  const gameStartTime = ref<number | null>(null)

  // ─── 游戏事件系统（通用） ───
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

  // ============================================================================
  // 🎯 第二部分：贪吃蛇特定游戏数据（其他游戏需要替换）
  // ============================================================================
  // ─── 蛇身数据 ───
  const snakeLength = ref(3)
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
  
  // 👉 蛇头旋转角度（用于视觉表现，单位：弧度）
  const headRotation = ref(0)

  // ============================================================================
  // 🎯 第三部分：道具效果系统（可扩展为通用框架）
  // ============================================================================
  // 道具效果状态（全部在 store 中统一管理，UI 和逻辑都从这里读取）
  const itemEffects = ref<ItemEffectState>({
    speedMultiplier: 1.0,
    scoreMultiplier: 1.0,
    hasShield: false,
    hasMagnet: false,
    activeEffects: []
  })

  // 道具效果计时器管理（防止 effect 堆叠时计时器泄漏）
  const itemTimers = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * 应用道具效果（贪吃蛇特定实现）
   * 其他游戏可以替换这个方法来实现自己的道具效果
   */
  const applyItemEffect = (type: string) => {
    const addActiveEffect = (icon: string, durationMs: number) => {
      const endTime = Date.now() + durationMs
      // 先移除同类效果（避免堆叠显示）
      itemEffects.value.activeEffects = itemEffects.value.activeEffects.filter(e => e.type !== type)
      itemEffects.value.activeEffects.push({ type, icon, endTime })
      // 定时清理显示
      setTimeout(() => {
        itemEffects.value.activeEffects = itemEffects.value.activeEffects.filter(e => e.type !== type)
      }, durationMs)
    }

    const clearTimer = (key: string) => {
      const old = itemTimers.get(key)
      if (old) clearTimeout(old)
    }

    switch (type) {
      case 'speed_boost':
        clearTimer('speed')
        itemEffects.value.speedMultiplier = 1.5
        addActiveEffect('⚡', 5000)
        console.log('⚡ 加速道具生效！速度 +50%')
        itemTimers.set('speed', setTimeout(() => {
          itemEffects.value.speedMultiplier = 1.0
          console.log('⚡ 加速效果结束')
        }, 5000))
        break

      case 'slow_down':
        clearTimer('speed')
        itemEffects.value.speedMultiplier = 0.5
        addActiveEffect('🐢', 5000)
        console.log('🐢 减速道具生效！速度 -50%')
        itemTimers.set('speed', setTimeout(() => {
          itemEffects.value.speedMultiplier = 1.0
          console.log('🐢 减速效果结束')
        }, 5000))
        break

      case 'shield':
        clearTimer('shield')
        itemEffects.value.hasShield = true
        addActiveEffect('🛡️', 10000)
        console.log('🛡️ 护盾道具生效！免疫一次碰撞')
        itemTimers.set('shield', setTimeout(() => {
          itemEffects.value.hasShield = false
          console.log('🛡️ 护盾效果结束')
        }, 10000))
        break

      case 'magnet':
        clearTimer('magnet')
        itemEffects.value.hasMagnet = true
        addActiveEffect('🧲', 8000)
        console.log('🧲 磁铁道具生效！')
        itemTimers.set('magnet', setTimeout(() => {
          itemEffects.value.hasMagnet = false
          console.log('🧲 磁铁效果结束')
        }, 8000))
        break

      case 'double_score':
        clearTimer('score')
        itemEffects.value.scoreMultiplier = 2.0
        addActiveEffect('✨', 10000)
        console.log('✨ 双倍分数生效！得分 x2')
        itemTimers.set('score', setTimeout(() => {
          itemEffects.value.scoreMultiplier = 1.0
          console.log('✨ 双倍分数效果结束')
        }, 10000))
        break

      case 'length_reduce':
        // 一次性效果：立即缩短蛇身 3 节
        if (snake.value.length > 3) {
          const removeCount = Math.min(3, snake.value.length - 3)
          snake.value.splice(snake.value.length - removeCount, removeCount)
          console.log(`✂️ 蛇身缩短 ${removeCount} 节！`)
        }
        addActiveEffect('✂️', 1500)
        break
    }
  }

  /**
   * 重置所有道具效果（游戏开始/结束时调用）
   */
  const resetItemEffects = () => {
    // 清理所有计时器
    itemTimers.forEach(timer => clearTimeout(timer))
    itemTimers.clear()
    // 逐字段重置，避免整体替换导致 template 短暂访问 undefined
    itemEffects.value.speedMultiplier = 1.0
    itemEffects.value.scoreMultiplier = 1.0
    itemEffects.value.hasShield = false
    itemEffects.value.hasMagnet = false
    itemEffects.value.activeEffects = []
  }

  // ============================================================================
  // 🎯 第四部分：通用存储功能（可复用到其他游戏）
  // ============================================================================

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

  // ============================================================================
  // 🎯 第五部分：游戏生命周期方法
  // ============================================================================

  // 开始游戏（通用逻辑 + 贪吃蛇特定初始化）
  const startGame = () => {
    score.value = 0
    snakeLength.value = 3
    isPlaying.value = true
    isPaused.value = false
    isGameOver.value = false
    playCount.value++
    gameStartTime.value = Date.now()  // 记录游戏开始时间
    resetItemEffects()  // 🎁 重置道具效果状态
    saveToStorage()
  }

  // 结束游戏
  const endGame = () => {
    isPlaying.value = false
    isGameOver.value = true
    emitEvent('gameover')
    resetItemEffects()  // 🎁 游戏结束时清理所有道具效果
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

  // 增加分数（带难度 + 道具倍率）
  const addScore = (points: number) => {
    // 🎁 应用道具得分倍率（如双倍分数道具）
    const multiplied = Math.round(points * itemEffects.value.scoreMultiplier)
    score.value += multiplied
    if (score.value > highScore.value) {
      highScore.value = score.value
      saveToStorage()
    }
  }

  // 获取当前难度配置
  const currentConfig = computed(() => DIFFICULTY_CONFIGS[difficulty.value])

  // ============================================================================
  // 🎯 第六部分：贪吃蛇特定游戏逻辑（核心玩法）
  // ============================================================================

  // 设置方向（贪吃蛇特定）
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

  /**
   * 移动蛇（贪吃蛇特定核心逻辑）
   * 包含：平滑移动、碰撞检测、得分处理
   */
  const moveSnake = (deltaTime?: number, cellSize: number = 50) => {
    if (!food.value || isGameOver.value) return

    // 👉 deltaTime 单位为秒，如果未传入则使用默认值（兼容旧代码）
    const dt = deltaTime || (currentConfig.value.speed / 1000) * 0.016

    direction.value = { ...nextDirection.value }
    
    // 🎁 应用道具速度倍率（加速/减速道具）
    const effectiveSpeed = currentConfig.value.speed * itemEffects.value.speedMultiplier
    
    // 👉 计算新头部位置
    const newHead = { ...snake.value[0] }
    newHead.x += direction.value.x * effectiveSpeed * dt
    newHead.y += direction.value.y * effectiveSpeed * dt

    const gridCols = 32
    const gridRows = 18
    
    // 边界检测（像素级）
    if (
      newHead.x < 0 || 
      newHead.x >= gridCols * cellSize || 
      newHead.y < 0 || 
      newHead.y >= gridRows * cellSize
    ) {
      // 🛡️ 护盾免疫边界碰撞（消耗护盾）
      if (itemEffects.value.hasShield) {
        itemEffects.value.hasShield = false
        itemEffects.value.activeEffects = itemEffects.value.activeEffects.filter(e => e.type !== 'shield')
        const shieldTimer = itemTimers.get('shield')
        if (shieldTimer) { clearTimeout(shieldTimer); itemTimers.delete('shield') }
        console.log('🛡️ 护盾抵挡了一次边界碰撞！')
        // 反弹蛇头回边界内
        newHead.x = Math.max(cellSize * 0.5, Math.min(gridCols * cellSize - cellSize * 0.5, newHead.x))
        newHead.y = Math.max(cellSize * 0.5, Math.min(gridRows * cellSize - cellSize * 0.5, newHead.y))
        snake.value[0] = newHead
        return
      }
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
    
    // 🛡️ 护盾消耗辅助函数
    const consumeShield = () => {
      itemEffects.value.hasShield = false
      itemEffects.value.activeEffects = itemEffects.value.activeEffects.filter(e => e.type !== 'shield')
      const shieldTimer = itemTimers.get('shield')
      if (shieldTimer) { clearTimeout(shieldTimer); itemTimers.delete('shield') }
      console.log('🛡️ 护盾消耗！')
    }
    
    // 👉 自身碰撞（从第 5 节开始检测，避免误判）
    for (let i = 5; i < snake.value.length; i++) {
      const segment = snake.value[i]
      const head = snake.value[0]
      const dx = head.x - segment.x
      const dy = head.y - segment.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < snakeRadius * 1.5) {  // 稍微放宽判定
        if (itemEffects.value.hasShield) { consumeShield(); return }
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
        if (itemEffects.value.hasShield) { consumeShield(); return }
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

  /**
   * 生成食物（贪吃蛇特定）
   * 其他游戏可以替换为自己的物品生成逻辑
   */
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

  // ============================================================================
  // 🎯 第七部分：粒子效果（通用，可复用到其他游戏）
  // ============================================================================

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

  // ============================================================================
  // 🎯 第八部分：贪吃蛇特定初始化和生成逻辑
  // ============================================================================

  // 开始游戏时初始化（贪吃蛇特定）
  const startGameWithInit = (cellSize: number = 50) => {
    startGame()
    // 初始位置：每个网格的中心点
    snake.value = [
      { x: 16 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 蛇头（中间）
      { x: 15 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 第二节
      { x: 14 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 }   // 第三节
    ]
    direction.value = { x: 1, y: 0 }
    nextDirection.value = { x: 1, y: 0 }
    particles.value = []
    generateObstacles(cellSize)  // 生成障碍物
    generateFood(cellSize)
    headRotation.value = 0
  }

  // 生成障碍物（贪吃蛇特定）
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

  // 重置游戏（贪吃蛇特定）
  const resetGame = (cellSize: number = 50) => {
    isPlaying.value = false
    isPaused.value = false
    isGameOver.value = false
    score.value = 0
    snakeLength.value = 3
    // 初始位置：每个网格的中心点
    snake.value = [
      { x: 16 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 蛇头（中间）
      { x: 15 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 },  // 第二节
      { x: 14 * cellSize + cellSize/2, y: 9 * cellSize + cellSize/2 }   // 第三节
    ]
    food.value = null
    obstacles.value = []
    direction.value = { x: 1, y: 0 }
    nextDirection.value = { x: 1, y: 0 }
    particles.value = []
    headRotation.value = 0
    resetItemEffects()
  }

  // ============================================================================
  // 🎯 第九部分：计算属性和导出
  // ============================================================================

  // 计算属性
  const currentScore = computed(() => score.value)
  const currentHighScore = computed(() => highScore.value)
  const currentPlayCount = computed(() => playCount.value)
  const currentDifficulty = computed(() => difficulty.value)

  // 初始化加载
  loadFromStorage()

  // ============================================================================
  // 🎯 导出部分
  // ============================================================================
  return {
    // ─── 通用状态 ───
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
    // ─── 贪吃蛇特定数据 ───
    snake,
    food,
    obstacles,
    direction,
    nextDirection,
    particles,
    headRotation,
    // ─── 道具效果系统 ───
    itemEffects,
    // ─── 通用方法 ───
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
    // ─── 贪吃蛇特定方法 ───
    setDirection,
    moveSnake,
    generateFood,
    generateObstacles,
    updateParticles,
    createParticles,
    setEventCallback,
    applyItemEffect,
    resetItemEffects,
    // ─── 计算属性 ───
    currentScore,
    currentHighScore,
    currentPlayCount,
    currentDifficulty,
    currentConfig
  }
})
