<template>
  <button
    type="button"
    class="game-play-header__toggle"
    :class="{ 'game-play-header__toggle--hidden': isHeaderVisible }"
    @click="toggleHeader"
    aria-label="Toggle header"
  >
    ☰
  </button>
  
  <header
    class="game-play-header"
    :class="{ 'game-play-header--hidden': !isHeaderVisible }"
  >
    <button type="button" class="game-play-header__back" @click="handleBack">
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
      @click="handleTogglePause"
    >
      {{ paused ? '▶' : '⏸' }}
    </button>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GAME_PLAY_SHELL } from '@simple/constants/gamePlayShell';

const props = withDefaults(
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
const isHeaderVisible = ref(false);

function toggleHeader() {
  isHeaderVisible.value = !isHeaderVisible.value;
}

function handleBack() {
  emit('back');
}

function handleTogglePause() {
  emit('toggle-pause');
}
</script>

<style scoped>
.game-play-header__toggle {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  left: calc(env(safe-area-inset-left, 0px) + 8px);
  z-index: 101;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  min-height: 44px;
}

.game-play-header__toggle:hover {
  background: rgba(15, 23, 42, 0.9);
}

.game-play-header__toggle--hidden {
  opacity: 0;
  pointer-events: none;
}

.game-play-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  min-height: 48px;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.92);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  z-index: 100;
  position: relative;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.game-play-header--hidden {
  transform: translateY(-100%) !important;
  opacity: 0 !important;
  pointer-events: none !important;
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  display: none;
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

.game-play-shell--landscape .game-play-header__toggle {
  top: auto;
  bottom: 8px;
  left: 8px;
}

.game-play-shell--force-landscape .game-play-header__toggle {
  transform: rotate(-90deg);
  left: auto;
  right: calc(env(safe-area-inset-right, 0px) + 8px);
  bottom: calc(50% - 18px);
}
</style>
