import type { Question, Difficulty } from './quiz'

export interface GradingResult {
  id: string
  examSessionId: string
  questionId: string
  userId: string
  userAnswer: string | string[] | null
  correctAnswer: string | string[] | null
  score: number
  fullScore: number
  isCorrect: boolean
  gradedBy?: string
  comment?: string
  gradedAt: number
}

export interface ExamScore {
  id: string
  examSessionId: string
  userId: string
  paperId: string
  totalScore: number
  fullScore: number
  correctCount: number
  wrongCount: number
  unansweredCount: number
  duration: number
  status: 'graded' | 'partial' | 'pending'
  gradedAt: number
  gradingResults: GradingResult[]
}

export interface SubjectiveGrading {
  examSessionId: string
  questionId: string
  userId: string
  score: number
  comment: string
  gradedBy: string
  gradedAt: number
}

export interface ClassScoreStats {
  classId: string
  className: string
  totalStudents: number
  participatedStudents: number
  averageScore: number
  fullScore: number
  passScore: number
  passRate: number
  excellentRate: number
  maxScore: number
  minScore: number
}

export interface KnowledgePointAnalysis {
  knowledgePointId: string
  knowledgePointName: string
  totalQuestions: number
  correctRate: number
  avgScore: number
  difficulty: Difficulty
}

export interface PersonalScoreDetail {
  userId: string
  userName: string
  examScore: ExamScore
  wrongQuestions: WrongQuestion[]
  weakKnowledgePoints: KnowledgePointAnalysis[]
}

export interface WrongQuestion {
  id: string
  question: Question
  userAnswer: string | string[] | null
  correctAnswer: string | string[] | null
  examSessionId: string
  wrongCount: number
  lastWrongTime: number
  mastered: boolean
  reviewCount: number
}

export interface WrongBookStats {
  total: number
  mastered: number
  bySubject: Record<string, number>
}