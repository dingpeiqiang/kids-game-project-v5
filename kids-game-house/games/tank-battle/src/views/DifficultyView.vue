<template>
  <div class="diff-screen">
    <div class="diff-content">
      <!-- 标题 -->
      <div class="diff-header">
        <span class="diff-icon">⚙️</span>
        <h2 class="diff-title">选择难度</h2>
        <p class="diff-sub">选择适合你的挑战等级</p>
      </div>

      <!-- 难度卡片 -->
      <div class="diff-grid">
        <button
          v-for="diff in difficulties"
          :key="diff.key"
          class="diff-card"
          :class="{ 'diff-card-active': selectedDiff === diff.key }"
          @click="selectDifficulty(diff.key)"
        >
          <span class="diff-emoji">{{ diff.emoji }}</span>
          <span class="diff-name">{{ diff.name }}</span>
          <span class="diff-enemies">{{ diff.enemyCount }} 个敌人</span>
          <!-- 选中指示 -->
          <div v-if="selectedDiff === diff.key" class="diff-check">✓</div>
        </button>
      </div>

      <!-- 难度详情 -->
      <Transition name="detail-expand">
        <div v-if="selectedDiff" class="diff-detail">
          <h3 class="detail-title">{{ selectedCard?.name }} 模式</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">🎯 敌人数量</span>
              <span class="detail-value">{{ currentConfig?.enemyCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">⚡ 生成间隔</span>
              <span class="detail-value">{{ ((currentConfig?.spawnInterval || 0) / 1000).toFixed(1) }}s</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">🏃 敌人速度</span>
              <span class="detail-value">{{ currentConfig?.enemySpeed }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">❤️ 生命数</span>
              <span class="detail-value">{{ currentConfig?.playerLives }}</span>
            </div>
            <div v-if="currentConfig?.timeLimit" class="detail-item">
              <span class="detail-label">⏱️ 时间限制</span>
              <span class="detail-value">{{ currentConfig.timeLimit }}s</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 按钮 -->
      <div class="diff-actions">
        <button class="action-btn action-ghost" @click="goBack">
          ← 返回
        </button>
        <button
          class="action-btn action-start"
          :disabled="!selectedDiff"
          @click="startGame"
        >
          🚀 开始战斗
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'

const router = useRouter()
const configStore = useConfigStore()

const difficulties = [
  { key: 'easy',   name: '简单', emoji: '🟢', enemyCount: 5 },
  { key: 'medium', name: '中等', emoji: '🟡', enemyCount: 10 },
  { key: 'hard',   name: '困难', emoji: '🟠', enemyCount: 15 },
  { key: 'expert', name: '专家', emoji: '🔴', enemyCount: 20 },
]

const selectedDiff = ref('medium')

const selectedCard = computed(() => difficulties.find(d => d.key === selectedDiff.value))

const currentConfig = computed(() => {
  const key = selectedDiff.value
  if (!key) return null
  configStore.setDifficulty(key)
  return configStore.getEffectiveConfig
})

const selectDifficulty = (key: string) => {
  selectedDiff.value = key
  configStore.setDifficulty(key)
}

const goBack = () => {
  router.push('/start')
}

const startGame = () => {
  if (selectedDiff.value) {
    configStore.setDifficulty(selectedDiff.value)
    router.push('/game')
  }
}
</script>

<style scoped>
.diff-screen {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #0f1a12 0%, #1a2e1f 40%, #0d1f15 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.diff-content {
  width: 100%;
  max-width: 440px;
}

/* 标题 */
.diff-header {
  text-align: center;
  margin-bottom: 1.75rem;
}
.diff-icon { font-size: 2rem; }
.diff-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fbbf24;
  margin: 0.25rem 0;
}
.diff-sub {
  font-size: 0.85rem;
  color: #6b7280;
}

/* 难度卡片 */
.diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 1.25rem;
}
.diff-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: all 0.15s;
}
.diff-card:hover {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.15);
}
.diff-card-active {
  background: rgba(251,191,36,0.1);
  border-color: rgba(251,191,36,0.4);
  box-shadow: 0 0 20px rgba(251,191,36,0.1);
}
.diff-emoji { font-size: 1.4rem; }
.diff-name {
  font-size: 1rem;
  font-weight: 700;
  color: #e5e7eb;
}
.diff-card-active .diff-name { color: #fbbf24; }
.diff-enemies {
  font-size: 0.7rem;
  color: #6b7280;
}
.diff-check {
  position: absolute;
  top: 6px; right: 8px;
  font-size: 0.7rem;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #fbbf24;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

/* 详情 */
.diff-detail {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}
.detail-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #d1d5db;
  margin-bottom: 0.75rem;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.detail-label { font-size: 0.8rem; color: #9ca3af; }
.detail-value { font-size: 0.8rem; font-weight: 700; color: #4ade80; }

/* 按钮 */
.diff-actions {
  display: flex;
  gap: 10px;
}
.action-btn {
  flex: 1;
  padding: 14px 0;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: transform 0.12s;
}
.action-btn:active { transform: scale(0.97); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.action-ghost {
  background: rgba(255,255,255,0.05);
  color: #9ca3af;
  border: 1px solid rgba(255,255,255,0.1);
}
.action-ghost:hover { background: rgba(255,255,255,0.08); }

.action-start {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1a1a1a;
  box-shadow: 0 4px 16px rgba(251,191,36,0.25);
}
.action-start:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(251,191,36,0.4);
}

/* 过渡 */
.detail-expand-enter-active { transition: all 0.25s ease-out; }
.detail-expand-leave-active { transition: all 0.15s ease-in; }
.detail-expand-enter-from   { opacity: 0; max-height: 0; transform: translateY(-8px); }
.detail-expand-leave-to     { opacity: 0; max-height: 0; }
</style>
