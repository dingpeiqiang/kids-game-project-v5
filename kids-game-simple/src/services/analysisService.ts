import type { ClassScoreStats, KnowledgePointAnalysis, PersonalScoreDetail, ExamScore, WrongQuestion } from '../types/grading'
import { gradingService } from './gradingService'
import { wrongBookService } from './wrongBookService'
import { KNOWLEDGE_POINTS, SUBJECTS } from '../data/mockData'

class AnalysisService {
  async getClassStats(classId: string, examId?: string): Promise<ClassScoreStats> {
    const scores = await this.getExamScores(examId)
    const fullScore = scores[0]?.fullScore || 100
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length)
      : 0
    
    const passLine = Math.round(fullScore * 0.6)
    const passCount = scores.filter(s => s.totalScore >= passLine).length
    const passRate = scores.length > 0 ? Math.round(passCount / scores.length * 100) : 0
    
    const excellentLine = Math.round(fullScore * 0.8)
    const excellentCount = scores.filter(s => s.totalScore >= excellentLine).length
    const excellentRate = scores.length > 0 ? Math.round(excellentCount / scores.length * 100) : 0
    
    const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.totalScore)) : 0
    const minScore = scores.length > 0 ? Math.min(...scores.map(s => s.totalScore)) : 0

    const stats: ClassScoreStats = {
      classId,
      className: `班级${classId}`,
      totalStudents: 30,
      participatedStudents: scores.length,
      averageScore: avgScore,
      fullScore,
      passScore: passLine,
      passRate,
      excellentRate,
      maxScore,
      minScore,
    }

    return stats
  }

  async getClassRanking(classId: string, examId: string): Promise<{ rank: number; userId: string; userName: string; score: number }[]> {
    const scores = await this.getExamScores(examId)
    const sorted = scores
      .map((score, index) => ({
        rank: index + 1,
        userId: score.userId,
        userName: `学生${String(index + 1).padStart(2, '0')}`,
        score: score.totalScore,
      }))
      .sort((a, b) => b.score - a.score)

    return sorted.map((item, index) => ({ ...item, rank: index + 1 }))
  }

  async getPersonalDetail(userId: string, examId: string): Promise<PersonalScoreDetail> {
    const scores = await this.getExamScores(examId)
    const score = scores.find(s => s.userId === userId)
    
    if (!score) {
      throw new Error('Score not found')
    }

    const wrongQuestions = await wrongBookService.getWrongQuestions({})
    const userWrongQuestions = wrongQuestions.filter(wq => 
      score.gradingResults.some(gr => gr.questionId === wq.question.id)
    )

    const knowledgeAnalysis = await this.getKnowledgeAnalysis(undefined, examId)
    const weakPoints = knowledgeAnalysis.filter(ka => ka.correctRate < 0.6)

    return {
      userId,
      userName: `学生${userId}`,
      examScore: score,
      wrongQuestions: userWrongQuestions,
      weakKnowledgePoints: weakPoints,
    }
  }

  async getKnowledgeAnalysis(classId?: string, examId?: string): Promise<KnowledgePointAnalysis[]> {
    const scores = await this.getExamScores(examId)
    const allResults = scores.flatMap(s => s.gradingResults)

    const knowledgeMap = new Map<string, { total: number; correct: number; sumScore: number }>()

    allResults.forEach(result => {
      const question = this.getQuestionById(result.questionId)
      if (question) {
        question.knowledgePoints.forEach((kpId: string) => {
          const current = knowledgeMap.get(kpId) || { total: 0, correct: 0, sumScore: 0 }
          knowledgeMap.set(kpId, {
            total: current.total + 1,
            correct: current.correct + (result.isCorrect ? 1 : 0),
            sumScore: current.sumScore + result.score,
          })
        })
      }
    })

    const analysis: KnowledgePointAnalysis[] = []

    knowledgeMap.forEach((data, kpId) => {
      const kp = KNOWLEDGE_POINTS.find(k => k.id === kpId)
      if (kp) {
        analysis.push({
          knowledgePointId: kpId,
          knowledgePointName: kp.name,
          totalQuestions: data.total,
          correctRate: data.total > 0 ? data.correct / data.total : 0,
          avgScore: data.total > 0 ? Math.round(data.sumScore / data.total) : 0,
          difficulty: 'medium',
        })
      }
    })

    return analysis.sort((a, b) => a.correctRate - b.correctRate)
  }

  async getDifficultyDistribution(examId: string): Promise<{ easy: number; medium: number; hard: number }> {
    const scores = await this.getExamScores(examId)
    const allResults = scores.flatMap(s => s.gradingResults)

    const distribution: { easy: number; medium: number; hard: number } = { easy: 0, medium: 0, hard: 0 }

    allResults.forEach(result => {
      const question = this.getQuestionById(result.questionId)
      if (question) {
        const diff = question.difficulty as 'easy' | 'medium' | 'hard'
        distribution[diff]++
      }
    })

    return distribution
  }

  async exportScores(examId: string, format: 'excel' | 'pdf'): Promise<Blob> {
    const scores = await this.getExamScores(examId)
    const content = JSON.stringify(scores, null, 2)
    return new Blob([content], { type: 'application/json' })
  }

  private async getExamScores(examId?: string): Promise<ExamScore[]> {
    const mockScores: ExamScore[] = []
    const fullScore = 100

    for (let i = 0; i < 25; i++) {
      const totalScore = Math.floor(Math.random() * 40) + 60
      const correctCount = Math.floor(totalScore / 10)
      const wrongCount = 10 - correctCount

      mockScores.push({
        id: `score_${i}`,
        examSessionId: `session_${i}`,
        userId: `user_${i}`,
        paperId: examId || 'paper001',
        totalScore,
        fullScore,
        correctCount,
        wrongCount,
        unansweredCount: 0,
        duration: Math.floor(Math.random() * 1800) + 600,
        status: 'graded',
        gradedAt: Date.now(),
        gradingResults: [],
      })
    }

    return mockScores
  }

  private getQuestionById(questionId: string): any {
    return {
      id: questionId,
      knowledgePoints: ['k001', 'k002'],
      difficulty: 'medium' as const,
    }
  }
}

export const analysisService = new AnalysisService()