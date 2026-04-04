<template>
  <div class="relative w-full h-screen overflow-hidden" style="background:#0f1a12;">
    <!-- ═══ 加载界面 ═══ -->
    <Transition name="loading-fade">
      <div v-if="isLoading" class="loading-screen">
        <div class="loading-content">
          <!-- Logo -->
          <div class="loading-logo">
            <span class="logo-icon">🎖️</span>
            <span class="logo-text">坦克大战</span>
          </div>

          <!-- 进度条 -->
          <div class="progress-wrap">
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${loadingProgress}%` }"
              ></div>
            </div>
            <span class="progress-pct">{{ loadingProgress }}%</span>
          </div>

          <!-- 状态文字 -->
          <p class="status-text">{{ loadingStatus }}</p>

          <!-- 加载文件 -->
          <div v-if="currentLoadingFile" class="loading-file">
            📄 {{ currentLoadingFile }}
          </div>
        </div>
      </div>
    </Transition>

    <!-- 游戏画布容器 -->
    <div ref="gameContainer" :style="gameContainerStyle" class="absolute inset-0" style="z-index:0;"></div>

    <!-- ═══ HUD 顶栏 ═══ -->
    <Transition name="hud-slide">
      <div v-if="showUI && isPlaying" class="hud-bar">
        <div class="hud-inner">
          <!-- 返回 -->
          <button class="hud-icon" @click="confirmQuit" title="返回">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <!-- 得分 -->
          <div class="hud-chip">
            <span class="hud-label">分数</span>
            <span class="hud-value score-val">{{ score.toLocaleString() }}</span>
          </div>

          <!-- 关卡 -->
          <div class="hud-chip level-chip">
            <span class="hud-label">关卡</span>
            <span class="hud-value level-val">{{ level }} / 5</span>
          </div>

          <!-- 生命 -->
          <div class="hud-chip">
            <span class="hud-label">生命</span>
            <span class="hud-value lives-val">
              <template v-if="lives > 0">
                <span v-for="i in lives" :key="i" class="life-heart">❤️</span>
              </template>
              <span v-else class="life-dead">💀</span>
            </span>
          </div>

          <!-- 暂停 -->
          <button class="hud-icon" @click="togglePause" title="暂停 (P)">
            <span class="pause-icon">⏸</span>
          </button>

          <!-- 编辑器 -->
          <button class="hud-icon" @click="openEditor" title="地图编辑器">
            <span>🗺️</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- ═══ 暂停遮罩 ═══ -->
    <Transition name="overlay-fade">
      <div v-if="isPaused" class="pause-overlay">
        <div class="pause-modal">
          <div class="pause-icon-big">⏸️</div>
          <h3 class="pause-title">游戏暂停</h3>
          <p class="pause-score">当前分数：{{ score.toLocaleString() }}</p>
          <div class="pause-actions">
            <button class="action-btn action-primary" @click="togglePause">
              ▶️ 继续游戏
            </button>
            <button class="action-btn action-secondary" @click="restartGame">
              🔄 重新开始
            </button>
            <button class="action-btn action-danger" @click="quitGame">
              🚪 退出游戏
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ 退出确认弹窗 ═══ -->
    <Transition name="overlay-fade">
      <div v-if="showQuitConfirm" class="pause-overlay">
        <div class="pause-modal">
          <div class="pause-icon-big">⚠️</div>
          <h3 class="pause-title">确定退出？</h3>
          <p class="pause-score">当前进度不会保存</p>
          <div class="pause-actions">
            <button class="action-btn action-secondary" @click="showQuitConfirm = false">
              继续游戏
            </button>
            <button class="action-btn action-danger" @click="quitGame">
              确认退出
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Tiled 地图编辑器 -->
    <TiledEditor v-if="showEditor" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useConfigStore } from '@/stores/config'
import TankGameScene from '@/scenes/TankGameScene'
import TiledEditor from '@/components/TiledEditor.vue'

const router = useRouter()
const gameStore = useGameStore()
const configStore = useConfigStore()

const gameContainer = ref<HTMLDivElement | null>(null)
const showUI = ref(true)
const isPlaying = ref(false)
const isPaused = ref(false)
const showEditor = ref(false)
const showQuitConfirm = ref(false)

// ⭐ 加载状态
const isLoading = ref(true)
const loadingProgress = ref(0)
const loadingStatus = ref('正在初始化...')
const currentLoadingFile = ref('')

const score = ref(0)
const lives = ref(3)
const level = ref(1)

let game: any = null
let isUnmounted = false

// 用 visibility 而非 display:none 隐藏 canvas，避免 WebGL framebuffer 错误
const gameContainerStyle = computed(() => ({
  visibility: showEditor.value ? ('hidden' as const) : ('visible' as const),
  pointerEvents: showEditor.value ? ('none' as const) : ('auto' as const),
}))

onMounted(() => {
  isUnmounted = false
  initGame()
  window.addEventListener('tiled-editor-close', closeEditor)
})

onUnmounted(() => {
  isUnmounted = true
  showEditor.value = false
  showQuitConfirm.value = false
  if (game) {
    game.destroy(true)
    game = null
  }
  window.removeEventListener('tiled-editor-close', closeEditor)
})

const initGame = () => {
  if (!gameContainer.value) return

  const Phaser = (window as any).Phaser

  // 🔥 方案 1：固定分辨率 + 自动缩放（推荐）
  // 游戏逻辑尺寸永远固定，保证资源和碰撞检测准确
  const LOGICAL_WIDTH = 832   // 13 格 × 64px
  const LOGICAL_HEIGHT = 832
  
  console.log('🔧 [固定分辨率]', {
    '逻辑尺寸': `${LOGICAL_WIDTH}×${LOGICAL_HEIGHT}`,
    '容器尺寸': `${gameContainer.value.clientWidth}×${gameContainer.value.clientHeight}`,
    '每格大小': '64px (固定)'
  })
  
  const config: any = {
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: LOGICAL_WIDTH,    // ⭐ 固定 832px
    height: LOGICAL_HEIGHT,  // ⭐ 固定 832px
    backgroundColor: '#1a4d2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [TankGameScene],
    scale: {
      mode: Phaser.Scale.FIT,        // ⭐ 自动适配容器，保持宽高比
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  }

  game = new Phaser.Game(config)

  // ⭐ 轮询等待 Scene 就绪后设置事件监听
  let sceneReady = false
  const checkSceneReady = () => {
    if (sceneReady || isUnmounted) return

    const tankScene = game?.scene?.getScene('GameScene')
    if (tankScene && tankScene.events) {
      sceneReady = true

      // 加载开始
      tankScene.events.on('loadingStart', () => {
        loadingStatus.value = '开始加载资源...'
      })

      // 总进度更新
      tankScene.events.on('loadingProgress', (value: number) => {
        loadingProgress.value = Math.round(value * 100)
        if (value < 0.3) {
          loadingStatus.value = '加载图片资源...'
        } else if (value < 0.7) {
          loadingStatus.value = '加载音频资源...'
        } else if (value < 0.95) {
          loadingStatus.value = '初始化游戏场景...'
        } else {
          loadingStatus.value = '准备就绪...'
        }
      })

      // 当前加载文件
      tankScene.events.on('loadingFile', (fileKey: string) => {
        currentLoadingFile.value = fileKey
      })

      // 单个文件加载完成
      tankScene.events.on('loadingFileComplete', (_fileKey: string) => {
        currentLoadingFile.value = ''
      })

      // 加载完成
      tankScene.events.once('loadingComplete', () => {
        loadingStatus.value = '加载完成！'
        loadingProgress.value = 100

        // 延迟隐藏加载界面，让用户看到 100%
        setTimeout(() => {
          isLoading.value = false
          isPlaying.value = true
        }, 300)
      })
    } else {
      // 继续轮询
      setTimeout(checkSceneReady, 16)
    }
  }

  // 开始轮询
  checkSceneReady()

  // 监听游戏事件
  game.events.on('scoreUpdate', (newScore: number) => {
    score.value = newScore
  })

  game.events.on('lifeLost', (newLives: number) => {
    lives.value = Math.max(0, newLives)
  })

  game.events.on('levelComplete', (newLevel: number) => {
    level.value = newLevel
  })

  game.events.on('gameOver', () => {
    setTimeout(() => {
      router.push('/gameover')
    }, 1000)
  })
}

/** 安全获取场景（防止 getScene 返回 null 或场景未就绪） */
const getTankScene = (): any => {
  if (!game || isUnmounted) return null
  try {
    const scene = game.scene.getScene('GameScene')
    if (!scene || !scene.sys) return null
    // 场景还没初始化完成
    if (!scene.sys.game) return null
    return scene
  } catch {
    return null
  }
}

const togglePause = () => {
  if (isUnmounted) return
  const scene = getTankScene()
  if (!scene) return

  isPaused.value = !isPaused.value
  if (isPaused.value) {
    try { scene.scene.pause() } catch {}
  } else {
    try { scene.scene.resume() } catch {}
  }
}

const confirmQuit = () => {
  if (isUnmounted) return
  isPaused.value = true
  const scene = getTankScene()
  if (scene) {
    try { scene.scene.pause() } catch {}
  }
  showQuitConfirm.value = true
}

const restartGame = () => {
  if (isUnmounted) return
  gameStore.$patch({
    status: 'playing',
    score: 0,
    lives: 3,
    level: 1,
    isGameOver: false,
  })

  score.value = 0
  lives.value = 3
  level.value = 1
  isPaused.value = false

  const scene = getTankScene()
  if (scene) {
    scene.scene.restart()
  }
}

const quitGame = () => {
  if (isUnmounted) return
  if (game) {
    game.destroy(true)
    game = null
  }
  router.push('/')
}

const openEditor = () => {
  if (isUnmounted) return
  showEditor.value = true
  const scene = getTankScene()
  if (scene) {
    try { scene.scene.pause() } catch {}
  }
}

const closeEditor = () => {
  if (isUnmounted) return
  showEditor.value = false
  const scene = getTankScene()
  if (scene && isPlaying.value && !isPaused.value) {
    try { scene.scene.resume() } catch {}
  }
}
</script>

<style scoped>
/* ── HUD 顶栏 ─────────────────────────────── */
.hud-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 30;
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 80%, transparent 100%);
  pointer-events: none;
}
.hud-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 640px;
  margin: 0 auto;
  gap: 8px;
}
.hud-icon {
  pointer-events: auto;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
  flex-shrink: 0;
}
.hud-icon:hover {
  background: rgba(255,255,255,0.22);
  transform: scale(1.08);
}
.pause-icon { font-size: 14px; }

.hud-chip {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 3px 12px;
  min-width: 56px;
}
.hud-label {
  font-size: 10px;
  color: #9ca3af;
  letter-spacing: 0.5px;
}
.hud-value {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.score-val { color: #fbbf24; }
.level-val { color: #60a5fa; }

.lives-val {
  display: flex;
  gap: 2px;
  justify-content: center;
}
.life-heart { font-size: 14px; }
.life-dead  { font-size: 18px; }

/* ── 暂停 / 确认遮罩 ──────────────────────── */
.pause-overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pause-modal {
  background: linear-gradient(145deg, #1c2a1f 0%, #0f1a12 100%);
  border: 1px solid rgba(251,191,36,0.25);
  border-radius: 20px;
  padding: 2rem 2.25rem;
  width: 88%;
  max-width: 340px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
}
.pause-icon-big {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
.pause-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 0.25rem;
}
.pause-score {
  color: #9ca3af;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}
.pause-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.action-btn {
  width: 100%;
  padding: 12px 0;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
}
.action-btn:active {
  transform: scale(0.97);
}
.action-primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  box-shadow: 0 4px 14px rgba(34,197,94,0.3);
}
.action-primary:hover { box-shadow: 0 6px 20px rgba(34,197,94,0.45); }

.action-secondary {
  background: rgba(96,165,250,0.15);
  color: #93c5fd;
  border: 1px solid rgba(96,165,250,0.3);
}
.action-secondary:hover { background: rgba(96,165,250,0.25); }

.action-danger {
  background: rgba(239,68,68,0.12);
  color: #fca5a5;
  border: 1px solid rgba(239,68,68,0.25);
}
.action-danger:hover { background: rgba(239,68,68,0.22); }

/* ── 全局：确保 Phaser canvas 不会覆盖编辑器 ── */
:deep(canvas) {
  position: relative;
  z-index: 0 !important;
}

/* ── 过渡动画 ──────────────────────────────── */
.hud-slide-enter-active { transition: all 0.35s ease-out; }
.hud-slide-leave-active { transition: all 0.2s ease-in; }
.hud-slide-enter-from   { opacity: 0; transform: translateY(-16px); }
.hud-slide-leave-to     { opacity: 0; transform: translateY(-8px); }

.overlay-fade-enter-active { transition: opacity 0.25s ease; }
.overlay-fade-leave-active { transition: opacity 0.18s ease; }
.overlay-fade-enter-from   { opacity: 0; }
.overlay-fade-leave-to     { opacity: 0; }

/* ── 加载界面样式 ─────────────────────────── */
.loading-screen {
  position: absolute;
  inset: 0;
  z-index: 100;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #0f1a12 0%, #1a2e1f 40%, #0d1f15 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  max-width: 360px;
  width: 100%;
  padding: 2rem;
}

.loading-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 2.5rem;
}
.logo-icon { font-size: 2rem; }
.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 0.1em;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}
.progress-track {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 999px;
  transition: width 0.15s ease-out;
  box-shadow: 0 0 12px rgba(74,222,128,0.3);
}
.progress-pct {
  font-size: 0.8rem;
  font-weight: 700;
  color: #4ade80;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.status-text {
  font-size: 0.9rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.loading-file {
  font-size: 0.75rem;
  color: #6b7280;
  max-width: 280px;
  margin: 0 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-fade-enter-active { transition: opacity 0.4s ease-out; }
.loading-fade-leave-active { transition: opacity 0.3s ease-in; }
.loading-fade-enter-from   { opacity: 0; }
.loading-fade-leave-to     { opacity: 0; }
</style>
