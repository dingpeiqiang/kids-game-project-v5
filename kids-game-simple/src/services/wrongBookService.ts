import type { WrongQuestion, WrongBookStats } from '../types/grading'
import type { Question } from '../types/quiz'
import type { ExamSession } from '../types/exam'
import type { Paper } from '../types/paper'
import { MOCK_WRONG_QUESTIONS } from '../data/mockData'
import { examService } from './examService'

class WrongBookService {
  private wrongQuestions: WrongQuestion[] = [...MOCK_WRONG_QUESTIONS]

  async addWrongQuestion(question: Question, userAnswer: string | string[] | null, examSessionId: string): Promise<void> {
    const correctAnswerContent = Array.isArray(question.answer.content) && question.answer.content.length > 0 && typeof question.answer.content[0] !== 'string'
      ? JSON.stringify(question.answer.content)
      : (question.answer.content as string | string[])

    const existingIndex = this.wrongQuestions.findIndex(
      wq => wq.question.id === question.id && wq.examSessionId === examSessionId
    )

    if (existingIndex !== -1) {
      this.wrongQuestions[existingIndex].wrongCount++
      this.wrongQuestions[existingIndex].lastWrongTime = Date.now()
      this.wrongQuestions[existingIndex].userAnswer = userAnswer
    } else {
      this.wrongQuestions.push({
        id: `wrong_${Date.now()}`,
        question,
        userAnswer,
        correctAnswer: correctAnswerContent as string | string[],
        examSessionId,
        wrongCount: 1,
        lastWrongTime: Date.now(),
        mastered: false,
        reviewCount: 0,
      })
    }
  }

  async getWrongQuestions(params: {
    userId?: string
    subject?: string
    knowledgePoint?: string
    mastered?: boolean
  }): Promise<WrongQuestion[]> {
    let filtered = this.wrongQuestions

    if (params.subject) {
      filtered = filtered.filter(wq => wq.question.subject === params.subject)
    }

    if (params.knowledgePoint) {
      filtered = filtered.filter(wq => 
        wq.question.knowledgePoints.includes(params.knowledgePoint!)
      )
    }

    if (params.mastered !== undefined) {
      filtered = filtered.filter(wq => wq.mastered === params.mastered)
    }

    return filtered.sort((a, b) => b.lastWrongTime - a.lastWrongTime)
  }

  async updateWrongQuestion(id: string, isCorrect: boolean): Promise<void> {
    const index = this.wrongQuestions.findIndex(wq => wq.id === id)
    if (index === -1) {
      throw new Error('Wrong question not found')
    }

    if (isCorrect) {
      this.wrongQuestions[index].reviewCount++
      if (this.wrongQuestions[index].reviewCount >= 3) {
        this.wrongQuestions[index].mastered = true
      }
    } else {
      this.wrongQuestions[index].wrongCount++
      this.wrongQuestions[index].lastWrongTime = Date.now()
      this.wrongQuestions[index].mastered = false
    }
  }

  async markAsMastered(id: string): Promise<void> {
    const index = this.wrongQuestions.findIndex(wq => wq.id === id)
    if (index === -1) {
      throw new Error('Wrong question not found')
    }
    this.wrongQuestions[index].mastered = true
  }

  async removeWrongQuestion(id: string): Promise<boolean> {
    const index = this.wrongQuestions.findIndex(wq => wq.id === id)
    if (index === -1) {
      return false
    }
    this.wrongQuestions.splice(index, 1)
    return true
  }

  async createReviewSession(userId: string, knowledgePoints?: string[], count?: number): Promise<ExamSession> {
    let questions = this.wrongQuestions.filter(wq => !wq.mastered)

    if (knowledgePoints && knowledgePoints.length > 0) {
      questions = questions.filter(wq =>
        wq.question.knowledgePoints.some(kp => knowledgePoints!.includes(kp))
      )
    }

    const selectedQuestions = questions.slice(0, count || 10)

    const mockPaper: Paper = {
      id: `review_paper_${Date.now()}`,
      name: '错题复习试卷',
      description: '根据错题生成的复习试卷',
      type: 'fixed',
      subject: selectedQuestions[0]?.question.subject || 'math',
      grade: selectedQuestions[0]?.question.grade || 'g1',
      questions: selectedQuestions.map((wq, i) => ({
        questionId: wq.question.id,
        question: wq.question,
        order: i + 1,
        score: wq.question.score,
      })),
      config: {
        totalScore: selectedQuestions.reduce((sum, wq) => sum + wq.question.score, 0),
        duration: selectedQuestions.length * 60,
        passScore: 0,
        maxAttempts: 1,
        allowRetry: true,
        showAnswer: true,
        shuffleQuestions: true,
        shuffleOptions: true,
      },
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userId,
    }

    return {
      id: `review_session_${Date.now()}`,
      paperId: mockPaper.id,
      paper: mockPaper,
      userId,
      status: 'inProgress',
      startTime: Date.now(),
      answers: {},
      markedQuestions: [],
      currentQuestionIndex: 0,
      screenSwitchCount: 0,
    }
  }

  async getWrongBookStats(userId: string): Promise<WrongBookStats> {
    const stats: WrongBookStats = {
      total: this.wrongQuestions.length,
      mastered: this.wrongQuestions.filter(wq => wq.mastered).length,
      bySubject: {},
    }

    this.wrongQuestions.forEach(wq => {
      const subject = wq.question.subject
      stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1
    })

    return stats
  }

  async clearWrongBook(userId: string): Promise<void> {
    this.wrongQuestions = []
  }
}

export const wrongBookService = new WrongBookService()