<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4 fade-in overflow-y-auto" :style="containerStyle">
    <div class="animate-bounce mb-4 md:mb-6" :style="emojiStyle">{{ isVictory ? '🎉' : '😢' }}</div>
    
    <h2 class="font-bold mb-6 md:mb-8 text-center" :style="titleStyle" :class="isVictory ? 'text-green-400' : 'text-red-400'">
      {{ isVictory ? '胜利！' : '游戏结束' }}
    </h2>
    
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

    <div v-if="isNewHighScore" class="bg-yellow-400/20 border-2 border-yellow-400 rounded-xl p-4 mb-6 animate-pulse" :style="achievementStyle">
      <p class="text-yellow-400 font-bold text-center" :style="achievementTextStyle">🎉 新纪录！太棒了！</p>
    </div>

    <div class="flex flex-col gap-3 md:gap-4 w-full max-w-xs px-4" :style="buttonContainerStyle">
      <GameButton variant="primary" @click="playAgain" class="w-full" :style="buttonStyle">
        🔄 再来一局
      </GameButton>
      <GameButton variant="secondary" @click="goHome" class="w-full" :style="buttonStyle">
        🏠 返回首页
      </GameButton>
      <GameButton variant="success" @click="changeDifficulty" class="w-full" :style="buttonStyle">
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
import { useResponsiveUI } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const ui = useResponsiveUI()

const score = computed(() => gameStore.score)
const highScore = computed(() => gameStore.highScore)
const playCount = computed(() => gameStore.playCount)
const isVictory = computed(() => gameStore.isVictory)
const isNewHighScore = computed(() => {
  return gameStore.score >= gameStore.highScore && gameStore.score > 0
})

const containerStyle = computed(() => ({
  paddingTop: ui.getPadding(32),
  paddingBottom: ui.getPadding(32)
}))

const emojiStyle = computed(() => ({
  fontSize: ui.getFontSize(96)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(40)
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(24),
  marginBottom: ui.getGap(24)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(48)
}))

const highlightNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(24)
}))

const infoStyle = computed(() => ({
  fontSize: ui.getFontSize(18)
}))

const achievementStyle = computed(() => ({
  padding: ui.getPadding(16),
  marginBottom: ui.getGap(24),
  borderRadius: ui.getBorderRadius(12)
}))

const achievementTextStyle = computed(() => ({
  fontSize: ui.getFontSize(16)
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(16),
  paddingLeft: ui.getPadding(16),
  paddingRight: ui.getPadding(16)
}))

const buttonStyle = computed(() => ({
  fontSize: ui.getFontSize(18)
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

onMounted(() => {
  if (isVictory.value) {
    audioStore.playWinSound()
  } else {
    audioStore.playLoseSound()
  }
})
</script>
