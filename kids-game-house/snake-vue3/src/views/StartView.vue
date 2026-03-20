<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4 fade-in" :style="containerStyle">
    <!-- 标题 -->
    <div class="text-center mb-8" :style="titleContainerStyle">
      <h1 class="animate-bounce" :style="snakeEmojiStyle">🐍</h1>
      <h2 class="font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400" :style="titleStyle">
        快乐贪吃蛇
      </h2>
      <p class="text-gray-400 mt-4" :style="subtitleStyle">儿童益智小游戏</p>
    </div>

    <!-- 最高分展示 -->
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

    <!-- 音效开关 -->
    <div class="mt-6 flex items-center justify-center gap-6">
      <SoundToggle />
      <ThemeSelector />
    </div>

    <!-- 操作说明 -->
    <div class="mt-8 text-center text-gray-400" :style="instructionStyle">
      <p>💡 键盘方向键 / WASD 控制方向</p>
      <p>📱 手机滑动屏幕控制方向</p>
    </div>

    <!-- 资源检测 Loading 弹窗 -->
    <div v-if="showCheckModal" class="check-overlay">
      <div class="check-modal">
        <div class="check-icon">🔍</div>
        <h3 class="check-title">正在检测游戏资源</h3>
        
        <!-- 进度条 -->
        <div class="check-progress">
          <div class="progress-bar" :style="{ width: checkProgress + '%' }"></div>
        </div>

        <!-- 检测步骤 -->
        <div class="check-steps">
          <div class="step" :class="{ active: checkStep >= 1, completed: checkStep > 1 }">
            <span class="step-icon">{{ checkStep > 1 ? '✓' : '1' }}</span>
            <span class="step-text">验证登录</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 2, completed: checkStep > 2 }">
            <span class="step-icon">{{ checkStep > 2 ? '✓' : '2' }}</span>
            <span class="step-text">初始化音频</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 3, completed: checkStep > 3 }">
            <span class="step-icon">{{ checkStep > 3 ? '✓' : '3' }}</span>
            <span class="step-text">加载主题</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 4, completed: checkStep > 4 }">
            <span class="step-icon">{{ checkStep > 4 ? '✓' : '4' }}</span>
            <span class="step-text">资源完整性检查</span>
          </div>
          <div class="step" :class="{ active: checkStep >= 5 }">
            <span class="step-icon">5</span>
            <span class="step-text">启动游戏</span>
          </div>
        </div>

        <!-- 实时检测状态 -->
        <div class="check-status">
          <p class="status-text">{{ statusText }}</p>
        </div>

        <p class="check-hint">请稍候，正在为您准备最佳游戏体验...</p>
      </div>
    </div>

    <!-- 错误提示弹窗 -->
    <div v-if="showErrorModal" class="error-overlay" @click="showErrorModal = false">
      <div class="error-modal" @click.stop>
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">资源检查失败</h3>
        <p class="error-message">{{ checkError }}</p>
        <button class="error-btn" @click="showErrorModal = false">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import { useResponsiveUI } from '@/utils/uiResponsive'
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'
import { validateGTRSTheme, type ValidationResult } from '@/utils/gtrs-validator'

const router = useRouter()
const gameStore = useGameStore()
const themeStore = useThemeStore()
const ui = useResponsiveUI()

// ⭐ 检查中状态
const isChecking = ref(false)
const checkError = ref<string | null>(null)
const showCheckModal = ref(false)
const showErrorModal = ref(false)
const checkProgress = ref(0)
const checkStep = ref(0)
const statusText = ref('准备检测...')

const highScore = computed(() => gameStore.highScore)
const playCount = computed(() => gameStore.playCount)

// 动态样式计算
const containerStyle = computed(() => ({
  paddingTop: ui.getPadding(32),
  paddingBottom: ui.getPadding(32)
}))

const titleContainerStyle = computed(() => ({
  marginBottom: ui.getGap(32)
}))

const snakeEmojiStyle = computed(() => ({
  fontSize: ui.getFontSize(96),  // 对应 text-6xl ~ text-8xl
  marginBottom: ui.getGap(16)
}))

const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(48),  // 对应 text-4xl ~ text-6xl
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
 * ⭐ 将主题配置转换为 GTRS JSON 格式用于校验
 * @param themeConfig 主题配置对象
 * @returns GTRS 格式的 JSON 字符串
 */
const buildGTRSThemeJson = (themeConfig: any): string => {
  // 从主题配置中提取资源信息，构建符合 GTRS 规范的 JSON
  const gtrsTheme = {
    specMeta: {
      specName: 'GTRS' as const,
      specVersion: '1.0.0',
      compatibleVersion: '1.0.0'
    },
    themeInfo: {
      themeId: themeConfig.id || 'default',
      gameId: 'snake',
      themeName: themeConfig.name || '默认主题',
      isDefault: !themeConfig.customTheme,
      author: themeConfig.author || 'System',
      description: themeConfig.description || ''
    },
    globalStyle: {
      primaryColor: themeConfig.colors?.primary || '#4ade80',
      secondaryColor: themeConfig.colors?.secondary || '#22c55e',
      bgColor: themeConfig.colors?.background || '#1e293b',
      textColor: themeConfig.colors?.text || '#ffffff',
      fontFamily: themeConfig.fontFamily || 'Arial',
      borderRadius: themeConfig.effects?.borderRadius || '8px'
    },
    resources: {
      images: {
        login: {},
        // ⭐ 游戏场景资源：必须使用真实图片路径（给 Phaser 用）
        scene: {
          food_apple: {
            src: '/games/snake-vue3/themes/default/images/scene/food_apple.png',
            type: 'png' as const,
            alias: '苹果'
          },
          food_banana: {
            src: '/games/snake-vue3/themes/default/images/scene/food_banana.png',
            type: 'png' as const,
            alias: '香蕉'
          },
          food_cherry: {
            src: '/games/snake-vue3/themes/default/images/scene/food_cherry.png',
            type: 'png' as const,
            alias: '樱桃'
          },
          snake_head: {
            src: '/games/snake-vue3/themes/default/images/scene/snake_head.png',
            type: 'png' as const,
            alias: '蛇头'
          },
          snake_body: {
            src: '/games/snake-vue3/themes/default/images/scene/snake_body.png',
            type: 'png' as const,
            alias: '蛇身'
          },
          snake_tail: {
            src: '/games/snake-vue3/themes/default/images/scene/snake_tail.png',
            type: 'png' as const,
            alias: '蛇尾'
          },
          obstacle_rock: {
            src: '/games/snake-vue3/themes/default/images/scene/obstacle_rock.png',
            type: 'png' as const,
            alias: '石头障碍物'
          },
          obstacle_wall: {
            src: '/games/snake-vue3/themes/default/images/scene/obstacle_wall.png',
            type: 'png' as const,
            alias: '墙壁障碍物'
          },
          scene_bg_grid: {
            src: '/games/snake-vue3/themes/default/images/scene/grid.png',
            type: 'png' as const,
            alias: '网格背景'
          },
          scene_bg_main: {
            src: '/games/snake-vue3/themes/default/images/scene/background.png',
            type: 'png' as const,
            alias: '游戏主背景'
          }
        },
        // ⭐ UI 资源：可以使用颜色值（给 Vue 组件用）
        ui: {
          button: {
            src: themeConfig.colors?.primary || '#4ade80',
            type: 'png' as const,
            alias: '按钮背景色'
          },
          panel: {
            src: themeConfig.colors?.background || 'rgba(26, 26, 46, 0.9)',
            type: 'png' as const,
            alias: '面板背景色'
          }
        },
        // ⭐ 图标资源：使用真实图片或 emoji
        icon: {
          snakeHead: {
            src: themeConfig.assets?.snakeHead?.type === 'image' 
              ? themeConfig.assets?.snakeHead?.value 
              : '/games/snake-vue3/themes/default/images/scene/snake_head.png',
            type: 'png' as const,
            alias: '蛇头图标'
          }
        },
        effect: {}
      },
      audio: {
        bgm: {
          main: {
            src: themeConfig.audio?.bgm?.src || '',
            type: 'mp3' as const,
            volume: themeConfig.audio?.bgm?.volume || 0.5,
            alias: '主背景音乐'
          }
        },
        effect: {
          eat: {
            src: themeConfig.audio?.eat?.src || '',
            type: 'mp3' as const,
            volume: themeConfig.audio?.eat?.volume || 0.3,
            alias: '吃东西音效'
          },
          gameOver: {
            src: themeConfig.audio?.gameOver?.src || '',
            type: 'mp3' as const,
            volume: themeConfig.audio?.gameOver?.volume || 0.4,
            alias: '游戏结束音效'
          }
        },
        voice: {}
      },
      video: {}
    }
  }

  return JSON.stringify(gtrsTheme)
}

/**
 * ⭐ 开始游戏
 */
const startGame = async () => {
  // 如果正在检查，防止重复点击
  if (isChecking.value) {
    console.log('⏳ 正在检查中，忽略点击')
    return
  }

  console.log('🎮 开始游戏按钮被点击')

  isChecking.value = true
  checkError.value = null
  showCheckModal.value = true
  showErrorModal.value = false
  checkProgress.value = 0
  checkStep.value = 0
  statusText.value = '开始检测...'

  console.log('✅ Loading 弹窗已显示:', showCheckModal.value)

  try {
    // 获取当前选择的主题 ID
    const themeId = themeStore.currentThemeId
    console.log('🎨 使用主题 ID:', themeId)

    // ⭐ 开始完整的游戏检测流程

    // 步骤 1：检查用户登录状态
    checkStep.value = 1
    checkProgress.value = 10
    statusText.value = '验证用户登录状态...'
    const token = localStorage.getItem('token')
    if (!token) {
      showCheckModal.value = false
      checkError.value = '用户未登录，请先登录后再开始游戏'
      showErrorModal.value = true
      isChecking.value = false
      return
    }
    console.log('✅ 用户已登录')
    statusText.value = '✅ 登录验证通过'
    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 2：初始化音频系统（由 Phaser 游戏接管）
    checkStep.value = 2
    checkProgress.value = 25
    statusText.value = '准备音频系统...'
    try {
      // 不再直接初始化 AudioContext，由 Phaser 游戏统一管理
      console.log('✅ 音频系统将由 Phaser 游戏统一管理')
      statusText.value = '✅ 音频系统已就绪'
    } catch (error: any) {
      console.warn('⚠️ 音频准备失败:', error.message)
      statusText.value = '⚠️ 音频准备失败（不影响游戏）'
      // 音频失败不阻断游戏，继续
    }
    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 3：加载主题并进行严格的 GTRS 资源校验
    checkStep.value = 3
    checkProgress.value = 45
    statusText.value = '进行 GTRS 严格校验...'

    if (!themeId) {
      // 没有主题时使用默认
      console.log('❌ 未选择主题，使用默认主题')
      statusText.value = '✅ 使用默认主题'
    } else {
      // ⭐ GTRS 主题资源严格完整性校验（使用 Ajv Schema）
      try {
        // 从 themeStore 获取当前主题的完整配置
        const currentTheme = themeStore.currentTheme
        console.log('🔍 开始 GTRS 严格校验:', currentTheme.name)
        statusText.value = '正在转换主题为 GTRS 格式...'
        
        // 将主题配置转换为 GTRS JSON 格式
        const themeJson = buildGTRSThemeJson(currentTheme)
        
        console.log('📋 GTRS JSON 生成完成，开始 Schema 校验...')
        statusText.value = '正在进行 Schema 严格校验...'
        
        // 使用 Ajv 进行完整的 Schema 校验
        const validationResult: ValidationResult = validateGTRSTheme(themeJson)
        
        if (!validationResult.valid) {
          console.error('❌ GTRS 严格校验失败:', validationResult.message)
          console.error('详细错误:', validationResult.errors)
          
          // 严格模式：显示详细错误信息
          const errorDetails = validationResult.errors?.map(e => 
            `• ${e.path}: ${e.message}`
          ).join('\n') || validationResult.message
          
          throw new Error(`GTRS 严格校验失败:\n\n${errorDetails}`)
        }
        
        console.log('✅ GTRS 严格校验通过:', validationResult.message)
        console.log('📊 校验详情:', {
          themeName: currentTheme.name,
          themeId: currentTheme.id,
          jsonLength: themeJson.length,
          validationMessage: validationResult.message
        })
        
        statusText.value = '✅ GTRS 严格校验通过'
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        console.error('❌ GTRS 严格校验异常:', error)
        
        // 严格模式：校验失败时阻断游戏，显示详细错误
        showCheckModal.value = false
        checkError.value = `主题资源不符合 GTRS v1.0.0 规范\n\n${error.message}`
        showErrorModal.value = true
        isChecking.value = false
        return // 阻断游戏启动
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200))

    // 步骤 4：启动游戏引擎，准备就绪
    checkStep.value = 4
    checkProgress.value = 85
    statusText.value = '启动游戏引擎...'
    
    try {
      // 不再在这里播放 BGM，由 Phaser 游戏统一管理音频
      console.log('✅ 音频将由 Phaser 游戏统一控制')
      statusText.value = '✅ 游戏引擎就绪'
    } catch (error: any) {
      console.warn('⚠️ 游戏引擎启动失败:', error.message)
      statusText.value = '⚠️ 游戏引擎启动失败（不影响游戏）'
    }

    checkProgress.value = 100
    console.log('✅ 所有检测通过，准备开始游戏')
    statusText.value = '✅ 检测完成，即将进入游戏'
    
    await new Promise(resolve => setTimeout(resolve, 500))

    // 关闭 loading 弹窗
    showCheckModal.value = false

    // 跳转到难度选择页面（带上 theme_id 参数）
    router.push({
      path: '/difficulty',
      query: { theme_id: themeId }
    })
  } catch (error: any) {
    console.error('❌ 游戏启动失败:', error)

    // 显示错误提示
    const errorMessage = error.message || '游戏启动失败，请重试'

    // 关闭 loading 弹窗，显示错误弹窗
    showCheckModal.value = false
    checkError.value = errorMessage
    showErrorModal.value = true

    isChecking.value = false
  }
}

onMounted(() => {
  // 确保 UI 已经初始化
  console.log('StartView mounted, UI scale:', ui.uiScale)
})
</script>

<style scoped>
/* 资源检测 Loading 弹窗 */
.check-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.check-modal {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 24px;
  padding: 2.5rem 3rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.5);
  animation: modalSlideUp 0.4s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.check-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  animation: bounce 1.2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.check-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0 0 1.5rem 0;
}

.check-progress {
  width: 100%;
  height: 10px;
  background: #374151;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%);
  background-size: 200% 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.check-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.3;
  transition: all 0.3s;
}

.step.active {
  opacity: 1;
}

.step.completed {
  opacity: 1;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4b5563;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.step.active .step-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  animation: pulse 1s ease-in-out infinite;
}

.step.completed .step-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.step-text {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

.step.active .step-text {
  color: #10b981;
  font-weight: 600;
}

.step.completed .step-text {
  color: #3b82f6;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.check-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* 实时检测状态框 */
.check-status {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  animation: pulseBorder 2s ease-in-out infinite;
}

@keyframes pulseBorder {
  0%, 100% { border-color: rgba(16, 185, 129, 0.3); }
  50% { border-color: rgba(16, 185, 129, 0.6); }
}

.status-text {
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 600;
  text-align: center;
  margin: 0;
  min-height: 1.25rem;
  transition: all 0.3s ease;
}

/* 错误提示弹窗 */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;
}

.error-modal {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 24px;
  padding: 2rem 2.5rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(239, 68, 68, 0.3);
  animation: modalSlideUp 0.4s ease-out;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f87171;
  margin: 0 0 1rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: #d1d5db;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  white-space: pre-line;
}

.error-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.error-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* 响应式 */
@media (max-width: 640px) {
  .check-modal {
    padding: 2rem 1.5rem;
  }

  .check-icon {
    font-size: 2.5rem;
  }

  .check-title {
    font-size: 1.25rem;
  }

  .check-steps {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .step {
    flex-direction: row;
    gap: 0.75rem;
  }

  .step-icon {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .step-text {
    font-size: 0.875rem;
  }

  .check-status {
    padding: 0.5rem 0.75rem;
  }

  .status-text {
    font-size: 0.75rem;
  }
}
</style>
