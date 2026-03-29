<script setup lang="ts">
/**
 * Phaser 游戏容器组件
 * 
 * 负责：
 * 1. 初始化 Phaser 游戏实例
 * 2. 管理游戏生命周期
 * 3. 与 Vue 组件通信
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useThemeStore } from '@/stores/theme'
import GameScene from '@/scenes/GameScene'

// 声明 Phaser 全局变量
declare const Phaser: any

interface Props {
  themeId?: string
}

const props = withDefaults(defineProps<Props>(), {
  themeId: ''
})

const emit = defineEmits<{
  'game-over': [score: number]
  ready: []
  progress: [percent: number]
}>()

const gameStore = useGameStore()
const themeStore = useThemeStore()

const gameContainer = ref<HTMLDivElement | null>(null)
let game: any = null

// 初始化游戏
async function initGame() {
  if (!gameContainer.value) return

  // 获取难度配置
  const difficulty = gameStore.difficulty
  const difficultyConfig = gameStore.currentDifficultyConfig

  // 获取 GTRS 配置
  let gtrsConfig = themeStore.gtrsRawJson
  if (!gtrsConfig && props.themeId) {
    // TODO: 从后端加载主题
    gtrsConfig = themeStore.gtrsRawJson
  }

  // 创建 Phaser 配置
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: '100%',
    height: '100%',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#1a1a2e',
    scene: [GameScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    }
  }

  // 创建游戏实例
  game = new Phaser.Game(config)

  // 监听游戏准备就绪
  game.events.on('ready', () => {
    emit('ready')
  })

  // 监听游戏结束
  game.events.on('gameover', (score: number) => {
    emit('game-over', score)
  })
}

// 销毁游戏
function destroyGame() {
  if (game) {
    game.destroy(true)
    game = null
  }
}

// 暂停/恢复游戏
function togglePause() {
  if (game?.scene?.getScene('GameScene')) {
    const scene = game.scene.getScene('GameScene')
    if (scene.scene.isPaused()) {
      scene.scene.resume()
    } else {
      scene.scene.pause()
    }
  }
}

// 监听难度变化
watch(() => gameStore.difficulty, () => {
  destroyGame()
  initGame()
})

onMounted(() => {
  initGame()
})

onUnmounted(() => {
  destroyGame()
})

// 暴露方法给父组件
defineExpose({
  togglePause,
  destroyGame
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
}
</style>
