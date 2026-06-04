<template>
  <div class="game-view w-full h-full relative overflow-hidden">

    <!-- Phaser 游戏画布 -->
    <PhaserGame
      ref="gameRef"
      @ready="handleReady"
      @game-over="handleGameOver"
      @paused="handlePaused"
      @resumed="handleResumed"
    />

    <!-- 加载遮罩（游戏引擎未就绪时） -->
    <Transition name="fade">
      <div v-if="!isReady" class="loading-overlay">
        <div class="loading-inner">
          <div class="loading-spinner"></div>
          <p class="text-white mt-4 text-base font-medium" :style="{ fontSize: ui.getFontSize(16) }">
            {{ loadingText }}
          </p>
          <!-- 加载步骤 -->
          <div class="mt-3 text-sm text-gray-400">
            <p v-for="(step, i) in loadingSteps" :key="i"
               :class="i === loadingStep ? 'text-blue-400' : i < loadingStep ? 'text-green-400' : 'text-gray-600'">
              {{ i < loadingStep ? '✅' : i === loadingStep ? '⏳' : '○' }} {{ step }}
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 顶部 HUD（游戏就绪后显示） -->
    <Transition name="slide-down-hud">
      <div v-if="isReady" class="hud absolute top-0 left-0 right-0 z-30 flex items-center px-3 py-2">
        <!-- 返回按钮 -->
        <button class="hud-icon-btn mr-2" :style="hudBtnStyle" @click="confirmBack" title="返回首页">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>

        <!-- 分数区 -->
        <div class="flex-1 flex items-center justify-center gap-4">
          <!-- 当前分数 -->
          <div class="score-chip">
            <span class="text-gray-400" :style="{ fontSize: ui.getFontSize(11) }">分数</span>
            <span class="text-white font-bold" :style="{ fontSize: ui.getFontSize(20) }">
              {{ currentScore }}
            </span>
          </div>

          <!-- 关卡指示 -->
          <div class="level-chip" :style="{ fontSize: ui.getFontSize(12) }">
            🏰 {{ currentLevel }} 关 · {{ levelName }}
          </div>

          <!-- 最高分 -->
          <div class="score-chip">
            <span class="text-gray-400" :style="{ fontSize: ui.getFontSize(11) }">最高</span>
            <span class="text-yellow-400 font-bold" :style="{ fontSize: ui.getFontSize(20) }">
              {{ highScore }}
            </span>
          </div>
        </div>

        <!-- 音效 + 暂停 -->
        <div class="flex items-center gap-2 ml-2">
          <SoundToggle :compact="true" />
          <PauseButton :is-paused="isPaused" :style="hudBtnStyle" @click="togglePause" />
        </div>
      </div>
    </Transition>

    <!-- 关卡升级动画 -->
    <LevelTransitionOverlay
      v-if="gameStore.levelTransition.isActive"
      :transition="gameStore.levelTransition"
      @dismissed="gameStore.dismissLevelTransition()"
    />

    <!-- 暂停弹窗 -->
    <Transition name="scale-in">
      <div v-if="isPaused" class="pause-overlay">
        <div class="pause-modal">
          <div class="text-4xl mb-3">⏸️</div>
          <h3 class="text-white font-bold mb-2" :style="{ fontSize: ui.getFontSize(24) }">游戏暂停</h3>
          <p class="text-gray-400 mb-6" :style="{ fontSize: ui.getFontSize(14) }">当前分数：{{ currentScore }}</p>
          <div class="flex flex-col gap-3 w-full">
            <GameButton variant="primary" :fontSize="18" :paddingTop="12" :paddingBottom="12" @click="handleContinue">
              ▶️ 继续游戏
            </GameButton>
            <GameButton variant="secondary" :fontSize="16" :paddingTop="10" :paddingBottom="10" @click="confirmBack">
              🏠 返回首页
            </GameButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 错误遮罩 -->
    <Transition name="fade">
      <div v-if="errorMessage" class="error-overlay">
        <div class="pause-modal">
          <div class="text-4xl mb-3">⚠️</div>
          <h3 class="text-white font-bold mb-2">遇到问题</h3>
          <p class="text-gray-400 text-sm mb-6">{{ errorMessage }}</p>
          <div class="flex gap-3">
            <GameButton variant="primary" :fontSize="15" :paddingTop="10" :paddingBottom="10" @click="retryGame">
              🔄 重试
            </GameButton>
            <GameButton variant="secondary" :fontSize="15" :paddingTop="10" :paddingBottom="10" @click="backToHome">
              🏠 首页
            </GameButton>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import PhaserGame from '@/components/game/PhaserGame.vue'
import PauseButton from '@/components/ui/PauseButton.vue'
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import LevelTransitionOverlay from '@/components/ui/LevelTransitionOverlay.vue'

const router     = useRouter()
const route      = useRoute()
const gameStore  = useGameStore()
const audioStore = useAudioStore()
const ui         = useResponsiveUI()

const gameRef      = ref<InstanceType<typeof PhaserGame> | null>(null)
const isPaused     = ref(false)
const isReady      = ref(false)
const errorMessage = ref('')
const loadingStep  = ref(0)

const loadingSteps = ['初始化引擎', '加载资源', '准备音频', '游戏就绪']
const loadingText  = computed(() => loadingSteps[Math.min(loadingStep.value, loadingSteps.length - 1)])

// ── Store 数据 ─────────────────────────────────────────────────────────────
const currentScore = computed(() => gameStore.score)
const highScore    = computed(() => gameStore.highScore)
const currentLevel = computed(() => gameStore.currentLevel)
const levelName    = computed(() => gameStore.levelConfig?.name || '')

// ── HUD 样式 ───────────────────────────────────────────────────────────────
const hudBtnStyle = computed(() => ({
  width    : ui.getWidth(36),
  height   : ui.getWidth(36),
  minWidth : ui.getWidth(36),
}))

// ── 事件处理 ───────────────────────────────────────────────────────────────

function handleReady() {
  loadingStep.value = 3
  setTimeout(() => { isReady.value = true }, 400)
}

function handleGameOver(_score: number) {
  const themeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || ''
  router.push({ path: '/gameover', query: { theme_id: themeId } })
}

function handlePaused() {
  isPaused.value = true
  audioStore.stopBGM()
}

function handleResumed() {
  isPaused.value = false
  audioStore.startBGM()
}

function togglePause() {
  audioStore.playPauseSound()
  gameRef.value?.togglePause()
}

function handleContinue() {
  audioStore.playClickSound()
  gameRef.value?.resume()
}

function confirmBack() {
  // 暂停游戏后导航（避免背景游戏仍在运行）
  if (!isPaused.value) gameRef.value?.pause()
  backToHome()
}

function backToHome() {
  audioStore.stopBGM()
  router.push('/')
}

function retryGame() {
  errorMessage.value = ''
  isReady.value      = false
  loadingStep.value  = 0
  // PhaserGame 组件会在重新挂载时自动重启
  router.replace(router.currentRoute.value)
}

// ── 监听 isGameOver，自动跳转 ────────────────────────────────────────────
watch(() => gameStore.isGameOver, (over) => {
  if (over) handleGameOver(gameStore.score)
})

// ── 模拟加载进度 ─────────────────────────────────────────────────────────
function advanceLoadingStep() {
  if (loadingStep.value < 2 && !isReady.value) {
    loadingStep.value++
    setTimeout(advanceLoadingStep, 800)
  }
}

// ── 生命周期 ──────────────────────────────────────────────────────────────
onMounted(() => {
  console.log('🎮 GameView mounted!')
  initUIParams(window.innerWidth, window.innerHeight)
  // 启动 BGM
  setTimeout(() => audioStore.startBGM(), 500)
  // 启动模拟加载进度
  setTimeout(advanceLoadingStep, 600)
})

onUnmounted(() => {
  console.log('🧹 GameView unmounted')
  audioStore.stopBGM()
})
</script>

<style scoped>
.game-view {
  background: #000;
  width: 100%;
  height: 100%;
}

/* 确保 Phaser 游戏画布正确显示 */
.game-view :deep(.phaser-game) {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* 加载遮罩 */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1a2335 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.loading-inner {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* HUD */
.hud {
  background: linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%);
}

.hud-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.hud-icon-btn:hover { background: rgba(255, 255, 255, 0.22); }

.score-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 4px 10px;
}

.level-chip {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 9999px;
  padding: 3px 10px;
  font-size: 12px;
  white-space: nowrap;
}

/* 暂停 & 错误遮罩 */
.pause-overlay,
.error-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  backdrop-filter: blur(8px);
}

.pause-modal {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 24px;
  padding: 2rem 2.5rem;
  width: 90%;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.4);
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,  .fade-leave-to     { opacity: 0; }

.scale-in-enter-active { transition: all 0.3s ease; }
.scale-in-leave-active { transition: all 0.2s ease; }
.scale-in-enter-from   { opacity: 0; transform: scale(0.85); }
.scale-in-leave-to     { opacity: 0; transform: scale(0.9); }

.slide-down-hud-enter-active { transition: all 0.4s ease; }
.slide-down-hud-leave-active { transition: all 0.3s ease; }
.slide-down-hud-enter-from   { opacity: 0; transform: translateY(-20px); }
.slide-down-hud-leave-to     { opacity: 0; transform: translateY(-10px); }
</style>
