<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in overflow-y-auto" :style="containerStyle">
    <!-- 游戏结束图标 -->
    <div class="animate-bounce mb-4 md:mb-6" :style="emojiStyle">😢</div>
    
    <!-- 标题 -->
    <h2 class="font-bold text-red-400 mb-6 md:mb-8 text-center" :style="titleStyle">游戏结束</h2>
    
    <!-- 分数展示 -->
    <div class="bg-gray-800/60 rounded-2xl backdrop-blur mb-6 md:mb-8 w-full max-w-sm" :style="scoreCardStyle">
      <div class="text-center">
        <p class="text-gray-400 mb-2" :style="labelStyle">本次得分</p>
        <p class="text-green-400 font-bold mb-4 md:mb-6" :style="scoreNumberStyle">{{ score }}</p>
        
        <div class="pt-4 md:pt-6 border-t border-gray-700">
          <div class="flex justify-between items-center mb-3 md:mb-4">
            <span class="text-gray-400" :style="labelStyle">🏆 最高分</span>
            <span class="font-bold text-yellow-400" :style="highlightNumberStyle">{{ highScore }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400" :style="labelStyle">🎮 游玩次数</span>
            <span class="text-white" :style="infoStyle">{{ playCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成就提示 -->
    <div v-if="isNewHighScore" class="bg-yellow-400/20 border-2 border-yellow-400 rounded-xl p-4 mb-6 animate-pulse" :style="achievementStyle">
      <p class="text-yellow-400 font-bold text-center" :style="achievementTextStyle">🎉 新纪录！太棒了！</p>
    </div>

    <!-- 按钮 -->
    <div class="flex flex-col items-center gap-2 w-full max-w-sm" :style="buttonContainerStyle">
      <GameButton
        variant="primary"
        @click="playAgain"
        class="w-full min-w-[140px] max-w-[180px]"
        :fontSize="24.96"
        :paddingLeft="31.2"
        :paddingRight="31.2"
        :paddingTop="15.6"
        :paddingBottom="15.6"
      >
        🔄 再来一局
      </GameButton>
      <GameButton
        variant="secondary"
        @click="goHome"
        class="w-full min-w-[140px] max-w-[180px]"
        :fontSize="24.96"
        :paddingLeft="31.2"
        :paddingRight="31.2"
        :paddingTop="15.6"
        :paddingBottom="15.6"
      >
        🏠 返回首页
      </GameButton>
      <GameButton
        variant="success"
        @click="changeDifficulty"
        class="w-full min-w-[140px] max-w-[180px]"
        :fontSize="24.96"
        :paddingLeft="31.2"
        :paddingRight="31.2"
        :paddingTop="15.6"
        :paddingBottom="15.6"
      >
        ⚙️ 更改难度
      </GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
// 使用本地 UI 组件
import GameButton from '@/components/ui/GameButton.vue'

const router = useRouter()
const route = useRoute()  // ⭐ 添加 route 获取当前路由参数
const gameStore = useGameStore()
const audioStore = useAudioStore()
const ui = useResponsiveUI()

const score = computed(() => gameStore.score)
const highScore = computed(() => gameStore.highScore)
const playCount = computed(() => gameStore.playCount)
const isNewHighScore = computed(() => {
  return gameStore.score >= gameStore.highScore && gameStore.score > 0
})

// 动态样式计算
const containerStyle = computed(() => ({
  // 🎨 上下边距各 2%,内容自动放大适配
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%' // 100% - 2% - 2% = 96%
}))

const emojiStyle = computed(() => ({
  fontSize: ui.getFontSize(139.39)  // 🎨 累计放大 45% (96 * 1.452)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(58.08)  // 🎨 累计放大 45% (40 * 1.452)
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(23.23),  // 🎨 累计放大 45% (16 * 1.452)
  marginBottom: ui.getGap(29.04)  // 🎨 累计放大 45% (20 * 1.452)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(20.33)  // 🎨 累计放大 45% (14 * 1.452)
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(69.7)  // 🎨 累计放大 45% (48 * 1.452)
}))

const highlightNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(34.85)  // 🎨 累计放大 45% (24 * 1.452)
}))

const infoStyle = computed(() => ({
  fontSize: ui.getFontSize(26.14)  // 🎨 累计放大 45% (18 * 1.452)
}))

const achievementStyle = computed(() => ({
  padding: ui.getPadding(17.42),  // 🎨 累计放大 45% (12 * 1.452)
  marginBottom: ui.getGap(29.04),  // 🎨 累计放大 45% (20 * 1.452)
  borderRadius: ui.getBorderRadius(14.52)  // 🎨 累计放大 45% (10 * 1.452)
}))

const achievementTextStyle = computed(() => ({
  fontSize: ui.getFontSize(23.23)  // 🎨 累计放大 45% (16 * 1.452)
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(12),
  paddingLeft: ui.getPadding(12),
  paddingRight: ui.getPadding(12),
  marginTop: ui.getGap(20)
}))

const playAgain = () => {
  audioStore.playClickSound()
  
  // ⭐ 获取当前主题 ID（从父组件或 localStorage）
  const currentThemeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || 'default'
  
  console.log('🔄 再来一局，使用主题 ID:', currentThemeId)
  
  gameStore.resetGame()
  gameStore.startGame()
  
  // ⭐ 跳转到游戏页面时带上 theme_id 参数
  router.push({
    path: '/game',
    query: {
      theme_id: currentThemeId
    }
  })
}

const goHome = () => {
  audioStore.playClickSound()
  gameStore.resetGame()
  router.push('/')
}

const changeDifficulty = () => {
  audioStore.playClickSound()
  gameStore.resetGame()
  router.push('/difficulty')
}

// 播放结束音效
onMounted(() => {
  // ⭐ 初始化 UI 参数，确保与 StartView 计算逻辑一致
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('GameOverView mounted, UI scale:', ui.uiScale)
  
  audioStore.playDieSound()
  // 游戏结束时停止 BGM
  audioStore.stopBGM()
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 确保容器正确居中 */
.w-full.h-full.flex.flex-col.items-center.justify-center {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 强制居中覆盖 */
.fade-in.overflow-y-auto {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
