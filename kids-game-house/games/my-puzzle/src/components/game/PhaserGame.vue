<script setup lang="ts">
/**
 * Phaser 游戏容器组件
 *
 * 职责：
 * 1. 创建 Phaser.Game 实例并管理其生命周期
 * 2. 接收 Phaser 场景事件，转发给 Vue 父组件
 * 3. 提供暂停/恢复方法给外部调用
 */
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import { useAudioStore } from '@/stores/audio'
import GameScene from '@/scenes/GameScene'

const emit = defineEmits<{
  ready: []
  'game-over': [score: number]
  'score-update': [score: number]
  paused: []
  resumed: []
}>()

const gameStore = useGameStore()
const themeStore = useThemeStore()
const audioStore = useAudioStore()

const gameContainer = ref<HTMLDivElement | null>(null)
let phaserGame: Phaser.Game | null = null

// ─── 初始化游戏 ───────────────────────────────────────────────

async function initGame(): Promise<void> {
  if (!gameContainer.value) return

  // 可选：加载主题音频
  const bgmSrc = themeStore.getAudioUrl('bgm_main', 'bgm')
  if (bgmSrc && gameStore.settings?.musicEnabled !== false) {
    audioStore.playBgm(bgmSrc)
  }

  // 创建 Phaser 配置
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: '100%',
    height: '100%',
    transparent: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // ⭐ 如果游戏需要物理引擎，取消注释：
    // physics: {
    //   default: 'arcade',
    //   arcade: { debug: false }
    // },
    scene: [GameScene]
  }

  phaserGame = new Phaser.Game(config)

  // 监听游戏场景事件 → 转发给 Vue
  phaserGame.events.on('ready', () => {
    emit('ready')
  })

  phaserGame.events.on('score', (score: number) => {
    gameStore.setScore(score)
    emit('score-update', score)
  })

  phaserGame.events.on('gameover', (score: number) => {
    audioStore.stopBgm()
    gameStore.endGame()
    emit('game-over', score)
  })

  phaserGame.events.on('paused', () => {
    audioStore.pauseBgm()
    gameStore.pauseGame()
    emit('paused')
  })

  phaserGame.events.on('resumed', () => {
    audioStore.resumeBgm()
    gameStore.resumeGame()
    emit('resumed')
  })
}

// ─── 销毁游戏 ─────────────────────────────────────────────────

function destroyGame(): void {
  audioStore.cleanup()
  if (phaserGame) {
    phaserGame.destroy(true)
    phaserGame = null
  }
}

// ─── 获取游戏场景 ─────────────────────────────────────────────

function getGameScene(): GameScene | null {
  if (!phaserGame) return null
  return phaserGame.scene.getScene('GameScene') as GameScene | null
}

// ─── 暂停/恢复 ───────────────────────────────────────────────

function pause(): void {
  getGameScene()?.pauseGame()
}

function resume(): void {
  getGameScene()?.resumeGame()
}

function togglePause(): void {
  getGameScene()?.togglePause()
}

// ─── 生命周期 ─────────────────────────────────────────────────

onMounted(() => {
  initGame()
})

onUnmounted(() => {
  destroyGame()
})

// 暴露方法给父组件
defineExpose({
  pause,
  resume,
  togglePause,
  destroyGame,
  getGameScene
})
</script>

<template>
  <div class="phaser-game" ref="gameContainer"></div>
</template>

<style scoped>
.phaser-game {
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 禁用触摸默认行为（移动端） */
  touch-action: none;
}
</style>
