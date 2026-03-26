<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4 fade-in overflow-y-auto" :style="containerStyle">
    <div class="text-center mb-8" :style="titleContainerStyle">
      <h1 class="animate-bounce" :style="plantEmojiStyle">🌻</h1>
      <h2 class="font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400" :style="titleStyle">
        植物保卫战
      </h2>
      <p class="text-gray-400 mt-4" :style="subtitleStyle">儿童益智塔防小游戏</p>
    </div>

    <div class="bg-gray-800/60 rounded-2xl backdrop-blur mb-8" :style="scoreCardStyle">
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
    </div>

    <!-- 开始按钮 -->
    <GameButton
      variant="primary"
      @click="startGame"
      :disabled="isChecking"
      class="mb-4"
      :style="buttonStyle"
    >
      {{ isChecking ? '🔍 检查资源中...' : '🎮 开始游戏' }}
    </GameButton>

    <div class="mt-8 flex gap-4 items-center">
      <SoundToggle />
      <ThemeSelector />
    </div>

    <div class="mt-8 text-center text-gray-400" :style="instructionStyle">
      <p>🌻 种植向日葵生产阳光</p>
      <p>🌱 种植豌豆射手攻击僵尸</p>
      <p>🧟 阻止僵尸到达左侧！</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useThemeStore } from '@/stores/theme'
import { useResponsiveUI } from '@/utils/uiResponsive'
import { loadAndValidateGameResources, PVA_GAME_REQUIREMENTS } from '@/utils/gameResourceValidator'
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'

const router = useRouter()
const gameStore = useGameStore()
const themeStore = useThemeStore()
const audioStore = useAudioStore()
const ui = useResponsiveUI()

// ⭐ 检查中状态
const isChecking = ref(false)
const checkError = ref<string | null>(null)

const highScore = computed(() => gameStore.highScore)
const playCount = computed(() => gameStore.playCount)

const containerStyle = computed(() => ({
  paddingTop: ui.getPadding(32),
  paddingBottom: ui.getPadding(32)
}))

const titleContainerStyle = computed(() => ({
  marginBottom: ui.getGap(32)
}))

const plantEmojiStyle = computed(() => ({
  fontSize: ui.getFontSize(96),
  marginBottom: ui.getGap(16)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(48),
}))

const subtitleStyle = computed(() => ({
  fontSize: ui.getFontSize(18),
  marginTop: ui.getGap(16)
}))

const scoreCardStyle = computed(() => ({
  padding: ui.getPadding(24),
  marginBottom: ui.getGap(32)
}))

const trophyIconStyle = computed(() => ({
  fontSize: ui.getFontSize(40)
}))

const labelStyle = computed(() => ({
  fontSize: ui.getFontSize(14)
}))

const scoreNumberStyle = computed(() => ({
  fontSize: ui.getFontSize(36),
  fontWeight: 'bold'
}))

const buttonStyle = computed(() => ({
  fontSize: ui.getFontSize(20),
  paddingLeft: ui.getPadding(48),
  paddingRight: ui.getPadding(48),
  paddingTop: ui.getPadding(24),
  paddingBottom: ui.getPadding(24)
}))

const instructionStyle = computed(() => ({
  fontSize: ui.getFontSize(14),
  marginTop: ui.getGap(32)
}))

/**
 * ⭐ 开始游戏（带资源检查）
 */
const startGame = async () => {
  // 如果正在检查，防止重复点击
  if (isChecking.value) {
    return
  }

  isChecking.value = true
  checkError.value = null

  try {
    audioStore.initAudio()
    audioStore.startBGM('start')

    // 获取当前选择的主题 ID
    const themeId = themeStore.currentThemeId
    console.log('🎨 使用主题 ID:', themeId)

    // ❌ 如果没有选择主题，直接报错
    if (!themeId) {
      console.log('❌ 未选择主题，拒绝启动')
      alert('请先选择一个游戏主题，然后再开始游戏。\n\n点击页面右上角的主题切换按钮来选择主题。')
      isChecking.value = false
      return
    }

    // ⭐ 进行主题资源检查
    console.log('🔍 开始检查主题资源...')

    const checkResult = await loadAndValidateGameResources(themeId, PVA_GAME_REQUIREMENTS)

    if (!checkResult.passed) {
      // 资源检查失败，显示错误提示
      const missingList = checkResult.missingResources.join('\n  • ')
      const errorMessage = `主题 "${checkResult.themeInfo?.themeName}" 缺少游戏运行必需的资源:\n\n  • ${missingList}\n\n请选择包含完整资源的主题。`

      // 显示友好的错误提示
      alert(errorMessage)

      isChecking.value = false
      return
    }

    console.log('✅ 主题资源检查通过')

    // 跳转到难度选择页面（带上 theme_id 参数）
    router.push({
      path: '/difficulty',
      query: { theme_id: themeId }
    })
  } catch (error: any) {
    console.error('❌ 游戏启动失败:', error)

    // 显示错误提示
    const errorMessage = error.message || '游戏启动失败，请重试'
    alert(`启动失败: ${errorMessage}`)

    isChecking.value = false
  }
}

onMounted(() => {
  console.log('StartView mounted, UI scale:', ui.uiScale)
})
</script>
