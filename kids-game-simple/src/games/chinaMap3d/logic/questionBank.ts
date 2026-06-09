import { QUESTIONS } from '../config';
import { Question } from '../types';

export function getQuestionsByDifficulty(difficulty: number): Question[] {
  return QUESTIONS.filter(q => q.difficulty === difficulty);
}

export function getRandomQuestion(difficulty: number): Question | null {
  const questions = getQuestionsByDifficulty(difficulty);
  if (questions.length === 0) {
    const fallbackQuestions = QUESTIONS.filter(q => q.difficulty <= difficulty);
    if (fallbackQuestions.length === 0) return null;
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
  return questions[Math.floor(Math.random() * questions.length)];
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find(q => q.id === id);
}

export function getTotalQuestions(): number {
  return QUESTIONS.length;
}

export function getDifficultyDistribution(): { difficulty: number; count: number }[] {
  const distribution: { difficulty: number; count: number }[] = [];
  for (let i = 1; i <= 5; i++) {
    distribution.push({
      difficulty: i,
      count: QUESTIONS.filter(q => q.difficulty === i).length,
    });
  }
  return distribution;
}