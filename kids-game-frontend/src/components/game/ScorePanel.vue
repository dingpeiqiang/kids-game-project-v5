<template>
  <div class="score-panel">
    <div class="score-item">
      <span class="icon">⭐</span>
      <span class="label">分数</span>
      <span class="value">{{ score }}</span>
    </div>
    <div class="score-item">
      <span class="icon">❤️</span>
      <span class="label">生命</span>
      <div class="lives">
        <span
          v-for="i in maxLives"
          :key="i"
          class="heart"
          :class="{ lost: i > lives }"
        >
          ❤️
        </span>
      </div>
    </div>
    <div class="score-item" v-if="showLevel">
      <span class="icon">🎮</span>
      <span class="label">关卡</span>
      <span class="value">{{ level }}</span>
    </div>
    <div class="score-item" v-if="showTime">
      <span class="icon">⏱️</span>
      <span class="label">时间</span>
      <span class="value">{{ formatTime(remainingTime) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  score: number;
  lives: number;
  maxLives: number;
  level?: number;
  remainingTime?: number;
  showLevel?: boolean;
  showTime?: boolean;
}

withDefaults(defineProps<Props>(), {
  showLevel: false,
  showTime: false,
});

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
</script>

<style scoped>
.score-panel {
  display: flex;
  gap: 15px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: bold;
}

.icon {
  font-size: 1.3rem;
}

.label {
  color: #666;
  font-size: 0.9rem;
}

.value {
  color: #FF6B9D;
  font-size: 1.2rem;
  min-width: 40px;
}

.lives {
  display: flex;
  gap: 3px;
}

.heart {
  font-size: 1.2rem;
  transition: opacity 0.3s;
}

.heart.lost {
  opacity: 0.2;
}

@media (max-width: 768px) {
  .score-panel {
    gap: 10px;
    padding: 10px 15px;
  }

  .score-item {
    font-size: 0.9rem;
  }

  .icon {
    font-size: 1.1rem;
  }

  .label {
    font-size: 0.8rem;
  }

  .value {
    font-size: 1rem;
  }
}
</style>
