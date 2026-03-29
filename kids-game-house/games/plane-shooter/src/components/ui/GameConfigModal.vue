<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 fade-in">
    <div class="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- 标题 -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400">
          ⚙️ 游戏配置
        </h2>
        <button @click="$emit('update:modelValue', false)" class="text-gray-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- 难度配置 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">🎯 难度设置</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="diff in difficulties"
            :key="diff.value"
            @click="config.difficulty = diff.value as 'easy' | 'normal' | 'hard' | 'extreme'"
            :class="[
              'px-4 py-3 rounded-xl font-medium transition-all',
              config.difficulty === diff.value
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            <div class="text-sm mb-1">{{ diff.label }}</div>
            <div class="text-xs opacity-75">{{ diff.speed }}px/s</div>
          </button>
        </div>
      </div>

      <!-- 游戏参数 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">🎮 游戏参数</h3>
        
        <div class="mb-4">
          <label class="block text-gray-300 text-sm mb-2">
            📏 初始长度：{{ config.initialLength }}
          </label>
          <input
            v-model.number="config.initialLength"
            type="range"
            min="3"
            max="10"
            step="1"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div class="mb-4">
          <label class="block text-gray-300 text-sm mb-2">
            ⚡ 速度：{{ config.speed }} px/s
          </label>
          <input
            v-model.number="config.speed"
            type="range"
            min="100"
            max="500"
            step="50"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div class="mb-4">
          <label class="block text-gray-300 text-sm mb-2">
            🔲 单元格：{{ config.cellSize }}px
          </label>
          <input
            v-model.number="config.cellSize"
            type="range"
            min="30"
            max="60"
            step="5"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <!-- 分数配置 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">🏆 分数设置</h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-gray-700 rounded-xl p-3">
            <label class="block text-gray-400 text-xs mb-1">普通</label>
            <input
              v-model.number="config.normalFoodScore"
              type="number"
              min="1"
              max="100"
              class="w-full bg-gray-600 text-white rounded px-2 py-1 text-center text-xs"
            />
          </div>
          <div class="bg-gray-700 rounded-xl p-3">
            <label class="block text-gray-400 text-xs mb-1">奖励</label>
            <input
              v-model.number="config.bonusFoodScore"
              type="number"
              min="10"
              max="200"
              class="w-full bg-gray-600 text-white rounded px-2 py-1 text-center text-xs"
            />
          </div>
          <div class="bg-gray-700 rounded-xl p-3">
            <label class="block text-gray-400 text-xs mb-1">特殊</label>
            <input
              v-model.number="config.specialFoodScore"
              type="number"
              min="50"
              max="500"
              class="w-full bg-gray-600 text-white rounded px-2 py-1 text-center text-xs"
            />
          </div>
        </div>
      </div>

      <!-- 高级选项 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">🔧 高级选项</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-gray-300">🔄 动态难度</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="config.enableDynamicDifficulty" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-300">⏸️ 自动暂停</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="config.autoPauseOnBlur" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-gray-300">✨ 粒子效果</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="config.enableParticles" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- 音频配置 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">🎵 音频设置</h3>
        
        <div class="mb-4">
          <label class="block text-gray-300 text-sm mb-2">
            🎼 BGM: {{ Math.round(config.bgmVolume * 100) }}%
          </label>
          <input
            v-model.number="config.bgmVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div class="mb-4">
          <label class="block text-gray-300 text-sm mb-2">
            🔊 SFX: {{ Math.round(config.sfxVolume * 100) }}%
          </label>
          <input
            v-model.number="config.sfxVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div class="flex items-center justify-between bg-gray-700 rounded-xl p-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🔇</span>
            <div>
              <div class="text-white font-medium">全局静音</div>
              <div class="text-gray-400 text-xs">关闭所有音频</div>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="config.muted" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3 pt-4 border-t border-gray-700">
        <button
          @click="resetToDefaults"
          class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition"
        >
          🔄 恢复默认
        </button>
        <button
          @click="applyConfig"
          class="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium transition shadow-lg"
        >
          ✅ 应用配置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface GameConfig {
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme'
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
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply', config: GameConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const difficulties = [
  { value: 'easy', label: '简单', speed: 150 },
  { value: 'normal', label: '普通', speed: 200 },
  { value: 'hard', label: '困难', speed: 300 },
  { value: 'extreme', label: '极限', speed: 400 }
]

const config = ref<GameConfig>({
  difficulty: 'normal',
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

const resetToDefaults = () => {
  config.value = {
    difficulty: 'normal',
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
}

const applyConfig = () => {
  emit('apply', config.value)
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // 可以在这里加载保存的配置
  }
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #10b981;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #059669;
  transform: scale(1.1);
}
</style>
