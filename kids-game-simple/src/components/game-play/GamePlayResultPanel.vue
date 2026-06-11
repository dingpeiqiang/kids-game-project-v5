<template>
  <div class="game-play-result">
    <div class="game-play-result__card">
      <p class="game-play-result__badge">{{ victory ? labels.resultVictory : labels.resultDefeat }}</p>
      <p class="game-play-result__title">{{ labels.resultTitle }}</p>
      <p class="game-play-result__score">{{ score }}</p>
      <div class="game-play-result__actions">
        <button type="button" class="game-play-result__btn game-play-result__btn--ghost" @click="emit('back')">
          {{ labels.back }}
        </button>
        <button type="button" class="game-play-result__btn game-play-result__btn--primary" @click="emit('replay')">
          {{ labels.replay }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GAME_PLAY_SHELL } from '@simple/constants/gamePlayShell';

defineProps<{
  score: number;
  victory?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  replay: [];
}>();

const labels = GAME_PLAY_SHELL.labels;
</script>

<style scoped>
.game-play-result {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  z-index: 160;
  padding: 16px;
}

.game-play-result__card {
  background: #fff;
  color: #0f172a;
  padding: 24px 28px;
  border-radius: 20px;
  text-align: center;
  max-width: 320px;
  width: 100%;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}

.game-play-result__badge {
  font-size: 14px;
  font-weight: 700;
  color: #4d96ff;
  margin: 0 0 4px;
}

.game-play-result__title {
  margin: 0;
  font-size: 15px;
  opacity: 0.75;
}

.game-play-result__score {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 12px 0 20px;
  font-variant-numeric: tabular-nums;
  color: #e67e22;
}

.game-play-result__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.game-play-result__btn {
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  border: 2px solid transparent;
}

.game-play-result__btn--ghost {
  background: #f1f5f9;
  color: #334155;
  border-color: #e2e8f0;
}

.game-play-result__btn--primary {
  background: #4d96ff;
  color: #fff;
}
</style>