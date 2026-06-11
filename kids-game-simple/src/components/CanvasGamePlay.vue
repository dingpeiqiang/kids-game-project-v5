<template>
  <div class="canvas-game-play" :class="{ 'landscape-mode': landscapeMode, 'force-landscape': forceLandscape }">
    <header class="play-header">
      <button type="button" class="back-btn" @click="onBack">← 返回</button>
      <span class="title">{{ title }}</span>
      <span class="score">得分 {{ liveScore }}</span>
    </header>
    <div ref="canvasHost" class="canvas-host" />
    <div v-if="loading" class="loading-mask">加载游戏中…</div>
    <div v-if="ended" class="result-mask">
      <div class="result-card">
        <p class="result-title">本局结束</p>
        <p class="result-score">{{ finalScore }}</p>
        <div class="result-actions">
          <button type="button" @click="onBack">返回</button>
          <button type="button" class="primary" @click="replay">再来一局</button>
        </div>
      </div>
    </div>
    <GameGuideOverlay
      v-if="showGuide && guide"
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
import { prepareEmbeddedCanvasPlay } from '@simple/services/embeddedGameLaunch';

const props = defineProps<{
  gameId: string;
}>();

const router = useRouter();
const canvasHost = ref<HTMLElement | null>(null);
const loading = ref(true);
const ended = ref(false);
const showGuide = ref(false);
const liveScore = ref(0);
const finalScore = ref(0);
const landscapeMode = ref(false);
const forceLandscape = ref(false);

let orientationManager: OrientationManager | null = null;
let scoreTimer: ReturnType<typeof setInterval> | null = null;
let sessionActive = false;
let launchPrepared = false;

const registration = computed(() => getGameRegistration(props.gameId));
const title = computed(() => registration.value?.game.name ?? props.gameId);
const guide = computed<GameGuide | undefined>(() => GAME_GUIDES[props.gameId]);
const accentColor = computed(() => registration.value?.game.color?.split(',')[0] ?? '#4D96FF');

function isGuideSkipped(): boolean {
  const skipped = userService.isLoggedIn
    ? userService.current?.guideSkipped
    : storageService.get().guideSkipped;
  return !!(skipped && skipped[props.gameId]);
}

function onBack() {
  teardownSession();
  router.back();
}

function onGuideCancel() {
  showGuide.value = false;
  router.back();
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
  showGuide.value = false;
  void (async () => {
    if (!(await ensureLaunchPrepared())) {
      router.back();
      return;
    }
    void startSession();
  })();
}

function replay() {
  ended.value = false;
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
  sessionActive = false;
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
    loading.value = false;
    return;
  }

  loading.value = true;
  ended.value = false;
  teardownSession();
  sessionActive = true;

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
    if (!sessionActive) return;
    finalScore.value = gameEngine.getScore();
    liveScore.value = finalScore.value;
    ended.value = true;
    gameEngine.endGame();
  });

  loading.value = false;
  if (!ok) return;

  scoreTimer = setInterval(() => {
    if (gameEngine.isRunning()) liveScore.value = gameEngine.getScore();
  }, 200);
}

onMounted(async () => {
  if (!registration.value) {
    router.replace('/');
    return;
  }
  if (!isGuideSkipped() && guide.value) {
    showGuide.value = true;
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
.canvas-game-play {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  color: #fff;
}
.play-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}
.back-btn {
  border: none;
  background: transparent;
  color: #93c5fd;
  font-size: 16px;
  cursor: pointer;
}
.title {
  flex: 1;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.score {
  font-variant-numeric: tabular-nums;
  opacity: 0.9;
}
.canvas-host {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.loading-mask,
.result-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}
.result-card {
  background: #fff;
  color: #111;
  padding: 24px 32px;
  border-radius: 16px;
  text-align: center;
}
.result-score {
  font-size: 2rem;
  font-weight: 700;
  margin: 12px 0;
}
.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}
.result-actions button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
  cursor: pointer;
}
.result-actions .primary {
  background: #4d96ff;
  color: #fff;
  border-color: #4d96ff;
}
.landscape-mode.force-landscape .canvas-host {
  width: 100vh;
  height: 100vw;
  transform: rotate(90deg);
  transform-origin: center center;
}
</style>