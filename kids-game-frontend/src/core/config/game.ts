/**
 * 游戏通用配置
 */
import type { GameConfig } from './types';

export const gameConfig: GameConfig = {
  ageRange: {
    min: 3,
    max: 12,
  },
  rules: {
    maxPlayTime: 30,
    maxDailyPlayTime: 60,
    breakInterval: 15,
    breakDuration: 5,
  },
  points: {
    puzzleComplete: 10,
    arithmeticCorrect: 5,
    questionCorrect: 8,
    streakBonus: 3,
    gameStartCost: 1, // 每次游戏消耗1点
    answerReward: 1, // 每答对1题奖励1点
    maxDailyAnswerPoints: 10, // 每日答题最多赚10点
  },
  difficulty: {
    easy: 1,
    medium: 2,
    hard: 3,
  },
  fatigue: {
    initialPoints: 10, // 初始点数
    pointsPerGame: 1, // 每次游戏消耗1点
    dailyReset: true, // 每日重置点数
    maxFatigueLevel: 10, // 最大疲劳度等级
  },
};


