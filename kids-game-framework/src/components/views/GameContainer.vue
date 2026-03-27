<template>
  <div class="game-container">
    <!-- Loading 覆盖层 -->
    <LoadingOverlay
      v-if="status === 'loading'"
      :steps="loadingSteps"
      :current-step="currentStepIndex"
      :progress="loadingProgress"
      :message="loadingMessage"
      :game-icon="gameIcon"
    />

    <!-- 游戏画布容器 -->
    <div ref="gameCanvasRef" class="game-container__canvas">
      <slot name="game"></slot>
    </div>

    <!-- 游戏 HUD (抬头显示) -->
    <div class="game-container__hud" v-if="status === 'playing' && !isPaused">
      <!-- 分数面板 -->
      <div class="game-container__score" v-if="hudConfig.showScore">
        <ScorePanel
          :score="score"
          :high-score="highScore"
          :show-high-score="hudConfig.showHighScore"
        />
      </div>

      <!-- 道具效果栏 -->
      <div class="game-container__effects" v-if="hudConfig.showItemEffects && hasActiveEffects">
        <ItemEffectsBar :item-effects="itemEffects" />
      </div>

      <!-- 控制按钮 -->
      <div class="game-container__controls">
        <button
          v-if="hudConfig.showHomeButton"
          class="game-container__btn"
          @click="handleHome"
          title="返回"
        >
          🏠
        </button>
        <button
          v-if="hudConfig.showPauseButton"
          class="game-container__btn"
          @click="handlePause"
          title="暂停"
        >
          ⏸️
        </button>
        <button
          v-if="hudConfig.showFullscreenButton"
          class="game-container__btn"
          @click="handleFullscreen"
          title="全屏"
        >
          {{ isFullscreen ? '⛶' : '⛶' }}
        </button>
        <button
          v-if="hudConfig.showSoundToggle"
          class="game-container__btn"
          @click="handleSoundToggle"
          title="声音"
        >
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
      </div>
    </div>

    <!-- 操作提示 -->
    <div
      class="game-container__hints"
      v-if="showControlsHint && status === 'playing'"
    >
      <ControlsHint :hints="controlHints" />
    </div>

    <!-- 暂停覆盖层 -->
    <div class="game-container__overlay" v-if="isPaused && status === 'playing'">
      <div class="game-container__pause-panel">
        <h2>游戏暂停</h2>
        <div class="game-container__pause-actions">
          <GameButton variant="primary" @click="handleResume">
            {{ resumeText }}
          </GameButton>
          <GameButton variant="secondary" @click="handleQuit">
            {{ quitText }}
          </GameButton>
        </div>
      </div>
    </div>

    <!-- 错误覆盖层 -->
    <div class="game-container__overlay" v-if="error">
      <div class="game-container__error-panel">
        <div class="game-container__error-icon">⚠️</div>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <div class="game-container__error-actions">
          <GameButton variant="primary" @click="handleRetry">
            {{ retryText }}
          </GameButton>
          <GameButton variant="secondary" @click="handleBack">
            {{ backText }}
          </GameButton>
        </div>
      </div>
    </div>

    <!-- 自定义插槽 -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import GameButton from '../ui/GameButton.vue'
import ScorePanel from '../ui/ScorePanel.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import ControlsHint from './ControlsHint.vue'
import ItemEffectsBar from './ItemEffectsBar.vue'
import type { LoadingStep, HUDConfig, ControlHint, ItemEffectsState } from '../../types/ui.types'

const props = withDefaults(defineProps<{
  /** 游戏状态 */
  status?: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'gameover'
  /** 当前分数 */
  score?: number
  /** 最高分 */
  highScore?: number
  /** 是否暂停 */
  isPaused?: boolean
  /** 错误信息 */
  error?: string | null
  /** 道具效果 */
  itemEffects?: ItemEffectsState
  /** 加载步骤 */
  loadingSteps?: LoadingStep[]
  /** 当前加载步骤索引 */
  currentStepIndex?: number
  /** 加载进度 */
  loadingProgress?: number
  /** 加载消息 */
  loadingMessage?: string
  /** 游戏图标 */
  gameIcon?: string
  /** HUD 配置 */
  hudConfig?: HUDConfig
  /** 操作提示配置 */
  controlsConfig?: ControlHint[]
  /** 是否显示操作提示 */
  showControlsHint?: boolean
  /** 游戏名称 */
  gameName?: string
  /** 声音是否启用 */
  soundEnabled?: boolean
  /** 继续按钮文字 */
  resumeText?: string
  /** 退出按钮文字 */
  quitText?: string
  /** 重试按钮文字 */
  retryText?: string
  /** 返回按钮文字 */
  backText?: string
}>(), {
  status: 'idle',
  score: 0,
  highScore: 0,
  isPaused: false,
  error: null,
  itemEffects: () => ({
    speedMultiplier: 1,
    scoreMultiplier: 1,
    invincibility: false,
    doubleScore: false,
    slowDown: false,
    speedUp: false
  }),
  loadingSteps: () => [
    { id: 'init', label: '初始化游戏', progress: 20, icon: '🎮' },
    { id: 'assets', label: '加载资源', progress: 60, icon: '📦' },
    { id: 'ready', label: '准备就绪', progress: 100, icon: '✅' }
  ],
  currentStepIndex: 0,
  loadingProgress: 0,
  loadingMessage: '',
  gameIcon: '🎮',
  hudConfig: () => ({
    showScore: true,
    showHighScore: true,
    showItemEffects: true,
    showPauseButton: true,
    showHomeButton: true,
    showFullscreenButton: true,
    showSoundToggle: true
  }),
  showControlsHint: false,
  gameName: '游戏',
  soundEnabled: true,
  resumeText: '继续游戏',
  quitText: '退出游戏',
  retryText: '重试',
  backText: '返回'
})

const emit = defineEmits<{
  // 生命周期
  init: []
  start: []
  resume: []
  pause: []
  quit: []
  retry: []
  // 操作
  home: []
  fullscreen: []
  soundToggle: [enabled: boolean]
  // 游戏输入
  input: [direction: string]
}>()

const gameCanvasRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

// 计算是否有激活的道具效果
const hasActiveEffects = computed(() => {
  const effects = props.itemEffects
  return effects && (
    effects.speedMultiplier !== 1 ||
    effects.scoreMultiplier !== 1 ||
    effects.invincibility ||
    effects.doubleScore ||
    effects.slowDown ||
    effects.speedUp
  )
})

// 默认操作提示
const controlHints = computed<ControlHint[]>(() => props.controlsConfig || [
  { key: 'up', label: '向上', icon: '⬆️' },
  { key: 'down', label: '向下', icon: '⬇️' },
  { key: 'left', label: '向左', icon: '⬅️' },
  { key: 'right', label: '向右', icon: '➡️' }
])

// 事件处理
function handleHome() {
  emit('home')
}

function handlePause() {
  emit('pause')
}

function handleResume() {
  emit('resume')
}

function handleQuit() {
  emit('quit')
}

function handleRetry() {
  emit('retry')
}

function handleBack() {
  emit('home')
}

function handleFullscreen() {
  if (!document.fullscreenElement) {
    gameCanvasRef.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
  emit('fullscreen')
}

function handleSoundToggle() {
  emit('soundToggle', !props.soundEnabled)
}

// 键盘事件处理
function handleKeydown(e: KeyboardEvent) {
  if (props.status !== 'playing' || props.isPaused) return

  const keyMap: Record<string, string> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right'
  }

  const direction = keyMap[e.key]
  if (direction) {
    e.preventDefault()
    emit('input', direction)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  emit('init')
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--theme-background, #1a1a2e);
}

.game-container__canvas {
  width: 100%;
  height: 100%;
}

/* HUD 样式 */
.game-container__hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: none;
}

.game-container__score {
  pointer-events: auto;
}

.game-container__effects {
  position: absolute;
  top: 80px;
  left: 16px;
}

.game-container__controls {
  display: flex;
  gap: 8px;
  pointer-events: auto;
}

.game-container__btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(55, 65, 81, 0.8);
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.game-container__btn:hover {
  background: rgba(75, 85, 99, 0.9);
  transform: scale(1.1);
}

/* 操作提示 */
.game-container__hints {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

/* 覆盖层 */
.game-container__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  z-index: 100;
}

/* 暂停面板 */
.game-container__pause-panel,
.game-container__error-panel {
  background: var(--theme-surface, #334155);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  color: var(--theme-text, #ffffff);
}

.game-container__pause-panel h2,
.game-container__error-panel h3 {
  font-size: 24px;
  margin: 0 0 20px 0;
}

.game-container__pause-actions,
.game-container__error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 错误面板 */
.game-container__error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.game-container__error-panel p {
  color: var(--theme-text-secondary, #9ca3af);
  margin-bottom: 20px;
}
</style>
