import type { Question, QuestionType, Difficulty } from './quiz'

export type PaperType = 'fixed' | 'random'

export interface PaperQuestion {
  questionId: string
  question: Question
  order: number
  score: number
}

export interface PaperConfig {
  totalScore: number
  duration: number
  passScore: number
  maxAttempts: number
  allowRetry: boolean
  showAnswer: boolean
  shuffleQuestions: boolean
  shuffleOptions: boolean
}

export interface Paper {
  id: string
  name: string
  description?: string
  type: PaperType
  subject: string
  grade: string
  questions: PaperQuestion[]
  config: PaperConfig
  status: 'draft' | 'published' | 'archived'
  createdAt: number
  updatedAt: number
  createdBy: string
}

export interface SmartPaperConfig {
  subject: string
  grade: string
  totalScore: number
  duration: number
  questionCount: number
  difficultyRatio: {
    easy: number
    medium: number
    hard: number
  }
  typeRatio: Record<QuestionType, number>
  knowledgePoints?: string[]
}

export interface PaperPreview {
  paper: Paper
  previewContent: string
  generatedAt: number
}