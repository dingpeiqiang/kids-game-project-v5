<template>
  <div class="game-container relative w-full h-screen overflow-hidden">
    <!-- 游戏画布容器 -->
    <div
      ref="gameContainer"
      class="game-canvas w-full h-full"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    ></div>

    <!-- 游戏 UI 覆盖层 - 顶栏：左分数右控制按钮 -->
    <div class="game-ui absolute top-2 left-0 right-0 flex justify-between items-start pointer-events-none px-4">
      <!-- 左侧：分数面板 -->
      <ScorePanel
        :score="score"
        :highScore="highScore"
        class="pointer-events-auto max-w-[180px]"
      />

      <!-- 右侧：控制按钮 -->
      <div class="flex gap-2 pointer-events-auto">
        <button
          @click="goHome"
          class="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-all"
          title="返回首页"
        >
          🏠
        </button>
        <button
          @click="toggleFullscreen"
          class="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-all"
          :title="isFullscreen ? '退出全屏' : '进入全屏'"
        >
          ⛶
        </button>
        <SoundToggle />
        <PauseButton
          :isPaused="isPaused"
          @click="togglePause"
        />
      </div>
    </div>

    <!-- 暂停覆盖层 -->
    <div
      v-if="isPaused"
      class="pause-overlay absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="text-center">
        <div class="text-5xl mb-4">⏸️</div>
        <div class="text-3xl font-bold text-white mb-6">游戏暂停</div>
        <GameButton @click="togglePause" variant="primary" :fontSize="20" :paddingLeft="32" :paddingRight="32" :paddingTop="14" :paddingBottom="14">
          继续游戏
        </GameButton>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="controls-hint text-center text-white/60 text-sm" style="padding-bottom: env(safe-area-inset-bottom);">
      <span class="hidden md:inline">使用 ← → 方向键移动，接住金币！</span>
      <span class="md:hidden">滑动屏幕控制方向</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ScorePanel from '@/components/ui/ScorePanel.vue'
import PauseButton from '@/components/ui/PauseButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { initGame, destroyGame, pauseGame, resumeGame } from '@/game'

const router = useRouter()

// 游戏状态
const gameContainer = ref<HTMLElement | null>(null)
const score = ref(0)
const highScore = ref(0)
const isPaused = ref(false)
const isFullscreen = ref(false)

// 触摸控制
let touchStartX = 0
let touchStartY = 0

// 保存 initGame 返回的 API
let gameAPI: ReturnType<typeof initGame> | null = null

// 初始化游戏
onMounted(() => {
  if (gameContainer.value) {
    gameAPI = initGame(gameContainer.value, {
      onScoreChange: (newScore: number) => {
        score.value = newScore
        // 更新最高分
        if (newScore > highScore.value) {
          highScore.value = newScore
        }
      },
      onGameOver: () => {
        // 跳转到独立的游戏结束页面
        setTimeout(() => {
          router.push({
            path: '/gameover',
            query: { score: String(score.value), highScore: String(highScore.value) }
          })
        }, 500)
      }
    })

    // 监听全屏变化
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // 触摸事件（阻止滚动）
    if (gameContainer.value) {
      gameContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    }
  }
})

// 销毁游戏
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (gameContainer.value) {
    gameContainer.value.removeEventListener('touchmove', handleTouchMove)
  }
  destroyGame()
})

// 暂停/继续
function togglePause() {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    pauseGame()
  } else {
    resumeGame()
  }
}

// 返回首页
function goHome() {
  destroyGame()
  router.push('/')
}

// 全屏切换
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('全屏失败:', err)
    })
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// 触摸控制
function handleTouchStart(event: TouchEvent) {
  touchStartX = event.touches[0].clientX
  touchStartY = event.touches[0].clientY
}

function handleTouchMove(event: TouchEvent) {
  event.preventDefault()
}

function handleTouchEnd(event: TouchEvent) {
  if (isPaused.value) return
  const touchEndX = event.changedTouches[0].clientX
  const touchEndY = event.changedTouches[0].clientY
  const dx = touchEndX - touchStartX
  const dy = touchEndY - touchStartY
  // 简单的滑动方向判断
  if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
    // 可以在这里扩展为向游戏发送方向指令
  }
}
</script>

<style scoped>
/* 基础容器 */
.game-container {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  width: 100%;
  height: 100%;
}

.game-canvas {
  width: 100%;
  height: 100%;
}

.game-ui {
  z-index: 10;
  background: transparent;
  min-height: 0;
}

.pause-overlay {
  z-index: 20;
  animation: fadeIn 0.2s ease;
}

.controls-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
