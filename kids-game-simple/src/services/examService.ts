import type { ExamSession, ExamPublishConfig, AntiCheatConfig, ExamStatus } from '../types/exam'
import type { Paper } from '../types/paper'
import type { ExamScore } from '../types/grading'
import { MOCK_EXAM_SESSIONS } from '../data/mockData'
import { paperService } from './paperService'
import { gradingService } from './gradingService'

class ExamService {
  private sessions: ExamSession[] = [...MOCK_EXAM_SESSIONS]
  private antiCheatConfig: AntiCheatConfig = {
    enableScreenDetection: true,
    maxScreenSwitches: 3,
    enableCopyBlock: true,
    enableTimer: true,
    enableAlert: true,
  }

  async createExamSession(paperId: string, userId: string): Promise<ExamSession> {
    const paper = await paperService.getPaper(paperId)
    if (!paper) {
      throw new Error('Paper not found')
    }

    let questions = [...paper.questions]
    if (paper.config.shuffleQuestions) {
      questions = this.shuffleArray(questions)
    }

    const now = Date.now()
    const session: ExamSession = {
      id: `session_${Date.now()}`,
      paperId,
      paper: { ...paper, questions },
      userId,
      status: 'inProgress',
      startTime: now,
      answers: {},
      markedQuestions: [],
      currentQuestionIndex: 0,
      screenSwitchCount: 0,
    }

    this.sessions.push(session)
    return session
  }

  async getExamSession(id: string): Promise<ExamSession | null> {
    return this.sessions.find(s => s.id === id) || null
  }

  async updateAnswer(sessionId: string, questionId: string, answer: string | string[] | null): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const existingAnswer = session.answers[questionId]
    session.answers[questionId] = {
      questionId,
      answer,
      timeSpent: existingAnswer ? existingAnswer.timeSpent : 0,
      isDraft: false,
    }
  }

  async markQuestion(sessionId: string, questionId: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const index = session.markedQuestions.indexOf(questionId)
    if (index === -1) {
      session.markedQuestions.push(questionId)
    } else {
      session.markedQuestions.splice(index, 1)
    }
  }

  async saveDraft(sessionId: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    Object.values(session.answers).forEach(answer => {
      answer.isDraft = true
    })
  }

  async submitExam(sessionId: string): Promise<ExamScore> {
    const session = this.sessions.find(s => s.id === sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.status = 'ended'
    session.endTime = Date.now()

    const score = await gradingService.gradeObjective(sessionId)
    return score
  }

  async autoSubmit(sessionId: string): Promise<ExamScore> {
    return this.submitExam(sessionId)
  }

  async recordScreenSwitch(sessionId: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.screenSwitchCount++

    if (this.antiCheatConfig.enableAlert && session.screenSwitchCount >= this.antiCheatConfig.maxScreenSwitches) {
      console.warn(`User ${session.userId} has exceeded screen switch limit`)
    }
  }

  async publishExam(config: ExamPublishConfig): Promise<{ examId: string }> {
    return { examId: `exam_${Date.now()}` }
  }

  async endExam(examId: string): Promise<void> {
    this.sessions.forEach(session => {
      if (session.paperId === examId && session.status === 'inProgress') {
        session.status = 'closed'
        session.endTime = Date.now()
      }
    })
  }

  async updateSessionStatus(sessionId: string, status: ExamStatus): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId)
    if (!session) {
      throw new Error('Session not found')
    }
    session.status = status
  }

  getAntiCheatConfig(): AntiCheatConfig {
    return this.antiCheatConfig
  }

  setAntiCheatConfig(config: Partial<AntiCheatConfig>): void {
    this.antiCheatConfig = { ...this.antiCheatConfig, ...config }
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}

export const examService = new ExamService()