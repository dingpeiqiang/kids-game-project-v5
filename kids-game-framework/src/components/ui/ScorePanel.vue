<template>
  <div class="score-panel" :style="containerStyle">
    <div class="score-panel__item">
      <span class="score-panel__label">{{ label }}</span>
      <span class="score-panel__value score-panel__value--primary" :key="score">
        {{ displayScore }}
      </span>
    </div>
    <div class="score-panel__item score-panel__item--right" v-if="showHighScore">
      <span class="score-panel__label">{{ highScoreLabel }}</span>
      <span class="score-panel__value score-panel__value--secondary">
        {{ highScoreIcon }} {{ displayHighScore }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** 当前分数 */
  score: number
  /** 最高分 */
  highScore?: number
  /** 是否显示最高分 */
  showHighScore?: boolean
  /** 分数标签 */
  label?: string
  /** 最高分标签 */
  highScoreLabel?: string
  /** 最高分图标 */
  highScoreIcon?: string
  /** 动画数字 */
  animated?: boolean
  /** 容器样式 */
  containerStyle?: Record<string, string>
}>(), {
  highScore: 0,
  showHighScore: true,
  label: '分数',
  highScoreLabel: '最高分',
  highScoreIcon: '🏆',
  animated: true
})

const displayScore = computed(() => {
  return props.score.toString().padStart(6, '0')
})

const displayHighScore = computed(() => {
  return props.highScore.toString().padStart(6, '0')
})
</script>

<style scoped>
.score-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(31, 41, 55, 0.7);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  padding: 10px 16px;
  gap: 24px;
}

.score-panel__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-panel__item--right {
  align-items: flex-end;
}

.score-panel__label {
  font-size: 14px;
  color: #9ca3af;
}

.score-panel__value {
  font-size: 28px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.score-panel__value--primary {
  color: #4ade80;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
}

.score-panel__value--secondary {
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

/* 分数变化动画 */
.score-panel__value--primary {
  animation: scorePop 0.3s ease-out;
}

@keyframes scorePop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
