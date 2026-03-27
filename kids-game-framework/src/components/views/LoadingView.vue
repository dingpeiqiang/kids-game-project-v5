<template>
  <div class="loading-view">
    <!-- 游戏图标 -->
    <div class="loading-view__icon" v-if="gameIcon">
      {{ gameIcon }}
    </div>

    <!-- 加载动画 -->
    <div class="loading-view__spinner" v-if="showSpinner">
      <div class="loading-view__spinner-circle"></div>
    </div>

    <!-- 进度条 -->
    <div class="loading-view__progress-container" v-if="showProgress">
      <div class="loading-view__progress-bar">
        <div
          class="loading-view__progress-fill"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <span class="loading-view__progress-text">{{ progress }}%</span>
    </div>

    <!-- 步骤列表 -->
    <div class="loading-view__steps" v-if="showSteps">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="loading-view__step"
        :class="{
          'loading-view__step--active': index === currentStepIndex,
          'loading-view__step--completed': index < currentStepIndex
        }"
      >
        <span class="loading-view__step-icon">
          {{ index < currentStepIndex ? '✓' : step.icon }}
        </span>
        <span class="loading-view__step-label">{{ step.label }}</span>
      </div>
    </div>

    <!-- 加载消息 -->
    <p class="loading-view__message" v-if="message">{{ message }}</p>

    <!-- 自定义内容 -->
    <div class="loading-view__extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoadingStep } from '../../types/ui.types'

const props = withDefaults(defineProps<{
  /** 加载步骤 */
  steps?: LoadingStep[]
  /** 当前步骤索引 */
  currentStep?: number
  /** 总进度 (0-100) */
  progress?: number
  /** 加载消息 */
  message?: string
  /** 游戏图标 */
  gameIcon?: string
  /** 是否显示加载动画 */
  showSpinner?: boolean
  /** 是否显示进度条 */
  showProgress?: boolean
  /** 是否显示步骤列表 */
  showSteps?: boolean
}>(), {
  steps: () => [
    { id: 'init', label: '初始化游戏', progress: 20, icon: '🎮' },
    { id: 'assets', label: '加载资源', progress: 60, icon: '📦' },
    { id: 'ready', label: '准备就绪', progress: 100, icon: '✅' }
  ],
  currentStep: 0,
  progress: 0,
  message: '',
  gameIcon: '🎮',
  showSpinner: true,
  showProgress: true,
  showSteps: true
})

const currentStepIndex = computed(() => props.currentStep)
</script>

<style scoped>
.loading-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: var(--theme-background, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
  color: var(--theme-text, #ffffff);
}

.loading-view__icon {
  font-size: 80px;
  margin-bottom: 30px;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 加载动画 */
.loading-view__spinner {
  width: 60px;
  height: 60px;
  margin-bottom: 30px;
}

.loading-view__spinner-circle {
  width: 100%;
  height: 100%;
  border: 4px solid rgba(74, 222, 128, 0.2);
  border-top-color: #4ade80;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 进度条 */
.loading-view__progress-container {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 80%;
  max-width: 300px;
  margin-bottom: 30px;
}

.loading-view__progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(55, 65, 81, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.loading-view__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.loading-view__progress-text {
  font-size: 14px;
  font-weight: bold;
  color: #4ade80;
  min-width: 40px;
  text-align: right;
}

/* 步骤列表 */
.loading-view__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 80%;
  max-width: 280px;
}

.loading-view__step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(55, 65, 81, 0.3);
  transition: all 0.3s ease;
}

.loading-view__step--active {
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid #4ade80;
}

.loading-view__step--completed {
  background: rgba(34, 197, 94, 0.1);
}

.loading-view__step-icon {
  font-size: 18px;
}

.loading-view__step-label {
  font-size: 14px;
}

.loading-view__step--completed .loading-view__step-label {
  color: #22c55e;
}

.loading-view__step--active .loading-view__step-label {
  color: #4ade80;
  font-weight: bold;
}

/* 加载消息 */
.loading-view__message {
  font-size: 14px;
  color: var(--theme-text-secondary, #9ca3af);
  margin-top: 20px;
  text-align: center;
}

.loading-view__extra {
  margin-top: 30px;
}
</style>
