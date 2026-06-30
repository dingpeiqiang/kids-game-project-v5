export type QuestionType = 
  | 'single'      // 单选题
  | 'multiple'    // 多选题
  | 'judge'       // 判断题
  | 'fill'        // 填空题
  | 'shortAnswer' // 简答题
  | 'essay'       // 论述题
  | 'code'        // 编程题
  | 'practical'   // 实操题

export type Difficulty = 'easy' | 'medium' | 'hard'

export type QuestionStatus = 'draft' | 'pending' | 'active' | 'disabled' | 'deleted'

export interface TextContent {
  type: 'plain' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'formula'
  content: string
}

export interface ImageContent {
  type: 'image'
  url: string
  alt: string
  width?: number
  height?: number
  caption?: string
}

export interface AudioContent {
  type: 'audio'
  url: string
  title?: string
  duration?: number
  autoplay?: boolean
  loop?: boolean
  controls?: boolean
}

export interface VideoContent {
  type: 'video'
  url: string
  title?: string
  duration?: number
  width?: number
  height?: number
  poster?: string
  autoplay?: boolean
  loop?: boolean
  controls?: boolean
  muted?: boolean
}

export interface TableContent {
  rows: string[][]
  bordered?: boolean
  striped?: boolean
}

export interface CodeBlock {
  language: string
  code: string
  showLineNumbers?: boolean
}

export interface ListContent {
  type: 'ordered' | 'unordered'
  items: QuestionContentElement[]
}

export type QuestionContentElement = 
  | { type: 'text'; content: string }
  | { type: 'richText'; blocks: TextContent[] }
  | { type: 'image'; image: ImageContent }
  | { type: 'audio'; audio: AudioContent }
  | { type: 'video'; video: VideoContent }
  | { type: 'table'; table: TableContent }
  | { type: 'code'; code: CodeBlock }
  | { type: 'formula'; formula: string }
  | { type: 'list'; list: ListContent }

export interface QuestionOption {
  id: string
  content: QuestionContentElement[]
  isCorrect?: boolean
}

export interface QuestionAttachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'code' | 'document' | 'pdf'
  url: string
  name: string
  thumbnail?: string
  size?: number
}

export interface KnowledgePoint {
  id: string
  name: string
  chapter: string
  subject: string
}

export interface AnswerContent {
  type: 'text' | 'richText' | 'code' | 'formula' | 'multiple'
  content: string | string[] | QuestionContentElement[]
  keywords?: string[]
  tolerance?: number
}

export interface QuestionConfig {
  shuffleOptions?: boolean
  showHintAfter?: number
  allowPartialAnswer?: boolean
  caseSensitive?: boolean
  ignoreWhitespace?: boolean
}

export interface SimilarityResult {
  questionId: string
  similarity: number
  content: string
}

export interface Question {
  id: string
  type: QuestionType
  subject: string
  grade: string
  chapter: string
  knowledgePoints: string[]
  difficulty: Difficulty
  score: number
  timeLimit: number
  tags: string[]
  coinReward?: number
  content: QuestionContentElement[]
  options?: QuestionOption[]
  answer: AnswerContent
  explanation?: QuestionContentElement[]
  hints?: QuestionContentElement[]
  attachments: QuestionAttachment[]
  config?: QuestionConfig
  status: QuestionStatus
  createdAt: number
  updatedAt: number
  createdBy: string
  reviewCount: number
  similarQuestions?: string[]
}