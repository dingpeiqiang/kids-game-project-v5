import { GameState, PlayerData, ParkingResult } from '../types';
import { GAME_CONFIG } from '../config';

export function calculateFinalScore(baseScore: number, timeRemaining: number, maxTime: number): number {
  const timeBonus = Math.round((timeRemaining / maxTime) * 20);
  return Math.min(100, baseScore + timeBonus);
}

export function isPerfectScore(score: number): boolean {
  return score >= GAME_CONFIG.PERFECT_SCORE_THRESHOLD;
}

export function loadPlayerData(): PlayerData {
  const saved = localStorage.getItem('carParking3d_playerData');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    bestScore: 0,
    completedLevels: [],
    perfectLevels: [],
    totalAttempts: 0,
  };
}

export function savePlayerData(data: PlayerData): void {
  localStorage.setItem('carParking3d_playerData', JSON.stringify(data));
}

export function updatePlayerData(levelId: number, score: number, isPerfect: boolean): PlayerData {
  const data = loadPlayerData();
  
  data.totalAttempts++;
  
  if (score > data.bestScore) {
    data.bestScore = score;
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
