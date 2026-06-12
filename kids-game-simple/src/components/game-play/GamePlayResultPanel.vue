<template>
  <div class="game-play-result">
    <div class="game-play-result__card">
      <p class="game-play-result__title">{{ resultTitle }}</p>
      <p class="game-play-result__score">{{ score }}</p>
      <div class="game-play-result__actions">
        <button type="button" class="game-play-result__btn" @click="emit('back')">
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
import { computed } from 'vue';
import { GAME_PLAY_SHELL } from '@simple/constants/gamePlayShell';

const props = defineProps<{
  score: number;
  victory?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  replay: [];
}>();

const labels = GAME_PLAY_SHELL.labels;

const resultTitle = computed(() =>
  props.victory ? labels.resultVictory : labels.resultTitle,
);
</script>

<style scoped>
.game-play-result {
  position: absolute;
  inset: 0;
  z-index: 160;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 16px;
}

.game-play-result__card {
  background: #fff;
  color: #0f172a;
  padding: 24px 32px;
  border-radius: 16px;
  text-align: center;
  min-width: 260px;
  max-width: 90vw;
}

.game-play-result__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.game-play-result__score {
  margin: 12px 0 20px;
  font-size: 2.25rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #4d96ff;
}

.game-play-result__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.game-play-result__btn {
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.game-play-result__btn--primary {
  background: #4d96ff;
  color: #fff;
  border-color: #4d96ff;
}
</style>