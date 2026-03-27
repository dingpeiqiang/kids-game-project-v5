<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in relative" :style="containerStyle">
    <!-- 标题区 -->
    <div class="text-center mb-8" :style="titleContainerStyle">
      <slot name="title">
        <h1 class="animate-bounce" :style="emojiStyle">{{ gameEmoji }}</h1>
        <h2
          class="font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400"
          :style="titleStyle"
        >
          {{ gameName }}
        </h2>
        <p class="text-gray-400 mt-4" :style="subtitleStyle">儿童益智小游戏</p>
      </slot>
    </div>

    <!-- 分数记录 -->
    <div class="bg-gray-800/60 rounded-2xl backdrop-blur mb-8" :style="scoreCardStyle">
      <slot name="score">
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
      </slot>
    </div>

    <!-- 开始按钮 -->
    <GameButton
      variant="primary"
      @click="handleStart"
      class="mb-3"
      :fontSize="buttonFontSize"
      :paddingLeft="buttonPaddingLeft"
      :paddingRight="buttonPaddingRight"
      :paddingTop="buttonPaddingTop"
      :paddingBottom="buttonPaddingBottom"
    >
      {{ startText }}
    </GameButton>

    <!-- 设置区 -->
    <div class="mt-4 flex flex-col items-center justify-center gap-2 md:gap-4" :style="soundToggleContainerStyle">
      <slot name="settings">
        <ThemeSelector v-if="showThemeSelector" />
        <SoundToggle :enabled="soundEnabled" @toggle="handleSoundToggle" />
      </slot>
    </div>

    <!-- 操作说明 -->
    <div class="mt-4 text-center text-gray-400" :style="instructionStyle">
      <slot name="instructions">
        <p>{{ defaultInstructions }}</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import GameButton from '../ui/GameButton.vue'
import ThemeSelector from '../ui/ThemeSelector.vue'
import SoundToggle from '../ui/SoundToggle.vue'

const props = withDefaults(defineProps<{
  /** 游戏名称 */
  gameName?: string
  /** 游戏 Emoji 图标 */
  gameEmoji?: string
  /** 最高分 */
  highScore?: number
  /** 游玩次数 */
  playCount?: number
  /** 是否显示最高分 */
  showHighScore?: boolean
  /** 是否显示设置区 */
  showSettings?: boolean
  /** 是否显示主题选择器 */
  showThemeSelector?: boolean
  /** 是否显示操作说明 */
  showInstructions?: boolean
  /** 开始按钮文字 */
  startText?: string
  /** 默认操作说明 */
  defaultInstructions?: string
  /** 声音是否启用 */
  soundEnabled?: boolean
  /** UI 缩放系数（从 useResponsiveUI 获取） */
  uiScale?: number
}>(), {
  gameName: '游戏',
  gameEmoji: '🎮',
  highScore: 0,
  playCount: 0,
  showHighScore: true,
  showSettings: true,
  showThemeSelector: true,
  showInstructions: true,
  startText: '开始游戏',
  defaultInstructions: '使用键盘方向键或滑动屏幕控制方向',
  soundEnabled: true,
  uiScale: 1.0
})

const emit = defineEmits<{
  start: []
  soundToggle: [enabled: boolean]
  themeChange: [themeId: string]
}>()

const soundEnabled = ref(true)

// 动态样式计算（完全复刻贪吃蛇）
const containerStyle = computed(() => ({
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%'
}))

const titleContainerStyle = computed(() => ({
  marginBottom: `${24 * props.uiScale}px`
}))

const emojiStyle = computed(() => ({
  fontSize: `${96 * props.uiScale * 1.452}px`,
  marginBottom: `${16 * props.uiScale * 1.452}px`
}))

const titleStyle = computed(() => ({
  fontSize: `${48 * props.uiScale * 1.452}px`
}))

const subtitleStyle = computed(() => ({
  fontSize: `${18 * props.uiScale * 1.452}px`,
  marginTop: `${16 * props.uiScale * 1.452}px`
}))

const scoreCardStyle = computed(() => ({
  padding: `${16 * props.uiScale * 1.452}px`,
  marginBottom: `${24 * props.uiScale * 1.452}px`
}))

const trophyIconStyle = computed(() => ({
  fontSize: `${40 * props.uiScale * 1.452}px`
}))

const labelStyle = computed(() => ({
  fontSize: `${14 * props.uiScale * 1.452}px`
}))

const scoreNumberStyle = computed(() => ({
  fontSize: `${36 * props.uiScale * 1.452}px`,
  fontWeight: 'bold'
}))

// 按钮样式参数（与贪吃蛇一致）
const buttonFontSize = computed(() => 23.4 * props.uiScale)
const buttonPaddingLeft = computed(() => 41.6 * props.uiScale)
const buttonPaddingRight = computed(() => 41.6 * props.uiScale)
const buttonPaddingTop = computed(() => 20.8 * props.uiScale)
const buttonPaddingBottom = computed(() => 20.8 * props.uiScale)

const instructionStyle = computed(() => ({
  fontSize: `${14 * props.uiScale * 1.452}px`,
  marginTop: `${32 * props.uiScale * 1.452}px`
}))

const soundToggleContainerStyle = computed(() => ({
  gap: `${16 * props.uiScale * 1.452}px`
}))

function handleStart() {
  emit('start')
}

function handleSoundToggle(enabled: boolean) {
  soundEnabled.value = enabled
  emit('soundToggle', enabled)
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
</style>
