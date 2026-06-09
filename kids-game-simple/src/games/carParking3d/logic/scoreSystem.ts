import { GameState, PlayerData, ParkingResult } from '../types';
import { GAME_CONFIG } from '../config';

const STORAGE_KEY = 'carParking3d_playerData';

export function calculateFinalScore(baseScore: number, timeRemaining: number, maxTime: number): number {
  const timeBonus = Math.round((timeRemaining / Math.max(maxTime, 1)) * 20);
  return Math.min(100, baseScore + timeBonus);
}

export function isPerfectScore(score: number): boolean {
  return score >= GAME_CONFIG.PERFECT_SCORE_THRESHOLD;
}

function defaultPlayerData(): PlayerData {
  return {
    bestScore: 0,
    levelBests: {},
    completedLevels: [],
    perfectLevels: [],
    totalAttempts: 0,
    guideSeen: false,
  };
}

export function loadPlayerData(): PlayerData {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultPlayerData();
  try {
    const parsed = JSON.parse(saved) as Partial<PlayerData>;
    return {
      ...defaultPlayerData(),
      ...parsed,
      levelBests: parsed.levelBests ?? {},
      completedLevels: parsed.completedLevels ?? [],
      perfectLevels: parsed.perfectLevels ?? [],
    };
  } catch {
    return defaultPlayerData();
  }
}

export function savePlayerData(data: PlayerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function markGuideSeen(): void {
  const data = loadPlayerData();
  data.guideSeen = true;
  savePlayerData(data);
}

export function getLevelBest(levelId: number): number {
  return loadPlayerData().levelBests[levelId] ?? 0;
}

export function updatePlayerData(levelId: number, score: number, isPerfect: boolean): PlayerData {
  const data = loadPlayerData();

  data.totalAttempts++;

  if (score > data.bestScore) {
    data.bestScore = score;
  }

  const prevLevel = data.levelBests[levelId] ?? 0;
  if (score > prevLevel) {
    data.levelBests[levelId] = score;
  }

  if (!data.completedLevels.includes(levelId)) {
    data.completedLevels.push(levelId);
  }

  if (isPerfect && !data.perfectLevels.includes(levelId)) {
    data.perfectLevels.push(levelId);
  }

  savePlayerData(data);
  return data;
}

export function resetGameState(state: GameState, levelTime: number): GameState {
  return {
    currentLevel: state.currentLevel,
    score: 0,
    maxScore: 100,
    timeRemaining: levelTime,
    collisions: 0,
    maxCollisions: GAME_CONFIG.MAX_COLLISIONS,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    isCompleted: false,
    isPerfect: false,
  };
}

export function updateScoreFromParking(result: ParkingResult): number {
  return result.score;
}