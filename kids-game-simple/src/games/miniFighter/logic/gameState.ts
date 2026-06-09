import type { GameState, GameStats } from '../types';
import { createPlayerState, createAIState } from './ai';

const STORAGE_KEY = 'mini_fighter_stats';

export function createInitialGameState(level: number = 1): GameState {
  return {
    player: createPlayerState(),
    ai: createAIState(level),
    currentLevel: level,
    isGameOver: false,
    isVictory: false,
    comboCount: 0,
    lastHitTime: 0,
  };
}

export function checkGameOver(state: GameState): boolean {
  if (state.player.hp <= 0) {
    state.isGameOver = true;
    state.isVictory = false;
    return true;
  }
  if (state.ai.hp <= 0) {
    state.isGameOver = true;
    state.isVictory = true;
    return true;
  }
  return false;
}

export function loadGameStats(): GameStats {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    console.warn('Failed to load game stats');
  }
  return {
    highestLevel: 1,
    totalWins: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}

export function saveGameStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    console.warn('Failed to save game stats');
  }
}

export function updateGameStats(stats: GameStats, victory: boolean, level: number): GameStats {
  const newStats = { ...stats };
  
  if (victory) {
    newStats.totalWins += 1;
    newStats.currentStreak += 1;
    if (level > newStats.highestLevel) {
      newStats.highestLevel = level;
    }
    if (newStats.currentStreak > newStats.bestStreak) {
      newStats.bestStreak = newStats.currentStreak;
    }
  } else {
    newStats.currentStreak = 0;
  }
  
  return newStats;
}