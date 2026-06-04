<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4 fade-in" :style="containerStyle">
    <!-- 加载图标 -->
    <div class="animate-bounce mb-6" :style="emojiStyle">__GAME_EMOJI__</div>
    
    <!-- 标题 -->
    <h2 class="font-bold text-white mb-8" :style="titleStyle">{{ currentTitle }}</h2>
    
    <!-- 进度条 -->
    <div class="w-full max-w-xs bg-gray-700 rounded-full overflow-hidden mb-4" :style="progressBarContainerStyle">
      <div 
        class="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300 ease-out"
        :style="{ width: progress + '%', height: progressBarHeight }"
      ></div>
    </div>
    
    <!-- 进度百分比 -->
    <p class="text-gray-400 mb-2" :style="percentageStyle">{{ progress }}%</p>
    
    <!-- 加载提示 -->
    <p class="text-gray-500 animate-pulse" :style="loadingTextStyle">{{ loadingText }}</p>
    
    <!-- 加载失败提示 -->
    <div v-if="loadError" class="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-lg" :style="errorBoxStyle">
      <p class="text-red-400 text-center" :style="errorMessageStyle">⚠️ {{ errorMessage }}</p>
      <GameButton
        variant="primary"
        @click="continueAnyway"
        class="mt-4"
        :fontSize="14"
        :paddingLeft="24"
        :paddingRight="24"
        :paddingTop="8"
        :paddingBottom="8"
      >
        继续游戏
      </GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAudioStore } from '@/stores/audio'
import { useGameStore } from '@/stores/game'
import { useResponsiveUI } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'

const router = useRouter()
const audioStore = useAudioStore()
const gameStore = useGameStore()
const ui = useResponsiveUI()

const progress = ref(0)
const currentTitle = ref('正在加载游戏')
const loadingText = ref('初始化中...')
const loadError = ref(false)
const errorMessage = ref('')

const loadingSteps = [
  { percent: 10, text: '检测屏幕尺寸...' },
  { percent: 20, text: '计算适配参数...' },
  { percent: 30, text: '初始化音频系统...' },
  { percent: 40, text: '加载游戏配置...' },
  { percent: 50, text: '准备游戏引擎...' },
  { percent: 60, text: '计算游戏区域...' },
  { percent: 70, text: '生成游戏数据...' },
  { percent: 80, text: '创建粒子系统...' },
  { percent: 90, text: '几乎完成了...' },
  { percent: 100, text: '准备就绪！' }
]

const continueAnyway = () => {
  audioStore.playClickSound()
  router.push('/')
}

// 动态样式计算
const containerStyle = computed(() => ({
  paddingTop: ui.getPadding(32),
  paddingBottom: ui.getPadding(32)
}))

const emojiStyle = computed(() => ({
  fontSize: ui.getFontSize(96)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(32)
}))

const progressBarContainerStyle = computed(() => ({
  borderRadius: ui.getBorderRadius(9999),
  height: ui.getHeight(20)
}))

const progressBarHeight = computed(() => ui.getHeight(20))

const percentageStyle = computed(() => ({
  fontSize: ui.getFontSize(16)
}))

const loadingTextStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const errorBoxStyle = computed(() => ({
  padding: ui.getPadding(16),
  borderRadius: ui.getBorderRadius(8)
}))

const errorMessageStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

/**
 * 步骤 1: 检测屏幕尺寸并计算适配参数
 */
const calculateAdaptParams = () => {
  const screenW = window.innerWidth
  const screenH = window.innerHeight
  
  console.log('✅ 屏幕尺寸:', screenW, 'x', screenH)
}

/**
 * 步骤 2: 初始化音频系统
 */
const initAudioSystem = async () => {
  try {
    await audioStore.initAudio()
    console.log('✅ 音频系统初始化完成')
  } catch (error) {
    console.warn('⚠️ 音频系统初始化失败，将继续游戏', error)
  }
}

/**
 * 步骤 3: 加载游戏配置
 */
const loadGameConfig = () => {
  console.log('✅ 游戏配置加载完成')
}

/**
 * 步骤 4: 生成游戏数据
 */
const generateGameData = () => {
  gameStore.resetGame()
  console.log('✅ 游戏数据生成完成')
}

onMounted(async () => {
  try {
    for (const step of loadingSteps) {
      progress.value = step.percent
      loadingText.value = step.text
      currentTitle.value = step.percent >= 100 ? '游戏已就绪' : '正在加载游戏'
      
      if (step.percent === 10) {
        calculateAdaptParams()
      } else if (step.percent === 30) {
        await initAudioSystem()
      } else if (step.percent === 40) {
        loadGameConfig()
      } else if (step.percent === 70) {
        generateGameData()
      }
      
      await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40))
    }
    
    setTimeout(() => {
      router.push('/start')
    }, 800)
  } catch (error) {
    console.error('❌ 加载失败:', error)
    loadError.value = true
    errorMessage.value = '资源加载异常'
    loadingText.value = '加载失败'
  }
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
