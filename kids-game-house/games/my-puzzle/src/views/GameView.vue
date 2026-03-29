<script setup lang="ts">
/**
 * 游戏主界面
 *
 * 包含：
 * - Phaser 游戏画布
 * - 顶部 HUD（分数、暂停按钮）
 * - 暂停弹窗
 * - 返回主页按钮
 */
import { ref, computed, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import PhaserGame from '@/components/game/PhaserGame.vue'
import PauseButton from '@/components/ui/PauseButton.vue'
import GameButton from '@/components/ui/GameButton.vue'

const emit = defineEmits<{
  'game-over': [score: number]
  back: []
}>()

const gameStore = useGameStore()
const gameRef = ref<InstanceType<typeof PhaserGame> | null>(null)
const isPaused = ref(false)
const isReady = ref(false)

// 分数展示（从 store 实时读取）
const currentScore = computed(() => gameStore.score)
const highScore = computed(() => gameStore.highScore)

// ─── 事件处理 ─────────────────────────────────────────────────

function handleReady() {
  isReady.value = true
}

function handleGameOver(score: number) {
  emit('game-over', score)
}

function handlePaused() {
  isPaused.value = true
}

function handleResumed() {
  isPaused.value = false
}

function togglePause() {
  gameRef.value?.togglePause()
}

function handleContinue() {
  gameRef.value?.resume()
}

function handleBack() {
  gameStore.reset()
  emit('back')
}

onUnmounted(() => {
  gameStore.reset()
})
</script>

<template>
  <div class="game-view">
    <!-- Phaser 游戏画布 -->
    <PhaserGame
      ref="gameRef"
      @ready="handleReady"
      @game-over="handleGameOver"
      @paused="handlePaused"
      @resumed="handleResumed"
    />

    <!-- 顶部 HUD -->
    <div v-if="isReady" class="hud">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="handleBack" title="返回主页">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>

      <!-- 分数 -->
      <div class="score-display">
        <span class="score-value">{{ currentScore.toLocaleString() }}</span>
        <span v-if="highScore > 0" class="high-score">最高 {{ highScore.toLocaleString() }}</span>
      </div>

      <!-- 暂停按钮 -->
      <PauseButton :is-paused="isPaused" @click="togglePause" />
    </div>

    <!-- 加载遮罩 -->
    <div v-if="!isReady" class="loading-mask">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 暂停弹窗 -->
    <Transition name="fade">
      <div v-if="isPaused" class="pause-overlay">
        <div class="pause-dialog">
          <h2 class="pause-title">游戏暂停</h2>
          <div class="pause-score">得分：{{ currentScore.toLocaleString() }}</div>
          <div class="pause-actions">
            <GameButton text="继续游戏" size="large" @click="handleContinue" />
            <GameButton text="返回主页" variant="secondary" @click="handleBack" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.game-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
}

/* ─── 顶部 HUD ─── */
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.back-btn svg {
  width: 22px;
  height: 22px;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.score-value {
  font-size: 22px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
}

.high-score {
  font-size: 11px;
  color: #94a3b8;
}

/* ─── 加载遮罩 ─── */
.loading-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.8);
  color: #94a3b8;
  font-size: 14px;
  gap: 16px;
  z-index: 200;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4ade80;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── 暂停弹窗 ─── */
.pause-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.pause-dialog {
  background: rgba(30, 30, 60, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  min-width: 260px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.pause-title {
  font-size: 28px;
  color: #ffffff;
  margin-bottom: 12px;
}

.pause-score {
  font-size: 16px;
  color: #94a3b8;
  margin-bottom: 32px;
}

.pause-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ─── 动画 ─── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
