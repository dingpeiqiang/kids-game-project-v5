<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 relative fade-in" :style="containerStyle">

    <!-- 返回用户首页按钮 -->
    <button class="home-back-btn absolute z-50" @click="goToUserHome" style="top:16px;left:16px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span>返回首页</span>
    </button>

    <!-- 标题区域 -->
    <div class="text-center" :style="titleContainerStyle">
      <!-- 游戏 Logo Emoji（开发者替换为游戏专属 emoji） -->
      <div class="animate-bounce" :style="logoStyle">🎮</div>
      <h2 class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400"
          :style="titleStyle">
        __GAME_NAME__
      </h2>
      <p class="text-gray-400" :style="subtitleStyle">儿童益智小游戏</p>
    </div>

    <!-- 最高分卡片 -->
    <div class="bg-gray-800/60 rounded-2xl backdrop-blur" :style="scoreCardStyle">
      <div class="flex items-center gap-3">
        <span :style="trophyStyle">🏆</span>
        <div>
          <p class="text-gray-400" :style="labelStyle">最高分记录</p>
          <p class="text-yellow-400 font-bold" :style="scoreNumberStyle">{{ highScore }}</p>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-gray-700">
        <p class="text-gray-400" :style="labelStyle">游玩次数：{{ playCount }} 次</p>
      </div>
    </div>

    <!-- 开始游戏按钮 -->
    <GameButton
      variant="primary"
      :disabled="isChecking"
      :fontSize="24"
      :paddingLeft="48"
      :paddingRight="48"
      :paddingTop="20"
      :paddingBottom="20"
      class="mb-3"
      @click="onStartClick"
    >
      {{ isChecking ? '⏳ 检测中...' : '🎮 开始游戏' }}
    </GameButton>

    <!-- 音效 + 主题 -->
    <div class="flex flex-col items-center gap-3 mt-4">
      <SoundToggle />
      <ThemeSelector />
    </div>

    <!-- 操作说明 -->
    <div class="mt-4 text-center text-gray-400" :style="instructionStyle">
      <p>💡 键盘方向键 / WASD 控制</p>
      <p>📱 手机触摸/滑动控制</p>
    </div>

    <!-- ── 资源检测 Loading 遮罩 ── -->
    <Teleport to="body">
      <div v-if="showCheckModal" class="check-overlay">
        <div class="check-modal">
          <div class="text-4xl mb-4">{{ checkStep < 4 ? '🔍' : '✅' }}</div>
          <h3 class="text-white font-bold text-xl mb-2">游戏准备中</h3>
          <p class="text-gray-300 text-sm mb-6">{{ statusText }}</p>

          <!-- 进度条 -->
          <div class="progress-track">
            <div class="progress-bar" :style="{ width: checkProgress + '%' }"></div>
          </div>

          <!-- 步骤指示器 -->
          <div class="flex justify-between mt-4 text-xs text-gray-500">
            <span :class="checkStep >= 1 ? 'text-green-400' : ''">① 登录</span>
            <span :class="checkStep >= 2 ? 'text-green-400' : ''">② 音频</span>
            <span :class="checkStep >= 3 ? 'text-green-400' : ''">③ 主题</span>
            <span :class="checkStep >= 4 ? 'text-green-400' : ''">④ 引擎</span>
          </div>
        </div>
      </div>

      <!-- 错误弹窗 -->
      <div v-if="showErrorModal" class="check-overlay">
        <div class="check-modal">
          <div class="text-4xl mb-4">❌</div>
          <h3 class="text-white font-bold text-xl mb-2">准备失败</h3>
          <p class="text-gray-300 text-sm mb-6">{{ checkError }}</p>
          <div class="flex gap-3 justify-center">
            <button
              class="btn-secondary"
              :disabled="retryCount >= maxRetryCount"
              @click="retryCheck"
            >
              🔄 重试 ({{ maxRetryCount - retryCount }} 次)
            </button>
            <button class="btn-cancel" @click="showErrorModal = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import { useAudioStore } from '@/stores/audio'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'

const router     = useRouter()
const gameStore  = useGameStore()
const themeStore = useThemeStore()
const audioStore = useAudioStore()
const ui         = useResponsiveUI()

// ── 检测流程状态 ───────────────────────────────────────────────────────────
const isChecking      = ref(false)
const checkError      = ref<string | null>(null)
const showCheckModal  = ref(false)
const showErrorModal  = ref(false)
const checkProgress   = ref(0)
const checkStep       = ref(0)
const statusText      = ref('准备检测...')
const retryCount      = ref(0)
const maxRetryCount   = 3

// ── 读取 store ────────────────────────────────────────────────────────────
const highScore = computed(() => gameStore.highScore)
const playCount = computed(() => gameStore.playCount)

// ── 响应式样式 ────────────────────────────────────────────────────────────
const containerStyle = computed(() => ({
  paddingTop: '2%', paddingBottom: '2%', height: '96%',
}))

const titleContainerStyle = computed(() => ({
  marginBottom: ui.getGap(32),
  textAlign: 'center' as const,
}))

const logoStyle = computed(() => ({
  fontSize: ui.getFontSize(96),
  marginBottom: ui.getGap(16),
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(48),
  marginBottom: ui.getGap(8),
}))

const subtitleStyle = computed(() => ({
  fontSize: ui.getFontSize(18),
  marginTop: ui.getGap(8),
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(20),
  marginBottom: ui.getGap(28),
  minWidth: ui.getWidth(280),
}))

const trophyStyle = computed(() => ({
  fontSize: ui.getFontSize(40),
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(14),
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(36),
  fontWeight: 'bold',
}))

const instructionStyle = computed(() => ({
  fontSize: ui.getFontSize(14),
  lineHeight: '2',
}))

// ── 导航 ─────────────────────────────────────────────────────────────────

function goToUserHome() {
  const homeUrl = localStorage.getItem('platformUrl') || 'http://localhost:3000/'
  window.location.href = homeUrl
}

// ── 资源检测 + 跳转 ───────────────────────────────────────────────────────

async function onStartClick() {
  if (isChecking.value) return
  audioStore.playClickSound()

  isChecking.value   = true
  checkError.value   = null
  showErrorModal.value = false
  checkProgress.value = 0
  checkStep.value     = 0
  statusText.value    = '开始检测...'

  // 延迟 200ms 再显示遮罩，避免快速检查时闪烁
  const loadingTimer = setTimeout(() => {
    if (isChecking.value) showCheckModal.value = true
  }, 200)

  try {
    const themeId = themeStore.currentThemeId

    // 步骤 1：登录验证
    checkStep.value     = 1
    checkProgress.value = 20
    statusText.value    = '验证用户登录状态...'
    const token = localStorage.getItem('token')
    if (!token) {
      clearTimeout(loadingTimer)
      showCheckModal.value = false
      setError('请先登录再玩游戏哦~')
      return
    }
    statusText.value = '✅ 登录验证通过'
    await delay(200)

    // 步骤 2：音频系统
    checkStep.value     = 2
    checkProgress.value = 45
    statusText.value    = '准备音频系统...'
    try {
      audioStore.initAudio()
      statusText.value = '✅ 音频系统就绪'
    } catch {
      statusText.value = '⚠️ 音频初始化失败（不影响游戏）'
    }
    await delay(200)

    // 步骤 3：GTRS 主题
    checkStep.value     = 3
    checkProgress.value = 70
    statusText.value    = '验证 GTRS 主题...'
    if (themeId) {
      const gtrsJson = themeStore.gtrsRawJson
      if (!gtrsJson) {
        clearTimeout(loadingTimer)
        showCheckModal.value = false
        setError('还没有选择主题呢，请先选择一个主题 🎨')
        return
      }
      const gtrsData = JSON.parse(gtrsJson)
      statusText.value = `✅ 主题「${gtrsData.themeInfo?.themeName || '未知'}」已就绪`
      await delay(300)
    } else {
      statusText.value = '✅ 使用默认主题'
      await delay(200)
    }

    // 步骤 4：引擎就绪
    checkStep.value     = 4
    checkProgress.value = 100
    statusText.value    = '✅ 游戏引擎就绪，即将进入...'
    await delay(500)

    // 保存主题 ID
    if (themeId) localStorage.setItem('current-theme-id', themeId)

    showCheckModal.value = false
    clearTimeout(loadingTimer)

    // 跳转到难度选择
    router.push({ path: '/difficulty', query: { theme_id: themeId } })

  } catch (err: any) {
    clearTimeout(loadingTimer)
    showCheckModal.value = false
    setError(err.message || '游戏启动失败，请重试')
  }
}

function setError(msg: string) {
  checkError.value     = msg
  showErrorModal.value = true
  isChecking.value     = false
}

function retryCheck() {
  if (retryCount.value >= maxRetryCount) {
    setError('多次尝试失败，建议返回首页重新开始')
    return
  }
  retryCount.value++
  onStartClick()
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── 生命周期 ──────────────────────────────────────────────────────────────
onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)
})
</script>

<style scoped>
/* 返回按钮 */
.home-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(8px);
}
.home-back-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateX(-2px);
}

/* 检测遮罩 */
.check-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
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
  animation: modalUp 0.4s ease-out;
}

@keyframes modalUp {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* 进度条 */
.progress-track {
  width: 100%;
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* 弹窗按钮 */
.btn-secondary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 10px 20px;
  background: rgba(75, 85, 99, 0.5);
  color: white;
  border: 1px solid rgba(107, 114, 128, 0.5);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-cancel:hover {
  background: rgba(107, 114, 128, 0.5);
}
</style>
