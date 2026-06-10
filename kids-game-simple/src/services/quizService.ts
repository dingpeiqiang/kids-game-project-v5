import type { Question, QuestionStatus, SimilarityResult, QuestionContentElement, QuestionAttachment } from '../types/quiz'
import { MOCK_QUESTIONS } from '../data/mockData'

class QuizService {
  private questions: Question[] = [...MOCK_QUESTIONS]

  async createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
    const now = Date.now()
    const newQuestion: Question = {
      ...question,
      id: `q${String(this.questions.length + 1).padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now,
    }
    this.questions.push(newQuestion)
    return newQuestion
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const index = this.questions.findIndex(q => q.id === id)
    if (index === -1) {
      throw new Error('Question not found')
    }
    this.questions[index] = {
      ...this.questions[index],
      ...updates,
      updatedAt: Date.now(),
    }
    return this.questions[index]
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const index = this.questions.findIndex(q => q.id === id)
    if (index === -1) {
      return false
    }
    this.questions.splice(index, 1)
    return true
  }

  async getQuestion(id: string): Promise<Question | null> {
    return this.questions.find(q => q.id === id) || null
  }

  async listQuestions(params: {
    subject?: string
    grade?: string
    difficulty?: string
    status?: QuestionStatus
    page?: number
    size?: number
  }): Promise<{ data: Question[]; total: number }> {
    let filtered = this.questions

    if (params.subject) {
      filtered = filtered.filter(q => q.subject === params.subject)
    }
    if (params.grade) {
      filtered = filtered.filter(q => q.grade === params.grade)
    }
    if (params.difficulty) {
      filtered = filtered.filter(q => q.difficulty === params.difficulty)
    }
    if (params.status) {
      filtered = filtered.filter(q => q.status === params.status)
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

  async searchQuestions(keyword: string, subject?: string): Promise<Question[]> {
    return this.questions.filter(q => {
      const matchesSubject = !subject || q.subject === subject
      const contentText = this.extractTextContent(q.content)
      return matchesSubject && contentText.includes(keyword)
    })
  }

  async checkSimilarity(content: string, threshold: number = 0.7): Promise<SimilarityResult[]> {
    const results: SimilarityResult[] = []
    const inputText = this.normalizeText(content)

    for (const question of this.questions) {
      const questionText = this.normalizeText(this.extractTextContent(question.content))
      const similarity = this.calculateSimilarity(inputText, questionText)
      
      if (similarity >= threshold) {
        results.push({
          questionId: question.id,
          similarity,
          content: questionText.substring(0, 100) + (questionText.length > 100 ? '...' : ''),
        })
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity)
  }

  async batchImport(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    return { success: 0, failed: 0, errors: ['Excel import not implemented in mock'] }
  }

  async batchExport(ids: string[]): Promise<Blob> {
    const questions = this.questions.filter(q => ids.includes(q.id))
    const content = JSON.stringify(questions, null, 2)
    return new Blob([content], { type: 'application/json' })
  }

  async batchUpdateStatus(ids: string[], status: QuestionStatus): Promise<number> {
    let count = 0
    this.questions.forEach(q => {
      if (ids.includes(q.id)) {
        q.status = status
        q.updatedAt = Date.now()
        count++
      }
    })
    return count
  }

  async migrateCategory(ids: string[], subject?: string, grade?: string): Promise<number> {
    let count = 0
    this.questions.forEach(q => {
      if (ids.includes(q.id)) {
        if (subject) q.subject = subject
        if (grade) q.grade = grade
        q.updatedAt = Date.now()
        count++
      }
    })
    return count
  }

  async uploadAttachment(file: File, type: QuestionAttachment['type']): Promise<QuestionAttachment> {
    return {
      id: `att_${Date.now()}`,
      type,
      url: `/uploads/${file.name}`,
      name: file.name,
      size: file.size,
    }
  }

  parseRichContent(content: string, format: 'html' | 'markdown' | 'json'): QuestionContentElement[] {
    if (format === 'json') {
      return JSON.parse(content)
    }
    return [{ type: 'text', content }]
  }

  renderContent(elements: QuestionContentElement[]): string {
    return elements.map(el => {
      switch (el.type) {
        case 'text':
          return el.content
        case 'image':
          return `<img src="${el.image.url}" alt="${el.image.alt}" />`
        case 'audio':
          return `<audio src="${el.audio.url}" controls=${el.audio.controls || true} />`
        case 'video':
          return `<video src="${el.video.url}" controls=${el.video.controls || true} />`
        case 'formula':
          return `$$${el.formula}$$`
        default:
          return ''
      }
    }).join('')
  }

  validateContent(content: QuestionContentElement[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    content.forEach((el, index) => {
      switch (el.type) {
        case 'image':
          if (!el.image.url) errors.push(`Element ${index}: Image URL is required`)
          if (!el.image.alt) errors.push(`Element ${index}: Image alt text is required`)
          break
        case 'audio':
          if (!el.audio.url) errors.push(`Element ${index}: Audio URL is required`)
          break
        case 'video':
          if (!el.video.url) errors.push(`Element ${index}: Video URL is required`)
          break
      }
    })

    return { valid: errors.length === 0, errors }
  }

  private extractTextContent(elements: QuestionContentElement[]): string {
    return elements.map(el => {
      switch (el.type) {
        case 'text':
          return el.content
        case 'richText':
          return el.blocks.map(b => b.content).join('')
        case 'image':
          return el.image.alt || ''
        case 'audio':
          return el.audio.title || ''
        case 'video':
          return el.video.title || ''
        case 'formula':
          return el.formula
        case 'table':
          return el.table.rows.flat().join(' ')
        case 'code':
          return el.code.code
        case 'list':
          return this.extractTextContent(el.list.items)
        default:
          return ''
      }
    }).join(' ')
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '').trim()
  }

  private calculateSimilarity(s1: string, s2: string): number {
    if (!s1 || !s2) return 0
    if (s1 === s2) return 1

    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1

    const longerLength = longer.length
    const editDistance = this.levenshteinDistance(longer, shorter)

    return (longerLength - editDistance) / longerLength
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = []
    
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue
      }
    }

    return costs[s2.length]
  }
}

export const quizService = new QuizService()