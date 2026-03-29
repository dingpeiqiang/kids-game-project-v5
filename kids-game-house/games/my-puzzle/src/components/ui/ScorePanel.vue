<script setup lang="ts">
/**
 * 分数面板组件
 */
import { computed } from 'vue'

interface Props {
  score: number
  isNewRecord?: boolean
  showHighScore?: boolean
  highScore?: number
}

const props = withDefaults(defineProps<Props>(), {
  isNewRecord: false,
  showHighScore: true,
  highScore: 0
})

// 格式化分数
const formattedScore = computed(() => {
  return props.score.toLocaleString()
})

const formattedHighScore = computed(() => {
  return (props.highScore || 0).toLocaleString()
})
</script>

<template>
  <div class="score-panel">
    <!-- 当前分数 -->
    <div class="current-score">
      <span class="label">得分</span>
      <span class="value">{{ formattedScore }}</span>
      <span v-if="isNewRecord" class="new-record">新纪录!</span>
    </div>

    <!-- 最高分 -->
    <div v-if="showHighScore && highScore > 0" class="high-score">
      <span class="label">最高分</span>
      <span class="value">{{ formattedHighScore }}</span>
    </div>
  </div>
</template>

<style scoped>
.score-panel {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 24px 32px;
  display: inline-block;
  min-width: 200px;
}

.current-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.current-score .label {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.current-score .value {
  font-size: 48px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.new-record {
  margin-top: 8px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #000000;
  font-size: 12px;
  font-weight: bold;
  border-radius: 20px;
  animation: pulse 1s ease-in-out infinite;
}

.high-score {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.high-score .label {
  font-size: 12px;
  color: #64748b;
}

.high-score .value {
  font-size: 24px;
  font-weight: bold;
  color: #94a3b8;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>
