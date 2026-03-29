<script setup lang="ts">
/**
 * 游戏主应用组件
 * 
 * 管理游戏流程：
 * 1. StartView - 开始界面
 * 2. DifficultyView - 难度选择
 * 3. GameView - 游戏界面
 * 4. GameOverView - 结束界面
 */
import { ref, provide } from 'vue'
import { useGameStore } from './stores/game'
import StartView from './views/StartView.vue'
import DifficultyView from './views/DifficultyView.vue'
import GameView from './views/GameView.vue'
import GameOverView from './views/GameOverView.vue'

// 游戏状态
type GamePhase = 'start' | 'difficulty' | 'playing' | 'gameover'

const gameStore = useGameStore()
const currentPhase = ref<GamePhase>('start')
const finalScore = ref(0)

// 提供给子组件
provide('gameStore', gameStore)

// 导航函数
function goToDifficulty() {
  currentPhase.value = 'difficulty'
}

function startGame(difficulty: string) {
  gameStore.setDifficulty(difficulty as 'easy' | 'normal' | 'hard')
  currentPhase.value = 'playing'
}

function handleGameOver(score: number) {
  finalScore.value = score
  currentPhase.value = 'gameover'
}

function handleRestart() {
  currentPhase.value = 'difficulty'
}

function handleBackToHome() {
  currentPhase.value = 'start'
}
</script>

<template>
  <div class="game-app">
    <!-- 开始界面 -->
    <StartView 
      v-if="currentPhase === 'start'" 
      @start="goToDifficulty" 
    />

    <!-- 难度选择 -->
    <DifficultyView 
      v-else-if="currentPhase === 'difficulty'" 
      @select="startGame"
      @back="handleBackToHome"
    />

    <!-- 游戏界面 -->
    <GameView 
      v-else-if="currentPhase === 'playing'" 
      @game-over="handleGameOver"
      @back="handleBackToHome"
    />

    <!-- 结束界面 -->
    <GameOverView 
      v-else-if="currentPhase === 'gameover'"
      :score="finalScore"
      @restart="handleRestart"
      @home="handleBackToHome"
    />
  </div>
</template>

<style scoped>
.game-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}
</style>
