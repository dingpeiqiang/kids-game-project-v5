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
    <div class="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 w-full max-w-md justify-center" :style="buttonContainerStyle">
      <GameButton
        variant="primary"
        @click="playAgain"
        class="flex-1 min-w-[140px] max-w-[180px]"
        :fontSize="16"
        :paddingLeft="20"
        :paddingRight="20"
        :paddingTop="10"
        :paddingBottom="10"
      >
        🔄 再来一局
      </GameButton>
      <GameButton
        variant="secondary"
        @click="goHome"
        class="flex-1 min-w-[140px] max-w-[180px]"
        :fontSize="16"
        :paddingLeft="20"
        :paddingRight="20"
        :paddingTop="10"
        :paddingBottom="10"
      >
        🏠 返回首页
      </GameButton>
      <GameButton
        variant="success"
        @click="changeDifficulty"
        class="flex-1 min-w-[140px] max-w-[180px]"
        :fontSize="16"
        :paddingLeft="20"
        :paddingRight="20"
        :paddingTop="10"
        :paddingBottom="10"
      >
        ⚙️ 更改难度
      </GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'

const router = useRouter()
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
  paddingTop: ui.getPadding(16),
  paddingBottom: ui.getPadding(16)
}))

const emojiStyle = computed(() => ({
  fontSize: ui.getFontSize(96)  // 对应 text-6xl ~ text-8xl
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(40)  // 对应 text-3xl ~ text-5xl
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(16),
  marginBottom: ui.getGap(20)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(48)  // 对应 text-4xl ~ text-5xl
}))

const highlightNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(24)  // 对应 text-xl ~ text-2xl
}))

const infoStyle = computed(() => ({
  fontSize: ui.getFontSize(18)
}))

const achievementStyle = computed(() => ({
  padding: ui.getPadding(12),
  marginBottom: ui.getGap(20),
  borderRadius: ui.getBorderRadius(10)
}))

const achievementTextStyle = computed(() => ({
  fontSize: ui.getFontSize(16)
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(12),
  paddingLeft: ui.getPadding(12),
  paddingRight: ui.getPadding(12),
  marginTop: ui.getGap(20)
}))

const playAgain = () => {
  audioStore.playClickSound()
  gameStore.resetGame()
  gameStore.startGame()
  router.push('/game')
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
