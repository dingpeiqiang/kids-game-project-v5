/**
 * Simple 游戏统一壳层 API：分数、回合、暂停、完成上报。
 * 由 SimpleGameHost provide，子游戏通过 useGameShell() 消费。
 */
import {
  computed,
  inject,
  provide,
  ref,
  shallowRef,
  type InjectionKey,
  type Ref,
} from 'vue';

export type SimpleGameShellPhase = 'idle' | 'playing' | 'paused' | 'completed';

export interface SimpleGameCompleteResult {
  score: number;
  stars?: number;
  maxScore?: number;
  correctCount?: number;
  totalCount?: number;
  durationMs?: number;
  payload?: Record<string, unknown>;
}

export interface SimpleGamePlayingShellOptions {
  gameId: string;
  sessionId?: string;
  title?: string;
  totalRounds?: number;
  onComplete?: (result: SimpleGameCompleteResult) => void | Promise<void>;
  onExit?: () => void;
  onPauseChange?: (paused: boolean) => void;
}

export interface SimpleGameShell {
  gameId: Ref<string>;
  title: Ref<string>;
  phase: Ref<SimpleGameShellPhase>;
  score: Ref<number>;
  round: Ref<number>;
  totalRounds: Ref<number>;
  progressCurrent: Ref<number>;
  progressTotal: Ref<number>;
  paused: Ref<boolean>;
  setTitle: (title: string) => void;
  setScore: (score: number) => void;
  addScore: (delta: number) => void;
  setRound: (round: number) => void;
  nextRound: () => void;
  setProgress: (current: number, total: number) => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  requestExit: () => void;
  complete: (result?: Partial<SimpleGameCompleteResult>) => void;
  fail: (reason?: string) => void;
}

export const GAME_SHELL_KEY: InjectionKey<SimpleGameShell> = Symbol('simple-game-shell');

export function provideGameShell(shell: SimpleGameShell): void {
  provide(GAME_SHELL_KEY, shell);
}

export function useGameShell(): SimpleGameShell {
  const shell = inject(GAME_SHELL_KEY);
  if (!shell) {
    throw new Error(
      '[useGameShell] 未找到壳层上下文，请确保游戏在 SimpleGameHost 内渲染，并使用 SimpleGameShellFrame。',
    );
  }
  return shell;
}

/** 可选注入：独立预览组件时不抛错 */
export function useGameShellOptional(): SimpleGameShell | null {
  return inject(GAME_SHELL_KEY, null);
}

export function createSimpleGamePlayingShell(
  options: SimpleGamePlayingShellOptions,
): SimpleGameShell {
  const gameId = ref(options.gameId);
  const title = ref(options.title ?? '');
  const phase = ref<SimpleGameShellPhase>('idle');
  const score = ref(0);
  const round = ref(1);
  const totalRounds = ref(options.totalRounds ?? 1);
  const progressCurrent = ref(0);
  const progressTotal = ref(0);
  const paused = ref(false);
  const startedAt = shallowRef<number | null>(null);

  const ensurePlaying = () => {
    if (phase.value === 'idle') {
      phase.value = 'playing';
      startedAt.value = Date.now();
    }
  };

  const shell: SimpleGameShell = {
    gameId,
    title,
    phase,
    score,
    round,
    totalRounds,
    progressCurrent,
    progressTotal,
    paused,
    setTitle(t) {
      title.value = t;
    },
    setScore(v) {
      ensurePlaying();
      score.value = Math.max(0, Math.floor(v));
    },
    addScore(delta) {
      ensurePlaying();
      score.value = Math.max(0, score.value + Math.floor(delta));
    },
    setRound(n) {
      round.value = Math.max(1, Math.floor(n));
    },
    nextRound() {
      if (round.value < totalRounds.value) {
        round.value += 1;
      }
    },
    setProgress(current, total) {
      progressCurrent.value = Math.max(0, Math.floor(current));
      progressTotal.value = Math.max(0, Math.floor(total));
    },
    pause() {
      if (phase.value !== 'playing') return;
      paused.value = true;
      phase.value = 'paused';
      options.onPauseChange?.(true);
    },
    resume() {
      if (phase.value !== 'paused') return;
      paused.value = false;
      phase.value = 'playing';
      options.onPauseChange?.(false);
    },
    togglePause() {
      if (paused.value) shell.resume();
      else shell.pause();
    },
    requestExit() {
      options.onExit?.();
    },
    complete(partial) {
      if (phase.value === 'completed') return;
      phase.value = 'completed';
      paused.value = false;
      const durationMs =
        partial?.durationMs ??
        (startedAt.value != null ? Date.now() - startedAt.value : undefined);
      const result: SimpleGameCompleteResult = {
        score: partial?.score ?? score.value,
        stars: partial?.stars,
        maxScore: partial?.maxScore,
        correctCount: partial?.correctCount,
        totalCount: partial?.totalCount,
        durationMs,
        payload: partial?.payload,
      };
      void options.onComplete?.(result);
    },
    fail(_reason) {
      shell.complete({ score: score.value, payload: { failed: true } });
    },
  };

  return shell;
}

/** 模板用：将 shell 转为 SimpleGameShellFrame 的 props */
export function useGameShellFrameProps(shell: SimpleGameShell) {
  return computed(() => ({
    title: shell.title.value,
    score: shell.score.value,
    round: shell.round.value,
    totalRounds: shell.totalRounds.value,
    progressCurrent: shell.progressCurrent.value,
    progressTotal: shell.progressTotal.value,
    paused: shell.paused.value,
    phase: shell.phase.value,
  }));
}