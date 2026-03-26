<template>
  <div class="game-ui-overlay">
    <!-- 暂停菜单 -->
    <div v-if="showPauseMenu" class="menu-overlay">
      <div class="menu-panel">
        <h2>游戏暂停</h2>
        <div class="menu-actions">
          <button @click="onResume" class="btn btn-primary">继续游戏</button>
          <button @click="onRestart" class="btn btn-secondary">重新开始</button>
          <button @click="onExit" class="btn btn-danger">退出游戏</button>
        </div>
      </div>
    </div>

    <!-- 游戏结束菜单 -->
    <div v-if="showGameOverMenu" class="menu-overlay">
      <div class="menu-panel">
        <h2>{{ isVictory ? '🎉 胜利!' : '😢 游戏结束' }}</h2>
        <div class="score-display">
          <p>得分：<strong>{{ score }}</strong></p>
          <p>最高分：<strong>{{ highScore }}</strong></p>
          <p>时长：<strong>{{ formatDuration(duration) }}</strong></p>
        </div>
        <div class="menu-actions">
          <button @click="onRestart" class="btn btn-primary">再玩一次</button>
          <button @click="onExit" class="btn btn-secondary">退出游戏</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showPauseMenu: boolean
  showGameOverMenu: boolean
  score: number
  highScore: number
  duration: number
  isVictory?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isVictory: false
})

const emit = defineEmits<{
  resume: []
  restart: []
  exit: []
}>()

const onResume = () => emit('resume')
const onRestart = () => emit('restart')
const onExit = () => emit('exit')

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.game-ui-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 1000;
}

.menu-panel {
  background: white;
  padding: 2rem 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 300px;
}

.menu-panel h2 {
  margin: 0 0 1.5rem 0;
  font-size: 2rem;
  color: #1f2937;
}

.score-display {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.score-display p {
  margin: 0.5rem 0;
  color: #4b5563;
}

.score-display strong {
  color: #667eea;
  font-size: 1.2rem;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #1f2937;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #fee2e2;
  color: #991b1b;
}

.btn-danger:hover {
  background: #fecaca;
}
</style>
