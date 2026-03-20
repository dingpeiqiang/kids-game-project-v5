<template>
  <div class="game-state-panel">
    <div class="panel-header">游戏状态</div>
    <div class="panel-content">
      <div class="player-info">
        <div class="player-avatar">
          <span>{{ playerName.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="player-details">
          <div class="player-name">{{ playerName }}</div>
          <div class="player-status">游戏中</div>
        </div>
      </div>

      <div class="game-stats-panel">
        <div class="stat-box">
          <div class="stat-label">得分</div>
          <div class="stat-value score">{{ score }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">生命</div>
          <div class="stat-value lives">
            <span v-for="i in lives" :key="i" class="heart">❤️</span>
            <span v-for="i in (maxLives - lives)" :key="'empty' + i" class="heart-empty">🖤</span>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">时间</div>
          <div class="stat-value time">{{ duration }}</div>
        </div>
      </div>

      <div class="game-progress">
        <div class="progress-label">游戏进度</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">{{ questionCount }} 题完成</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDuration } from '../utils/format';

const props = defineProps<{
  playerName: string;
  score: number;
  lives: number;
  maxLives: number;
  duration: number;
  questionCount: number;
}>();
</script>

<style scoped>
.game-state-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  width: 260px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.panel-header {
  font-size: 16px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.player-avatar {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.player-details {
  flex: 1;
}

.player-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.player-status {
  font-size: 12px;
  opacity: 0.9;
}

.game-stats-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
}

.stat-value.score {
  color: #10b981;
}

.stat-value.lives {
  font-size: 16px;
  line-height: 1.5;
}

.stat-value.time {
  color: #f59e0b;
}

.heart {
  margin: 0 1px;
}

.heart-empty {
  margin: 0 1px;
  opacity: 0.3;
}

.game-progress {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
}

.progress-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: #666;
  text-align: center;
}

@media (max-width: 768px) {
  .game-state-panel {
    width: 200px;
    top: 60px;
    right: 10px;
    padding: 12px;
  }

  .panel-header {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .player-avatar {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .player-name {
    font-size: 12px;
  }

  .player-status {
    font-size: 10px;
  }

  .game-stats-panel {
    gap: 6px;
  }

  .stat-box {
    padding: 6px;
  }

  .stat-label {
    font-size: 10px;
  }

  .stat-value {
    font-size: 14px;
  }

  .stat-value.lives {
    font-size: 12px;
  }

  .game-progress {
    padding: 8px;
  }

  .progress-label {
    font-size: 10px;
  }

  .progress-bar {
    height: 6px;
  }

  .progress-text {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .game-state-panel {
    width: 180px;
    top: 50px;
    right: 5px;
    padding: 10px;
  }

  .panel-header {
    font-size: 12px;
    margin-bottom: 6px;
    padding-bottom: 6px;
  }

  .player-info {
    padding: 6px;
  }

  .player-avatar {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .player-name {
    font-size: 11px;
  }

  .player-status {
    font-size: 9px;
  }

  .game-stats-panel {
    gap: 4px;
  }

  .stat-box {
    padding: 4px;
  }

  .stat-label {
    font-size: 9px;
  }

  .stat-value {
    font-size: 12px;
  }

  .stat-value.lives {
    font-size: 11px;
  }

  .game-progress {
    padding: 6px;
  }

  .progress-bar {
    height: 5px;
  }

  .progress-text {
    font-size: 9px;
  }
}
</style>
