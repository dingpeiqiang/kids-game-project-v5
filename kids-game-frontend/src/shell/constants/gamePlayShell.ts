/** 终端 Canvas 游戏统一壳层视觉与文案 */
export const GAME_PLAY_SHELL = {
  headerHeight: 48,
  zIndex: {
    shell: 100,
    guide: 200,
    pause: 150,
    result: 160,
    loading: 140,
  },
  labels: {
    back: '返回',
    score: '得分',
    combo: '连击',
    loading: '加载游戏中…',
    resultTitle: '本局结束',
    resultVictory: '挑战成功',
    resultDefeat: '再接再厉',
    replay: '再来一局',
    pause: '暂停',
    resume: '继续游戏',
    pausedTitle: '已暂停',
  },
  colors: {
    bg: '#0f172a',
    headerBg: 'rgba(15, 23, 42, 0.92)',
    accent: '#4d96ff',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    cardBg: '#ffffff',
    cardText: '#0f172a',
  },
} as const;

export type CanvasGameSessionPhase =
  | 'guide'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended';