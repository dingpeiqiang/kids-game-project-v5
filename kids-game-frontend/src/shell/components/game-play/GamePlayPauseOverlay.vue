<template>
  <div class="game-play-pause">
    <p class="game-play-pause__title">{{ labels.pausedTitle }}</p>
    <button type="button" class="game-play-pause__btn" @click="emit('resume')">
      {{ labels.resume }}
    </button>
    <button type="button" class="game-play-pause__btn game-play-pause__btn--ghost" @click="emit('back')">
      {{ labels.back }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { GAME_PLAY_SHELL } from '@shell/constants/gamePlayShell';

const emit = defineEmits<{
  resume: [];
  back: [];
}>();

const labels = GAME_PLAY_SHELL.labels;
</script>

<style scoped>
.game-play-pause {
  position: absolute;
  inset: 0;
  z-index: 150;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
}

.game-play-pause__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 8px;
}

.game-play-pause__btn {
  padding: 10px 28px;
  border: none;
  border-radius: 12px;
  background: #4d96ff;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  min-width: 160px;
}

.game-play-pause__btn--ghost {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.85);
}
</style>