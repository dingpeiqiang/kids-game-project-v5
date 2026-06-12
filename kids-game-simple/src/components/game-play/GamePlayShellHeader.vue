<template>
  <header class="game-play-header">
    <button type="button" class="game-play-header__back" @click="emit('back')">
      ← {{ labels.back }}
    </button>
    <div class="game-play-header__center">
      <span v-if="icon" class="game-play-header__icon">{{ icon }}</span>
      <span class="game-play-header__title">{{ title }}</span>
    </div>
    <div class="game-play-header__stats">
      <span class="game-play-header__score">{{ labels.score }} {{ score }}</span>
      <span v-if="combo >= 3" class="game-play-header__combo">{{ labels.combo }} ×{{ combo }}</span>
    </div>
    <button
      v-if="showPause"
      type="button"
      class="game-play-header__pause"
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
    icon?: string;
    score: number;
    combo?: number;
    paused?: boolean;
    showPause?: boolean;
  }>(),
  {
    icon: '',
    combo: 0,
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
.game-play-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  min-height: 48px;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.92);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  z-index: 2;
}

.game-play-header__back {
  border: none;
  background: transparent;
  color: #93c5fd;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 4px 6px;
}

.game-play-header__center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.game-play-header__icon {
  font-size: 1.1rem;
}

.game-play-header__title {
  font-weight: 600;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-play-header__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  line-height: 1.25;
  flex-shrink: 0;
}

.game-play-header__score {
  font-variant-numeric: tabular-nums;
  color: #fbbf24;
  font-weight: 700;
}

.game-play-header__combo {
  color: #f472b6;
  font-weight: 600;
}

.game-play-header__pause {
  border: none;
  background: rgba(77, 150, 255, 0.35);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 14px;
}
</style>