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
      <h1 class="animate-bounce" :style="snakeEmojiStyle">🐍</h1>
      <h2 class="font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400" :style="titleStyle">
        快乐贪吃蛇
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
      :fontSize="18"
      :paddingLeft="32"
      :paddingRight="32"
      :paddingTop="16"
      :paddingBottom="16"
    >
      {{ isChecking ? '🔍 检查资源中...' : '🎮 开始游戏' }}
    </GameButton>

    <!-- 音效开关 -->
    <div class="mt-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4" :style="soundToggleContainerStyle">
      <SoundToggle />
      <ThemeSelector />
    </div>

    <!-- 操作说明 -->
    <div class="mt-4 text-center text-gray-400" :style="instructionStyle">
      <p>💡 键盘方向键 / WASD 控制方向</p>
      <p>📱 手机滑动屏幕控制方向</p>
    </div>

    <!-- 资源检测 Loading 弹窗 -->
    <div v-if="showCheckModal" class="check-overlay">
      <div class="check-modal">
        <div class="check-icon">🔍</div>
        <h3 class="check-title">正在检测游戏资源</h3>
        
        <!-- 进度条 -->
        <div class="check-progress">
          <div class="progress-bar" :style="{ width: checkProgress + '%' }"></div>
        </div>

        <!-- 检测步骤 -->
        <div class="check-steps">
          <div class="step" :class="{ active: checkStep >= 1, completed: checkStep > 1 }">
            <span class="step-icon">{{ checkStep > 1 ? '✓' : '1' }}</span>
            <span class="step-text">验证登录</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 2, completed: checkStep > 2 }">
            <span class="step-icon">{{ checkStep > 2 ? '✓' : '2' }}</span>
            <span class="step-text">初始化音频</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 3, completed: checkStep > 3 }">
            <span class="step-icon">{{ checkStep > 3 ? '✓' : '3' }}</span>
            <span class="step-text">加载主题</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 4, completed: checkStep > 4 }">
            <span class="step-icon">{{ checkStep > 4 ? '✓' : '4' }}</span>
            <span class="step-text">资源完整性检查</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 5 }">
            <span class="step-icon">5</span>
            <span class="step-text">启动游戏</span>
          </div>
        </div>

        <!-- 实时检测状态 -->
        <div class="check-status">
          <p class="status-text">{{ statusText }}</p>
        </div>

        <p class="check-hint">请稍候，正在为您准备最佳游戏体验...</p>
      </div>
    </div>

    <!-- 错误提示弹窗 -->
    <div v-if="showErrorModal" class="error-overlay" @click="showErrorModal = false">
      <div class="error-modal" @click.stop>
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">资源检查失败</h3>
        <p class="error-message">{{ checkError }}</p>
        
        <!-- 重试次数提示 -->
        <div v-if="retryCount > 0 && retryCount < maxRetryCount" class="retry-hint">
          <span>已重试 {{ retryCount }} 次</span>
        </div>
        
        <!-- 操作按钮 -->
        <div class="error-actions">
          <button 
            v-if="retryCount < maxRetryCount" 
            class="error-btn error-btn-retry" 
            @click="retryCheck"
          >
            🔄 重试
          </button>
          <button 
            class="error-btn error-btn-close" 
            @click="showErrorModal = false; isChecking = false"
          >
            关闭
          </button>
          <button 
            v-if="retryCount >= maxRetryCount" 
            class="error-btn error-btn-home" 
            @click="goToUserHome"
          >
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'
import { SnakePhaserGame } from '@/components/game/PhaserGame'

const router = useRouter()
const gameStore = useGameStore()
const themeStore = useThemeStore()
const ui = useResponsiveUI()

// PhaserGame 实例（用于播放主菜单音乐）
let phaserGameInstance: SnakePhaserGame | null = null

// ⭐ 检查中状态
const isChecking = ref(false)
const checkError = ref<string | null>(null)
const showCheckModal = ref(false)
const showErrorModal = ref(false)
const checkProgress = ref(0)
const checkStep = ref(0)
const statusText = ref('准备检测...')
const retryCount = ref(0)
const maxRetryCount = 3
const lastCheckThemeId = ref<string | null>(null)

const highScore = computed(() => gameStore.highScore)
const playCount = computed(() => gameStore.playCount)

// 动态样式计算
const containerStyle = computed(() => ({
  paddingTop: ui.getPadding(16),
  paddingBottom: ui.getPadding(16)
}))

const titleContainerStyle = computed(() => ({
  marginBottom: ui.getGap(24)
}))

const snakeEmojiStyle = computed(() => ({
  fontSize: ui.getFontSize(96),  // 对应 text-6xl ~ text-8xl
  marginBottom: ui.getGap(16)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(48),  // 对应 text-4xl ~ text-6xl
}))

const subtitleStyle = computed(() => ({
  fontSize: ui.getFontSize(18),
  marginTop: ui.getGap(16)
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(16),
  marginBottom: ui.getGap(24)
}))

const trophyIconStyle = computed(() => ({
  fontSize: ui.getFontSize(40)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(36),
  fontWeight: 'bold'
}))

const buttonStyle = computed(() => ({
  fontSize: ui.getFontSize(20),
  paddingLeft: ui.getPadding(48),
  paddingRight: ui.getPadding(48),
  paddingTop: ui.getPadding(24),
  paddingBottom: ui.getPadding(24)
}))

const instructionStyle = computed(() => ({
  fontSize: ui.getFontSize(14),
  marginTop: ui.getGap(32)
}))

const soundToggleContainerStyle = computed(() => ({
  gap: ui.getGap(16)
}))

// 移除 buttonStyle，现在通过 props 传递

/**
 * ⭐ 返回用户首页
 */
function goToUserHome() {
  // 跳转到主系统首页（kids-game-frontend 运行在 3000 端口）
  const homeUrl = 'http://localhost:3000/'
  window.location.href = homeUrl
}

/**
 * ⭐ 处理错误
 */
const handleError = (error: Error | string, friendlyMessage?: string) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  console.error('❌ 游戏启动失败:', errorObj)

  // 获取友好的错误信息
  let message = friendlyMessage || '游戏准备失败，请稍后重试'
  
  // 根据错误类型提供更具体的建议
  if (errorObj.message.includes('GTRS') || errorObj.message.includes('主题')) {
    message = friendlyMessage || '主题资源加载失败，请检查网络或重新选择主题'
  }

  // 显示错误弹窗
  checkError.value = message
  showErrorModal.value = true
}

/**
 * ⭐ 重试检查
 */
const retryCheck = () => {
  if (retryCount.value >= maxRetryCount) {
    handleError(new Error('MAX_RETRY'), '多次尝试失败，建议返回首页重新开始')
    return
  }

  retryCount.value++
  console.log(`🔄 第 ${retryCount.value} 次重试`)
  
  // 重新执行检查流程
  startGame()
}

/**
 * ⭐ 开始游戏
 */
const startGame = async () => {
  // 如果正在检查，防止重复点击
  if (isChecking.value) {
    console.log('⏳ 正在检查中，忽略点击')
    return
  }

  console.log('🎮 开始游戏按钮被点击')

  // 重置状态
  isChecking.value = true
  checkError.value = null
  showErrorModal.value = false
  checkProgress.value = 0
  checkStep.value = 0
  statusText.value = '开始检测...'
  showCheckModal.value = false  // 先不显示，延迟显示避免闪烁

  // 延迟 200ms 显示 loading，避免视觉卡顿
  const loadingTimer = setTimeout(() => {
    if (isChecking.value) {
      showCheckModal.value = true
      console.log('✅ Loading 弹窗已显示:', showCheckModal.value)
    }
  }, 200)

  try {
    // 获取当前选择的主题 ID
    const themeId = themeStore.currentThemeId
    lastCheckThemeId.value = themeId  // 记录用于重试
    console.log('🎨 使用主题 ID:', themeId)

    // ⭐ 开始完整的游戏检测流程

    // 步骤 1：检查用户登录状态
    checkStep.value = 1
    checkProgress.value = 10
    statusText.value = '验证用户登录状态...'
    const token = localStorage.getItem('token')
    if (!token) {
      clearTimeout(loadingTimer)
      showCheckModal.value = false
      handleError(new Error('USER_NOT_LOGIN'), '请先登录再玩游戏哦~')
      isChecking.value = false
      return
    }
    console.log('✅ 用户已登录')
    statusText.value = '✅ 登录验证通过'
    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 2：初始化音频系统（由 Phaser 游戏接管）
    checkStep.value = 2
    checkProgress.value = 25
    statusText.value = '准备音频系统...'
    try {
      // 不再直接初始化 AudioContext，由 Phaser 游戏统一管理
      console.log('✅ 音频系统将由 Phaser 游戏统一管理')
      statusText.value = '✅ 音频系统已就绪'
    } catch (error: any) {
      console.warn('⚠️ 音频准备失败:', error.message)
      statusText.value = '⚠️ 音频准备失败（不影响游戏）'
      // 音频失败不阻断游戏，继续
    }
    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 3：验证 GTRS 主题已正确加载
    checkStep.value = 3
    checkProgress.value = 45
    statusText.value = '验证 GTRS 主题...'

    if (!themeId) {
      // 没有主题时使用默认
      console.log('❌ 未选择主题，使用默认主题')
      statusText.value = '✅ 使用默认主题'
    } else {
      // ⭐ GTRS 主题已在 themeStore.loadThemeFromBackend 中校验通过
      // 这里直接使用已校验的 gtrsRawJson
      const gtrsJson = themeStore.gtrsRawJson
      if (!gtrsJson) {
        clearTimeout(loadingTimer)
        handleError(new Error('THEME_NOT_LOADED'), '还没有选择喜欢的主题呢，请先选择一个主题')
        isChecking.value = false
        return
      }

      const gtrsData = JSON.parse(gtrsJson)
      console.log('✅ GTRS 主题已加载:', gtrsData.themeInfo?.themeName || '未知主题')
      console.log('📊 主题信息:', {
        themeName: gtrsData.themeInfo?.themeName,
        themeId: gtrsData.themeInfo?.themeId,
        jsonLength: gtrsJson.length
      })

      statusText.value = '✅ GTRS 主题验证通过'
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 4：启动游戏引擎，准备就绪
    checkStep.value = 4
    checkProgress.value = 85
    statusText.value = '启动游戏引擎...'
    
    try {
      // 不再在这里播放 BGM，由 Phaser 游戏统一管理音频
      console.log('✅ 音频将由 Phaser 游戏统一控制')
      statusText.value = '✅ 游戏引擎就绪'
    } catch (error: any) {
      console.warn('⚠️ 游戏引擎启动失败:', error.message)
      statusText.value = '⚠️ 游戏引擎启动失败（不影响游戏）'
    }

    checkProgress.value = 100
    console.log('✅ 所有检测通过，准备开始游戏')
    statusText.value = '✅ 检测完成，即将进入游戏'
    
    await new Promise(resolve => setTimeout(resolve, 500))

    // 关闭 loading 弹窗
    showCheckModal.value = false

    // 跳转到难度选择页面（带上 theme_id 参数）
    router.push({
      path: '/difficulty',
      query: { theme_id: themeId }
    })
  } catch (error: any) {
    console.error('❌ 游戏启动失败:', error)

    // 清除 loading 定时器
    clearTimeout(loadingTimer)

    // 关闭 loading 弹窗，显示错误弹窗
    showCheckModal.value = false
    
    // 使用统一的错误处理
    handleError(error, error.message || '游戏启动失败，请重试')
    
    isChecking.value = false
  }
}

onMounted(() => {
  // ⭐ 首次加载时初始化 UI 参数
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('StartView mounted, UI scale:', ui.uiScale)

  // 监听窗口大小变化，实时更新 UI 参数
  window.addEventListener('resize', handleResize)

  // ⭐ 初始化一个隐藏的 PhaserGame 实例用于播放主菜单背景音乐
  initMainMenuBGM()
})

/**
 * ⭐ 初始化主菜单背景音乐（创建隐藏的 PhaserGame 实例）
 */
const initMainMenuBGM = async () => {
  try {
    const themeId = themeStore.currentThemeId
    if (!themeId) {
      console.log('🎵 主菜单：未选择主题，跳过 BGM 初始化')
      return
    }

    // 创建一个隐藏的容器来初始化 PhaserGame
    const container = document.createElement('div')
    container.style.display = 'none'
    document.body.appendChild(container)

    // 初始化 PhaserGame 实例
    phaserGameInstance = new SnakePhaserGame(container)
    
    // 加载主题并播放主菜单音乐
    await phaserGameInstance.start('easy', themeId)
    
    // 播放主菜单背景音乐
    setTimeout(() => {
      if (phaserGameInstance) {
        phaserGameInstance.playBgmMain()
        console.log('🎵 主菜单：开始播放 BGM_Main')
      }
    }, 500)

    console.log('✅ 主菜单：BGM 初始化完成')
  } catch (error) {
    console.warn('⚠️ 主菜单：BGM 初始化失败', error)
  }
}

/**
 * ⭐ 清理主菜单 BGM 资源
 */
const cleanupMainMenuBGM = () => {
  if (phaserGameInstance) {
    phaserGameInstance.stopAllBgm()
    phaserGameInstance.destroy()
    phaserGameInstance = null
    console.log('🧹 主菜单：BGM 资源已清理')
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  // ⭐ 清理主菜单 BGM 资源
  cleanupMainMenuBGM()
})

// 窗口大小变化时更新 UI 参数
const handleResize = () => {
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('🔄 窗口 resize, UI scale:', ui.uiScale)
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
  margin-bottom: ui.getGap(24);
  padding: 0 ui.getGap(8);
  gap: ui.getGap(8);
  flex-wrap: wrap;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ui.getGap(8);
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
  width: ui.getWidth(32);
  height: ui.getHeight(32);
  border-radius: 50%;
  background: #4b5563;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: ui.getFontSize(14);
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
  font-size: ui.getFontSize(12);
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
  font-size: ui.getFontSize(14);
  color: #6b7280;
  margin: 0;
}

/* 实时检测状态框 */
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
  font-size: ui.getFontSize(14);
  color: #10b981;
  font-weight: 600;
  text-align: center;
  margin: 0;
  min-height: ui.getHeight(20);
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
  font-size: ui.getFontSize(14);
  color: #d1d5db;
  margin: 0 0 ui.getGap(24) 0;
  line-height: 1.6;
  white-space: pre-line;
}

/* 重试次数提示 */
.retry-hint {
  margin-bottom: ui.getGap(16);
  padding: ui.getPadding(8) ui.getPadding(16);
  background: rgba(245, 158, 11, 0.1);
  border-radius: ui.getBorderRadius(8);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.retry-hint span {
  font-size: ui.getFontSize(14);
  color: #f59e0b;
  font-weight: 600;
}

/* 错误操作按钮组 */
.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-btn {
  border: none;
  border-radius: ui.getBorderRadius(12);
  padding: ui.getPadding(12) ui.getPadding(24);
  font-size: ui.getFontSize(14);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
  min-width: 80px;
}

/* 重试按钮 */
.error-btn-retry {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.error-btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* 关闭按钮 */
.error-btn-close {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
}

.error-btn-close:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
}

/* 返回首页按钮 */
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
    padding: ui.getPadding(32) ui.getPadding(24);
  }

  .check-icon {
    font-size: ui.getFontSize(64);
  }

  .check-title {
    font-size: ui.getFontSize(32);
  }

  .check-steps {
    flex-direction: row;
    gap: ui.getGap(4);
    justify-content: center;
  }

  .step {
    flex-direction: column;
    gap: ui.getGap(4);
    min-width: 50px;
  }

  .step-icon {
    width: ui.getWidth(28);
    height: ui.getHeight(28);
    font-size: ui.getFontSize(12);
  }

  .step-text {
    font-size: ui.getFontSize(11);
  }

  .check-status {
    padding: ui.getPadding(8) ui.getPadding(12);
  }

  .status-text {
    font-size: ui.getFontSize(12);
  }
  
  .error-modal {
    padding: ui.getPadding(32) ui.getPadding(24);
  }
  
  .error-icon {
    font-size: ui.getFontSize(48);
  }
  
  .error-title {
    font-size: ui.getFontSize(24);
  }
}
</style>
