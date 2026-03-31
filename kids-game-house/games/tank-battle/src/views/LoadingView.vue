<template>
  <div class="loading-screen">
    <div class="loading-content">
      <!-- Logo -->
      <div class="loading-logo">
        <span class="logo-icon">🎖️</span>
        <span class="logo-text">坦克大战</span>
      </div>

      <!-- 进度条 -->
      <div class="progress-wrap">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <span class="progress-pct">{{ progress }}%</span>
      </div>

      <!-- 状态文字 -->
      <p class="status-text">{{ statusText }}</p>

      <!-- 加载步骤 -->
      <div class="steps">
        <p
          v-for="(step, i) in loadingSteps"
          :key="i"
          class="step-item"
          :class="{
            'step-done': i < currentStep,
            'step-active': i === currentStep,
            'step-pending': i > currentStep,
          }"
        >
          {{ i < currentStep ? '✅' : i === currentStep ? '⏳' : '○' }} {{ step.text }}
        </p>
      </div>

      <!-- 错误 -->
      <div v-if="error" class="error-section">
        <p class="error-text">{{ error }}</p>
        <button class="retry-btn" @click="retry">🔄 重试</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const progress = ref(0)
const statusText = ref('正在加载...')
const currentStep = ref(0)
const error = ref('')

const loadingSteps = [
  { text: '初始化游戏引擎', percent: 10 },
  { text: '加载图片资源', percent: 30 },
  { text: '加载音频资源', percent: 50 },
  { text: '验证 GTRS 配置', percent: 65 },
  { text: '初始化物理引擎', percent: 80 },
  { text: '准备游戏场景', percent: 92 },
  { text: '即将开始...', percent: 100 },
]

const startLoading = async () => {
  try {
    error.value = ''
    for (let i = 0; i < loadingSteps.length; i++) {
      const step = loadingSteps[i]
      currentStep.value = i
      statusText.value = step.text

      // 模拟渐进进度
      const start = progress.value
      const end = step.percent
      const frames = 8
      for (let f = 1; f <= frames; f++) {
        await new Promise(r => setTimeout(r, 30))
        progress.value = Math.round(start + (end - start) * (f / frames))
      }
    }

    // 完成
    currentStep.value = loadingSteps.length
    statusText.value = '加载完成！'
    progress.value = 100

    await new Promise(r => setTimeout(r, 400))
    router.push('/start')
  } catch (e) {
    error.value = '加载失败，请重试'
    console.error(e)
  }
}

const retry = () => {
  progress.value = 0
  currentStep.value = 0
  startLoading()
}

// 自动开始
startLoading()
</script>

<style scoped>
.loading-screen {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #0f1a12 0%, #1a2e1f 40%, #0d1f15 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading-content {
  text-align: center;
  max-width: 360px;
  width: 100%;
  padding: 2rem;
}

/* Logo */
.loading-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 2.5rem;
}
.logo-icon { font-size: 2rem; }
.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 0.1em;
}

/* 进度条 */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}
.progress-track {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 999px;
  transition: width 0.2s ease;
  box-shadow: 0 0 12px rgba(74,222,128,0.3);
}
.progress-pct {
  font-size: 0.8rem;
  font-weight: 700;
  color: #4ade80;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 状态文字 */
.status-text {
  font-size: 0.9rem;
  color: #d1d5db;
  margin-bottom: 1.25rem;
}

/* 步骤 */
.steps {
  text-align: left;
  padding: 0 0.5rem;
}
.step-item {
  font-size: 0.8rem;
  padding: 3px 0;
  transition: color 0.2s;
}
.step-done   { color: #4ade80; }
.step-active { color: #60a5fa; }
.step-pending { color: #4b5563; }

/* 错误 */
.error-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(239,68,68,0.2);
}
.error-text {
  color: #fca5a5;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}
.retry-btn {
  padding: 10px 24px;
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
  border: 1px solid rgba(251,191,36,0.3);
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
}
.retry-btn:hover { background: rgba(251,191,36,0.25); }
</style>
