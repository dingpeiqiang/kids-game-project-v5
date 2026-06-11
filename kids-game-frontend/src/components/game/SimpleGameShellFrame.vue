<template>
  <div class="simple-game-shell" :class="{ 'is-paused': paused }">
    <header class="simple-game-shell__hud">
      <button
        type="button"
        class="simple-game-shell__back"
        aria-label="退出"
        @click="$emit('exit')"
      >
        ←
      </button>
      <div class="simple-game-shell__title">{{ title }}</div>
      <div class="simple-game-shell__stats">
        <span v-if="showScore" class="simple-game-shell__score">得分 {{ score }}</span>
        <span v-if="showRound" class="simple-game-shell__round">
          第 {{ round }} / {{ totalRounds }} 关
        </span>
        <span v-if="showProgress" class="simple-game-shell__progress">
          {{ progressCurrent }} / {{ progressTotal }}
        </span>
      </div>
      <button
        v-if="showPause"
        type="button"
        class="simple-game-shell__pause"
        :aria-label="paused ? '继续' : '暂停'"
        @click="$emit('toggle-pause')"
      >
        {{ paused ? '▶' : '⏸' }}
      </button>
    </header>

    <main class="simple-game-shell__body">
      <slot />
    </main>

    <footer v-if="$slots.footer" class="simple-game-shell__footer">
      <slot name="footer" />
    </footer>

    <div v-if="paused" class="simple-game-shell__pause-overlay">
      <p>已暂停</p>
      <button type="button" class="simple-game-shell__btn" @click="$emit('toggle-pause')">
        继续游戏
      </button>
      <button type="button" class="simple-game-shell__btn simple-game-shell__btn--ghost" @click="$emit('exit')">
        退出
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    score?: number;
    round?: number;
    totalRounds?: number;
    progressCurrent?: number;
    progressTotal?: number;
    paused?: boolean;
    hideScore?: boolean;
    hideRound?: boolean;
    hidePause?: boolean;
  }>(),
  {
    title: '',
    score: 0,
    round: 1,
    totalRounds: 1,
    progressCurrent: 0,
    progressTotal: 0,
    paused: false,
    hideScore: false,
    hideRound: false,
    hidePause: false,
  },
);

defineEmits<{
  exit: [];
  'toggle-pause': [];
}>();

const showScore = computed(() => !props.hideScore);
const showRound = computed(() => !props.hideRound && props.totalRounds > 1);
const showProgress = computed(
  () => props.progressTotal > 0 && props.progressCurrent >= 0,
);
const showPause = computed(() => !props.hidePause);
</script>

<style scoped lang="scss">
.simple-game-shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  height: 100%;
  background: var(--simple-shell-bg, linear-gradient(180deg, #e8f4ff 0%, #f5f9ff 100%));
  color: var(--simple-shell-fg, #1a2b4a);
  position: relative;
}

.simple-game-shell__hud {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  z-index: 2;
}

.simple-game-shell__back,
.simple-game-shell__pause {
  border: none;
  background: #4a90e2;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.simple-game-shell__title {
  flex: 1;
  font-weight: 700;
  font-size: 16px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.simple-game-shell__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  gap: 2px;
  min-width: 72px;
}

.simple-game-shell__score {
  font-weight: 700;
  color: #e67e22;
}

.simple-game-shell__body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.simple-game-shell__footer {
  flex-shrink: 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.simple-game-shell__pause-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
  color: #fff;
}

.simple-game-shell__btn {
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  background: #4a90e2;
  color: #fff;
  font-size: 15px;
  cursor: pointer;

  &--ghost {
    background: transparent;
    border: 2px solid #fff;
  }
}
</style>