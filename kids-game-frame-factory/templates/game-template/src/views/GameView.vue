<script setup lang="ts">
/**
 * 游戏界面
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import PhaserGame from '@/components/game/PhaserGame.vue'

const emit = defineEmits<{
  'game-over': [score: number]
  back: []
}>()

const gameStore = useGameStore()
const gameRef = ref<InstanceType<typeof PhaserGame> | null>(null)

// 游戏结束回调
function handleGameOver(score: number) {
  emit('game-over', score)
}

// 退出游戏
function handleBack() {
  gameStore.reset()
  emit('back')
}

onUnmounted(() => {
  gameStore.reset()
})
</script>

<template>
  <div class="game-view">
    <!-- 游戏画布 -->
    <PhaserGame 
      ref="gameRef"
      @game-over="handleGameOver"
    />

    <!-- 退出按钮 -->
    <button class="back-btn" @click="handleBack">
      <el-icon><ArrowLeft /></el-icon>
    </button>
  </div>
</template>

<style scoped>
.game-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}
</style>
