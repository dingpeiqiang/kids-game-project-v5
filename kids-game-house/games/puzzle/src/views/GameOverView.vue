<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in overflow-y-auto"
       :style="containerStyle">

    <!-- 结束图标 -->
    <div class="animate-bounce" :style="emojiStyle">😢</div>

    <!-- 标题 -->
    <h2 class="font-bold text-red-400 text-center" :style="titleStyle">游戏结束</h2>

    <!-- 分数卡片 -->
    <div class="bg-gray-800/60 rounded-2xl backdrop-blur w-full max-w-sm" :style="scoreCardStyle">
      <div class="text-center">

        <!-- 关卡信息 -->
        <div v-if="currentLevel > 0" class="mb-4">
          <span class="level-badge">
            🏰 第 {{ currentLevel }} 关 · {{ levelName }}
          </span>
        </div>

        <!-- 本次得分 -->
        <p class="text-gray-400 mb-2" :style="labelStyle">本次得分</p>
        <p class="text-green-400 font-bold mb-4" :style="scoreNumberStyle">{{ score }}</p>

        <div class="pt-4 border-t border-gray-700">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-400" :style="labelStyle">🏆 最高分</span>
            <span class="font-bold text-yellow-400" :style="highlightStyle">{{ highScore }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400" :style="labelStyle">🎮 游玩次数</span>
            <span class="text-white" :style="infoStyle">{{ playCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新纪录提示 -->
    <div v-if="isNewHighScore"
         class="bg-yellow-400/20 border-2 border-yellow-400 rounded-xl animate-pulse"
         :style="achievementStyle">
      <p class="text-yellow-400 font-bold text-center" :style="achievementTextStyle">
        🎉 新纪录！太棒了！
      </p>
    </div>

    <!-- 按钮 -->
    <div class="flex flex-col items-center w-full max-w-xs" :style="buttonContainerStyle">
      <GameButton
        variant="primary"
        class="w-full mb-2"
        :fontSize="22"
        :paddingLeft="28"
        :paddingRight="28"
        :paddingTop="14"
        :paddingBottom="14"
        @click="playAgain"
      >
        🔄 再来一局
      </GameButton>

      <GameButton
        variant="secondary"
        class="w-full mb-2"
        :fontSize="20"
        :paddingLeft="28"
        :paddingRight="28"
        :paddingTop="12"
        :paddingBottom="12"
        @click="changeDifficulty"
      >
        ⚙️ 更改难度
      </GameButton>

      <GameButton
        variant="danger"
        class="w-full"
        :fontSize="18"
        :paddingLeft="28"
        :paddingRight="28"
        :paddingTop="11"
        :paddingBottom="11"
        @click="goHome"
      >
        🏠 返回首页
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
import GameButton from '@/components/ui/GameButton.vue'

const router     = useRouter()
const route      = useRoute()
const gameStore  = useGameStore()
const audioStore = useAudioStore()
const ui         = useResponsiveUI()

// ── Store 数据 ─────────────────────────────────────────────────────────────
const score         = computed(() => gameStore.score)
const highScore     = computed(() => gameStore.highScore)
const playCount     = computed(() => gameStore.playCount)
const currentLevel  = computed(() => gameStore.currentLevel)
const levelName     = computed(() => gameStore.levelConfig?.name || '')
const isNewHighScore = computed(() => gameStore.score > 0 && gameStore.score >= gameStore.highScore)

// ── 响应式样式 ─────────────────────────────────────────────────────────────
const containerStyle = computed(() => ({
  paddingTop: '2%', paddingBottom: '2%', height: '96%',
}))

const emojiStyle = computed(() => ({
  fontSize: ui.getFontSize(88),
  marginBottom: ui.getGap(16),
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(42),
  marginBottom: ui.getGap(24),
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(20),
  marginBottom: ui.getGap(20),
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(14),
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(56),
  fontWeight: 'bold',
}))

const highlightStyle = computed(() => ({
  fontSize: ui.getFontSize(24),
  fontWeight: 'bold',
}))

const infoStyle = computed(() => ({
  fontSize: ui.getFontSize(18),
}))

const achievementStyle = computed(() => ({
  padding: ui.getPadding(14),
  marginBottom: ui.getGap(20),
  borderRadius: ui.getBorderRadius(12),
  minWidth: ui.getWidth(220),
}))

const achievementTextStyle = computed(() => ({
  fontSize: ui.getFontSize(16),
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(10),
  marginTop: ui.getGap(8),
}))

// ── 操作 ──────────────────────────────────────────────────────────────────

function playAgain() {
  audioStore.playClickSound()
  const themeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || ''
  router.push({ path: '/game', query: { theme_id: themeId } })
}

function changeDifficulty() {
  audioStore.playClickSound()
  router.push('/difficulty')
}

function goHome() {
  audioStore.playClickSound()
  router.push('/')
}

// ── 生命周期 ──────────────────────────────────────────────────────────────
onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)
  audioStore.playDieSound()
  audioStore.stopBGM()
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.level-badge {
  font-size: 0.85rem;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  padding: 0.35rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(251, 191, 36, 0.25);
}
</style>
