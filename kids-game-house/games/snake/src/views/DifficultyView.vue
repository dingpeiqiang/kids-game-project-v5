<template>
  <div class="difficulty-page w-full h-full flex flex-col overflow-hidden fade-in" :style="containerStyle">

    <!-- ===== 顶部标题区 ===== -->
    <div class="page-header flex-shrink-0 flex items-center px-4 pt-3 pb-2">
      <!-- 返回按钮 -->
      <button @click="goBack" class="back-btn" :style="backBtnStyle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- 标题 -->
      <div class="flex-1 text-center">
        <h1 class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-yellow-400" :style="titleStyle">
          选择难度
        </h1>
        <p class="text-gray-400 mt-0.5" :style="subtitleStyle">选择你的挑战等级，开始冒险！</p>
      </div>

      <!-- 右侧占位（保持居中） -->
      <div :style="backBtnStyle" class="opacity-0 pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"/>
      </div>
    </div>

    <!-- ===== 主体滚动区 ===== -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-2" style="scroll-behavior: smooth;">
      
      <!-- ⭐ 保存成功提示 Toast -->
      <Transition name="slide-down">
        <div v-if="showNotification" class="save-notification fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
          <div class="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-white/20">
            <span class="text-xl">✅</span>
            <span class="text-sm font-medium flex-1">{{ notificationMessage }}</span>
          </div>
        </div>
      </Transition>

      <!-- 主题选择区 -->
      <div class="theme-section mb-4" :style="sectionStyle">
        <div class="section-label flex items-center gap-2 mb-3">
          <span class="section-dot bg-purple-400"></span>
          <span class="text-gray-300 font-semibold" :style="sectionLabelStyle">🎨 主题皮肤</span>
        </div>
        <div class="theme-wrapper">
          <ThemeSelector />
        </div>
      </div>

      <!-- 难度选择区 -->
      <div class="difficulty-section mb-4" :style="sectionStyle">
        <div class="section-label flex items-center gap-2 mb-3">
          <span class="section-dot bg-green-400"></span>
          <span class="text-gray-300 font-semibold" :style="sectionLabelStyle">🎯 游戏难度</span>
        </div>
        <DifficultySelector
          :modelValue="selectedDifficulty"
          @update:modelValue="(val) => selectedDifficulty = val"
        />
      </div>

      <!-- 高级设置折叠区 -->
      <div class="advanced-section mb-4">
        <!-- 折叠按钮 -->
        <button
          @click="toggleAdvanced"
          class="advanced-toggle w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
          :class="showAdvanced ? 'bg-gray-700/80' : 'bg-gray-800/60 hover:bg-gray-700/60'"
          :style="sectionStyle"
        >
          <div class="flex items-center gap-2">
            <span class="section-dot" :class="showAdvanced ? 'bg-yellow-400' : 'bg-gray-500'"></span>
            <span class="font-semibold" :style="{ ...sectionLabelStyle, color: showAdvanced ? '#fbbf24' : '#9ca3af' }">⚙️ 更多设置</span>
          </div>
          <span class="text-gray-400 transition-transform duration-300" :style="{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', fontSize: sectionLabelStyle.fontSize }">▾</span>
        </button>

        <!-- 折叠内容 -->
        <Transition name="slide-down">
          <div v-if="showAdvanced" class="advanced-content mt-3 space-y-3">
            <GameSettingsPanel
              ref="settingsPanelRef"
              :showThemeSelector="false"
              :showDifficultySelector="false"
              :uiScale="ui.uiScale.value"
              :defaultCollapsed="false"
              @save="handleSaveConfig"
              @themeChange="handleThemeChange"
              @reset="handleResetConfig"
            />
          </div>
        </Transition>
      </div>

    </div>

    <!-- ===== 底部操作栏 ===== -->
    <div class="bottom-bar flex-shrink-0 px-4 pb-4 pt-2" :style="bottomBarStyle">
      <GameButton
        variant="primary"
        @click="startGame"
        class="w-full mb-2"
        :fontSize="Math.round(26 * 1.3)"
        :paddingLeft="Math.round(36 * 1.3)"
        :paddingRight="Math.round(36 * 1.3)"
        :paddingTop="Math.round(18 * 1.3)"
        :paddingBottom="Math.round(18 * 1.3)"
      >
        ▶️ 开始游戏
      </GameButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import type { Difficulty } from '@/types/game'
// 使用本地 UI 组件
import GameButton from '@/components/ui/GameButton.vue'
import GameSettingsPanel from '@/components/ui/GameSettingsPanel.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'
import DifficultySelector from '@/components/ui/DifficultySelector.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const ui = useResponsiveUI()

const settingsPanelRef = ref<InstanceType<typeof GameSettingsPanel>>()
const showAdvanced = ref(false)

// ⭐ Toast 通知相关
const showNotification = ref(false)
const notificationMessage = ref('')
let notificationTimer: number | null = null

// 显示保存成功提示
const showSaveNotification = (message: string) => {
  notificationMessage.value = message
  showNotification.value = true
  
  // 清除之前的定时器
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }
  
  // 3 秒后自动隐藏
  notificationTimer = window.setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

// 当前选中难度（初始值使用默认值，避免循环依赖）
const selectedDifficulty = ref<Difficulty>('medium' as Difficulty)

// 当前游戏实例的配置（仅本次游戏有效）
let currentGameConfig: any = null

// 切换高级设置
const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value
}

// 处理配置保存（仅保存到临时变量）
const handleSaveConfig = (config: any) => {
  console.log('✅ 配置已保存（仅当前游戏实例有效）:', config)
  currentGameConfig = config
  // ⭐ 添加用户可见的提示（使用自定义样式，避免 alert 被沙盒阻止）
  showSaveNotification('✅ 配置已保存！配置仅对本次游戏有效')
}

// 处理重置配置
const handleResetConfig = () => {
  console.log('🔄 配置已恢复默认值')
  // ⭐ 添加用户可见的提示
  showSaveNotification('🔄 配置已恢复默认值')
}

// 处理主题变化
const handleThemeChange = (themeId: string) => {
  console.log('🎨 主题变更为:', themeId)
  localStorage.setItem('current-theme-id', themeId)
}

// ===== 样式计算 =====

const containerStyle = computed(() => ({
  background: 'linear-gradient(160deg, #0f172a 0%, #1a2335 50%, #0f1f2e 100%)',
}))

const backBtnStyle = computed(() => ({
  width: ui.getWidth(44 * 1.3),  // ⭐ 放大 30%
  height: ui.getWidth(44 * 1.3),
  minWidth: ui.getWidth(44 * 1.3),
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(48 * 1.3),  // ⭐ 放大 30%
}))

const subtitleStyle = computed(() => ({
  fontSize: ui.getFontSize(18 * 1.3),  // ⭐ 放大 30%
}))

const sectionStyle = computed(() => ({
  borderRadius: ui.getBorderRadius(16),
}))

const sectionLabelStyle = computed(() => ({
  fontSize: ui.getFontSize(20 * 1.3),  // ⭐ 放大 30%
}))

const bottomBarStyle = computed(() => ({
  borderTop: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(15,23,42,0.95)',
  backdropFilter: 'blur(12px)',
}))

// ===== 操作 =====

const goBack = () => {
  router.push('/')
}

const startGame = () => {
  const themeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || ''
  console.log('🎮 开始游戏，难度:', selectedDifficulty.value, '主题 ID:', themeId)

  if (themeId) {
    localStorage.setItem('current-theme-id', themeId)
  }

  // ⭐ 将难度写入 store（确保 SnakeGame.vue 拿到正确难度）
  gameStore.setDifficulty(selectedDifficulty.value)

  // ⭐ 将自定义配置写入 store（速度/长度/格子/分数均生效）
  if (currentGameConfig) {
    console.log('⚙️ 应用自定义配置:', currentGameConfig)
    gameStore.setCustomConfig({
      initialLength:           currentGameConfig.initialLength,
      speed:                   currentGameConfig.speed,
      cellSize:                currentGameConfig.cellSize,
      normalFoodScore:         currentGameConfig.normalFoodScore,
      bonusFoodScore:          currentGameConfig.bonusFoodScore,
      specialFoodScore:        currentGameConfig.specialFoodScore,
      enableDynamicDifficulty: currentGameConfig.enableDynamicDifficulty,
      enableParticles:         currentGameConfig.enableParticles,
      autoPauseOnBlur:         currentGameConfig.autoPauseOnBlur,
      bgmVolume:               currentGameConfig.bgmVolume,
      sfxVolume:               currentGameConfig.sfxVolume,
      muted:                   currentGameConfig.muted,
    })
  } else {
    // 没有自定义配置，清空上次残留的配置
    console.log('⚙️ 使用默认难度配置，难度:', selectedDifficulty.value)
    gameStore.setCustomConfig(null)
  }

  router.push({
    path: '/game',
    query: { 
      theme_id: themeId,
      difficulty: selectedDifficulty.value
    }
  })
}

onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)
  console.log('DifficultyView mounted, UI params initialized, UI scale:', ui.uiScale.value)
})
</script>

<style scoped>
/* 页面进场动画 */
.fade-in {
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 返回按钮 */
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(0) scale(0.95);
}

/* 区块标签小圆点 */
.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 高级设置折叠按钮 */
.advanced-toggle {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.advanced-toggle:active {
  transform: scale(0.99);
}

/* 折叠展开动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 800px;
  transform: translateY(0);
}

/* 底部栏 */
.bottom-bar {
  position: relative;
  z-index: 10;
}

/* 滚动区自定义滚动条 */
.flex-1.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.flex-1.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.flex-1.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}

/* 主题区包装 */
.theme-wrapper {
  padding: 4px 0;
}
</style>
