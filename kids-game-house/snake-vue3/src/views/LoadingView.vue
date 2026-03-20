<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4 fade-in" :style="containerStyle">
    <!-- 加载图标 -->
    <div class="animate-bounce mb-6" :style="emojiStyle">🐍</div>
    
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
    
    <!-- 游戏参数预览（可选） -->
    <div v-if="showGameParams && gameParams" class="mt-6 w-full max-w-xs bg-gray-800/50 rounded-lg p-4 border border-gray-700" :style="paramsCardStyle">
      <h3 class="text-white font-bold mb-3" :style="paramsTitleStyle">📊 游戏参数预览</h3>
      <div class="grid grid-cols-2 gap-2" :style="paramsGridStyle">
        <div class="text-gray-400" :style="paramLabelStyle">屏幕尺寸:</div>
        <div class="text-white text-right" :style="paramValueStyle">{{ gameParams.screenW }} × {{ gameParams.screenH }}</div>
        
        <div class="text-gray-400" :style="paramLabelStyle">单元格大小:</div>
        <div class="text-green-400 text-right" :style="paramValueStyle">{{ gameParams.cellSize?.toFixed(2) }} px</div>
        
        <div class="text-gray-400" :style="paramLabelStyle">游戏区域:</div>
        <div class="text-white text-right" :style="paramValueStyle">{{ gameParams.gameAreaWidth?.toFixed(0) }} × {{ gameParams.gameAreaHeight?.toFixed(0) }}</div>
        
        <div class="text-gray-400" :style="paramLabelStyle">安全区域:</div>
        <div class="text-yellow-400 text-right" :style="paramValueStyle">上 {{ gameParams.safeTop?.toFixed(0) }} / 下 {{ gameParams.safeBottom?.toFixed(0) }}</div>
        
        <div class="text-gray-400" :style="paramLabelStyle">难度配置:</div>
        <div class="text-blue-400 text-right" :style="paramValueStyle">{{ gameParams.difficulty }}</div>
        
        <div class="text-gray-400" :style="paramLabelStyle">蛇初始位置:</div>
        <div class="text-purple-400 text-right" :style="paramValueStyle">({{ gameParams.snakeStart?.x }}, {{ gameParams.snakeStart?.y }})</div>
      </div>
    </div>
    
    <!-- 加载失败提示 -->
    <div v-if="loadError" class="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-lg" :style="errorBoxStyle">
      <p class="text-red-400 text-center" :style="errorMessageStyle">⚠️ {{ errorMessage }}</p>
      <GameButton variant="primary" @click="continueAnyway" class="mt-4" :style="errorButtonStyle">
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
import { useSettingsStore } from '@/stores/settings'
import { DIFFICULTY_CONFIGS } from '@/types/game'
import { useResponsiveUI } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'

const router = useRouter()
const audioStore = useAudioStore()
const gameStore = useGameStore()
const settingsStore = useSettingsStore()
const ui = useResponsiveUI()

const progress = ref(0)
const currentTitle = ref('正在加载游戏')
const loadingText = ref('初始化中...')
const loadError = ref(false)
const errorMessage = ref('')
const showGameParams = ref(true) // 是否显示游戏参数预览

// 游戏参数对象
const gameParams = ref<{
  screenW?: number
  screenH?: number
  scale?: number
  cellSize?: number
  gameAreaWidth?: number
  gameAreaHeight?: number
  safeTop?: number
  safeBottom?: number
  difficulty?: string
  snakeStart?: { x: number; y: number }
}>({})

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
  fontSize: ui.getFontSize(96)  // 对应 text-6xl ~ text-8xl
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(32)  // 对应 text-2xl ~ text-4xl
}))

const progressBarContainerStyle = computed(() => ({
  borderRadius: ui.getBorderRadius(9999),
  height: ui.getHeight(20)  // 动态高度
}))

const progressBarHeight = computed(() => ui.getHeight(20))

const percentageStyle = computed(() => ({
  fontSize: ui.getFontSize(16)
}))

const loadingTextStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const paramsCardStyle = computed(() => ({
  padding: ui.getPadding(16),
  borderRadius: ui.getBorderRadius(8)
}))

const paramsTitleStyle = computed(() => ({
  fontSize: ui.getFontSize(14),
  marginBottom: ui.getGap(12)
}))

const paramsGridStyle = computed(() => ({
  gap: ui.getGap(8)
}))

const paramLabelStyle = computed(() => ({
  fontSize: ui.getFontSize(12)
}))

const paramValueStyle = computed(() => ({
  fontSize: ui.getFontSize(12)
}))

const errorBoxStyle = computed(() => ({
  padding: ui.getPadding(16),
  borderRadius: ui.getBorderRadius(8)
}))

const errorMessageStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const errorButtonStyle = computed(() => ({
  fontSize: ui.getFontSize(14),
  paddingLeft: ui.getPadding(24),
  paddingRight: ui.getPadding(24),
  paddingTop: ui.getPadding(8),
  paddingBottom: ui.getPadding(8)
}))

/**
 * 步骤 1: 检测屏幕尺寸并计算适配参数
 */
const calculateAdaptParams = () => {
  // 设计基准（竖屏）
  const DESIGN_WIDTH = 720
  const DESIGN_HEIGHT = 1280
  
  // 网格配置
  const GRID_COLS = 32
  const GRID_ROWS = 18
  
  // 获取设备屏幕尺寸
  const screenW = window.innerWidth
  const screenH = window.innerHeight
  
  // 计算最佳缩放比
  const scale = Math.min(
    screenW / DESIGN_WIDTH,
    screenH / DESIGN_HEIGHT
  )
  
  // 计算安全区域（手机刘海/底部手势条）
  const safeTop = Math.max(44, screenH * 0.05)
  const safeBottom = Math.max(34, screenH * 0.08)
  
  // 计算动态单元格大小
  const gameAreaWidth = GRID_COLS * 50
  const gameAreaHeight = GRID_ROWS * 50
  
  const availableWidth = screenW * 0.95
  const availableHeight = (screenH - safeTop - safeBottom) * 0.9
  
  const scaleByWidth = availableWidth / gameAreaWidth
  const scaleByHeight = availableHeight / gameAreaHeight
  
  const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)
  const cellSize = 50 * finalScale
  
  // 保存参数
  gameParams.value = {
    screenW,
    screenH,
    scale,
    cellSize,
    gameAreaWidth: GRID_COLS * cellSize,
    gameAreaHeight: GRID_ROWS * cellSize,
    safeTop,
    safeBottom,
    difficulty: settingsStore.difficulty,
    snakeStart: { x: 10, y: 10 }
  }
  
  console.log('✅ 游戏适配参数计算完成:', gameParams.value)
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
  // 从 store 加载配置
  const config = {
    difficulty: settingsStore.difficulty,
    difficultyConfig: DIFFICULTY_CONFIGS[settingsStore.difficulty],
    highScore: gameStore.highScore,
    playCount: gameStore.playCount
  }
  
  console.log('✅ 游戏配置加载完成:', config)
}

/**
 * 步骤 4: 生成游戏数据
 */
const generateGameData = () => {
  // 重置游戏状态
  gameStore.resetGame()
  
  console.log('✅ 游戏数据生成完成')
}

onMounted(async () => {
  try {
    // 逐步执行加载步骤
    for (const step of loadingSteps) {
      progress.value = step.percent
      loadingText.value = step.text
      currentTitle.value = step.percent >= 100 ? '游戏已就绪' : '正在加载游戏'
      
      // 根据进度执行不同任务
      if (step.percent === 10) {
        calculateAdaptParams()
      } else if (step.percent === 30) {
        await initAudioSystem()
      } else if (step.percent === 40) {
        loadGameConfig()
      } else if (step.percent === 70) {
        generateGameData()
      }
      
      // 模拟必要的延迟（让 UI 流畅显示）
      await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40))
    }
    
    // 短暂延迟后跳转到开始页
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
