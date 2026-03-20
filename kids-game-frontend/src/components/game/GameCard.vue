<template>
  <div class="game-card" @click="handleClick">
    <!-- 游戏封面 -->
    <div class="game-cover">
      <span class="game-emoji">{{ getGameEmoji(game.category) }}</span>
      <div class="game-badges">
        <span v-if="game.isNew" class="game-badge tag-new">NEW</span>
        <span v-if="game.isHot" class="game-badge tag-hot">HOT</span>
      </div>
    </div>

    <!-- 游戏信息 -->
    <div class="game-info">
      <h4 class="game-name">{{ game.gameName }}</h4>
      <p class="game-grade">{{ getGradeName(game.grade) }}</p>
      <div class="game-rating">
        <span class="stars">{{ '★'.repeat(Math.min(5, game.rating || 4)) }}</span>
        <span class="rating-count">({{ game.playCount || 0 }})</span>
      </div>
    </div>

    <!-- 播放按钮 -->
    <div class="game-play-btn">
      ▶️
    </div>
  </div>
</template>

<script setup lang="ts">
interface Game {
  gameId: number;
  gameCode: string;
  gameName: string;
  category: string;
  grade: string;
  rating?: number;
  playCount?: number;
  isNew?: boolean;
  isHot?: boolean;
}

const props = defineProps<{
  game: Game;
}>();

const emit = defineEmits<{
  click: [game: Game];
}>();

function handleClick() {
  emit('click', props.game);
}

function getGameEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'creative': '🎨',
    'puzzle': '🧩',
    'math': '🔢',
    'adventure': '⚔️',
    'arithmetic': '🧮',
    'logic': '🧠',
    'memory': '🧠',
    'reaction': '⚡',
  };
  return emojiMap[category] || '🎮';
}

function getGradeName(grade: string): string {
  const gradeMap: Record<string, string> = {
    '1': '小班',
    '2': '中班',
    '3': '大班',
    '4': '一年级',
    '5': '二年级',
    '6': '三年级',
  };
  return gradeMap[grade] || grade;
}
</script>

<style scoped>
.game-card {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.game-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.game-card:active {
  transform: translateY(-2px) scale(0.98);
}

/* 游戏封面 */
.game-cover {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #d0d9ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.game-cover::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(0deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(360deg);
  }
}

.game-emoji {
  font-size: 5rem;
  position: relative;
  z-index: 1;
  transition: transform 0.3s;
}

.game-card:hover .game-emoji {
  transform: scale(1.1) rotate(5deg);
}

/* 游戏徽章 */
.game-badges {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 0.5rem;
  z-index: 2;
}

.game-badge {
  padding: 0.3rem 0.8rem;
  background: #f59e0b;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  animation: badgePulse 2s ease-in-out infinite;
}

.game-badge.tag-new {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.game-badge.tag-hot {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 游戏信息 */
.game-info {
  padding: 1.25rem;
  position: relative;
  z-index: 1;
}

.game-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-grade {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.game-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  color: #f59e0b;
  font-size: 1rem;
  letter-spacing: 0.1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.rating-count {
  font-size: 0.85rem;
  color: #999;
  font-weight: 500;
}

/* 播放按钮 */
.game-play-btn {
  position: absolute;
  bottom: 1.25rem;
  right: 1.25rem;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  z-index: 2;
  border: 3px solid white;
}

.game-card:hover .game-play-btn {
  transform: scale(1.15);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.game-card:active .game-play-btn {
  transform: scale(0.95);
}

/* 响应式 */
@media (max-width: 768px) {
  .game-cover {
    height: 140px;
  }

  .game-emoji {
    font-size: 3.5rem;
  }

  .game-info {
    padding: 1rem;
  }

  .game-name {
    font-size: 1rem;
  }

  .game-grade {
    font-size: 0.85rem;
  }

  .game-play-btn {
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
    bottom: 1rem;
    right: 1rem;
  }
}

@media (max-width: 480px) {
  .game-cover {
    height: 120px;
  }

  .game-emoji {
    font-size: 3rem;
  }

  .game-info {
    padding: 0.875rem;
  }

  .game-name {
    font-size: 0.95rem;
  }

  .game-grade {
    font-size: 0.8rem;
  }

  .stars {
    font-size: 0.9rem;
  }

  .rating-count {
    font-size: 0.8rem;
  }

  .game-play-btn {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }
}
</style>
