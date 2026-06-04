<template>
  <div class="w-full">
    <!-- 主题选择（可选显示） -->
    <div v-if="showThemeSelector" class="mb-4 p-4 bg-gray-700/40 rounded-xl border border-white/5">
      <h3 class="text-sm font-semibold text-gray-300 mb-3">🎨 主题配置</h3>
      <ThemeSelector :modelValue="selectedThemeId" @update:modelValue="handleThemeChange" />
    </div>
    
    <!-- 难度选择（可选显示） -->
    <div v-if="showDifficultySelector" class="mb-4 p-4 bg-gray-700/40 rounded-xl border border-white/5">
      <h3 class="text-sm font-semibold text-gray-300 mb-3">🎯 难度设置</h3>
      <DifficultySelector 
        :modelValue="config.difficulty" 
        @update:modelValue="(val) => config.difficulty = val"
        :uiScale="uiScale"
      />
    </div>
    
    <!-- ⭐ 详细设置区域（默认折叠） -->
    <template v-if="showDetailedSettings">
    <!-- 使用响应式网格布局，自动横向排列 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
      <!-- 游戏参数 -->
      <div class="p-2.5 bg-gray-700/40 rounded-xl border border-white/5">
        <h3 class="text-xs font-semibold text-gray-300 mb-2">🎮 游戏参数</h3>
        
        <!-- 蛇初始长度 -->
        <div class="mb-2">
          <label class="block text-gray-400 text-[11px] mb-1">
            📏 长度：{{ config.initialLength }}
          </label>
          <input
            v-model.number="config.initialLength"
            type="range"
            min="3"
            max="10"
            step="1"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <!-- 移动速度 -->
        <div class="mb-2">
          <label class="block text-gray-400 text-[11px] mb-1">
            ⚡ 速度：{{ config.speed }}px/s
          </label>
          <input
            v-model.number="config.speed"
            type="range"
            min="100"
            max="500"
            step="50"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <!-- 单元格大小 -->
        <div>
          <label class="block text-gray-400 text-[11px] mb-1">
            🔲 格子：{{ config.cellSize }}px
          </label>
          <input
            v-model.number="config.cellSize"
            type="range"
            min="30"
            max="60"
            step="5"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <!-- 音频设置 -->
      <div class="p-2.5 bg-gray-700/40 rounded-xl border border-white/5">
        <h3 class="text-xs font-semibold text-gray-300 mb-2">🎵 音频设置</h3>
        
        <!-- 背景音乐音量 -->
        <div class="mb-2">
          <label class="block text-gray-400 text-[11px] mb-1">
            🎼 BGM：{{ Math.round(config.bgmVolume * 100) }}%
          </label>
          <input
            v-model.number="config.bgmVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <!-- 游戏音效音量 -->
        <div class="mb-2">
          <label class="block text-gray-400 text-[11px] mb-1">
            🔊 SFX：{{ Math.round(config.sfxVolume * 100) }}%
          </label>
          <input
            v-model.number="config.sfxVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <!-- 全局静音 -->
        <div class="flex items-center justify-between">
          <span class="text-gray-400 text-[11px]">🔇 静音</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="config.muted"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-7 h-3.5 bg-gray-600 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>

      <!-- 分数配置 -->
      <div class="p-2.5 bg-gray-700/40 rounded-xl border border-white/5">
        <h3 class="text-xs font-semibold text-gray-300 mb-2">🏆 分数配置</h3>
        <div class="grid grid-cols-3 gap-1.5">
          <div>
            <label class="block text-gray-500 text-[10px] mb-0.5 text-center">普通</label>
            <input
              v-model.number="config.normalFoodScore"
              type="number"
              min="1"
              max="100"
              class="w-full bg-gray-600/50 text-white rounded px-1.5 py-1 text-center text-xs"
            />
          </div>
          <div>
            <label class="block text-gray-500 text-[10px] mb-0.5 text-center">奖励</label>
            <input
              v-model.number="config.bonusFoodScore"
              type="number"
              min="10"
              max="200"
              class="w-full bg-gray-600/50 text-white rounded px-1.5 py-1 text-center text-xs"
            />
          </div>
          <div>
            <label class="block text-gray-500 text-[10px] mb-0.5 text-center">特殊</label>
            <input
              v-model.number="config.specialFoodScore"
              type="number"
              min="50"
              max="500"
              class="w-full bg-gray-600/50 text-white rounded px-1.5 py-1 text-center text-xs"
            />
          </div>
        </div>
      </div>

      <!-- 高级选项 -->
      <div class="p-2.5 bg-gray-700/40 rounded-xl border border-white/5">
        <h3 class="text-xs font-semibold text-gray-300 mb-2">🔧 高级选项</h3>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-gray-400 text-[11px]">🔄 动态难度</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="config.enableDynamicDifficulty"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-7 h-3.5 bg-gray-600 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-400 text-[11px]">⏸️ 自动暂停</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="config.autoPauseOnBlur"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-7 h-3.5 bg-gray-600 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-400 text-[11px]">✨ 粒子效果</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="config.enableParticles"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-7 h-3.5 bg-gray-600 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- 操作按钮 -->
    <div class="flex gap-3 pt-3 border-t border-white/8">
      <button
        @click="resetToDefaults"
        class="flex-1 px-4 py-2.5 bg-gray-700/70 hover:bg-gray-600/70 text-gray-300 rounded-xl text-sm font-medium transition border border-white/5"
      >
        🔄 恢复默认
      </button>
      <button
        @click="saveConfig"
        class="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-green-500/20"
      >
        ✅ 保存配置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Difficulty } from '@/types/game'
import ThemeSelector from './ThemeSelector.vue'
import DifficultySelector from './DifficultySelector.vue'

interface GameConfig {
  difficulty: Difficulty
  initialLength: number
  speed: number
  cellSize: number
  normalFoodScore: number
  bonusFoodScore: number
  specialFoodScore: number
  enableDynamicDifficulty: boolean
  autoPauseOnBlur: boolean
  enableParticles: boolean
  bgmVolume: number
  sfxVolume: number
  muted: boolean
}

interface Props {
  modelValue?: boolean
  showThemeSelector?: boolean
  showDifficultySelector?: boolean
  uiScale?: number
  defaultCollapsed?: boolean     // ⭐ 默认折叠其他设置（仅显示难度）
}

interface Emits {
  (e: 'save', config: GameConfig): void
  (e: 'themeChange', themeId: string): void
  (e: 'reset'): void  // ⭐ 新增重置事件
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  showThemeSelector: true,
  showDifficultySelector: true,
  uiScale: 1,
  defaultCollapsed: false  // ⭐ 默认展开所有设置
})

const emit = defineEmits<Emits>()

// ⭐ 是否显示详细设置（通过 v-if 控制渲染）
const showDetailedSettings = ref(!props.defaultCollapsed)

// 当前选中的主题 ID
const selectedThemeId = ref<string>('')

// 游戏配置（使用默认值，不从 localStorage 加载）
const config = ref<GameConfig>({
  difficulty: 'medium' as Difficulty,  // 使用标准难度
  initialLength: 4,
  speed: 200,
  cellSize: 40,
  normalFoodScore: 10,
  bonusFoodScore: 50,
  specialFoodScore: 100,
  enableDynamicDifficulty: true,
  autoPauseOnBlur: true,
  enableParticles: true,
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  muted: false
})

// ⭐ 临时配置（仅在当前游戏实例有效，不保存到 localStorage）
const tempConfig = ref<GameConfig | null>(null)

// 加载配置（优先使用临时配置，否则使用默认值）
const loadConfig = () => {
  if (tempConfig.value) {
    // 使用临时配置（当前游戏实例）
    config.value = { ...config.value, ...tempConfig.value }
    console.log('📥 使用当前游戏实例的临时配置')
  } else {
    console.log('📥 使用默认配置（不加载 localStorage）')
  }
}

// 处理主题变化
const handleThemeChange = (themeId: string) => {
  selectedThemeId.value = themeId
  emit('themeChange', themeId)
}

// ⭐ 保存配置（仅在当前游戏实例有效，不保存到 localStorage）
const saveConfig = () => {
  // 验证配置数据
  const validatedConfig = validateGameConfig(config.value)
  
  // ⭐ 仅保存到临时变量，不写入 localStorage
  tempConfig.value = validatedConfig
  
  console.log('✅ 配置已保存（仅当前游戏实例有效）:', validatedConfig)
  emit('save', validatedConfig)
}

// ⭐ 切换详细设置的显示/隐藏
const toggleDetailedSettings = () => {
  showDetailedSettings.value = !showDetailedSettings.value
  console.log(showDetailedSettings.value ? '✅ 展开详细设置' : '✅ 收起详细设置')
}

// ⭐ 暴露方法给父组件
defineExpose({
  toggleDetailedSettings
})

// 恢复默认配置
const resetToDefaults = () => {
  config.value = {
    difficulty: 'medium' as Difficulty,  // 使用标准难度
    initialLength: 4,
    speed: 200,
    cellSize: 40,
    normalFoodScore: 10,
    bonusFoodScore: 50,
    specialFoodScore: 100,
    enableDynamicDifficulty: true,
    autoPauseOnBlur: true,
    enableParticles: true,
    bgmVolume: 0.7,
    sfxVolume: 0.8,
    muted: false
  }
  // ⭐ 添加用户可见的提示
  emit('reset')
}

// 验证配置数据
const validateGameConfig = (cfg: any): GameConfig => {
  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max)
  }
  
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard']
  
  const validated: GameConfig = {
    difficulty: validDifficulties.includes(cfg.difficulty) 
      ? cfg.difficulty 
      : ('medium' as Difficulty),
    initialLength: clamp(cfg.initialLength, 3, 10),
    speed: clamp(cfg.speed, 100, 500),
    cellSize: clamp(cfg.cellSize, 30, 60),
    normalFoodScore: clamp(cfg.normalFoodScore, 1, 100),
    bonusFoodScore: clamp(cfg.bonusFoodScore, 10, 200),
    specialFoodScore: clamp(cfg.specialFoodScore, 50, 500),
    enableDynamicDifficulty: Boolean(cfg.enableDynamicDifficulty),
    autoPauseOnBlur: Boolean(cfg.autoPauseOnBlur),
    enableParticles: Boolean(cfg.enableParticles),
    bgmVolume: clamp(cfg.bgmVolume, 0, 1),
    sfxVolume: clamp(cfg.sfxVolume, 0, 1),
    muted: Boolean(cfg.muted)
  }
  
  return validated
}

// 初始化时加载配置（使用默认值，不从 localStorage 加载）
loadConfig()
</script>

<style scoped>
/* 自定义滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #10b981;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #059669;
  transform: scale(1.1);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #10b981;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

input[type="range"]::-moz-range-thumb:hover {
  background: #059669;
  transform: scale(1.1);
}
</style>
