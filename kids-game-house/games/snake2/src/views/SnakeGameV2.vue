<script setup lang="ts">
/**
 * 🐍 Snake2 实体系统测试页面
 * 
 * 用于快速验证新的实体系统集成效果
 */
import { ref, onMounted, onUnmounted } from 'vue'
import PhaserGame from '@/components/game/PhaserGame'

const gameContainer = ref<HTMLElement | null>(null)
let phaserGame: PhaserGame | null = null
let isInitialized = ref(false)

onMounted(() => {
  if (gameContainer.value) {
    console.log('🚀 [SnakeGameV2] 开始初始化...')
    
    // 创建 Phaser 游戏实例
    phaserGame = new PhaserGame(gameContainer.value)
    
    // 启动游戏（使用默认主题）
    phaserGame.start('medium', 'theme-001').then(() => {
      console.log('✅ [SnakeGameV2] Phaser 游戏启动完成')
      
      // 等待 1 秒后初始化实体系统
      setTimeout(() => {
        initEntitySystem()
      }, 1000)
    }).catch(err => {
      console.error('❌ [SnakeGameV2] 游戏启动失败:', err)
    })
  }
})

function initEntitySystem(): void {
  if (!phaserGame) {
    console.error('❌ [SnakeGameV2] PhaserGame 实例不存在')
    return
  }
  
  console.log('🐍 [SnakeGameV2] 开始初始化实体系统...')
  
  try {
    // 初始化实体系统
    phaserGame.initializeEntitySystem()
    isInitialized.value = true
    
    console.log('✅ [SnakeGameV2] 实体系统初始化成功!')
    console.log('   ├─ snakeGameV2:', phaserGame.snakeGameV2 ? '存在' : '不存在')
    console.log('   └─ 可以通过控制台调用:')
    console.log('      - window.testSnakeGame.setSnakeDirection("up")')
    console.log('      - window.testSnakeGame.getSnakeLength()')
    
    // 暴露给全局对象方便测试
    ;(window as any).testSnakeGame = phaserGame
  } catch (error) {
    console.error('❌ [SnakeGameV2] 实体系统初始化失败:', error)
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!phaserGame || !isInitialized.value) return
  
  const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  }
  
  const direction = keyMap[event.key]
  if (direction) {
    phaserGame.setSnakeDirection(direction)
    console.log(`⌨️ [SnakeGameV2] 方向控制：${direction}`)
  }
}

onUnmounted(() => {
  if (phaserGame) {
    console.log('🧹 [SnakeGameV2] 清理资源...')
    // TODO: phaserGame.destroy()
    phaserGame = null
  }
})
</script>

<template>
  <div class="snake-game-v2 relative w-full h-screen overflow-hidden bg-gray-900">
    <!-- 游戏画布容器 -->
    <div
      ref="gameContainer"
      class="game-canvas w-full h-full"
      @keydown="handleKeydown"
      tabindex="0"
    ></div>
    
    <!-- UI 覆盖层 -->
    <div class="ui-overlay absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
      <!-- 状态指示 -->
      <div class="status-badge bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm">
        <span v-if="isInitialized" class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          ✅ 实体系统已就绪
        </span>
        <span v-else class="flex items-center gap-2">
          <span class="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></span>
          ⏳ 正在初始化...
        </span>
      </div>
      
      <!-- 操作提示 -->
      <div class="hint-badge bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-xs">
        <p>💡 按 ↑↓←→ 控制方向</p>
        <p class="mt-1 opacity-70">或打开控制台执行测试代码</p>
      </div>
      
      <!-- 测试命令 -->
      <div class="test-commands bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-xs font-mono">
        <p class="font-bold mb-1">📝 测试命令:</p>
        <p>window.testSnakeGame.setSnakeDirection('up')</p>
        <p>window.testSnakeGame.getSnakeLength()</p>
      </div>
    </div>
    
    <!-- 未就绪提示 -->
    <div
      v-if="!isInitialized"
      class="loading-overlay absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="text-center text-white">
        <div class="text-6xl mb-4 animate-bounce">🐍</div>
        <h2 class="text-2xl font-bold mb-2">Snake2 实体系统测试</h2>
        <p class="text-sm opacity-80">正在初始化游戏...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snake-game-v2 {
  font-family: 'Microsoft YaHei', sans-serif;
}

.ui-overlay {
  max-width: 300px;
}

.status-badge,
.hint-badge,
.test-commands {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
