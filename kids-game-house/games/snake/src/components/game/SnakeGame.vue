<template>
  <div class="snake-game-container relative w-full h-screen overflow-hidden">
    <!-- ⭐ 资源检测 Loading 覆盖层 -->
    <div
      v-if="isLoading"
      class="loading-overlay absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="loading-container max-w-md mx-4 p-6 text-center">
        <!-- Loading 图标 -->
        <div class="loading-icon text-6xl mb-4 animate-bounce">🔍</div>
        
        <!-- 标题 -->
        <h2 class="loading-title text-2xl font-bold text-white mb-4">{{ loadingTitle }}</h2>
        
        <!-- 进度条 -->
        <div class="progress-container bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
          <div
            class="progress-bar bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        
        <!-- 当前步骤 -->
        <p class="loading-text text-white/80 text-sm mb-2">{{ loadingText }}</p>
        
        <!-- 提示信息 -->
        <p class="hint-text text-white/50 text-xs">请稍候，正在为您准备最佳游戏体验...</p>
      </div>
    </div>
    
    <!-- 游戏画布容器 -->
    <div
      ref="gameContainer"
      class="game-canvas w-full h-full"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    ></div>
    
    <!-- 游戏内 UI 覆盖层 - 悬浮在左上角，不遮挡游戏区域 -->
    <div class="game-ui absolute top-2 left-0 right-0 flex justify-between items-start pointer-events-none px-4">
      <!-- 左侧：分数面板 -->
      <ScorePanel 
        :score="gameStore.score" 
        :highScore="gameStore.highScore"
        class="pointer-events-auto max-w-[180px]"
      />
      
      <!-- 右侧：控制按钮 -->
      <div class="flex gap-2 pointer-events-auto">
        <button
          @click="goToHome"
          class="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-all"
          title="返回首页"
        >
          🏠
        </button>
        <button
          @click="toggleFullscreen"
          class="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-all"
          :title="isFullscreen ? '退出全屏' : '进入全屏'"
        >
          {{ isFullscreen ? '⛶' : '⛶' }}
        </button>
        <SoundToggle />
        <PauseButton 
          :isPaused="gameStore.isPaused" 
          @click="gameStore.togglePause()"
        />
      </div>
    </div>
    
    <!-- 🎁 道具效果状态栏 - 显示当前激活的道具效果 -->
    <div
      v-if="gameStore.isPlaying && gameStore.itemEffects?.activeEffects?.length > 0"
      class="item-effects-bar absolute top-16 left-0 right-0 flex justify-center gap-2 pointer-events-none px-4"
    >
      <transition-group name="effect-badge">
        <div
          v-for="effect in gameStore.itemEffects?.activeEffects"
          :key="effect.type"
          class="effect-badge flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg backdrop-blur-sm"
          :class="getEffectBadgeClass(effect.type)"
        >
          <span class="text-base">{{ effect.icon }}</span>
          <span>{{ getEffectLabel(effect.type) }}</span>
          <!-- 倒计时进度条 -->
          <div class="effect-timer w-12 h-1.5 bg-white/30 rounded-full overflow-hidden ml-1">
            <div
              class="h-full bg-white rounded-full transition-all duration-1000"
              :style="{ width: getEffectProgress(effect) + '%' }"
            ></div>
          </div>
        </div>
      </transition-group>
    </div>
    
    <!-- 暂停覆盖层 -->
    <div
      v-if="gameStore.isPaused"
      class="pause-overlay absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="text-center">
        <div class="text-5xl mb-4">⏸️</div>
        <div class="text-3xl font-bold text-white mb-6">游戏暂停</div>
        <GameButton @click="gameStore.togglePause()" variant="primary" :fontSize="20" :paddingLeft="32" :paddingRight="32" :paddingTop="14" :paddingBottom="14">
          继续游戏
        </GameButton>
      </div>
    </div>

    <!-- ⭐ 主题加载错误提示覆盖层 -->
    <div
      v-if="loadError"
      class="error-overlay absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
    >
      <div class="error-container max-w-md mx-4 p-6 bg-gradient-to-br from-red-900/90 to-red-950/90 rounded-2xl shadow-2xl border border-red-500/30">
        <!-- 错误图标 -->
        <div class="error-icon text-center mb-4">
          <div class="text-6xl">⚠️</div>
        </div>

        <!-- 错误标题 -->
        <h2 class="error-title text-2xl font-bold text-white text-center mb-4">
          主题加载失败
        </h2>

        <!-- 错误详情 -->
        <div class="error-details text-white/90 text-sm mb-6 space-y-3">
          <p>{{ loadError.message }}</p>
        </div>

        <!-- 主题信息 -->
        <div v-if="loadError.themeInfo" class="theme-info bg-black/30 rounded-lg p-3 mb-6">
          <div class="text-xs text-white/60 mb-1">主题信息</div>
          <div class="text-white font-medium">{{ loadError.themeInfo.themeName }}</div>
          <div class="text-xs text-white/60">ID: {{ loadError.themeInfo.themeId }}</div>
        </div>

        <!-- 操作按钮 -->
        <div class="error-actions flex gap-3">
          <button
            @click="handleGoBack"
            class="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-medium"
          >
            返回
          </button>
          <button
            @click="handleRetry"
            class="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-medium"
          >
            重新加载
          </button>
        </div>

        <!-- 技术详情（折叠） -->
        <details class="mt-4">
          <summary class="text-xs text-white/50 cursor-pointer hover:text-white/70">
            查看技术详情
          </summary>
          <pre class="text-xs text-white/40 mt-2 overflow-auto max-h-40 bg-black/40 rounded p-2">{{ loadError.rawError }}</pre>
        </details>
      </div>
    </div>
    
    <!-- 操作提示 -->
    <div class="controls-hint text-center text-white/60 text-sm" style="padding-bottom: env(safe-area-inset-bottom);">
      <span class="hidden md:inline">使用 ↑ ↓ ← → 或 W A S D 控制方向</span>
      <span class="md:hidden">滑动屏幕控制方向</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, provide, readonly } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore, type GameEventType } from '@/stores/game'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'  // ⭐ 添加导入
import { SnakePhaserGame } from './PhaserGame'
// 使用本地 UI 组件
import ScorePanel from '@/components/ui/ScorePanel.vue'
import PauseButton from '@/components/ui/PauseButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { initUIParams } from '@/utils/uiResponsive'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const settingsStore = useSettingsStore()
const themeStore = useThemeStore()  // ⭐ 初始化 themeStore

const gameContainer = ref<HTMLElement | null>(null)

// ⭐ 资源加载状态
const isLoading = ref(true)
const progress = ref(0)
const loadingTitle = ref('正在初始化游戏')
const loadingText = ref('准备中...')

// 使用 ref 存储 PhaserGame 实例，并提供给子组件
const phaserGameRef = ref<SnakePhaserGame | null>(null)
provide('phaserGame', readonly(phaserGameRef))
let gameLoop: number | null = null
let lastMoveTime = 0
const isFullscreen = ref(false)

// PhaserGame 实例的 getter
const getPhaserGame = () => phaserGameRef.value

// ⭐ 主题加载错误状态
const loadError = ref<{
  type: 'network' | 'unknown'
  message: string
  themeInfo?: { themeName: string; themeId: string }
  rawError: string
} | null>(null)

// 触摸控制
let touchStartX = 0
let touchStartY = 0

/**
 * 返回首页
 */
function goToHome() {
  // 清理游戏资源
  cleanupGame()
  // 跳转到首页
  router.push('/')
}

/**
 * 切换全屏
 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('全屏失败:', err)
    })
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 监听全屏变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

/**
 * ⭐ 处理错误提示：返回上一页
 */
function handleGoBack() {
  loadError.value = null
  router.back()
}

/**
 * ⭐ 处理错误提示：重新加载
 */
async function handleRetry() {
  loadError.value = null

  // 重新初始化游戏
  if (gameContainer.value && phaserGameRef.value) {
    // 清理旧游戏
    phaserGameRef.value.destroy()
    phaserGameRef.value = null

    // 创建新游戏
    phaserGameRef.value = new SnakePhaserGame(gameContainer.value)
    // 🎁 注入道具效果回调（必须在 Vue 上下文中设置，确保 Pinia store 正常访问）
    phaserGameRef.value.setItemEffectCallback((type: string) => {
      gameStore.applyItemEffect(type)
    })

    // 获取主题 ID
    const themeId = route.query.theme_id as string

    try {
      await phaserGameRef.value.start(settingsStore.difficulty, themeId)
      const autoCellSize = phaserGameRef.value.getCellSize()
      const cellSize = gameStore.customConfig?.cellSize ?? autoCellSize
      gameStore.startGameWithInit(cellSize)
      startGameLoop()
    } catch (err) {
      const error = err as Error
      loadError.value = {
        type: 'unknown',
        message: error.message || '加载失败',
        rawError: error.toString()
      }
    }
  }
}

/**
 * 窗口大小变化处理（Phaser 侧，不含 UI 部分——UI 已由 uiResponsive 全局统一处理）
 */

/**
 * 初始化游戏
 */
onMounted(async () => {
  // 初始化 UI 参数（useResponsiveUI 已自动注册全局 resize 监听）
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('🎮 游戏页面加载，UI scale:', window.innerWidth, window.innerHeight)
  
  if (gameContainer.value) {
    // ⭐ 先执行资源检测和缓存加载
    await performResourceCheck()
    
    // ⭐ 检测通过后创建 Phaser 游戏实例
    phaserGameRef.value = new SnakePhaserGame(gameContainer.value)
    // 🎁 注入道具效果回调（必须在 Vue 上下文中设置，确保 Pinia store 正常访问）
    phaserGameRef.value.setItemEffectCallback((type: string) => {
      gameStore.applyItemEffect(type)
    })
    
    // 👉 关键：等待 Phaser 启动完成，获取 cellSize
    const themeId = route.query.theme_id as string
    console.log('🎨 游戏启动，主题 ID:', themeId)
    
    try {
      console.log('[SnakeGame] 🚀 开始调用 phaserGameRef.value.start()...')
      await phaserGameRef.value.start(settingsStore.difficulty, themeId)
      console.log('[SnakeGame] ✅ Phaser 游戏实例已创建，等待资源预加载...')
      
      // ⭐ 关键修复：等待 Phaser 场景的 create 阶段完成，确保所有资源已就绪
      console.log('[SnakeGame] ⏳ 等待游戏资源准备就绪...')
      await phaserGameRef.value.waitForReady(10000)  // 最多等待 10 秒
      console.log('[SnakeGame] ✅ 游戏资源已就绪，开始游戏循环')
      
      // 👉 获取 cellSize 并初始化游戏数据
      // ⭐ 如果 customConfig 指定了 cellSize，优先使用（否则用 Phaser 自动计算值）
      const autoCellSize = phaserGameRef.value.getCellSize()
      const cellSize = gameStore.customConfig?.cellSize ?? autoCellSize
      console.log('📏 cellSize:', cellSize.toFixed(2), gameStore.customConfig?.cellSize ? '(自定义)' : '(自动计算)')
      
      // ⭐ 使用 startGameWithInit 初始化：会读取 customConfig 的 initialLength
      gameStore.startGameWithInit(cellSize)
      
      startGameLoop()
    } catch (err) {
      const error = err as Error
      loadError.value = {
        type: 'unknown',
        message: error.message || '游戏加载失败',
        rawError: error.toString()
      }
      console.error('[SnakeGame] 游戏加载失败', err)
      return
    }

    // 设置游戏事件回调（音效）
    gameStore.setEventCallback((event: GameEventType, data?: any) => {
      const game = getPhaserGame()
      if (!game) return

      switch (event) {
        case 'eat':
          game.playSound('eat')
          game.createExplosion(data.position.x, data.position.y, '#4ade80')
          break
        case 'gameover':
          game.playSound('gameover')
          break
        case 'crash':
          game.playSound('crash')
          break
        case 'levelup':
          game.playSound('levelup')
          break
      }
    })

    // 播放游戏中背景音乐
    getPhaserGame()?.playBgmGameplay()

    // 监听键盘输入
    window.addEventListener('keydown', handleKeyDown)

    // 监听全屏变化
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // 添加触摸事件监听器（非被动以支持 preventDefault）
    if (gameContainer.value) {
      gameContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    }
  }
})

/**
 * ⭐ 执行资源检测和缓存加载
 */
async function performResourceCheck() {
  try {
    isLoading.value = true
    progress.value = 0
    loadingTitle.value = '正在初始化游戏'
    loadingText.value = '准备中...'
    
    // 步骤 1：检查用户登录状态
    progress.value = 10
    loadingText.value = '验证用户登录状态...'
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('请先登录再玩游戏哦~')
    }
    console.log('✅ 用户已登录')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 步骤 2：检查主题选择
    progress.value = 30
    loadingText.value = '检查主题配置...'
    const themeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || ''
    if (!themeId) {
      throw new Error('还没有选择喜欢的主题呢，请先选择一个主题')
    }
    console.log('🎨 使用主题 ID:', themeId)
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 步骤 3：验证 GTRS 主题
    progress.value = 50
    loadingText.value = '验证 GTRS 主题...'
    const gtrsJson = themeStore.gtrsRawJson
    if (!gtrsJson) {
      throw new Error('主题资源未加载，请重新选择主题')
    }
    
    const gtrsData = JSON.parse(gtrsJson)
    console.log('✅ GTRS 主题已加载:', gtrsData.themeInfo?.themeName || '未知主题')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 步骤 4：预热图片资源缓存
    progress.value = 70
    loadingText.value = '预热图片资源缓存...'
    console.log('♻️ 开始预热图片资源缓存...')

    // 创建一个临时的 Phaser 实例来触发资源加载
    const tempContainer = document.createElement('div')
    tempContainer.style.display = 'none'
    document.body.appendChild(tempContainer)

    const tempGame = new SnakePhaserGame(tempContainer)

    // 📥 注入加载进度回调，实时更新 UI 进度条
    tempGame.setProgressCallback((p: number) => {
      // 将 0-100 的加载进度映射到 70-95 的 UI 进度
      const uiProgress = 70 + (p / 100) * 25
      progress.value = Math.min(95, uiProgress)
      loadingText.value = `加载资源: ${Math.round(p)}%`
    })

    // 等待资源加载完成（start 内部会等待所有资源加载完）
    await tempGame.start(settingsStore.difficulty, themeId)

    // 清理临时实例
    tempGame.destroy()
    document.body.removeChild(tempContainer)

    console.log('✅ 图片资源缓存已预热完成')
    
    // 步骤 5：准备就绪
    progress.value = 90
    loadingText.value = '准备游戏环境...'
    await new Promise(resolve => setTimeout(resolve, 300))
    
    progress.value = 100
    loadingText.value = '游戏已就绪，即将开始...'
    
    // 短暂延迟后关闭 Loading
    await new Promise(resolve => setTimeout(resolve, 500))
    isLoading.value = false
    
    console.log('✅ 资源检测完成，开始游戏')
  } catch (error: any) {
    console.error('❌ 资源检测失败:', error)
    isLoading.value = false
    throw error
  }
}

/**
 * 清理游戏资源
 */
const cleanupGame = () => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
  }
  
  // 🎁 销毁 PhaserGame 实例 (会清理道具系统)
  if (phaserGameRef.value) {
    phaserGameRef.value.destroy()
    // ⚠️ 不要立即设置为 null，让 onUnmounted 也能访问
    // phaserGameRef.value = null  // 删除这行!
  }
}

/**
 * 组件卸载时清理资源
 */
onUnmounted(() => {
  // 清理游戏循环和资源
  cleanupGame()
  
  // 🎁 清理道具系统 (防止内存泄漏)
  const phaserGame = phaserGameRef.value as any
  if (phaserGame && phaserGame.getItemSystem) {
    const itemSystem = phaserGame.getItemSystem()
    if (itemSystem) {
      itemSystem.cleanup()
      console.log('🎁 组件卸载，道具系统已清理')
    }
  }
  
  // 移除其他事件监听
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  
  if (gameContainer.value) {
    gameContainer.value.removeEventListener('touchmove', handleTouchMove)
  }
})

/**
 * 监听游戏状态变化
 */
watch([() => gameStore.snake, () => gameStore.food], () => {
  renderGame()
}, { deep: true })

watch(() => gameStore.isPaused, (paused) => {
  const game = getPhaserGame()
  if (paused) {
    game?.stopAllBgm()
  } else {
    game?.playBgmGameplay()
  }
})

watch(() => gameStore.isGameOver, (gameOver) => {
  const game = getPhaserGame()
  if (gameOver) {
    game?.stopAllBgm()
    game?.playSound('gameover')
    // 只触发一次轻微震动
    game?.shakeScreen()

    // 🎁 清理道具系统 (停止生成定时器)
    const phaserGame = phaserGameRef.value as any
    if (phaserGame && phaserGame.getItemSystem) {
      const itemSystem = phaserGame.getItemSystem()
      if (itemSystem) {
        itemSystem.cleanup()  // 清理道具系统
        console.log('🎁 游戏结束，道具系统已清理')
      }
    }

    // 延迟跳转到游戏结束页面
    setTimeout(() => {
      router.push('/gameover')
    }, 800)  // 缩短到 800ms
  }
})

// ============================================================================
// 🎁 道具效果 UI 辅助函数
// ============================================================================

/**
 * 获取道具效果徽章的样式类
 */
function getEffectBadgeClass(type: string): string {
  const classMap: Record<string, string> = {
    'speed_boost': 'bg-yellow-500/80 border border-yellow-300/50',
    'slow_down':   'bg-gray-500/80 border border-gray-300/50',
    'shield':      'bg-blue-500/80 border border-blue-300/50',
    'magnet':      'bg-pink-500/80 border border-pink-300/50',
    'double_score':'bg-green-500/80 border border-green-300/50',
    'length_reduce':'bg-orange-500/80 border border-orange-300/50',
  }
  return classMap[type] || 'bg-white/20'
}

/**
 * 获取道具效果标签文字
 */
function getEffectLabel(type: string): string {
  const labelMap: Record<string, string> = {
    'speed_boost':  '加速',
    'slow_down':    '减速',
    'shield':       '护盾',
    'magnet':       '磁铁',
    'double_score': '双倍分',
    'length_reduce':'已缩短',
  }
  return labelMap[type] || type
}

/**
 * 获取道具效果倒计时进度（0-100）
 */
function getEffectProgress(effect: { type: string; endTime: number }): number {
  const durationMap: Record<string, number> = {
    'speed_boost':  5000,
    'slow_down':    5000,
    'shield':       10000,
    'magnet':       8000,
    'double_score': 10000,
    'length_reduce': 1500,
  }
  const total = durationMap[effect.type] || 5000
  const remaining = Math.max(0, effect.endTime - Date.now())
  return (remaining / total) * 100
}

/**
 * 游戏主循环（平滑移动版本 + 优化）
 */
function startGameLoop() {
  let lastTime = performance.now()
  
  function loop(currentTime: number) {
    if (gameStore.isPlaying && !gameStore.isPaused && !gameStore.isGameOver) {
      // 👉 计算时间增量（秒）
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime
      
      // 👉 获取 cellSize 并传入（确保碰撞检测准确）
      const cellSize = phaserGameRef.value?.getCellSize() || 50
      
      // 👉 传入 deltaTime 和 cellSize，实现精确的平滑移动和碰撞检测
      gameStore.moveSnake(deltaTime, cellSize)
      
      // 🎁 同步蛇数据到 PhaserGame，供 Phaser update 循环中的道具碰撞检测使用
      const game = getPhaserGame()
      if (game) {
        game.updateSnakeData(gameStore.snake)
      }
      
      // 更新粒子
      gameStore.updateParticles()
    }
    
    gameLoop = requestAnimationFrame(loop)
  }
  
  loop(performance.now())
}

/**
 * 渲染游戏画面（带蛇头旋转）
 */
function renderGame() {
  const game = getPhaserGame() as any
  if (!game) return

  // 👉 传入蛇头旋转角度
  game.renderSnake(gameStore.snake, gameStore.headRotation)
  game.renderFood(gameStore.food)
  game.renderObstacles(gameStore.obstacles)  // 渲染障碍物

  // 🎁 渲染道具 - 注意：不要在这里渲染，由 ItemSystem 自己管理
  // 道具渲染应该在 Phaser 的 update 循环中，避免每帧创建新对象

  // 渲染粒子
  gameStore.particles.forEach(particle => {
    // 粒子效果可以在这里添加
  })
}

/**
 * 键盘控制
 */
function handleKeyDown(event: KeyboardEvent) {
  if (gameStore.isPaused || gameStore.isGameOver) return
  
  const key = event.key.toLowerCase()
  
  switch (key) {
    case 'arrowup':
    case 'w':
      gameStore.setDirection({ x: 0, y: -1 })
      break
    case 'arrowdown':
    case 's':
      gameStore.setDirection({ x: 0, y: 1 })
      break
    case 'arrowleft':
    case 'a':
      gameStore.setDirection({ x: -1, y: 0 })
      break
    case 'arrowright':
    case 'd':
      gameStore.setDirection({ x: 1, y: 0 })
      break
    case ' ':
    case 'escape':
      gameStore.togglePause()
      break
  }
}

/**
 * 触摸控制
 */
function handleTouchStart(event: TouchEvent) {
  touchStartX = event.touches[0].clientX
  touchStartY = event.touches[0].clientY
}

function handleTouchMove(event: TouchEvent) {
  event.preventDefault()
}

function handleTouchEnd(event: TouchEvent) {
  if (gameStore.isPaused || gameStore.isGameOver) return
  
  const touchEndX = event.changedTouches[0].clientX
  const touchEndY = event.changedTouches[0].clientY
  
  const dx = touchEndX - touchStartX
  const dy = touchEndY - touchStartY
  
  // 判断滑动方向
  if (Math.abs(dx) > Math.abs(dy)) {
    // 水平滑动
    if (dx > 30) {
      gameStore.setDirection({ x: 1, y: 0 })
    } else if (dx < -30) {
      gameStore.setDirection({ x: -1, y: 0 })
    }
  } else {
    // 垂直滑动
    if (dy > 30) {
      gameStore.setDirection({ x: 0, y: 1 })
    } else if (dy < -30) {
      gameStore.setDirection({ x: 0, y: -1 })
    }
  }
}
</script>

<style scoped>
/* 基础容器：Phaser ENVELOP 模式处理所有缩放 */
.snake-game-container {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  width: 100%;
  height: 100%;
}

.game-canvas {
  width: 100%;
  height: 100%;
}

.game-ui {
  z-index: 10;
  /* 完全透明背景，不遮挡视线 */
  background: transparent;
  /* 紧凑布局 */
  min-height: 0;
}

.pause-overlay {
  z-index: 20;
  animation: fadeIn 0.2s ease;
}

/* ⭐ 错误提示覆盖层 */
.error-overlay {
  animation: slideIn 0.3s ease;
}

.error-container {
  animation: bounceIn 0.4s ease;
}

.error-icon {
  animation: pulse 2s ease-in-out infinite;
}

.error-title {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error-details {
  max-height: 200px;
  overflow-y: auto;
}

.theme-info {
  border-left: 3px solid rgba(255, 255, 255, 0.3);
}

.error-actions button {
  transition: all 0.2s ease;
}

.error-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.controls-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 滚动条样式 */
.error-details::-webkit-scrollbar {
  width: 6px;
}

.error-details::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.error-details::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.error-details::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 🎁 道具效果徽章动画 */
.item-effects-bar {
  z-index: 15;
}

.effect-badge-enter-active {
  animation: effectIn 0.3s ease;
}
.effect-badge-leave-active {
  animation: effectOut 0.3s ease forwards;
}
.effect-badge-move {
  transition: transform 0.3s ease;
}

@keyframes effectIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes effectOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.7);
  }
}
</style>
