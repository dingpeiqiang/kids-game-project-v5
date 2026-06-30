import { computed, ref, shallowRef } from 'vue';
import type { CanvasGameSessionPhase } from '@shell/constants/gamePlayShell';

export interface CanvasGameEndPayload {
  score: number;
  victory: boolean;
  stats?: unknown;
}

export function useCanvasGameSession(gameId: string) {
  const phase = ref<CanvasGameSessionPhase>('guide');
  const liveScore = ref(0);
  const liveCombo = ref(0);
  const finalScore = ref(0);
  const victory = ref(false);
  const sessionActive = shallowRef(false);

  const isPlaying = computed(() => phase.value === 'playing');
  const isPaused = computed(() => phase.value === 'paused');
  const isEnded = computed(() => phase.value === 'ended');

  function setPhase(next: CanvasGameSessionPhase) {
    phase.value = next;
  }

  function beginSession() {
    sessionActive.value = true;
    liveScore.value = 0;
    liveCombo.value = 0;
    finalScore.value = 0;
    victory.value = false;
    phase.value = 'loading';
  }

  function markPlaying() {
    phase.value = 'playing';
  }

  function togglePause() {
    if (phase.value === 'playing') phase.value = 'paused';
    else if (phase.value === 'paused') phase.value = 'playing';
  }

  function endSession(payload: CanvasGameEndPayload) {
    if (!sessionActive.value) return;
    finalScore.value = payload.score;
    victory.value = payload.victory;
    phase.value = 'ended';
    sessionActive.value = false;
  }

  function resetForReplay() {
    finalScore.value = 0;
    victory.value = false;
    liveScore.value = 0;
    liveCombo.value = 0;
    sessionActive.value = false;
    phase.value = 'loading';
  }

  function teardown() {
    sessionActive.value = false;
    phase.value = 'guide';
  }

  return {
    gameId,
    phase,
    liveScore,
    liveCombo,
    finalScore,
    victory,
    sessionActive,
    isPlaying,
    isPaused,
    isEnded,
    setPhase,
    beginSession,
    markPlaying,
    togglePause,
    endSession,
    resetForReplay,
    teardown,
  };
}