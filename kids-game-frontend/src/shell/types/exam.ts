import type { Paper } from './paper'

export type ExamStatus = 'draft' | 'published' | 'inProgress' | 'ended' | 'closed'

export interface UserAnswer {
  questionId: string
  answer: string | string[] | null
  timeSpent: number
  isDraft: boolean
}

export interface ExamSession {
  id: string
  paperId: string
  paper: Paper
  userId: string
  status: ExamStatus
  startTime: number
  endTime?: number
  answers: Record<string, UserAnswer>
  markedQuestions: string[]
  currentQuestionIndex: number
  screenSwitchCount: number
}

export interface ExamPublishConfig {
  paperId: string
  classIds: string[]
  startTime: number
  endTime: number
  allowLateSubmit: boolean
}

export interface AntiCheatConfig {
  enableScreenDetection: boolean
  maxScreenSwitches: number
  enableCopyBlock: boolean
  enableTimer: boolean
  enableAlert: boolean
}