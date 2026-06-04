<template>
  <Transition name="level-transition">
    <div
      v-if="isActive"
      class="level-transition-overlay"
    >
      <!-- 背景遮罩 -->
      <div class="overlay-bg" />

      <!-- 内容 -->
      <div class="transition-content">
        <!-- 关卡数 -->
        <div class="level-number">
          <span class="level-prefix">LEVEL</span>
          <span class="level-num">{{ toLevel }}</span>
        </div>

        <!-- 关卡名 -->
        <div class="level-name">{{ toLevelName }}</div>

        <!-- 升级提示 -->
        <div class="level-hint">
          <span v-if="fromLevel > 0">第 {{ fromLevel }} 关完成！</span>
        </div>

        <!-- 新参数预览 -->
        <div class="level-params">
          <div class="param-item">
            <span class="param-icon">⚡</span>
            <span>速度提升</span>
          </div>
          <div v-if="obstacleAdded" class="param-item warning">
            <span class="param-icon">🪨</span>
            <span>障碍物增加</span>
          </div>
          <div class="param-item bonus">
            <span class="param-icon">💰</span>
            <span>分数更高</span>
          </div>
        </div>

        <!-- 进度条提示 -->
        <div class="progress-hint">
          即将开始...
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { getLevelConfig } from '@/types/level'

const gameStore = useGameStore()

const isActive = computed(() => gameStore.levelTransition.isActive)
const fromLevel = computed(() => gameStore.levelTransition.fromLevel)
const toLevel = computed(() => gameStore.levelTransition.toLevel)
const toLevelName = computed(() => gameStore.levelTransition.toLevelName)

const obstacleAdded = computed(() => {
  if (fromLevel.value <= 0) return false
  const prevConfig = getLevelConfig(fromLevel.value, gameStore.difficulty)
  const nextConfig = getLevelConfig(toLevel.value, gameStore.difficulty)
  return nextConfig.obstacleCount > prevConfig.obstacleCount
})
</script>

<style scoped>
.level-transition-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.overlay-bg {
  position: absolute;
  inset: 0;
  background: transparent;
}

.transition-content {
  position: relative;
  text-align: center;
  padding: 2rem 3rem;
  z-index: 1;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
}

.level-number {
  margin-bottom: 0.5rem;
}

.level-prefix {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(251, 191, 36, 0.8);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.level-num {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  text-shadow: none;
}

.level-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.level-hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.level-params {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
}

.param-item.warning {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
}

.param-item.bonus {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.15);
}

.param-icon {
  font-size: 1rem;
}

.progress-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  animation: pulse-hint 1s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* 过渡动画 */
.level-transition-enter-active {
  transition: all 0.4s ease-out;
}

.level-transition-leave-active {
  transition: all 0.3s ease-in;
}

.level-transition-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.level-transition-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
