<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in overflow-y-auto" :style="containerStyle">
    <!-- 结束图标 -->
    <div class="animate-bounce mb-4 md:mb-6" :style="emojiStyle">{{ emoji }}</div>

    <!-- 标题 -->
    <h2 class="font-bold text-red-400 mb-6 md:mb-8 text-center" :style="titleStyle">{{ title }}</h2>

    <!-- 分数区域 -->
    <div class="bg-gray-800/60 rounded-2xl backdrop-blur mb-6 md:mb-8 w-full max-w-sm" :style="scoreCardStyle">
      <slot name="score">
        <div class="text-center">
          <p class="text-gray-400 mb-2" :style="labelStyle">{{ scoreLabel }}</p>
          <p class="text-green-400 font-bold mb-4 md:mb-6" :style="scoreNumberStyle">{{ score }}</p>

          <div class="pt-4 md:pt-6 border-t border-gray-700">
            <div class="flex justify-between items-center mb-3 md:mb-4">
              <span class="text-gray-400" :style="labelStyle">🏆 {{ highScoreLabel }}</span>
              <span class="font-bold text-yellow-400" :style="highlightNumberStyle">{{ highScore }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400" :style="labelStyle">🎮 {{ playCountLabel }}</span>
              <span class="text-white" :style="infoStyle">{{ playCount }}</span>
            </div>
          </div>
        </div>
      </slot>
    </div>

    <!-- 新纪录提示 -->
    <div v-if="isNewRecord" class="bg-yellow-400/20 border-2 border-yellow-400 rounded-xl p-4 mb-6 animate-pulse" :style="achievementStyle">
      <p class="text-yellow-400 font-bold text-center" :style="achievementTextStyle">🎉 {{ newRecordText }}</p>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-col items-center gap-2 w-full max-w-sm" :style="buttonContainerStyle">
      <slot name="actions">
        <GameButton
          variant="primary"
          @click="handleReplay"
          class="w-full min-w-[140px] max-w-[180px]"
          :fontSize="buttonFontSize"
          :paddingLeft="buttonPaddingLeft"
          :paddingRight="buttonPaddingRight"
          :paddingTop="buttonPaddingTop"
          :paddingBottom="buttonPaddingBottom"
        >
          {{ replayText }}
        </GameButton>
        <GameButton
          variant="secondary"
          @click="handleHome"
          class="w-full min-w-[140px] max-w-[180px]"
          :fontSize="buttonFontSize"
          :paddingLeft="buttonPaddingLeft"
          :paddingRight="buttonPaddingRight"
          :paddingTop="buttonPaddingTop"
          :paddingBottom="buttonPaddingBottom"
        >
          {{ homeText }}
        </GameButton>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GameButton from '../ui/GameButton.vue'

const props = withDefaults(defineProps<{
  /** 当前分数 */
  score?: number
  /** 最高分 */
  highScore?: number
  /** 游玩次数 */
  playCount?: number
  /** 是否破纪录 */
  isNewRecord?: boolean
  /** 结束图标 */
  emoji?: string
  /** 标题文字 */
  title?: string
  /** 分数标签 */
  scoreLabel?: string
  /** 最高分标签 */
  highScoreLabel?: string
  /** 游玩次数标签 */
  playCountLabel?: string
  /** 是否显示最高分 */
  showHighScore?: boolean
  /** 是否显示成就 */
  showAchievements?: boolean
  /** 新纪录文字 */
  newRecordText?: string
  /** 重新开始按钮文字 */
  replayText?: string
  /** 返回主页按钮文字 */
  homeText?: string
  /** UI 缩放系数（从 useResponsiveUI 获取） */
  uiScale?: number
}>(), {
  score: 0,
  highScore: 0,
  playCount: 0,
  isNewRecord: false,
  emoji: '😢',
  title: '游戏结束',
  scoreLabel: '本次得分',
  highScoreLabel: '最高分',
  playCountLabel: '游玩次数',
  showHighScore: true,
  showAchievements: false,
  newRecordText: '新纪录！太棒了！',
  replayText: '🔄 再来一局',
  homeText: '🏠 返回首页',
  uiScale: 1.0
})

const emit = defineEmits<{
  replay: []
  home: []
}>()

// 动态样式计算（完全复刻贪吃蛇）
const containerStyle = computed(() => ({
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%'
}))

const emojiStyle = computed(() => ({
  fontSize: `${139.39 * props.uiScale}px`  // 96 * 1.452
}))

const titleStyle = computed(() => ({
  fontSize: `${58.08 * props.uiScale}px`  // 40 * 1.452
}))

const scoreCardStyle = computed(() => ({
  padding: `${23.23 * props.uiScale}px`,  // 16 * 1.452
  marginBottom: `${29.04 * props.uiScale}px`  // 20 * 1.452
}))

const labelStyle = computed(() => ({
  fontSize: `${20.33 * props.uiScale}px`  // 14 * 1.452
}))

const scoreNumberStyle = computed(() => ({
  fontSize: `${69.7 * props.uiScale}px`  // 48 * 1.452
}))

const highlightNumberStyle = computed(() => ({
  fontSize: `${34.85 * props.uiScale}px`  // 24 * 1.452
}))

const infoStyle = computed(() => ({
  fontSize: `${26.14 * props.uiScale}px`  // 18 * 1.452
}))

const achievementStyle = computed(() => ({
  padding: `${17.42 * props.uiScale}px`,  // 12 * 1.452
  marginBottom: `${29.04 * props.uiScale}px`,  // 20 * 1.452
  borderRadius: `${14.52 * props.uiScale}px`  // 10 * 1.452
}))

const achievementTextStyle = computed(() => ({
  fontSize: `${23.23 * props.uiScale}px`  // 16 * 1.452
}))

const buttonContainerStyle = computed(() => ({
  gap: `${12 * props.uiScale}px`,
  paddingLeft: `${12 * props.uiScale}px`,
  paddingRight: `${12 * props.uiScale}px`,
  marginTop: `${20 * props.uiScale}px`
}))

// 按钮样式参数（与贪吃蛇一致）
const buttonFontSize = 24.96 * props.uiScale
const buttonPaddingLeft = 31.2 * props.uiScale
const buttonPaddingRight = 31.2 * props.uiScale
const buttonPaddingTop = 15.6 * props.uiScale
const buttonPaddingBottom = 15.6 * props.uiScale

function handleReplay() {
  emit('replay')
}

function handleHome() {
  emit('home')
}
</script>

<style scoped>
/* 淡入动画 */
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
