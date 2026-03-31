<template>
  <div class="snake-game-container relative w-full h-screen overflow-hidden">
    <!-- ⭐ 资源检测 Loading 覆盖层 -->
    <div
      v-if="isLoading"
      class="loading-overlay absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="loading-container max-w-md mx-4 p-6 text-center">
        <div class="loading-icon text-6xl mb-4 animate-bounce">🔍</div>
        <h2 class="loading-title text-2xl font-bold text-white mb-4">{{ loadingTitle }}</h2>
        <div class="progress-container bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
          <div
            class="progress-bar bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <p class="loading-text text-white/80 text-sm mb-2">{{ loadingText }}</p>
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

    <!-- 游戏内 UI 覆盖层 -->
    <div class="game-ui absolute top-2 left-0 right-0 flex justify-between items-start pointer-events-none px-4">
      <!-- 左侧：分数面板 -->
      <div class="flex flex-col gap-1">
        <ScorePanel
          :score="score"
          :highScore="highScore"
          class="pointer-events-auto max-w-[180px]"
        />
      </div>

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
          ⛶
        </button>
        <SoundToggle />
        <!-- 暂停按钮（直接用新架构的 pause/resume） -->
        <button
          @click="togglePause"
          class="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-all"
          :title="isPaused ? '继续游戏' : '暂停游戏'"
        >
          {{ isPaused ? '▶️' : '⏸️' }}
        </button>
      </div>
    </div>

    <!-- 🎁 道具效果状态栏 -->
    <div
      v-if="isPlaying && activeEffects.length > 0"
      class="item-effects-bar absolute top-16 left-0 right-0 flex justify-center gap-2 pointer-events-none px-4"
    >
      <transition-group name="effect-badge">
        <div
          v-for="effect in activeEffects"
          :key="effect.type"
          class="effect-badge flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg backdrop-blur-sm"
          :class="getEffectBadgeClass(effect.type)"
        >
          <span class="text-base">{{ effect.icon }}</span>
          <span>{{ getEffectLabel(effect.type) }}</span>
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
      v-if="isPaused"
      class="pause-overlay absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20"
    >
      <div class="text-center">
        <div class="text-5xl mb-4">⏸️</div>
        <div class="text-3xl font-bold text-white mb-6">游戏暂停</div>
        <GameButton @click="togglePause" variant="primary" :fontSize="20" :paddingLeft="32" :paddingRight="32" :paddingTop="14" :paddingBottom="14">
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
        <div class="error-icon text-center mb-4">
          <div class="text-6xl">⚠️</div>
        </div>
        <h2 class="error-title text-2xl font-bold text-white text-center mb-4">
          游戏加载失败
        </h2>
        <div class="error-details text-white/90 text-sm mb-6 space-y-3">
          <p>{{ loadError.message }}</p>
        </div>
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
        <details class="mt-4">
          <summary class="text-xs text-white/50 cursor-pointer hover:text-white/70">查看技术详情</summary>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import { EventBus } from '@/components/core/EventBus'
import { GameEventType } from '@/components/core/GameEvent'
import { ComponentGameSceneV2 } from '@/scenes/ComponentGameSceneV2'
// UI 组件
import ScorePanel from '@/components/ui/ScorePanel.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { initUIParams } from '@/utils/uiResponsive'

// ============================================================================
// 路由 & Store
// ============================================================================
const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const themeStore = useThemeStore()

// ============================================================================
// DOM 引用
// ============================================================================
const gameContainer = ref<HTMLElement | null>(null)

// ============================================================================
// 游戏场景实例（新架构）
// ============================================================================
let gameScene: ComponentGameSceneV2 | null = null

// ============================================================================
// 加载状态
// ============================================================================
const isLoading = ref(true)
const progress = ref(0)
const loadingTitle = ref('正在初始化游戏')
const loadingText = ref('准备中...')

// ============================================================================
// 错误状态
// ============================================================================
const loadError = ref<{
  message: string
  rawError: string
} | null>(null)

// ============================================================================
// 游戏 UI 状态（由 EventBus 驱动，不依赖 stores/game.ts）
// ============================================================================
const score = ref(0)
const highScore = ref(0)
const isPaused = ref(false)
const isPlaying = ref(false)
const isFullscreen = ref(false)

// 道具效果（由 ITEM_EFFECT_ACTIVATED / ITEM_EFFECT_EXPIRED 驱动）
interface ActiveEffect {
  type: string
  icon: string
  endTime: number
  duration: number
}
const activeEffects = ref<ActiveEffect[]>([])

// ============================================================================
// 触摸控制
// ============================================================================
let touchStartX = 0
let touchStartY = 0

// ============================================================================
// EventBus 订阅 ID（用于取消订阅）
// ============================================================================
const subscriptionIds: string[] = []

// ============================================================================
// 初始化
// ============================================================================
onMounted(async () => {
  initUIParams(window.innerWidth, window.innerHeight)

  // 监听全屏变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // 非被动 touchmove 阻止默认滚动
  if (gameContainer.value) {
    gameContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  }

  // 键盘输入
  window.addEventListener('keydown', handleKeyDown)

  // 资源检查（复用原有逻辑，仅做加载状态显示）
  try {
    await performResourceCheck()
  } catch (err: any) {
    loadError.value = { message: err.message || '资源检查失败', rawError: String(err) }
    isLoading.value = false
    return
  }

  // 订阅 EventBus
  subscribeToEventBus()

  // 创建并启动新架构场景
  await startGameScene()
})

onUnmounted(() => {
  // 取消所有 EventBus 订阅
  const eventBus = EventBus.getInstance()
  subscriptionIds.forEach(id => eventBus.off(id))

  // 停止游戏场景
  gameScene?.stop()
  gameScene = null

  // 清理事件
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (gameContainer.value) {
    gameContainer.value.removeEventListener('touchmove', handleTouchMove)
  }
})

// ============================================================================
// EventBus 订阅（将引擎事件映射到 Vue 响应式状态）
// ============================================================================
function subscribeToEventBus() {
  const eventBus = EventBus.getInstance()

  // 分数变化
  subscriptionIds.push(
    eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
      score.value = event.payload?.score ?? 0
      highScore.value = event.payload?.highScore ?? highScore.value
    })
  )

  // 最高分更新
  subscriptionIds.push(
    eventBus.on(GameEventType.HIGH_SCORE_UPDATED, (event) => {
      highScore.value = event.payload?.highScore ?? highScore.value
    })
  )

  // 游戏开始
  subscriptionIds.push(
    eventBus.on(GameEventType.GAME_START, () => {
      isPlaying.value = true
      isPaused.value = false
      score.value = 0
    })
  )

  // 暂停
  subscriptionIds.push(
    eventBus.on(GameEventType.PAUSE, () => {
      isPaused.value = true
      gameScene?.pausePhaser()
    })
  )

  // 恢复
  subscriptionIds.push(
    eventBus.on(GameEventType.RESUME, () => {
      isPaused.value = false
      gameScene?.resumePhaser()
    })
  )

  // 游戏结束
  subscriptionIds.push(
    eventBus.on(GameEventType.GAME_OVER, (event) => {
      isPlaying.value = false
      // 将分数传给 GameOverView
      sessionStorage.setItem('last-score', String(event.payload?.score ?? score.value))
      sessionStorage.setItem('last-high-score', String(event.payload?.highScore ?? highScore.value))
      setTimeout(() => {
        router.push('/gameover')
      }, 800)
    })
  )

  // 道具效果激活
  subscriptionIds.push(
    eventBus.on(GameEventType.ITEM_EFFECT_ACTIVATED, (event) => {
      const { type, icon, duration } = event.payload ?? {}
      if (!type) return
      // 移除同类旧效果
      activeEffects.value = activeEffects.value.filter(e => e.type !== type)
      activeEffects.value.push({
        type,
        icon: icon ?? '✨',
        endTime: Date.now() + (duration ?? 5000),
        duration: duration ?? 5000,
      })
    })
  )

  // 道具效果消失
  subscriptionIds.push(
    eventBus.on(GameEventType.ITEM_EFFECT_EXPIRED, (event) => {
      const type = event.payload?.type
      if (type) {
        activeEffects.value = activeEffects.value.filter(e => e.type !== type)
      }
    })
  )
}

// ============================================================================
// 启动游戏场景
// ============================================================================
async function startGameScene() {
  if (!gameContainer.value) return

  const themeId = (route.query.theme_id as string) || localStorage.getItem('current-theme-id') || ''

  try {
    gameScene = new ComponentGameSceneV2(gameContainer.value)
    await gameScene.start({
      difficulty: settingsStore.difficulty as any,
      themeId,
    })
    isPlaying.value = true
    console.log('✅ [ComponentSnakeGame] 新架构游戏场景启动成功')
  } catch (err: any) {
    console.error('[ComponentSnakeGame] 启动失败', err)
    loadError.value = { message: err.message || '游戏启动失败', rawError: String(err) }
  }
}

// ============================================================================
// 资源预检（保留原有逻辑，仅显示进度）
// ============================================================================
async function performResourceCheck() {
  isLoading.value = true
  progress.value = 0
  loadingTitle.value = '正在初始化游戏'
  loadingText.value = '准备中...'

  // 验证登录
  progress.value = 20
  loadingText.value = '验证用户登录状态...'
  const token = localStorage.getItem('token')
  if (!token) throw new Error('请先登录再玩游戏哦~')
  await delay(150)

  // 验证主题
  progress.value = 40
  loadingText.value = '检查主题配置...'
  const themeId = (route.query.theme_id as string) || localStorage.getItem('current-theme-id') || ''
  if (!themeId) throw new Error('还没有选择喜欢的主题呢，请先选择一个主题')
  await delay(150)

  // 验证 GTRS
  progress.value = 60
  loadingText.value = '验证 GTRS 主题...'
  const gtrsJson = themeStore.gtrsRawJson
  if (!gtrsJson) throw new Error('主题资源未加载，请重新选择主题')
  await delay(200)

  progress.value = 90
  loadingText.value = '准备游戏环境...'
  await delay(300)

  progress.value = 100
  loadingText.value = '游戏已就绪，即将开始...'
  await delay(400)

  isLoading.value = false
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// UI 交互
// ============================================================================
function goToHome() {
  gameScene?.stop()
  gameScene = null
  router.push('/')
}

function togglePause() {
  if (isPaused.value) {
    gameScene?.resume()
  } else {
    gameScene?.pause()
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.error('全屏失败:', err))
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function handleGoBack() {
  loadError.value = null
  router.back()
}

async function handleRetry() {
  loadError.value = null
  gameScene?.stop()
  gameScene = null
  try {
    await performResourceCheck()
    subscribeToEventBus() // 重新订阅（避免重复）
    await startGameScene()
  } catch (err: any) {
    loadError.value = { message: err.message || '重新加载失败', rawError: String(err) }
  }
}

// ============================================================================
// 键盘 / 触摸输入（直接通过 EventBus 发送，不依赖 Phaser 键盘）
// ============================================================================
function handleKeyDown(event: KeyboardEvent) {
  const key = event.key.toLowerCase()

  // 暂停 / 恢复
  if (key === ' ' || key === 'escape') {
    togglePause()
    return
  }

  // 方向控制（直接发 EventBus 事件，替代 InputHandlerComponent 的 Phaser 键盘监听）
  const directionMap: Record<string, string> = {
    arrowup: 'up', w: 'up',
    arrowdown: 'down', s: 'down',
    arrowleft: 'left', a: 'left',
    arrowright: 'right', d: 'right',
  }
  const direction = directionMap[key]
  if (direction && !isPaused.value) {
    const eventBus = EventBus.getInstance()
    eventBus.emit({
      type: GameEventType.INPUT_DIRECTION_CHANGED,
      payload: { direction, code: event.code, timestamp: Date.now() },
      timestamp: Date.now(),
    })
  }
}

function handleTouchStart(event: TouchEvent) {
  touchStartX = event.touches[0].clientX
  touchStartY = event.touches[0].clientY
}

function handleTouchMove(event: TouchEvent) {
  event.preventDefault()
}

function handleTouchEnd(event: TouchEvent) {
  if (isPaused.value) return

  const touchEndX = event.changedTouches[0].clientX
  const touchEndY = event.changedTouches[0].clientY
  const dx = touchEndX - touchStartX
  const dy = touchEndY - touchStartY

  const eventBus = EventBus.getInstance()

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) {
      eventBus.emit({ type: GameEventType.INPUT_DIRECTION_CHANGED, payload: { direction: 'right' }, timestamp: Date.now() })
    } else if (dx < -30) {
      eventBus.emit({ type: GameEventType.INPUT_DIRECTION_CHANGED, payload: { direction: 'left' }, timestamp: Date.now() })
    }
  } else {
    if (dy > 30) {
      eventBus.emit({ type: GameEventType.INPUT_DIRECTION_CHANGED, payload: { direction: 'down' }, timestamp: Date.now() })
    } else if (dy < -30) {
      eventBus.emit({ type: GameEventType.INPUT_DIRECTION_CHANGED, payload: { direction: 'up' }, timestamp: Date.now() })
    }
  }
}

// ============================================================================
// 道具效果 UI 辅助
// ============================================================================
function getEffectBadgeClass(type: string): string {
  const classMap: Record<string, string> = {
    'speed_boost':   'bg-yellow-500/80 border border-yellow-300/50',
    'slow_down':     'bg-gray-500/80 border border-gray-300/50',
    'shield':        'bg-blue-500/80 border border-blue-300/50',
    'magnet':        'bg-pink-500/80 border border-pink-300/50',
    'double_score':  'bg-green-500/80 border border-green-300/50',
    'length_reduce': 'bg-orange-500/80 border border-orange-300/50',
  }
  return classMap[type] || 'bg-white/20'
}

function getEffectLabel(type: string): string {
  const labelMap: Record<string, string> = {
    'speed_boost':   '加速',
    'slow_down':     '减速',
    'shield':        '护盾',
    'magnet':        '磁铁',
    'double_score':  '双倍分',
    'length_reduce': '已缩短',
  }
  return labelMap[type] || type
}

function getEffectProgress(effect: ActiveEffect): number {
  const remaining = Math.max(0, effect.endTime - Date.now())
  return (remaining / effect.duration) * 100
}
</script>

<style scoped>
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
  background: transparent;
  min-height: 0;
}

.pause-overlay {
  z-index: 20;
  animation: fadeIn 0.2s ease;
}

.error-overlay {
  animation: slideIn 0.3s ease;
}

.error-container {
  animation: bounceIn 0.4s ease;
}

.controls-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

.item-effects-bar {
  z-index: 15;
}

.effect-badge-enter-active { animation: effectIn 0.3s ease; }
.effect-badge-leave-active { animation: effectOut 0.3s ease forwards; }
.effect-badge-move { transition: transform 0.3s ease; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.9); }
  50% { transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes effectIn {
  from { opacity: 0; transform: translateY(-10px) scale(0.8); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes effectOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.7); }
}
</style>
