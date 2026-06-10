import type { ExamScore, GradingResult, SubjectiveGrading } from '../types/grading'
import type { ExamSession } from '../types/exam'
import type { Question } from '../types/quiz'
import { MOCK_EXAM_SCORES } from '../data/mockData'
import { examService } from './examService'
import { wrongBookService } from './wrongBookService'

class GradingService {
  private scores: ExamScore[] = [...MOCK_EXAM_SCORES]

  async gradeObjective(sessionId: string): Promise<ExamScore> {
    const session = await examService.getExamSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const gradingResults: GradingResult[] = []
    let totalScore = 0
    let correctCount = 0
    let wrongCount = 0
    let unansweredCount = 0

    for (const paperQuestion of session.paper.questions) {
      const question = paperQuestion.question
      const userAnswer = session.answers[question.id]?.answer
      const isCorrect = this.checkAnswer(question, userAnswer)
      const score = isCorrect ? paperQuestion.score : 0

      if (userAnswer === null || userAnswer === undefined) {
        unansweredCount++
      } else if (isCorrect) {
        correctCount++
      } else {
        wrongCount++
      }

      totalScore += score

      const correctAnswerContent = Array.isArray(question.answer.content) && question.answer.content.length > 0 && typeof question.answer.content[0] !== 'string'
        ? JSON.stringify(question.answer.content)
        : (question.answer.content as string | string[])

      gradingResults.push({
        id: `grade_${Date.now()}_${question.id}`,
        examSessionId: sessionId,
        questionId: question.id,
        userId: session.userId,
        userAnswer,
        correctAnswer: correctAnswerContent as string | string[],
        score,
        fullScore: paperQuestion.score,
        isCorrect,
        gradedAt: Date.now(),
      })

      if (!isCorrect && userAnswer !== null && userAnswer !== undefined) {
        await wrongBookService.addWrongQuestion(question, userAnswer, sessionId)
      }
    }

    const examScore: ExamScore = {
      id: `score_${Date.now()}`,
      examSessionId: sessionId,
      userId: session.userId,
      paperId: session.paperId,
      totalScore,
      fullScore: session.paper.config.totalScore,
      correctCount,
      wrongCount,
      unansweredCount,
      duration: (session.endTime || Date.now()) - session.startTime,
      status: 'graded',
      gradedAt: Date.now(),
      gradingResults,
    }

    this.scores.push(examScore)
    return examScore
  }

  async gradeSubjective(data: SubjectiveGrading): Promise<GradingResult> {
    const session = await examService.getExamSession(data.examSessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const paperQuestion = session.paper.questions.find(q => q.questionId === data.questionId)
    if (!paperQuestion) {
      throw new Error('Question not found in paper')
    }

    const correctAnswerContent = Array.isArray(paperQuestion.question.answer.content) && paperQuestion.question.answer.content.length > 0 && typeof paperQuestion.question.answer.content[0] !== 'string'
        ? JSON.stringify(paperQuestion.question.answer.content)
        : (paperQuestion.question.answer.content as string | string[])

    const gradingResult: GradingResult = {
      id: `grade_${Date.now()}`,
      examSessionId: data.examSessionId,
      questionId: data.questionId,
      userId: data.userId,
      userAnswer: null,
      correctAnswer: correctAnswerContent as string | string[],
      score: data.score,
      fullScore: paperQuestion.score,
      isCorrect: data.score >= paperQuestion.score * 0.6,
      gradedBy: data.gradedBy,
      comment: data.comment,
      gradedAt: data.gradedAt,
    }

    const score = this.scores.find(s => s.examSessionId === data.examSessionId)
    if (score) {
      const existingIndex = score.gradingResults.findIndex(r => r.questionId === data.questionId)
      if (existingIndex !== -1) {
        score.gradingResults[existingIndex] = gradingResult
      } else {
        score.gradingResults.push(gradingResult)
      }
      score.totalScore = score.gradingResults.reduce((sum, r) => sum + r.score, 0)
      score.status = score.gradingResults.length === session.paper.questions.length ? 'graded' : 'partial'
    }

    return gradingResult
  }

  async batchGradeSubjective(dataList: SubjectiveGrading[]): Promise<GradingResult[]> {
    const results: GradingResult[] = []
    for (const data of dataList) {
      const result = await this.gradeSubjective(data)
      results.push(result)
    }
    return results
  }

  async reviewScore(scoreId: string): Promise<ExamScore> {
    const score = this.scores.find(s => s.id === scoreId)
    if (!score) {
      throw new Error('Score not found')
    }

    score.status = 'graded'
    return score
  }

  async updateScore(scoreId: string, questionId: string, score: number, comment?: string): Promise<ExamScore> {
    const examScore = this.scores.find(s => s.id === scoreId)
    if (!examScore) {
      throw new Error('Score not found')
    }

    const gradingResult = examScore.gradingResults.find(r => r.questionId === questionId)
    if (!gradingResult) {
      throw new Error('Grading result not found')
    }

    gradingResult.score = score
    gradingResult.comment = comment
    gradingResult.isCorrect = score >= gradingResult.fullScore * 0.6
    gradingResult.gradedAt = Date.now()

    examScore.totalScore = examScore.gradingResults.reduce((sum, r) => sum + r.score, 0)

    return examScore
  }

  async resetScore(scoreId: string): Promise<void> {
    const index = this.scores.findIndex(s => s.id === scoreId)
    if (index === -1) {
      throw new Error('Score not found')
    }

    this.scores[index].gradingResults.forEach(result => {
      result.score = 0
      result.isCorrect = false
      result.comment = undefined
    })
    this.scores[index].totalScore = 0
    this.scores[index].status = 'pending'
  }

  async getGradingQueue(paperId?: string, userId?: string): Promise<ExamSession[]> {
    const sessions = await examService.getExamSession('')
    if (!sessions) return []

    return []
  }

  async getScore(scoreId: string): Promise<ExamScore | null> {
    return this.scores.find(s => s.id === scoreId) || null
  }

  private checkAnswer(question: Question, userAnswer: string | string[] | null | undefined): boolean {
    if (!userAnswer) return false

    const correctAnswer = question.answer

    if (question.type === 'fill') {
      if (correctAnswer.keywords && correctAnswer.keywords.length > 0) {
        const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.join('') : String(userAnswer)
        return correctAnswer.keywords.some((keyword: string) => 
          userAnswerStr.includes(keyword)
        )
      }
      return String(userAnswer) === String(correctAnswer.content)
    }

    if (question.type === 'multiple') {
      if (!Array.isArray(userAnswer)) return false
      const correctOptions = Array.isArray(correctAnswer.content) && correctAnswer.content.every((c: any) => typeof c === 'string')
        ? (correctAnswer.content as string[])
        : []
      if (userAnswer.length !== correctOptions.length) return false
      return userAnswer.every((a: string) => correctOptions.includes(a))
    }

    return String(userAnswer) === String(correctAnswer.content)
  }
}

export const gradingService = new GradingService()