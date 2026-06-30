import type { Paper, SmartPaperConfig } from '../types/paper'
import type { Question } from '../types/quiz'
import { MOCK_PAPERS, MOCK_QUESTIONS } from '../data/mockData'
import { quizService } from './quizService'

class PaperService {
  private papers: Paper[] = [...MOCK_PAPERS]

  async createPaper(paper: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>): Promise<Paper> {
    const now = Date.now()
    const newPaper: Paper = {
      ...paper,
      id: `paper${String(this.papers.length + 1).padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now,
    }
    this.papers.push(newPaper)
    return newPaper
  }

  async updatePaper(id: string, updates: Partial<Paper>): Promise<Paper> {
    const index = this.papers.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error('Paper not found')
    }
    this.papers[index] = {
      ...this.papers[index],
      ...updates,
      updatedAt: Date.now(),
    }
    return this.papers[index]
  }

  async deletePaper(id: string): Promise<boolean> {
    const index = this.papers.findIndex(p => p.id === id)
    if (index === -1) {
      return false
    }
    this.papers.splice(index, 1)
    return true
  }

  async getPaper(id: string): Promise<Paper | null> {
    return this.papers.find(p => p.id === id) || null
  }

  async listPapers(params: {
    subject?: string
    grade?: string
    status?: string
    page?: number
    size?: number
  }): Promise<{ data: Paper[]; total: number }> {
    let filtered = this.papers

    if (params.subject) {
      filtered = filtered.filter(p => p.subject === params.subject)
    }
    if (params.grade) {
      filtered = filtered.filter(p => p.grade === params.grade)
    }
    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status)
    }

    const total = filtered.length
    const page = params.page || 1
    const size = params.size || 10
    const start = (page - 1) * size
    const end = start + size

    return {
      data: filtered.slice(start, end),
      total,
    }
  }

  async addQuestionToPaper(paperId: string, questionId: string, score?: number): Promise<Paper> {
    const paper = this.papers.find(p => p.id === paperId)
    if (!paper) {
      throw new Error('Paper not found')
    }

    const question = await quizService.getQuestion(questionId)
    if (!question) {
      throw new Error('Question not found')
    }

    const existingIndex = paper.questions.findIndex(q => q.questionId === questionId)
    if (existingIndex !== -1) {
      throw new Error('Question already in paper')
    }

    paper.questions.push({
      questionId,
      question,
      order: paper.questions.length + 1,
      score: score || question.score,
    })

    paper.config.totalScore = paper.questions.reduce((sum, q) => sum + q.score, 0)
    paper.updatedAt = Date.now()

    return paper
  }

  async removeQuestionFromPaper(paperId: string, questionId: string): Promise<Paper> {
    const paper = this.papers.find(p => p.id === paperId)
    if (!paper) {
      throw new Error('Paper not found')
    }

    const index = paper.questions.findIndex(q => q.questionId === questionId)
    if (index === -1) {
      throw new Error('Question not in paper')
    }

    paper.questions.splice(index, 1)
    paper.questions.forEach((q, i) => {
      q.order = i + 1
    })

    paper.config.totalScore = paper.questions.reduce((sum, q) => sum + q.score, 0)
    paper.updatedAt = Date.now()

    return paper
  }

  async createSmartPaper(config: SmartPaperConfig): Promise<Paper> {
    let availableQuestions = MOCK_QUESTIONS.filter(q => 
      q.subject === config.subject && 
      q.grade === config.grade && 
      q.status === 'active'
    )

    if (config.knowledgePoints && config.knowledgePoints.length > 0) {
      availableQuestions = availableQuestions.filter(q =>
        q.knowledgePoints.some(kp => config.knowledgePoints!.includes(kp))
      )
    }

    const selectedQuestions: Question[] = []
    const totalRatio = config.difficultyRatio.easy + config.difficultyRatio.medium + config.difficultyRatio.hard

    const easyCount = Math.round((config.difficultyRatio.easy / totalRatio) * config.questionCount)
    const mediumCount = Math.round((config.difficultyRatio.medium / totalRatio) * config.questionCount)
    const hardCount = config.questionCount - easyCount - mediumCount

    const easyQuestions = availableQuestions.filter(q => q.difficulty === 'easy')
    const mediumQuestions = availableQuestions.filter(q => q.difficulty === 'medium')
    const hardQuestions = availableQuestions.filter(q => q.difficulty === 'hard')

    selectedQuestions.push(...this.randomPick(easyQuestions, easyCount))
    selectedQuestions.push(...this.randomPick(mediumQuestions, mediumCount))
    selectedQuestions.push(...this.randomPick(hardQuestions, hardCount))

    const shuffled = this.shuffleArray(selectedQuestions)

    const paperQuestions = shuffled.map((q, i) => ({
      questionId: q.id,
      question: q,
      order: i + 1,
      score: Math.round(config.totalScore / config.questionCount),
    }))

    const now = Date.now()
    const newPaper: Paper = {
      id: `paper${String(this.papers.length + 1).padStart(3, '0')}`,
      name: `${config.subject}智能组卷`,
      description: `根据知识点自动生成的试卷`,
      type: 'random',
      subject: config.subject,
      grade: config.grade,
      questions: paperQuestions,
      config: {
        totalScore: config.totalScore,
        duration: config.duration,
        passScore: Math.round(config.totalScore * 0.6),
        maxAttempts: 1,
        allowRetry: false,
        showAnswer: true,
        shuffleQuestions: true,
        shuffleOptions: true,
      },
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: 'admin',
    }

    this.papers.push(newPaper)
    return newPaper
  }

  async previewPaper(id: string): Promise<Paper> {
    const paper = this.papers.find(p => p.id === id)
    if (!paper) {
      throw new Error('Paper not found')
    }

    if (paper.type === 'random') {
      const shuffled = [...paper.questions]
      shuffled.forEach((q, i) => {
        q.order = i + 1
      })
      return { ...paper, questions: shuffled }
    }

    return paper
  }

  async exportPaper(id: string, format: 'pdf' | 'word'): Promise<Blob> {
    const paper = this.papers.find(p => p.id === id)
    if (!paper) {
      throw new Error('Paper not found')
    }

    const content = JSON.stringify(paper, null, 2)
    return new Blob([content], { type: 'application/json' })
  }

  private randomPick<T>(arr: T[], count: number): T[] {
    const shuffled = this.shuffleArray([...arr])
    return shuffled.slice(0, Math.min(count, arr.length))
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

export const paperService = new PaperService()