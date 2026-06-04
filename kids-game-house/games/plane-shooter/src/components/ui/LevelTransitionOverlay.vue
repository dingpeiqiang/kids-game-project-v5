<template>
  <Transition name="level-transition">
    <div v-if="transition.isActive" class="level-transition-overlay" @click="$emit('dismissed')">
      <!-- 背景遮罩 -->
      <div class="overlay-bg"/>

      <!-- 内容区 -->
      <div class="transition-content">
        <!-- LEVEL 数字 -->
        <div class="level-number">
          <span class="level-prefix">LEVEL</span>
          <span class="level-num">{{ transition.toLevel }}</span>
        </div>

        <!-- 关卡名 -->
        <div class="level-name">{{ transition.toLevelName }}</div>

        <!-- 完成提示 -->
        <div class="level-hint">
          <span v-if="transition.fromLevel > 0">第 {{ transition.fromLevel }} 关完成！</span>
        </div>

        <!-- 新参数预览 -->
        <div class="level-params">
          <div class="param-item">
            <span>⚡</span>
            <span>速度提升</span>
          </div>
          <div v-if="obstacleAdded" class="param-item warning">
            <span>🪨</span>
            <span>障碍物增加</span>
          </div>
          <div class="param-item bonus">
            <span>💰</span>
            <span>分数更高</span>
          </div>
        </div>

        <div class="progress-hint">即将开始...</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import type { LevelTransition } from '@/types/level'
import { getLevelConfig } from '@/types/level'

const props = defineProps<{
  transition: LevelTransition
}>()

defineEmits<{ dismissed: [] }>()

const gameStore = useGameStore()

const obstacleAdded = computed(() => {
  if (props.transition.fromLevel <= 0) return false
  const prev = getLevelConfig(props.transition.fromLevel, gameStore.difficulty)
  const next = getLevelConfig(props.transition.toLevel,   gameStore.difficulty)
  return next.obstacleCount > prev.obstacleCount
})
</script>

<style scoped>
.level-transition-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
}

.overlay-bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.transition-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem 3rem;
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.7));
}

.level-number { margin-bottom: 0.5rem; }

.level-prefix {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(251, 191, 36, 0.85);
  letter-spacing: 0.35em;
}

.level-num {
  font-size: 5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.level-name {
  font-size: 1.6rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.75rem;
}

.level-hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.level-params {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.75);
  background: rgba(255,255,255,0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
}
.param-item.warning { color: #fbbf24; background: rgba(251,191,36,0.15); }
.param-item.bonus   { color: #4ade80; background: rgba(74,222,128,0.15); }

.progress-hint {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.4);
  animation: pulse-hint 1s ease-in-out infinite;
}
@keyframes pulse-hint {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}

/* 过渡 */
.level-transition-enter-active { transition: all 0.4s ease-out; }
.level-transition-leave-active { transition: all 0.3s ease-in; }
.level-transition-enter-from   { opacity: 0; transform: scale(0.9); }
.level-transition-leave-to     { opacity: 0; transform: scale(1.05); }
</style>
