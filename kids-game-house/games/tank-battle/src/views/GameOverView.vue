<template>
  <div class="gameover-screen">
    <div class="gameover-content">
      <!-- 结果图标 -->
      <div class="result-icon">{{ isVictory ? '🏆' : '💀' }}</div>
      <h1 class="result-title">{{ isVictory ? '胜利！' : '游戏结束' }}</h1>
      <p class="result-sub" v-if="isVictory">恭喜你成功通关！</p>

      <!-- 分数卡片 -->
      <div class="score-card">
        <div class="score-row">
          <span class="score-label">🎯 最终得分</span>
          <span class="score-value primary-score">{{ finalScore.toLocaleString() }}</span>
        </div>
        <div class="score-divider"></div>
        <div class="score-row">
          <span class="score-label">🏰 到达关卡</span>
          <span class="score-value level-score">第 {{ level }} 关</span>
        </div>
        <div class="score-row">
          <span class="score-label">💀 阵亡次数</span>
          <span class="score-value death-score">{{ deaths }}</span>
        </div>
        <div class="score-divider"></div>
        <div class="score-row">
          <span class="score-label">🏆 最高分</span>
          <span class="score-value high-score">{{ highScore.toLocaleString() }}</span>
        </div>
        <!-- 新纪录 -->
        <div v-if="isNewRecord" class="new-record">
          🎉 新纪录！
        </div>
      </div>

      <!-- 按钮 -->
      <div class="gameover-actions">
        <button class="action-btn action-primary" @click="restartGame">
          🔄 再来一局
        </button>
        <button class="action-btn action-secondary" @click="changeDifficulty">
          ⚙️ 更改难度
        </button>
        <button class="action-btn action-ghost" @click="goHome">
          🏠 返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const highScore = ref(0)
const isNewRecord = ref(false)

const finalScore = computed(() => gameStore.score)
const deaths = computed(() => Math.max(0, 3 - gameStore.lives))
const level = computed(() => gameStore.level)

const isVictory = computed(() => gameStore.status === 'victory')

onMounted(() => {
  const saved = localStorage.getItem('tank-battle-highscore')
  const prev = saved ? parseInt(saved) : 0
  highScore.value = prev

  if (gameStore.score > prev) {
    highScore.value = gameStore.score
    isNewRecord.value = true
    localStorage.setItem('tank-battle-highscore', gameStore.score.toString())
  }
})

const restartGame = () => {
  gameStore.reset()
  router.push('/game')
}

const changeDifficulty = () => {
  gameStore.reset()
  router.push('/difficulty')
}

const goHome = () => {
  gameStore.reset()
  router.push('/start')
}
</script>

<style scoped>
.gameover-screen {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #0f1a12 0%, #1a2e1f 40%, #0d1f15 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.gameover-content {
  width: 100%;
  max-width: 380px;
  text-align: center;
}

/* 结果 */
.result-icon {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
}
.result-title {
  font-size: 2rem;
  font-weight: 900;
  color: #fbbf24;
  margin-bottom: 0.25rem;
}
.result-sub {
  font-size: 0.9rem;
  color: #4ade80;
  margin-bottom: 1.5rem;
}

/* 分数卡片 */
.score-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}
.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}
.score-label {
  font-size: 0.85rem;
  color: #9ca3af;
}
.score-value {
  font-size: 0.95rem;
  font-weight: 700;
}
.primary-score { color: #fbbf24; font-size: 1.15rem; }
.level-score   { color: #60a5fa; }
.death-score   { color: #fca5a5; }
.high-score    { color: #4ade80; }

.score-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 6px 0;
}

.new-record {
  margin-top: 0.75rem;
  padding: 6px 0;
  font-size: 1rem;
  font-weight: 800;
  color: #fbbf24;
  animation: pulse-glow 1.5s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 按钮 */
.gameover-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.action-btn {
  width: 100%;
  padding: 14px 0;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: transform 0.12s;
}
.action-btn:active { transform: scale(0.97); }

.action-primary {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1a1a1a;
  box-shadow: 0 4px 16px rgba(251,191,36,0.25);
}
.action-primary:hover {
  box-shadow: 0 6px 24px rgba(251,191,36,0.4);
}

.action-secondary {
  background: rgba(96,165,250,0.12);
  color: #93c5fd;
  border: 1px solid rgba(96,165,250,0.25);
}
.action-secondary:hover { background: rgba(96,165,250,0.2); }

.action-ghost {
  background: rgba(255,255,255,0.04);
  color: #6b7280;
  border: 1px solid rgba(255,255,255,0.08);
}
.action-ghost:hover { background: rgba(255,255,255,0.08); color: #d1d5db; }
</style>
