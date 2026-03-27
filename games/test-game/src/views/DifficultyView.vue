<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4 fade-in overflow-y-auto" :style="containerStyle">
    <h2 class="font-bold text-white text-center" :style="titleStyle">选择难度</h2>

    <DifficultySelector v-model="selectedDifficulty" :config="difficultyConfig" class="w-full max-w-lg" :uiScale="uiScale" />

    <div class="flex flex-col items-center gap-2 w-full max-w-lg" :style="buttonContainerStyle">
      <GameButton
        variant="secondary"
        @click="goBack"
        class="w-full"
        :fontSize="25.92"
        :paddingLeft="34.56"
        :paddingRight="34.56"
        :paddingTop="17.28"
        :paddingBottom="17.28"
      >
        🔙 返回
      </GameButton>
      <GameButton
        variant="primary"
        @click="startGame"
        class="w-full"
        :fontSize="25.92"
        :paddingLeft="34.56"
        :paddingRight="34.56"
        :paddingTop="17.28"
        :paddingBottom="17.28"
      >
        ▶️ 开始
      </GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import type { Difficulty } from '@/types/game'
// 使用框架的 UI 组件
import { DifficultySelector, GameButton } from '@kids-game/framework'

const router = useRouter()
const route = useRoute()
const ui = useResponsiveUI()

const selectedDifficulty = ref<string>('normal')
const uiScale = computed(() => ui.uiScale)

// 难度配置（test-game 专用）
const difficultyConfig = {
  defaultId: 'normal',
  levels: [
    {
      id: 'easy',
      name: 'Easy',
      nameCN: '简单',
      icon: '🌱',
      description: '适合新手，轻松上手',
      params: {
        speed: 1,
        scoreMultiplier: 1
      }
    },
    {
      id: 'normal',
      name: 'Normal',
      nameCN: '普通',
      icon: '⚡',
      description: '标准体验，平衡挑战',
      params: {
        speed: 2,
        scoreMultiplier: 2
      }
    },
    {
      id: 'hard',
      name: 'Hard',
      nameCN: '困难',
      icon: '🔥',
      description: '极限挑战，高手专属',
      params: {
        speed: 3,
        scoreMultiplier: 3
      }
    }
  ]
}

// 动态样式计算（完全复刻贪吃蛇）
const containerStyle = computed(() => ({
  // 🎨 上下边距各 2%,内容自动放大适配
  paddingTop: '2%',
  paddingBottom: '2%',
  height: '96%' // 100% - 2% - 2% = 96%
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(83.64),  // 🎨 累计放大 109% (40 * 2.09088)
  marginBottom: ui.getGap(50.18)  // 🎨 累计放大 109% (24 * 2.09088)
}))

const buttonContainerStyle = computed(() => ({
  gap: ui.getGap(25.09),  // 🎨 累计放大 109% (12 * 2.09088)
  marginTop: ui.getGap(50.18)  // 🎨 累计放大 109% (24 * 2.09088)
}))

const goBack = () => {
  router.push('/')
}

const startGame = () => {
  // 获取主题 ID 并传递到游戏页面
  const themeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || ''
  console.log('🎨 难度选择完成，使用主题 ID:', themeId)
  
  // 保存主题 ID 到 localStorage
  if (themeId) {
    localStorage.setItem('current-theme-id', themeId)
  }
  
  // 保存难度设置
  localStorage.setItem('test-game-difficulty', selectedDifficulty.value)
  
  // 跳转到游戏页面
  router.push({
    path: '/game',
    query: { 
      difficulty: selectedDifficulty.value,
      theme_id: themeId 
    }
  })
}

// ⭐ 初始化 UI 参数，确保与 StartView 计算逻辑一致
onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('DifficultyView mounted, UI params initialized, UI scale:', ui.uiScale)
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
</style>
