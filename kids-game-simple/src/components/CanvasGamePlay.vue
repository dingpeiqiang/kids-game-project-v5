<template>
  <div
    class="game-play-shell"
    :class="{
      'game-play-shell--landscape': landscapeMode,
      'game-play-shell--force-landscape': forceLandscape,
      'game-play-shell--compact-footer': shellLayout.compactFooter,
      'game-play-shell--immersive-header': shellLayout.immersiveHeader,
    }"
    :style="landscapeShellStyle"
  >
    <GamePlayShellHeader
      v-if="showHeader"
      :title="title"
      :icon="guideIcon"
      :score="liveScore"
      :combo="liveCombo"
      :paused="session.isPaused.value"
      :show-score="shellLayout.showPlatformScore"
      :show-pause="
        shellLayout.showPlatformPause &&
        (session.isPlaying.value || session.isPaused.value)
      "
      :immersive-header="shellLayout.immersiveHeader"
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
      :prev-best="sessionPrevBest"
      :stats="resultStats"
      :rank-badge="resultRankLocal?.badge"
      :rank-text="resultRankLocal?.text"
      :server-rank="resultServerRank"
      :synced="resultSynced"
      :crits="resultCrits"
      :combo="resultCombo"
      @back="onBack"
      @replay="replay"
      @reset-guide="onResetGuide"
    />

    <GameGuideOverlay
      v-if="session.phase.value === 'guide' && guide"
      :guide="guide"
      :accent="accentColor"
      :game-code="props.gameId"
      :custom-panel="guideCustomPanel"
      @start="onGuideStart"
      @cancel="onGuideCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue';
import { useRouter } from 'vue-router';
import type { GameGuide } from '@simple/types';
import { getGameRegistration, destroyGame, initGame } from '@simple/games/gameRegistry';
import { hasGameGuide, loadGameGuideModule } from '@simple/platform/gameGuide';
import { mergeGuideWithControlHint } from '@simple/platform/mobileControls';
import { gameEngine } from '@simple/services/gameEngine';
import {
  mountMainGameCanvas,
  resolveGameViewport,
  shouldForceLandscapeOnMobile,
  syncLandscapeMainCanvas,
  type GameViewport,
} from '@simple/services/canvasGameRuntime';
import { OrientationManager } from '@simple/utils/orientation';
import { storageService } from '@simple/services/storage';
import { userService } from '@simple/services/userService';
import GameGuideOverlay from '@simple/components/GameGuideOverlay.vue';
import GamePlayShellHeader from '@simple/components/game-play/GamePlayShellHeader.vue';
import GamePlayResultPanel from '@simple/components/game-play/GamePlayResultPanel.vue';
import GamePlayPauseOverlay from '@simple/components/game-play/GamePlayPauseOverlay.vue';
import { prepareEmbeddedCanvasPlay } from '@simple/services/embeddedGameLaunch';
import {
  installGameEventBridge,
  uninstallGameEventBridge,
  setGameEndHandler,
} from '@simple/platform';
import { useCanvasGameSession } from '@simple/composables/useCanvasGameSession';
import { GAME_PLAY_SHELL } from '@simple/constants/gamePlayShell';
import { getGameLayoutConfig } from '@simple/games/gameLayout';
import {
  mountLandscapeRotateHint,
  unmountLandscapeRotateHint,
  resetRotateDismissForNewGame,
  setRouteLandscapeSessionActive,
} from '@simple/app/gameShellOrientation';
import { LOBBY_HOME_PATH, navigateToLobbyHome } from '@simple/router/navigation';
import { calculateRankDisplay } from '@simple/app/rankDisplay';
import type { GameResultStats } from '@simple/types/gameResult';

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
const guide = ref<GameGuide | undefined>();
const guideCustomPanel = ref<Component | undefined>();
const guideIcon = computed(() => guide.value?.icon ?? '');
const accentColor = computed(() => registration.value?.game.color?.split(',')[0] ?? '#4D96FF');

const shellLayout = computed(() => {
  const layout = getGameLayoutConfig(props.gameId);
  return {
    compactFooter: !!layout.compactFooter,
    showPlatformScore: !layout.hidePlatformScore,
    showPlatformPause: !layout.hidePlatformPause,
    immersiveHeader: !!layout.immersiveHeader,
  };
});

const showHeader = computed(() => true);

const landscapeShellStyle = computed(() => {
  if (!landscapeMode.value || !forceLandscape.value) return undefined;
  const layout = getGameLayoutConfig(props.gameId);
  const ratio = layout.designHeight / layout.designWidth;
  return { '--game-ratio': String(ratio) };
});

let sessionLandscapeResizeHandler: (() => void) | null = null;
let activeLandscapeVp: GameViewport | null = null;

const sessionPrevBest = ref(0);
const resultStats = ref<GameResultStats | null>(null);
const resultRankLocal = ref<{ badge: string; text: string } | null>(null);
const resultServerRank = ref<number | null>(null);
const resultSynced = ref(false);
const resultCrits = ref(0);
const resultCombo = ref(0);

function resetResultPresentation() {
  sessionPrevBest.value = 0;
  resultStats.value = null;
  resultRankLocal.value = null;
  resultServerRank.value = null;
  resultSynced.value = false;
  resultCrits.value = 0;
  resultCombo.value = 0;
}

function normalizeResultStats(raw: unknown): GameResultStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  return {
    maxCombo: typeof s.maxCombo === 'number' ? s.maxCombo : undefined,
    totalKills: typeof s.totalKills === 'number' ? s.totalKills : undefined,
    gameTime: typeof s.gameTime === 'number' ? s.gameTime : undefined,
    level: typeof s.level === 'number' ? s.level : undefined,
    won: typeof s.won === 'boolean' ? s.won : undefined,
  };
}

function isGuideSkipped(): boolean {
  const skipped = userService.isLoggedIn
    ? userService.current?.guideSkipped
    : storageService.get().guideSkipped;
  return !!(skipped && skipped[props.gameId]);
}

function leavePlayRoute() {
  teardownSession();
  if (window.history.length > 1) {
    router.back();
  } else {
    navigateToLobbyHome();
  }
}

function onBack() {
  leavePlayRoute();
}

function onGuideCancel() {
  session.setPhase('guide');
  leavePlayRoute();
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
      leavePlayRoute();
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
      leavePlayRoute();
      return;
    }
    void startSession();
  })();
}

function finishSessionFromEngine() {
  if (!session.sessionActive.value) return;
  const score = gameEngine.getScore();
  const victory = gameEngine.isVictory();
  const rawStats = gameEngine.getGameStats();
  const prevBest =
    userService.isLoggedIn && userService.current
      ? userService.current.bestScores[props.gameId] ?? 0
      : storageService.get().bestScores?.[props.gameId] ?? 0;

  sessionPrevBest.value = prevBest;
  resultStats.value = normalizeResultStats(rawStats);
  resultCrits.value = gameEngine.getCrits();
  resultCombo.value = gameEngine.getCombo();
  resultRankLocal.value = calculateRankDisplay(score);
  resultServerRank.value = null;
  resultSynced.value = false;

  liveScore.value = score;
  session.endSession({
    score,
    victory,
    stats: rawStats,
  });
  gameEngine.endGame();

  void userService.recordGameResult(props.gameId, score, rawStats).then((result) => {
    resultSynced.value = result.synced;
    if (result.rank != null) resultServerRank.value = result.rank;
    window.dispatchEvent(new CustomEvent('ugp:userChange'));
    window.dispatchEvent(new CustomEvent('ugp:tasksRefresh'));
  });
}

async function onResetGuide() {
  if (userService.isLoggedIn) userService.resetGuide(props.gameId);
  else storageService.resetGuide(props.gameId);
  resetResultPresentation();
  const hasGuide = await resolveGuideForPlay();
  if (hasGuide) session.setPhase('guide');
}

function teardownSession() {
  setGameEndHandler(null);
  uninstallGameEventBridge();
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

function clearLandscapeViewportListeners() {
  if (sessionLandscapeResizeHandler) {
    window.removeEventListener('resize', sessionLandscapeResizeHandler);
    window.visualViewport?.removeEventListener('resize', sessionLandscapeResizeHandler);
    sessionLandscapeResizeHandler = null;
  }
  activeLandscapeVp = null;
}

function clearRuntimeOnly() {
  if (scoreTimer) {
    clearInterval(scoreTimer);
    scoreTimer = null;
  }
  clearLandscapeViewportListeners();
  setRouteLandscapeSessionActive(false);
  unmountLandscapeRotateHint();
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
  resetResultPresentation();
  session.beginSession();

  wireEngineUiCallbacks();
  gameEngine.start();
  const layout = getGameLayoutConfig(props.gameId);
  const portraitHeldForce = shouldForceLandscapeOnMobile(props.gameId);
  const vp = resolveGameViewport(props.gameId, portraitHeldForce);
  landscapeMode.value = vp.isLandscapeGame;

  if (vp.isLandscapeGame) {
    if (!orientationManager) orientationManager = new OrientationManager();
    orientationManager.tryLockLandscape();
    forceLandscape.value = portraitHeldForce;
    resetRotateDismissForNewGame();
    setRouteLandscapeSessionActive(true);
    mountLandscapeRotateHint({
      forceLandscapeOnMobile: layout.forceLandscapeOnMobile !== false,
      orientationManager,
    });
  }

  mountMainGameCanvas(canvasHost.value, vp, !!reg.isSpecial, portraitHeldForce);

  if (vp.isLandscapeGame && !reg.isSpecial) {
    activeLandscapeVp = vp;
    const syncLandscapeCanvas = () => {
      const cvs = document.getElementById('mainGameCanvas') as HTMLCanvasElement | null;
      if (!cvs || !activeLandscapeVp) return;
      const held = shouldForceLandscapeOnMobile(props.gameId);
      forceLandscape.value = held;
      syncLandscapeMainCanvas(cvs, activeLandscapeVp, held);
    };
    sessionLandscapeResizeHandler = syncLandscapeCanvas;
    window.addEventListener('resize', sessionLandscapeResizeHandler);
    window.visualViewport?.addEventListener('resize', sessionLandscapeResizeHandler);
  }

  installGameEventBridge();
  setGameEndHandler(() => {
    destroyGame(props.gameId);
    finishSessionFromEngine();
  });

  const ok = await initGame(props.gameId, gameEngine, () => {
    destroyGame(props.gameId);
    finishSessionFromEngine();
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

async function resolveGuideForPlay(): Promise<boolean> {
  if (!hasGameGuide(props.gameId)) return false;
  const mod = await loadGameGuideModule(props.gameId);
  if (!mod) return false;
  guide.value = mergeGuideWithControlHint(props.gameId, mod.guide);
  guideCustomPanel.value = mod.GuidePage;
  return true;
}

onMounted(async () => {
  if (!registration.value) {
    router.replace(LOBBY_HOME_PATH);
    return;
  }
  if (!isGuideSkipped()) {
    const hasGuide = await resolveGuideForPlay();
    if (hasGuide) {
      session.setPhase('guide');
      return;
    }
  }
  if (!(await ensureLaunchPrepared())) {
    leavePlayRoute();
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
  z-index: 1;
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
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(90deg);
  width: 100vh !important;
  height: calc(100vh * var(--game-ratio, 0.47)) !important;
  flex-shrink: 0;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.game-play-shell--landscape:not(.game-play-shell--force-landscape) .game-play-shell__canvas {
  display: flex;
  align-items: center;
  justify-content: center;
}

/** 3D / 横屏：为游戏内底栏或虚拟键预留安全区，避免与系统 Home 条重叠 */
.game-play-shell--compact-footer .game-play-shell__canvas {
  padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

/** 沉浸式：顶栏收起时画布占满壳层 */
.game-play-shell--immersive-header :deep(.game-play-header--hidden) {
  display: none;
}

.game-play-shell--immersive-header :deep(.game-play-header__toggle) {
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  right: calc(env(safe-area-inset-right, 0px) + 8px);
  left: auto;
}

.game-play-shell--landscape.game-play-shell--immersive-header :deep(.game-play-header__toggle) {
  top: auto;
  bottom: max(8px, env(safe-area-inset-bottom, 0px));
  right: calc(env(safe-area-inset-right, 0px) + 8px);
  left: auto;
}

.game-play-shell--landscape.game-play-shell--immersive-header :deep(.game-play-header__back-float) {
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  left: calc(env(safe-area-inset-left, 0px) + 8px);
}

.game-play-shell--force-landscape.game-play-shell--immersive-header :deep(.game-play-header__toggle) {
  transform: rotate(-90deg);
  right: calc(env(safe-area-inset-right, 0px) + 8px);
  bottom: calc(50% - 22px);
}
</style>