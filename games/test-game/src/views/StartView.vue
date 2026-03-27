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
      <h2
        class="font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400"
        :style="titleStyle"
      >
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
      @click="goToDifficulty"
      class="mb-3"
      :fontSize="23.4"
      :paddingLeft="41.6"
      :paddingRight="41.6"
      :paddingTop="20.8"
      :paddingBottom="20.8"
    >
      🎮 开始游戏
    </GameButton>

    <!-- 音效开关 + 主题选择 -->
    <div class="mt-4 flex flex-col items-center justify-center gap-2 md:gap-4" :style="soundToggleContainerStyle">
      <SoundToggle />
      <ThemeSelector />
    </div>

    <!-- 操作说明 -->
    <div class="mt-4 text-center text-gray-400" :style="instructionStyle">
      <p>💡 键盘 ← → 方向键控制移动</p>
      <p>📱 手机滑动屏幕控制方向</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { GameButton, SoundToggle, ThemeSelector } from '@kids-game/framework'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'

const router = useRouter()
const ui = useResponsiveUI()

// 游戏状态
const highScore = ref(0)
const playCount = ref(0)

// 动态样式计算（与贪吃蛇完全一致）
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

onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)

  const saved = localStorage.getItem('test-game-high-score')
  if (saved) highScore.value = parseInt(saved, 10)
  const savedCount = localStorage.getItem('test-game-play-count')
  if (savedCount) playCount.value = parseInt(savedCount, 10)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  initUIParams(window.innerWidth, window.innerHeight)
}

function goToUserHome() {
  const homeUrl = 'http://localhost:3000/'
  window.location.href = homeUrl
}

function goToDifficulty() {
  router.push('/difficulty')
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
  font-size: 14px;
}

.home-back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-2px);
}

.home-back-btn:active {
  transform: translateX(0);
}

.fade-in {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
