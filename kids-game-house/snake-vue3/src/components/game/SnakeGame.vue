<template>
  <div class="snake-game-container relative w-full h-screen overflow-hidden">
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
    
    <!-- 暂停覆盖层 -->
    <div
      v-if="gameStore.isPaused"
      class="pause-overlay absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="text-center">
        <div class="text-4xl mb-4">⏸️</div>
        <div class="text-2xl font-bold text-white mb-4">游戏暂停</div>
        <GameButton @click="gameStore.togglePause()" variant="primary">
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
import { SnakePhaserGame } from './PhaserGame'
import ScorePanel from '../ui/ScorePanel.vue'
import PauseButton from '../ui/PauseButton.vue'
import SoundToggle from '../ui/SoundToggle.vue'
import GameButton from '../ui/GameButton.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const settingsStore = useSettingsStore()

const gameContainer = ref<HTMLElement | null>(null)

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
    gameStore.resetGame()
    gameStore.startGame()
    gameStore.generateFood()

    // 获取主题 ID
    const themeId = route.query.theme_id as string

    try {
      await phaserGameRef.value.start(settingsStore.difficulty, themeId)
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
 * 初始化游戏
 */
onMounted(async () => {
  if (gameContainer.value) {
    phaserGameRef.value = new SnakePhaserGame(gameContainer.value)
    // 初始化游戏数据
    gameStore.resetGame()
    gameStore.startGame()
    gameStore.generateFood()

    // 获取主题 ID 并传递给 Phaser 游戏
    const themeId = route.query.theme_id as string
    console.log('🎨 游戏启动，主题 ID:', themeId)

    // 等待主题配置加载完成后再启动游戏
    try {
      await phaserGameRef.value.start(settingsStore.difficulty, themeId)
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

    // 开始游戏循环
    startGameLoop()

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
 * 清理资源
 */
onUnmounted(() => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
  }
  if (phaserGameRef.value) {
    phaserGameRef.value.destroy()
  }
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

    // 延迟跳转到游戏结束页面
    setTimeout(() => {
      router.push('/gameover')
    }, 800)  // 缩短到 800ms
  }
})

/**
 * 游戏主循环
 */
function startGameLoop() {
  function loop() {
    if (gameStore.isPlaying && !gameStore.isPaused && !gameStore.isGameOver) {
      const now = Date.now()
      const config = gameStore.currentConfig
      
      if (now - lastMoveTime > config.speed) {
        gameStore.moveSnake()
        lastMoveTime = now
      }
      
      // 更新粒子
      gameStore.updateParticles()
    }
    
    gameLoop = requestAnimationFrame(loop)
  }
  
  loop()
}

/**
 * 渲染游戏画面
 */
function renderGame() {
  const game = getPhaserGame()
  if (!game) return

  game.renderSnake(gameStore.snake)
  game.renderFood(gameStore.food)
  game.renderObstacles(gameStore.obstacles)  // 渲染障碍物

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
</style>
