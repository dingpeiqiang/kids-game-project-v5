<template>
  <header class="game-play-shell-header">
    <button type="button" class="game-play-shell-header__back" @click="emit('back')">
      ← {{ labels.back }}
    </button>
    <div class="game-play-shell-header__center">
      <span v-if="icon" class="game-play-shell-header__icon">{{ icon }}</span>
      <span class="game-play-shell-header__title">{{ title }}</span>
    </div>
    <div class="game-play-shell-header__stats">
      <span class="game-play-shell-header__score">{{ labels.score }} {{ score }}</span>
      <span v-if="combo >= 3" class="game-play-shell-header__combo">{{ labels.combo }} ×{{ combo }}</span>
    </div>
    <button
      v-if="showPause"
      type="button"
      class="game-play-shell-header__pause"
      :aria-label="paused ? labels.resume : labels.pause"
      @click="emit('toggle-pause')"
    >
      {{ paused ? '▶' : '⏸' }}
    </button>
  </header>
</template>

<script setup lang="ts">
import { GAME_PLAY_SHELL } from '@simple/constants/gamePlayShell';

withDefaults(
  defineProps<{
    title: string;
    score: number;
    combo?: number;
    icon?: string;
    paused?: boolean;
    showPause?: boolean;
  }>(),
  {
    combo: 0,
    icon: '',
    paused: false,
    showPause: true,
  },
);

const emit = defineEmits<{
  back: [];
  'toggle-pause': [];
}>();

const labels = GAME_PLAY_SHELL.labels;
</script>

<style scoped>
.game-play-shell-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 6px 10px;
  background: var(--game-shell-header-bg, rgba(15, 23, 42, 0.92));
  color: var(--game-shell-text, #f8fafc);
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  z-index: 2;
}

.game-play-shell-header__back {
  border: none;
  background: rgba(77, 150, 255, 0.2);
  color: #93c5fd;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.game-play-shell-header__center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.game-play-shell-header__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.game-play-shell-header__title {
  font-weight: 700;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-play-shell-header__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 64px;
}

.game-play-shell-header__score {
  font-weight: 700;
  color: #fbbf24;
}

.game-play-shell-header__combo {
  color: #f472b6;
  font-weight: 600;
}

.game-play-shell-header__pause {
  border: none;
  background: #4d96ff;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}
</style>