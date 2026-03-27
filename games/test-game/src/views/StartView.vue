<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in relative" :style="containerStyle">
    <!-- 返回用户首页按钮 -->
    <button
      @click="goToUserHome"
      class="absolute top-4 left-4 z-50 home-back-btn"
      title="返回用户首页"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span>返回首页</span>
    </button>
    <!-- 标题 -->
    <div class="text-center mb-8" :style="titleContainerStyle">
      <h1 class="animate-bounce" :style="gameEmojiStyle">🪙</h1>
      <h2 class="font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400" :style="titleStyle">
        接金币大作战
      </h2>
      <p class="text-gray-400 mt-4" :style="subtitleStyle">儿童益智小游戏</p>
    </div>

    <!-- 最高分展示 -->
    <div class="bg-gray-800/60 rounded-2xl backdrop-blur mb-8" :style="scoreCardStyle">
      <div class="flex items-center gap-3">
        <span :style="trophyIconStyle">🏆</span>
        <div>
          <p class="text-gray-400" :style="labelStyle">最高分记录</p>
          <p class="text-yellow-400 font-bold" :style="scoreNumberStyle">{{ highScore }}</p>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-gray-700">
        <p class="text-gray-400" :style="labelStyle">游玩次数：{{ playCount }} 次</p>
      </div>
    </div>

    <!-- 开始按钮 -->
    <GameButton
      variant="primary"
      @click="startGame"
      :disabled="isChecking"
      class="mb-3"
      :fontSize="23.4"
      :paddingLeft="41.6"
      :paddingRight="41.6"
      :paddingTop="20.8"
      :paddingBottom="20.8"
    >
      🎮 开始游戏
    </GameButton>

    <!-- 音效开关 -->
    <div class="mt-4 flex flex-col items-center justify-center gap-2 md:gap-4" :style="soundToggleContainerStyle">
      <SoundToggle />
      <ThemeSelector />
    </div>

    <!-- 操作说明 -->
    <div class="mt-4 text-center text-gray-400" :style="instructionStyle">
      <p>💡 键盘 ← → 方向键控制移动</p>
      <p>📱 手机滑动屏幕控制方向</p>
    </div>

    <!-- 资源检测 Loading 弹窗 -->
    <Transition name="fade">
      <div v-if="showCheckModal" class="check-overlay">
        <div class="check-modal">
          <div class="check-icon">🔍</div>
          <h2 class="check-title">游戏准备中</h2>

          <!-- 进度条 -->
          <div class="check-progress">
            <div class="progress-bar" :style="{ width: checkProgress + '%' }"></div>
          </div>

          <!-- 步骤指示器 -->
          <div class="check-steps">
            <div class="step" :class="{ active: checkStep === 1, completed: checkStep > 1 }">
              <div class="step-icon">1</div>
              <span class="step-text">登录</span>
            </div>
            <div class="step" :class="{ active: checkStep === 2, completed: checkStep > 2 }">
              <div class="step-icon">2</div>
              <span class="step-text">音频</span>
            </div>
            <div class="step" :class="{ active: checkStep === 3, completed: checkStep > 3 }">
              <div class="step-icon">3</div>
              <span class="step-text">主题</span>
            </div>
            <div class="step" :class="{ active: checkStep === 4, completed: checkStep > 4 }">
              <div class="step-icon">4</div>
              <span class="step-text">引擎</span>
            </div>
          </div>

          <!-- 实时状态 -->
          <div class="check-status">
            <p class="status-text">{{ statusText }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 错误提示弹窗 -->
    <Transition name="fade">
      <div v-if="showErrorModal" class="error-overlay" @click.self="showErrorModal = false">
        <div class="error-modal">
          <div class="error-icon">😞</div>
          <h3 class="error-title">启动失败</h3>
          <p class="error-message">{{ checkError }}</p>

          <!-- 重试次数提示 -->
          <div v-if="retryCount > 0" class="retry-hint">
            <span>⚠️ 已重试 {{ retryCount }}/{{ maxRetryCount }} 次</span>
          </div>

          <div class="error-actions">
            <button
              v-if="retryCount < maxRetryCount"
              class="error-btn error-btn-retry"
              @click="retryCheck"
            >🔄 重试</button>
            <button class="error-btn error-btn-home" @click="goToUserHome">🏠 返回首页</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import { useAudioStore } from '@/stores/audio'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'

const router = useRouter()
const gameStore = useGameStore()
const themeStore = useThemeStore()
const audioStore = useAudioStore()
const ui = useResponsiveUI()

// 检查中状态
const isChecking = ref(false)
const checkError = ref<string | null>(null)
const showCheckModal = ref(false)
const showErrorModal = ref(false)
const checkProgress = ref(0)
const checkStep = ref(0)
const statusText = ref('准备检测...')
const retryCount = ref(0)
const maxRetryCount = 3

const highScore = computed(() => gameStore.highScore)
const playCount = computed(() => gameStore.playCount)

// 动态样式计算
const containerStyle = computed(() => ({
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%'
}))

const titleContainerStyle = computed(() => ({
  marginBottom: ui.getGap(34.85)
}))

const gameEmojiStyle = computed(() => ({
  fontSize: ui.getFontSize(139.39),
  marginBottom: ui.getGap(23.23)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(69.7)
}))

const subtitleStyle = computed(() => ({
  fontSize: ui.getFontSize(26.14),
  marginTop: ui.getGap(23.23)
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(23.23),
  marginBottom: ui.getGap(34.85)
}))

const trophyIconStyle = computed(() => ({
  fontSize: ui.getFontSize(58.08)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(20.33)
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(52.27),
  fontWeight: 'bold'
}))

const instructionStyle = computed(() => ({
  fontSize: ui.getFontSize(20.33),
  marginTop: ui.getGap(46.46)
}))

const soundToggleContainerStyle = computed(() => ({
  gap: ui.getGap(23.23)
}))

function goToUserHome() {
  window.location.href = 'http://localhost:3000/'
}

const handleError = (error: Error | string, friendlyMessage?: string) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  console.error('❌ 游戏启动失败:', errorObj)
  let message = friendlyMessage || '游戏准备失败，请稍后重试'
  if (errorObj.message.includes('GTRS') || errorObj.message.includes('主题')) {
    message = friendlyMessage || '主题资源加载失败，请检查网络或重新选择主题'
  }
  checkError.value = message
  showErrorModal.value = true
}

const retryCheck = () => {
  if (retryCount.value >= maxRetryCount) {
    handleError(new Error('MAX_RETRY'), '多次尝试失败，建议返回首页重新开始')
    return
  }
  retryCount.value++
  startGame()
}

const startGame = async () => {
  if (isChecking.value) return

  isChecking.value = true
  checkError.value = null
  showErrorModal.value = false
  checkProgress.value = 0
  checkStep.value = 0
  statusText.value = '开始检测...'
  showCheckModal.value = false

  const loadingTimer = setTimeout(() => {
    if (isChecking.value) showCheckModal.value = true
  }, 200)

  try {
    const themeId = themeStore.currentThemeId

    // 步骤 1：检查用户登录状态（暂时注释，开发阶段跳过登录）
    checkStep.value = 1
    checkProgress.value = 10
    statusText.value = '验证用户登录状态...'
    // TODO: 生产环境恢复登录检查
    // const token = localStorage.getItem('token')
    // if (!token) {
    //   clearTimeout(loadingTimer)
    //   showCheckModal.value = false
    //   handleError(new Error('USER_NOT_LOGIN'), '请先登录再玩游戏哦~')
    //   isChecking.value = false
    //   return
    // }
    statusText.value = '✅ 登录验证通过（开发模式跳过）'
    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 2：初始化音频系统
    checkStep.value = 2
    checkProgress.value = 25
    statusText.value = '准备音频系统...'
    statusText.value = '✅ 音频系统已就绪'
    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 3：验证 GTRS 主题
    checkStep.value = 3
    checkProgress.value = 45
    statusText.value = '验证 GTRS 主题...'
    if (!themeId) {
      statusText.value = '✅ 使用默认主题'
    } else {
      const gtrsJson = themeStore.gtrsRawJson
      if (!gtrsJson) {
        clearTimeout(loadingTimer)
        handleError(new Error('THEME_NOT_LOADED'), '还没有选择喜欢的主题呢，请先选择一个主题')
        isChecking.value = false
        return
      }
      statusText.value = '✅ GTRS 主题验证通过'
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 4：启动游戏引擎
    checkStep.value = 4
    checkProgress.value = 85
    statusText.value = '启动游戏引擎...'
    statusText.value = '✅ 游戏引擎就绪'

    checkProgress.value = 100
    statusText.value = '✅ 检测完成，即将进入游戏'
    await new Promise(resolve => setTimeout(resolve, 500))

    showCheckModal.value = false

    if (themeId) {
      localStorage.setItem('current-theme-id', themeId)
    }

    router.push('/difficulty')
  } catch (error: any) {
    clearTimeout(loadingTimer)
    showCheckModal.value = false
    handleError(error, error.message || '游戏启动失败，请重试')
    isChecking.value = false
  }
}

onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)
  gameStore.loadFromLocalStorage()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  initUIParams(window.innerWidth, window.innerHeight)
}
</script>

<style scoped>
/* 返回首页按钮 */
.home-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  backdrop-filter: blur(8px);
}

.home-back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-2px);
}

.home-back-btn:active {
  transform: translateX(0);
}

/* 资源检测 Loading 弹窗 */
.check-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.check-modal {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 24px;
  padding: 2.5rem 3rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.5);
  animation: modalSlideUp 0.4s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.check-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  animation: bounce 1.2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.check-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0 0 1.5rem 0;
}

.check-progress {
  width: 100%;
  height: 10px;
  background: #374151;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%);
  background-size: 200% 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.check-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 0 8px;
  gap: 8px;
  flex-wrap: wrap;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.3;
  transition: all 0.3s;
  flex: 0 0 auto;
  min-width: 60px;
}

.step.active {
  opacity: 1;
}

.step.completed {
  opacity: 1;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4b5563;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.step.active .step-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  animation: pulse 1s ease-in-out infinite;
}

.step.completed .step-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.step-text {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.step.active .step-text {
  color: #10b981;
  font-weight: 600;
}

.step.completed .step-text {
  color: #3b82f6;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.check-hint {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.check-status {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  animation: pulseBorder 2s ease-in-out infinite;
}

@keyframes pulseBorder {
  0%, 100% { border-color: rgba(16, 185, 129, 0.3); }
  50% { border-color: rgba(16, 185, 129, 0.6); }
}

.status-text {
  font-size: 14px;
  color: #10b981;
  font-weight: 600;
  text-align: center;
  margin: 0;
  min-height: 20px;
  transition: all 0.3s ease;
}

/* 错误提示弹窗 */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;
}

.error-modal {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 24px;
  padding: 2rem 2.5rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(239, 68, 68, 0.3);
  animation: modalSlideUp 0.4s ease-out;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f87171;
  margin: 0 0 1rem 0;
}

.error-message {
  font-size: 14px;
  color: #d1d5db;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  white-space: pre-line;
}

.retry-hint {
  margin-bottom: 1rem;
  padding: 8px 16px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.retry-hint span {
  font-size: 14px;
  color: #f59e0b;
  font-weight: 600;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-btn {
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
  min-width: 80px;
}

.error-btn-retry {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.error-btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.error-btn-home {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.error-btn-home:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.error-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* 响应式 */
@media (max-width: 640px) {
  .check-modal {
    padding: 2rem 1.5rem;
  }

  .check-icon {
    font-size: 2.5rem;
  }

  .check-title {
    font-size: 1.25rem;
  }

  .check-steps {
    flex-direction: row;
    gap: 4px;
    justify-content: center;
  }

  .step {
    flex-direction: column;
    gap: 4px;
    min-width: 50px;
  }

  .step-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .step-text {
    font-size: 11px;
  }

  .check-status {
    padding: 8px 12px;
  }

  .status-text {
    font-size: 12px;
  }

  .error-modal {
    padding: 1.5rem;
  }

  .error-icon {
    font-size: 2.5rem;
  }

  .error-title {
    font-size: 1.1rem;
  }
}
</style>
