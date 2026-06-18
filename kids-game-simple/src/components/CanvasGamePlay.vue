<template>
  <div
    class="game-play-shell"
    :class="{
      'game-play-shell--landscape': landscapeMode,
      'game-play-shell--force-landscape': forceLandscape,
    }"
  >
    <GamePlayShellHeader
      v-if="showHeader"
      :title="title"
      :icon="guideIcon"
      :score="liveScore"
      :combo="liveCombo"
      :paused="session.isPaused.value"
      :show-pause="session.isPlaying.value || session.isPaused.value"
      @back="onBack"
      @toggle-pause="onTogglePause"
    />

    <div
      ref="canvasHost"
      class="game-play-shell__canvas"
      :class="{ 'game-play-shell__canvas--frozen': session.isPaused.value }"
    />

    <div v-if="session.phase.value === 'loading'" class="game-play-shell__loading">
      {{ shellLabels.loading }}
    </div>

    <GamePlayPauseOverlay
      v-if="session.isPaused.value"
      @resume="onTogglePause"
      @back="onBack"
    />

    <GamePlayResultPanel
      v-if="session.isEnded.value"
      :score="session.finalScore.value"
      :victory="session.victory.value"
      @back="onBack"
      @replay="replay"
    />

    <GameGuideOverlay
      v-if="session.phase.value === 'guide' && guide"
      :guide="guide"
      :accent="accentColor"
      @start="onGuideStart"
      @cancel="onGuideCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import type { GameGuide } from '@simple/types';
import { getGameRegistration, destroyGame, initGame, GAME_GUIDES } from '@simple/games/gameRegistry';
import { gameEngine } from '@simple/services/gameEngine';
import { mountMainGameCanvas, resolveGameViewport, isMobileViewport } from '@simple/services/canvasGameRuntime';
import { OrientationManager } from '@simple/utils/orientation';
import { storageService } from '@simple/services/storage';
import { userService } from '@simple/services/userService';
import GameGuideOverlay from '@simple/components/GameGuideOverlay.vue';
import GamePlayShellHeader from '@simple/components/game-play/GamePlayShellHeader.vue';
import GamePlayResultPanel from '@simple/components/game-play/GamePlayResultPanel.vue';
import GamePlayPauseOverlay from '@simple/components/game-play/GamePlayPauseOverlay.vue';
import { prepareEmbeddedCanvasPlay } from '@simple/services/embeddedGameLaunch';
import { useCanvasGameSession } from '@simple/composables/useCanvasGameSession';
import { GAME_PLAY_SHELL } from '@simple/constants/gamePlayShell';

const props = defineProps<{
  gameId: string;
}>();

const router = useRouter();
const canvasHost = ref<HTMLElement | null>(null);
const landscapeMode = ref(false);
const forceLandscape = ref(false);

const session = useCanvasGameSession(props.gameId);
const liveScore = session.liveScore;
const liveCombo = session.liveCombo;

let orientationManager: OrientationManager | null = null;
let scoreTimer: ReturnType<typeof setInterval> | null = null;
let launchPrepared = false;

const shellLabels = GAME_PLAY_SHELL.labels;

const registration = computed(() => getGameRegistration(props.gameId));
const title = computed(() => registration.value?.game.name ?? props.gameId);
const guide = computed<GameGuide | undefined>(() => GAME_GUIDES[props.gameId]);
const guideIcon = computed(() => guide.value?.icon ?? '');
const accentColor = computed(() => registration.value?.game.color?.split(',')[0] ?? '#4D96FF');

const showHeader = computed(
  () =>
    session.phase.value !== 'guide' &&
    session.phase.value !== 'loading' &&
    !session.isEnded.value,
);

function isGuideSkipped(): boolean {
  const skipped = userService.isLoggedIn
    ? userService.current?.guideSkipped
    : storageService.get().guideSkipped;
  return !!(skipped && skipped[props.gameId]);
}

function onBack() {
  teardownSession();
  router.push('/');
}

function onGuideCancel() {
  session.setPhase('guide');
  router.back();
}

function onTogglePause() {
  if (!session.isPlaying.value && !session.isPaused.value) return;
  session.togglePause();
  if (session.isPaused.value) gameEngine.pause();
  else gameEngine.resume();
}

async function ensureLaunchPrepared(): Promise<boolean> {
  if (launchPrepared) return true;
  const allowed = await prepareEmbeddedCanvasPlay(props.gameId);
  if (allowed) launchPrepared = true;
  return allowed;
}

function onGuideStart(skipNext: boolean) {
  if (skipNext) {
    if (userService.isLoggedIn) userService.skipGuide(props.gameId);
    else storageService.skipGuide(props.gameId);
  }
  void (async () => {
    if (!(await ensureLaunchPrepared())) {
      router.back();
      return;
    }
    void startSession();
  })();
}

function replay() {
  session.resetForReplay();
  launchPrepared = false;
  void (async () => {
    if (!(await ensureLaunchPrepared())) {
      router.back();
      return;
    }
    void startSession();
  })();
}

function teardownSession() {
  session.teardown();
  clearRuntimeOnly();
}

function wireEngineUiCallbacks() {
  gameEngine.setCallbacks({
    onComboShow: (combo) => {
      liveCombo.value = combo;
    },
    onComboBreak: () => {
      liveCombo.value = 0;
    },
  });
}

function clearRuntimeOnly() {
  if (scoreTimer) {
    clearInterval(scoreTimer);
    scoreTimer = null;
  }
  destroyGame(props.gameId);
  gameEngine.stop();
  gameEngine.endGame();
  orientationManager?.unlock?.();
  landscapeMode.value = false;
  forceLandscape.value = false;
}

async function startSession() {
  const reg = registration.value;
  if (!reg || !canvasHost.value) {
    session.setPhase('guide');
    return;
  }

  clearRuntimeOnly();
  session.beginSession();

  wireEngineUiCallbacks();
  gameEngine.start();
  const vp = resolveGameViewport(props.gameId);
  landscapeMode.value = vp.isLandscapeGame;

  if (vp.isLandscapeGame) {
    if (!orientationManager) orientationManager = new OrientationManager();
    orientationManager.tryLockLandscape();
    if (isMobileViewport()) forceLandscape.value = true;
  }

  mountMainGameCanvas(canvasHost.value, vp, !!reg.isSpecial);

  const ok = await initGame(props.gameId, gameEngine, () => {
    if (!session.sessionActive.value) return;
    const score = gameEngine.getScore();
    liveScore.value = score;
    session.endSession({
      score,
      victory: gameEngine.isVictory(),
      stats: gameEngine.getGameStats(),
    });
    gameEngine.endGame();
  });

  if (!ok) {
    session.teardown();
    return;
  }

  session.markPlaying();

  scoreTimer = setInterval(() => {
    if (gameEngine.isRunning() && session.isPlaying.value) {
      liveScore.value = gameEngine.getScore();
      liveCombo.value = gameEngine.getCombo();
    }
  }, 200);
}

onMounted(async () => {
  if (!registration.value) {
    router.replace('/');
    return;
  }
  if (!isGuideSkipped() && guide.value) {
    session.setPhase('guide');
    return;
  }
  if (!(await ensureLaunchPrepared())) {
    router.back();
    return;
  }
  void startSession();
});

onUnmounted(() => {
  teardownSession();
});
</script>

<style scoped>
.game-play-shell {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  background: var(--game-shell-bg, #0f172a);
  color: #fff;
}

.game-play-shell__canvas {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.game-play-shell__canvas--frozen {
  pointer-events: none;
  filter: brightness(0.55);
}

.game-play-shell__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 140;
  font-size: 16px;
}

.game-play-shell--landscape.game-play-shell--force-landscape .game-play-shell__canvas {
  width: 100vh;
  height: 100vw;
  transform: rotate(90deg);
  transform-origin: center center;
}
</style>