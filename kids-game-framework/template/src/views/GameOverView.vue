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
    <div
      v-if="isNewHighScore"
      class="bg-yellow-400/20 border-2 border-yellow-400 rounded-xl p-4 mb-6 animate-pulse"
      :style="achievementStyle"
    >
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
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { GameButton } from '@kids-game/framework'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'

const router = useRouter()
const route = useRoute()
const ui = useResponsiveUI()

// 从路由参数获取分数
const score = computed(() => parseInt(route.query.score as string) || 0)
const highScore = ref(0)
const playCount = ref(0)
const isNewHighScore = computed(() => score.value >= highScore.value && score.value > 0)

onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)

  // 读取历史数据
  const savedHighScore = localStorage.getItem('{{GAME_ID}}-high-score')
  const prevHighScore = savedHighScore ? parseInt(savedHighScore, 10) : 0

  // 更新最高分
  if (score.value > prevHighScore) {
    highScore.value = score.value
    localStorage.setItem('{{GAME_ID}}-high-score', String(score.value))
  } else {
    highScore.value = prevHighScore
  }

  // 更新游玩次数
  const savedCount = localStorage.getItem('{{GAME_ID}}-play-count')
  playCount.value = (savedCount ? parseInt(savedCount, 10) : 0) + 1
  localStorage.setItem('{{GAME_ID}}-play-count', String(playCount.value))
})

// 动态样式计算
const containerStyle = computed(() => ({
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%'
}))

const emojiStyle = computed(() => ({
  fontSize: ui.getFontSize(139.39)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(58.08)
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(23.23),
  marginBottom: ui.getGap(29.04)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(20.33)
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(69.7)
}))

const highlightNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(34.85)
}))

const infoStyle = computed(() => ({
  fontSize: ui.getFontSize(26.14)
}))

const achievementStyle = computed(() => ({
  padding: ui.getPadding(17.42),
  marginBottom: ui.getGap(29.04),
  borderRadius: ui.getBorderRadius(14.52)
}))

const achievementTextStyle = computed(() => ({
  fontSize: ui.getFontSize(23.23)
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(12),
  paddingLeft: ui.getPadding(12),
  paddingRight: ui.getPadding(12),
  marginTop: ui.getGap(20)
}))

function playAgain() {
  router.push('/game')
}

function goHome() {
  router.push('/')
}

function changeDifficulty() {
  // 如需难度选择页面，可在此跳转
  router.push('/')
}
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 弹跳动画 */
.animate-bounce {
  animation: bounce 0.6s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 脉冲动画 */
.animate-pulse {
  animation: pulse 1s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>
