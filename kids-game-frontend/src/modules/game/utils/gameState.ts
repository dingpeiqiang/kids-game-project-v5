import { ref } from 'vue';

export interface GameStateUpdate {
  lives?: number;
  questionCount?: number;
  score?: number;
}

const currentLives = ref(3);
const maxLives = ref(3);
const questionCount = ref(0);

export function updateGameState(data: GameStateUpdate) {
  if (data.lives !== undefined) {
    currentLives.value = data.lives;
  }
  if (data.questionCount !== undefined) {
    questionCount.value = data.questionCount;
  }
  console.log('[GameState] 已更新:', { 
    currentLives: currentLives.value, 
    questionCount: questionCount.value 
  });
}

export function resetGameState() {
  currentLives.value = 3;
  maxLives.value = 3;
  questionCount.value = 0;
}

export function useGameState() {
  return {
    currentLives,
    maxLives,
    questionCount,
    updateGameState,
    resetGameState,
  };
}
