export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Question {
  id: string;
  type: 'province' | 'city' | 'terrain' | 'border';
  difficulty: number;
  name: string;
  hint: string;
  target: GeoPoint;
  tolerance: number;
  knowledge: string;
}

export interface GameState {
  currentLevel: number;
  score: number;
  timeRemaining: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isSuccess: boolean;
  showResult: boolean;
  playerPoint: GeoPoint | null;
  currentQuestion: Question | null;
}

export interface PlayerRecord {
  highScore: number;
  maxLevel: number;
  perfectCount: number;
  totalAnswers: number;
  unlockedKnowledge: string[];
}

export interface MapCameraState {
  rotationX: number;
  rotationY: number;
  zoom: number;
  targetX: number;
  targetY: number;
}

export interface ScoreResult {
  score: number;
  rating: 'perfect' | 'excellent' | 'good' | 'fail';
  distance: number;
}

export interface QuizResult {
  success: boolean;
  score: number;
  rating: string;
  distance: number;
  timeBonus: number;
  question: Question;
  playerAnswer: GeoPoint | null;
}