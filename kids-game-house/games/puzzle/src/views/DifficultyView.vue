<template>
  <div class="difficulty-page w-full h-full flex flex-col overflow-hidden fade-in" :style="containerStyle">

    <!-- ===== 顶部标题区 ===== -->
    <div class="flex-shrink-0 flex items-center px-4 pt-3 pb-2">
      <!-- 返回按钮 -->
      <button class="back-btn" :style="backBtnStyle" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- 标题 -->
      <div class="flex-1 text-center">
        <h1 class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-yellow-400"
            :style="titleStyle">
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
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-2 scroll-area">

      <!-- Toast 提示 -->
      <Transition name="slide-down">
        <div v-if="showToast" class="save-toast fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md">
          <div class="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl
                      shadow-lg flex items-center gap-3 border border-white/20">
            <span class="text-xl">✅</span>
            <span class="text-sm font-medium flex-1">{{ toastMessage }}</span>
          </div>
        </div>
      </Transition>

      <!-- 主题选择 -->
      <div class="mb-4" :style="sectionStyle">
        <div class="flex items-center gap-2 mb-3">
          <span class="section-dot bg-purple-400"></span>
          <span class="text-gray-300 font-semibold" :style="sectionLabelStyle">🎨 主题皮肤</span>
        </div>
        <ThemeSelector />
      </div>

      <!-- 难度选择 -->
      <div class="mb-4" :style="sectionStyle">
        <div class="flex items-center gap-2 mb-3">
          <span class="section-dot bg-green-400"></span>
          <span class="text-gray-300 font-semibold" :style="sectionLabelStyle">🎯 游戏难度</span>
        </div>
        <DifficultySelector
          :modelValue="selectedDifficulty"
          @update:modelValue="(val) => selectedDifficulty = val"
        />
      </div>

      <!-- 高级设置折叠 -->
      <div class="mb-4">
        <button
          class="advanced-toggle w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
          :class="showAdvanced ? 'bg-gray-700/80' : 'bg-gray-800/60 hover:bg-gray-700/60'"
          @click="showAdvanced = !showAdvanced"
        >
          <div class="flex items-center gap-2">
            <span class="section-dot" :class="showAdvanced ? 'bg-yellow-400' : 'bg-gray-500'"></span>
            <span class="font-semibold" :style="{ ...sectionLabelStyle, color: showAdvanced ? '#fbbf24' : '#9ca3af' }">
              ⚙️ 更多设置
            </span>
          </div>
          <span class="text-gray-400 transition-transform duration-300 inline-block"
                :style="{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: sectionLabelStyle.fontSize }">
            ▾
          </span>
        </button>

        <Transition name="slide-down">
          <div v-if="showAdvanced" class="mt-3 space-y-3 bg-gray-800/40 rounded-xl p-4 border border-white/5">
            <!-- 速度滑块 -->
            <div>
              <label class="text-gray-300 text-sm mb-2 block">
                🐢 游戏速度：{{ customSpeed }}
              </label>
              <input
                type="range" min="80" max="400" step="20"
                v-model.number="customSpeed"
                class="w-full accent-blue-500"
              />
            </div>
            <!-- 普通得分 -->
            <div>
              <label class="text-gray-300 text-sm mb-2 block">
                🍎 普通目标分值：{{ customFoodScore }}
              </label>
              <input
                type="range" min="5" max="50" step="5"
                v-model.number="customFoodScore"
                class="w-full accent-green-500"
              />
            </div>
            <!-- 重置按钮 -->
            <div class="flex gap-2 pt-1">
              <button class="btn-sm-primary flex-1" @click="applyAdvancedConfig">✅ 应用配置</button>
              <button class="btn-sm-cancel flex-1" @click="resetAdvancedConfig">🔄 恢复默认</button>
            </div>
          </div>
        </Transition>
      </div>

    </div>

    <!-- ===== 底部操作栏 ===== -->
    <div class="flex-shrink-0 px-4 pb-4 pt-2 bottom-bar">
      <GameButton
        variant="primary"
        class="w-full"
        :fontSize="28"
        :paddingLeft="40"
        :paddingRight="40"
        :paddingTop="20"
        :paddingBottom="20"
        @click="startGame"
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
import type { Difficulty } from '@/stores/game'
import { useResponsiveUI, initUIParams } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'
import DifficultySelector from '@/components/ui/DifficultySelector.vue'

const router    = useRouter()
const route     = useRoute()
const gameStore = useGameStore()
const ui        = useResponsiveUI()

const selectedDifficulty = ref<Difficulty>('medium')
const showAdvanced = ref(false)

// 高级设置
const customSpeed      = ref(150)
const customFoodScore  = ref(10)
let customConfig: any  = null

// Toast
const showToast    = ref(false)
const toastMessage = ref('')
let toastTimer: number | null = null

function showToastMsg(msg: string) {
  toastMessage.value = msg
  showToast.value    = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { showToast.value = false }, 3000)
}

// ── 样式 ────────────────────────────────────────────────────────────────────

const containerStyle = computed(() => ({
  background: 'linear-gradient(160deg, #0f172a 0%, #1a2335 50%, #0f1f2e 100%)',
}))

const backBtnStyle = computed(() => ({
  width    : ui.getWidth(48),
  height   : ui.getWidth(48),
  minWidth : ui.getWidth(48),
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(42),
}))

const subtitleStyle = computed(() => ({
  fontSize: ui.getFontSize(16),
}))

const sectionStyle = computed(() => ({
  borderRadius: ui.getBorderRadius(16),
}))

const sectionLabelStyle = computed(() => ({
  fontSize: ui.getFontSize(18),
}))

// ── 操作 ────────────────────────────────────────────────────────────────────

function goBack() {
  router.push('/')
}

function applyAdvancedConfig() {
  customConfig = {
    speed          : customSpeed.value,
    normalFoodScore: customFoodScore.value,
  }
  showToastMsg('✅ 配置已应用！')
}

function resetAdvancedConfig() {
  customSpeed.value     = 150
  customFoodScore.value = 10
  customConfig          = null
  showToastMsg('🔄 配置已恢复默认值')
}

function startGame() {
  const themeId = route.query.theme_id as string || localStorage.getItem('current-theme-id') || ''

  if (themeId) localStorage.setItem('current-theme-id', themeId)

  // 写入难度到 store
  gameStore.setDifficulty(selectedDifficulty.value)

  // 写入自定义配置（或清空残留）
  gameStore.setCustomConfig(customConfig)

  router.push({
    path : '/game',
    query: { theme_id: themeId, difficulty: selectedDifficulty.value },
  })
}

// ── 生命周期 ──────────────────────────────────────────────────────────────
onMounted(() => {
  initUIParams(window.innerWidth, window.innerHeight)
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.35s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

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
.back-btn:hover { background: rgba(255, 255, 255, 0.2); transform: translateX(-2px); }
.back-btn:active { transform: translateX(0) scale(0.95); }

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.advanced-toggle {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

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
  max-height: 600px;
  transform: translateY(0);
}

.scroll-area::-webkit-scrollbar { width: 4px; }
.scroll-area::-webkit-scrollbar-track { background: transparent; }
.scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

.bottom-bar {
  border-top: 1px solid rgba(255,255,255,0.06);
  background: rgba(15,23,42,0.95);
  backdrop-filter: blur(12px);
}

.btn-sm-primary {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-sm-cancel {
  padding: 8px 16px;
  background: rgba(75, 85, 99, 0.5);
  color: white;
  border: 1px solid rgba(107, 114, 128, 0.4);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
</style>
