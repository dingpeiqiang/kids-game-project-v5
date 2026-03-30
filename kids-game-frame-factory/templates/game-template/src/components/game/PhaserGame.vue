<script setup lang="ts">
/**
 * Phaser 游戏容器组件
 *
 * 职责：
 * 1. 创建 Phaser.Game 实例并管理其生命周期
 * 2. 接收 Phaser 场景事件，转发给 Vue 父组件
 * 3. 提供暂停/恢复方法给外部调用
 *
 * 事件协议（GameScene → PhaserGame → Vue）：
 * - 'ready'     → 游戏场景已就绪
 * - 'score'     → 分数更新（GameScene 直接调用 gameStore.addScore 更推荐）
 * - 'gameover'  → 游戏结束
 * - 'paused'    → 游戏暂停
 * - 'resumed'   → 游戏恢复
 */
import { ref, onMounted, onUnmounted } from 'vue'
// Phaser 通过 CDN 加载，全局变量声明见 global.d.ts
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import { useAudioStore } from '@/stores/audio'
import GameScene from '@/scenes/GameScene'
// ⚠️ 重要提示：复制模板后，需要将 MyGameScene 替换为你实际实现的游戏场景类
// 例如：import PuzzleGameScene from '@/scenes/PuzzleGameScene'
import MyGameScene from '@/scenes/MyGameScene'

const emit = defineEmits<{
  ready:         []
  'game-over':   [score: number]
  'score-update':[score: number]
  paused:        []
  resumed:       []
}>()

const gameStore      = useGameStore()
const themeStore     = useThemeStore()
const audioStore     = useAudioStore()
const gameContainer  = ref<HTMLDivElement | null>(null)
let phaserGame: Phaser.Game | null = null

// ─── 初始化游戏 ─────────────────────────────────────────────────────────────

async function initGame(): Promise<void> {
  if (!gameContainer.value) return

  // 初始化游戏状态
  gameStore.startGame()

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: '100%',
    height: '100%',
    transparent: true,
    scale: {
      mode      : Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // 如需物理引擎，取消注释：
    // physics: { default: 'arcade', arcade: { debug: false } },
    // ⚠️ 重要提示：复制模板后，需要将 MyGameScene 替换为你实际实现的游戏场景类
    scene: [MyGameScene],
  }

  phaserGame = new Phaser.Game(config)

  // ── Phaser 场景事件 → Vue emit ──────────────────────────────────────────

  phaserGame.events.on('ready', () => {
    emit('ready')
  })

  phaserGame.events.on('score', (score: number) => {
    emit('score-update', score)
  })

  phaserGame.events.on('gameover', (score: number) => {
    audioStore.stopBGM()
    gameStore.endGame()
    emit('game-over', score)
  })

  phaserGame.events.on('paused', () => {
    emit('paused')
  })

  phaserGame.events.on('resumed', () => {
    emit('resumed')
  })
}

// ─── 销毁游戏 ────────────────────────────────────────────────────────────────

function destroyGame(): void {
  if (phaserGame) {
    phaserGame.destroy(true)
    phaserGame = null
  }
}

// ─── 获取游戏场景 ────────────────────────────────────────────────────────────

function getGameScene(): GameScene | null {
  if (!phaserGame) return null
  return phaserGame.scene.getScene('GameScene') as GameScene | null
}

// ─── 暂停/恢复 ───────────────────────────────────────────────────────────────

function pause(): void {
  getGameScene()?.pauseGame()
}

function resume(): void {
  getGameScene()?.resumeGame()
}

function togglePause(): void {
  getGameScene()?.togglePause()
}

// ─── 生命周期 ────────────────────────────────────────────────────────────────

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
  getGameScene,
})
</script>

<template>
  <div ref="gameContainer" class="phaser-game"/>
</template>

<style scoped>
.phaser-game {
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
}
</style>
