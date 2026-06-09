import { GAME_CONFIG } from '../config';
import { GameState, ScoreRecord, LandingResult } from '../types';

const STORAGE_KEY = 'jump3d_records';

export function loadRecords(): ScoreRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load records');
  }
  return { highScore: 0, maxCombo: 0 };
}

export function saveRecords(records: ScoreRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save records');
  }
}

export function calculateScore(gameState: GameState, landing: LandingResult): number {
  let points = GAME_CONFIG.SCORE.BASE;
  
  if (landing.isPerfect) {
    points += GAME_CONFIG.SCORE.PERFECT_BONUS;
  } else if (!landing.isEdge) {
    points += GAME_CONFIG.SCORE.NORMAL_BONUS;
  }
  
  let multiplier = 1;
  if (gameState.combo >= 10) {
    multiplier = GAME_CONFIG.SCORE.COMBO_MULTIPLIER_10;
  } else if (gameState.combo >= 5) {
    multiplier = GAME_CONFIG.SCORE.COMBO_MULTIPLIER_5;
  }
  
  return Math.floor(points * multiplier);
}

export function updateGameState(gameState: GameState, landing: LandingResult): { newRecord: boolean } {
  let newRecord = false;
  const records = loadRecords();
  
  if (landing.isPerfect) {
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
      gameState.maxCombo = gameState.combo;
    }
    if (gameState.maxCombo > records.maxCombo) {
      records.maxCombo = gameState.maxCombo;
      saveRecords(records);
    }
  } else {
    gameState.combo = 0;
  }
  
  const points = calculateScore(gameState, landing);
  gameState.score += points;
  
  if (gameState.score > records.highScore) {
    records.highScore = gameState.score;
    saveRecords(records);
    newRecord = true;
  }
  
  return { newRecord };
}

export function resetGameState(gameState: GameState): void {
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.isPlaying = false;
  gameState.isGameOver = false;
  gameState.isCharging = false;
  gameState.chargeTime = 0;
}
