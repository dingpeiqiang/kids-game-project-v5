# 试题系统设计方案

## 一、需求分析

基于项目背景（儿童游戏平台）和详细需求，试题系统包含以下核心模块：

| 模块 | 核心功能 |
|------|----------|
| **题库管理** | 试题CRUD、题型全覆盖、附件支持、批量操作、查重机制 |
| **试卷管理** | 手动/智能组卷、固定/随机试卷、试卷配置、预览导出 |
| **在线考试** | 考试发布、答题界面、防作弊、交卷机制 |
| **阅卷评分** | 客观题自动批改、主观题人工批阅、成绩复核 |
| **成绩分析** | 班级排名、知识点分析、数据图表、成绩导出 |
| **错题本** | 自动收录、按知识点重做、专项刷题 |

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        试题系统架构                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  UI层                                                                  │
│  ├── 题库管理：QuestionManager.vue / QuestionForm.vue                  │
│  ├── 试卷管理：PaperManager.vue / PaperForm.vue                        │
│  ├── 在线考试：ExamPanel.vue / ExamResult.vue                          │
│  ├── 阅卷评分：GradingPanel.vue / SubjectiveGrading.vue                │
│  ├── 成绩分析：ScoreAnalysis.vue / ClassRanking.vue                    │
│  └── 错题本：WrongBook.vue / ReviewPanel.vue                           │
├─────────────────────────────────────────────────────────────────────────┤
│  服务层                                                                │
│  ├── quizService.ts       (题库管理)                                   │
│  ├── paperService.ts      (试卷管理)                                   │
│  ├── examService.ts       (在线考试)                                   │
│  ├── gradingService.ts    (阅卷评分)                                   │
│  ├── analysisService.ts   (成绩分析)                                   │
│  └── wrongBookService.ts  (错题本)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  数据层                                                                │
│  ├── types/quiz.ts        (类型定义)                                   │
│  ├── types/paper.ts       (试卷类型)                                   │
│  ├── types/exam.ts        (考试类型)                                   │
│  ├── types/grading.ts     (评分类型)                                   │
│  └── data/mockData.ts     (Mock数据)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  外部依赖                                                              │
│  ├── apiClient.ts         (后端接口)                                   │
│  ├── storage.ts           (本地存储)                                   │
│  └── userService.ts       (用户服务)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 三、类型定义设计

### 3.1 试题类型枚举

```typescript
// 题型枚举
export type QuestionType = 
  | 'single'      // 单选题
  | 'multiple'    // 多选题
  | 'judge'       // 判断题
  | 'fill'        // 填空题
  | 'shortAnswer' // 简答题
  | 'essay'       // 论述题
  | 'code'        // 编程题
  | 'practical'   // 实操题

// 难度等级
export type Difficulty = 'easy' | 'medium' | 'hard'

// 试题状态
export type QuestionStatus = 'draft' | 'pending' | 'active' | 'disabled' | 'deleted'

// 试卷类型
export type PaperType = 'fixed' | 'random'

// 考试状态
export type ExamStatus = 'draft' | 'published' | 'inProgress' | 'ended' | 'closed'
```

### 3.2 试题基础接口（支持文本、图片、语音、视频）

```typescript
// 试题选项（支持多内容格式）
export interface QuestionOption {
  id: string              // 选项标识
  content: QuestionContentElement[] // 选项内容（支持多格式）
  isCorrect?: boolean     // 是否正确（主观题不用）
}

// 文本内容块
export interface TextContent {
  type: 'plain' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'formula'
  content: string
}

// 图片内容
export interface ImageContent {
  type: 'image'
  url: string             // 图片URL
  alt: string             // 替代文本（必填）
  width?: number          // 宽度（像素）
  height?: number         // 高度（像素）
  caption?: string        // 图片说明
}

// 语音内容
export interface AudioContent {
  type: 'audio'
  url: string             // 音频URL
  title?: string          // 音频标题
  duration?: number       // 时长（秒）
  autoplay?: boolean      // 是否自动播放
  loop?: boolean          // 是否循环播放
  controls?: boolean      // 是否显示控制栏（默认true）
}

// 视频内容
export interface VideoContent {
  type: 'video'
  url: string             // 视频URL
  title?: string          // 视频标题
  duration?: number       // 时长（秒）
  width?: number          // 宽度（像素）
  height?: number         // 高度（像素）
  poster?: string         // 封面图片URL
  autoplay?: boolean      // 是否自动播放（默认false）
  loop?: boolean          // 是否循环播放
  controls?: boolean      // 是否显示控制栏（默认true）
  muted?: boolean         // 是否静音
}

// 表格内容
export interface TableContent {
  rows: string[][]        // 二维数组，第一行为表头
  bordered?: boolean      // 是否有边框
  striped?: boolean       // 是否斑马纹
}

// 代码块
export interface CodeBlock {
  language: string        // 编程语言
  code: string            // 代码内容
  showLineNumbers?: boolean // 是否显示行号
}

// 公式内容（LaTeX）
export interface FormulaContent {
  type: 'formula'
  formula: string         // LaTeX公式
  display?: boolean       // 是否块级显示（默认true）
}

// 列表内容
export interface ListContent {
  type: 'ordered' | 'unordered'
  items: QuestionContentElement[] // 列表项（支持嵌套）
}

// 试题内容元素（核心支持：文本、图片、语音、视频）
export type QuestionContentElement = 
  | { type: 'text'; content: string }        // 纯文本
  | { type: 'richText'; blocks: TextContent[] } // 富文本
  | { type: 'image'; image: ImageContent }    // 图片
  | { type: 'audio'; audio: AudioContent }    // 语音
  | { type: 'video'; video: VideoContent }    // 视频
  | { type: 'table'; table: TableContent }    // 表格
  | { type: 'code'; code: CodeBlock }        // 代码块
  | { type: 'formula'; formula: string }     // LaTeX公式
  | { type: 'list'; list: ListContent }       // 列表

// 试题附件
export interface QuestionAttachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'code' | 'document' | 'pdf'
  url: string
  name: string
  thumbnail?: string
  size?: number           // 文件大小（字节）
}

// 知识点标签
export interface KnowledgePoint {
  id: string
  name: string
  chapter: string         // 所属章节
  subject: string         // 所属科目
}

// 试题接口（支持多内容格式）
export interface Question {
  id: string              // 试题唯一标识
  type: QuestionType      // 题型
  subject: string         // 科目（数学、语文、英语等）
  grade: string           // 年级/阶段
  chapter: string         // 章节
  knowledgePoints: string[] // 知识点ID列表
  difficulty: Difficulty  // 难度
  score: number           // 分值
  timeLimit: number       // 答题时长（秒，0表示无限制）
  tags: string[]          // 标签
  
  // 题目内容（支持多种格式）
  content: QuestionContentElement[]
  
  // 选项（单选/多选/判断/填空）
  options?: QuestionOption[] 
  
  // 参考答案（支持多种格式）
  answer: AnswerContent
  
  // 答案解析（支持富文本）
  explanation?: QuestionContentElement[]
  
  // 提示（支持多条）
  hints?: QuestionContentElement[]
  
  // 附件列表
  attachments: QuestionAttachment[] 
  
  // 额外配置
  config?: QuestionConfig
  
  status: QuestionStatus  // 状态
  createdAt: number       // 创建时间
  updatedAt: number       // 更新时间
  createdBy: string       // 创建人
  reviewCount: number     // 审核次数
  similarQuestions?: string[] // 相似题目ID（查重用）
}

// 答案内容（支持多种格式）
export interface AnswerContent {
  type: 'text' | 'richText' | 'code' | 'formula' | 'multiple'
  content: string | string[] | QuestionContentElement[]
  keywords?: string[]     // 填空题关键词匹配
  tolerance?: number      // 匹配容差（0-1）
}

// 试题配置
export interface QuestionConfig {
  shuffleOptions?: boolean // 是否随机打乱选项顺序
  showHintAfter?: number   // 多少秒后显示提示
  allowPartialAnswer?: boolean // 是否允许部分正确（多选题）
  caseSensitive?: boolean // 是否大小写敏感
  ignoreWhitespace?: boolean // 是否忽略空白字符
}

// 查重结果
export interface SimilarityResult {
  questionId: string
  similarity: number      // 相似度 0-1
  content: string         // 相似题目内容
}
```

### 3.3 试卷管理接口

```typescript
// 试卷中的试题
export interface PaperQuestion {
  questionId: string      // 试题ID
  question: Question      // 试题详情
  order: number           // 排序号
  score: number           // 本题分值（可覆盖试题默认分值）
}

// 试卷配置
export interface PaperConfig {
  totalScore: number      // 总分
  duration: number        // 考试时长（分钟）
  passScore: number       // 及格线
  maxAttempts: number     // 最大答题次数（0表示不限）
  allowRetry: boolean     // 是否允许重考
  showAnswer: boolean     // 是否展示答案
  shuffleQuestions: boolean // 是否随机打乱试题顺序
  shuffleOptions: boolean  // 是否随机打乱选项顺序
}

// 试卷接口
export interface Paper {
  id: string              // 试卷唯一标识
  name: string            // 试卷名称
  description?: string    // 试卷描述
  type: PaperType         // 固定试卷/随机试卷
  subject: string         // 科目
  grade: string           // 适用年级
  questions: PaperQuestion[] // 试题列表（固定试卷）
  config: PaperConfig     // 配置
  status: 'draft' | 'published' | 'archived'
  createdAt: number
  updatedAt: number
  createdBy: string
}

// 智能组卷配置
export interface SmartPaperConfig {
  subject: string         // 科目
  grade: string           // 年级
  totalScore: number      // 总分
  duration: number        // 时长（分钟）
  questionCount: number   // 题目数量
  difficultyRatio: {      // 难度配比
    easy: number
    medium: number
    hard: number
  }
  typeRatio: Record<QuestionType, number> // 题型配比
  knowledgePoints?: string[] // 指定知识点
}
```

### 3.4 在线考试接口

```typescript
// 考试会话
export interface ExamSession {
  id: string              // 会话ID
  paperId: string         // 试卷ID
  paper: Paper            // 试卷详情
  userId: string          // 用户ID
  status: ExamStatus      // 考试状态
  startTime: number       // 开始时间
  endTime?: number        // 结束时间
  answers: Record<string, UserAnswer> // 用户答案
  markedQuestions: string[] // 标记的疑难题目
  currentQuestionIndex: number // 当前题目索引
  screenSwitchCount: number // 切屏次数
}

// 用户答案
export interface UserAnswer {
  questionId: string
  answer: string | string[] | null // 用户答案
  timeSpent: number       // 答题耗时（秒）
  isDraft: boolean        // 是否为草稿
}

// 考试发布配置
export interface ExamPublishConfig {
  paperId: string
  classIds: string[]      // 绑定班级ID列表
  startTime: number       // 开始时间
  endTime: number         // 结束时间
  allowLateSubmit: boolean // 是否允许迟到提交
}

// 防作弊配置
export interface AntiCheatConfig {
  enableScreenDetection: boolean // 切屏检测
  maxScreenSwitches: number      // 最大切屏次数
  enableCopyBlock: boolean       // 禁止复制
  enableTimer: boolean           // 限时
  enableAlert: boolean           // 弹窗提醒
}
```

### 3.5 阅卷评分接口

```typescript
// 评分结果
export interface GradingResult {
  id: string              // 评分记录ID
  examSessionId: string   // 考试会话ID
  questionId: string      // 试题ID
  userId: string          // 用户ID
  userAnswer: string | string[] | null
  correctAnswer: string | string[] | null
  score: number           // 得分
  fullScore: number       // 满分
  isCorrect: boolean      // 是否正确（客观题）
  gradedBy?: string       // 批阅人（主观题）
  comment?: string        // 批阅备注
  gradedAt: number        // 批阅时间
}

// 考试成绩
export interface ExamScore {
  id: string              // 成绩ID
  examSessionId: string   // 考试会话ID
  userId: string          // 用户ID
  paperId: string         // 试卷ID
  totalScore: number      // 总分
  fullScore: number       // 满分
  correctCount: number    // 正确题数
  wrongCount: number      // 错误题数
  unansweredCount: number // 未答题数
  duration: number        // 答题时长（秒）
  status: 'graded' | 'partial' | 'pending'
  gradedAt: number        // 评分时间
  gradingResults: GradingResult[]
}

// 主观题批阅记录
export interface SubjectiveGrading {
  examSessionId: string
  questionId: string
  userId: string
  score: number
  comment: string
  gradedBy: string
  gradedAt: number
}
```

### 3.6 成绩分析接口

```typescript
// 班级成绩统计
export interface ClassScoreStats {
  classId: string
  className: string
  totalStudents: number
  participatedStudents: number
  averageScore: number
  fullScore: number
  passRate: number        // 及格率
  excellentRate: number   // 优秀率（80分以上）
  maxScore: number
  minScore: number
}

// 知识点分析
export interface KnowledgePointAnalysis {
  knowledgePointId: string
  knowledgePointName: string
  totalQuestions: number
  correctRate: number     // 正确率
  avgScore: number
  difficulty: Difficulty
}

// 个人成绩详情
export interface PersonalScoreDetail {
  userId: string
  userName: string
  examScore: ExamScore
  wrongQuestions: WrongQuestion[]
  weakKnowledgePoints: KnowledgePointAnalysis[]
}

// 错题记录
export interface WrongQuestion {
  id: string
  question: Question
  userAnswer: string | string[] | null
  correctAnswer: string | string[] | null
  examSessionId: string
  wrongCount: number      // 错误次数
  lastWrongTime: number
  mastered: boolean
  reviewCount: number     // 复习次数
}
```

## 四、核心服务设计

### 4.1 题库管理服务 (QuizService)

| 方法名 | 功能说明 | 参数 | 返回值 |
|--------|----------|------|--------|
| `createQuestion` | 创建试题 | `question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>` | `Promise<Question>` |
| `updateQuestion` | 更新试题 | `id: string; updates: Partial<Question>` | `Promise<Question>` |
| `deleteQuestion` | 删除试题 | `id: string` | `Promise<boolean>` |
| `getQuestion` | 获取单个试题 | `id: string` | `Promise<Question | null>` |
| `listQuestions` | 分页获取试题列表 | `params: { subject?, grade?, difficulty?, status?, page?, size? }` | `Promise<{ data: Question[]; total: number }>` |
| `searchQuestions` | 搜索试题 | `keyword: string; subject?` | `Promise<Question[]>` |
| `checkSimilarity` | 查重检测 | `content: string; threshold?: number` | `Promise<SimilarityResult[]>` |
| `batchImport` | 批量导入（Excel） | `file: File` | `Promise<{ success: number; failed: number; errors: string[] }>` |
| `parseRichContent` | 解析富文本内容 | `content: string; format: 'html' | 'markdown' | 'json'` | `QuestionContentElement[]` |
| `renderContent` | 渲染内容为HTML | `elements: QuestionContentElement[]` | `string` |
| `validateContent` | 验证内容格式 | `content: QuestionContentElement[]` | `{ valid: boolean; errors: string[] }` |
| `uploadAttachment` | 上传附件 | `file: File; type: QuestionAttachment['type']` | `Promise<QuestionAttachment>` |
| `batchExport` | 批量导出（Excel） | `ids: string[]` | `Promise<Blob>` |
| `batchUpdateStatus` | 批量更新状态 | `ids: string[]; status: QuestionStatus` | `Promise<number>` |
| `migrateCategory` | 批量迁移分类 | `ids: string[]; subject?: string; grade?: string` | `Promise<number>` |

### 4.2 试卷管理服务 (PaperService)

| 方法名 | 功能说明 | 参数 | 返回值 |
|--------|----------|------|--------|
| `createPaper` | 创建试卷 | `paper: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>` | `Promise<Paper>` |
| `updatePaper` | 更新试卷 | `id: string; updates: Partial<Paper>` | `Promise<Paper>` |
| `deletePaper` | 删除试卷 | `id: string` | `Promise<boolean>` |
| `getPaper` | 获取试卷 | `id: string` | `Promise<Paper | null>` |
| `listPapers` | 分页获取试卷列表 | `params: { subject?, grade?, status?, page?, size? }` | `Promise<{ data: Paper[]; total: number }>` |
| `addQuestionToPaper` | 添加试题到试卷 | `paperId: string; questionId: string; score?: number` | `Promise<Paper>` |
| `removeQuestionFromPaper` | 从试卷移除试题 | `paperId: string; questionId: string` | `Promise<Paper>` |
| `createSmartPaper` | 智能组卷 | `config: SmartPaperConfig` | `Promise<Paper>` |
| `previewPaper` | 预览试卷 | `id: string` | `Promise<Paper>` |
| `exportPaper` | 导出试卷（PDF/Word） | `id: string; format: 'pdf' | 'word'` | `Promise<Blob>` |

### 4.3 在线考试服务 (ExamService)

| 方法名 | 功能说明 | 参数 | 返回值 |
|--------|----------|------|--------|
| `createExamSession` | 创建考试会话 | `paperId: string; userId: string` | `Promise<ExamSession>` |
| `getExamSession` | 获取考试会话 | `id: string` | `Promise<ExamSession | null>` |
| `updateAnswer` | 更新答案 | `sessionId: string; questionId: string; answer: string | string[] | null` | `Promise<void>` |
| `markQuestion` | 标记/取消标记题目 | `sessionId: string; questionId: string` | `Promise<void>` |
| `saveDraft` | 保存草稿 | `sessionId: string` | `Promise<void>` |
| `submitExam` | 提交试卷 | `sessionId: string` | `Promise<ExamScore>` |
| `autoSubmit` | 超时自动提交 | `sessionId: string` | `Promise<ExamScore>` |
| `recordScreenSwitch` | 记录切屏 | `sessionId: string` | `Promise<void>` |
| `publishExam` | 发布考试 | `config: ExamPublishConfig` | `Promise<{ examId: string }>` |
| `endExam` | 结束考试 | `examId: string` | `Promise<void>` |

### 4.4 阅卷评分服务 (GradingService)

| 方法名 | 功能说明 | 参数 | 返回值 |
|--------|----------|------|--------|
| `gradeObjective` | 自动批改客观题 | `sessionId: string` | `Promise<ExamScore>` |
| `gradeSubjective` | 人工批阅主观题 | `data: SubjectiveGrading` | `Promise<GradingResult>` |
| `batchGradeSubjective` | 批量批阅主观题 | `data: SubjectiveGrading[]` | `Promise<GradingResult[]>` |
| `reviewScore` | 成绩复核 | `scoreId: string` | `Promise<ExamScore>` |
| `updateScore` | 修改分数 | `scoreId: string; questionId: string; score: number; comment?: string` | `Promise<ExamScore>` |
| `resetScore` | 重置成绩 | `scoreId: string` | `Promise<void>` |
| `getGradingQueue` | 获取待批阅队列 | `paperId?: string; userId?: string` | `Promise<ExamSession[]>` |

### 4.5 成绩分析服务 (AnalysisService)

| 方法名 | 功能说明 | 参数 | 返回值 |
|--------|----------|------|--------|
| `getClassStats` | 获取班级成绩统计 | `classId: string; examId?: string` | `Promise<ClassScoreStats>` |
| `getClassRanking` | 获取班级排名 | `classId: string; examId: string` | `Promise<{ rank: number; userId: string; userName: string; score: number }[]>` |
| `getPersonalDetail` | 获取个人成绩详情 | `userId: string; examId: string` | `Promise<PersonalScoreDetail>` |
| `getKnowledgeAnalysis` | 获取知识点分析 | `classId?: string; examId?: string` | `Promise<KnowledgePointAnalysis[]>` |
| `getDifficultyDistribution` | 获取难度分布 | `examId: string` | `Promise<{ easy: number; medium: number; hard: number }>` |
| `exportScores` | 导出成绩 | `examId: string; format: 'excel' | 'pdf'` | `Promise<Blob>` |

### 4.6 错题本服务 (WrongBookService)

| 方法名 | 功能说明 | 参数 | 返回值 |
|--------|----------|------|--------|
| `addWrongQuestion` | 添加错题 | `question: Question; userAnswer: string | string[] | null; examSessionId: string` | `Promise<void>` |
| `getWrongQuestions` | 获取错题列表 | `userId?: string; subject?: string; knowledgePoint?: string; mastered?: boolean` | `Promise<WrongQuestion[]>` |
| `updateWrongQuestion` | 更新错题状态 | `id: string; isCorrect: boolean` | `Promise<void>` |
| `markAsMastered` | 标记为已掌握 | `id: string` | `Promise<void>` |
| `removeWrongQuestion` | 移除错题 | `id: string` | `Promise<boolean>` |
| `createReviewSession` | 创建复习会话 | `userId: string; knowledgePoints?: string[]; count?: number` | `Promise<ExamSession>` |
| `getWrongBookStats` | 获取错题本统计 | `userId: string` | `Promise<{ total: number; mastered: number; bySubject: Record<string, number> }>` |
| `clearWrongBook` | 清空错题本 | `userId: string` | `Promise<void>` |

## 五、数据库/数据层设计

### 5.1 Mock数据结构

#### 5.1.1 科目配置

```typescript
export const SUBJECTS = [
  { id: 'math', name: '数学', icon: '🧮', color: '#4D96FF' },
  { id: 'chinese', name: '语文', icon: '📖', color: '#FF6B6B' },
  { id: 'english', name: '英语', icon: '🔤', color: '#9B59B6' },
  { id: 'science', name: '科学', icon: '🔬', color: '#4ECDC4' },
  { id: 'history', name: '历史', icon: '📜', color: '#8B4513' },
  { id: 'geography', name: '地理', icon: '🌍', color: '#6BCB77' },
]

export const GRADES = [
  { id: 'g1', name: '一年级', stage: '小学' },
  { id: 'g2', name: '二年级', stage: '小学' },
  { id: 'g3', name: '三年级', stage: '小学' },
  { id: 'g4', name: '四年级', stage: '小学' },
  { id: 'g5', name: '五年级', stage: '小学' },
  { id: 'g6', name: '六年级', stage: '小学' },
  { id: 'g7', name: '初一', stage: '初中' },
  { id: 'g8', name: '初二', stage: '初中' },
  { id: 'g9', name: '初三', stage: '初中' },
]
```

#### 5.1.2 Mock试题示例（支持文本、图片、语音、视频）

```typescript
export const MOCK_QUESTIONS: Question[] = [
  // 示例1：纯文本单选题
  {
    id: 'q001',
    type: 'single',
    subject: 'math',
    grade: 'g3',
    chapter: '第三章 加减法',
    knowledgePoints: ['k001', 'k002'],
    difficulty: 'easy',
    score: 10,
    timeLimit: 60,
    tags: ['基础', '计算'],
    content: [
      { type: 'text', content: '小明有5个苹果，小红有3个苹果，他们一共有几个苹果？' }
    ],
    options: [
      { id: 'A', content: [{ type: 'text', content: '6个' }], isCorrect: false },
      { id: 'B', content: [{ type: 'text', content: '8个' }], isCorrect: true },
      { id: 'C', content: [{ type: 'text', content: '7个' }], isCorrect: false },
      { id: 'D', content: [{ type: 'text', content: '9个' }], isCorrect: false },
    ],
    answer: { type: 'text', content: 'B' },
    explanation: [
      { type: 'text', content: '5 + 3 = 8，所以他们一共有8个苹果。' }
    ],
    attachments: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 5,
    createdBy: 'admin',
    reviewCount: 1,
  },
  // 示例2：包含图片的题目
  {
    id: 'q002',
    type: 'single',
    subject: 'science',
    grade: 'g5',
    chapter: '植物的生长',
    knowledgePoints: ['k003'],
    difficulty: 'easy',
    score: 10,
    timeLimit: 60,
    tags: ['植物', '叶子'],
    content: [
      { type: 'text', content: '观察下图，这是植物的什么器官？' },
      { type: 'image', image: { 
        type: 'image', 
        url: '/images/leaf.jpg', 
        alt: '一片绿色的叶子', 
        width: 200, 
        height: 150,
        caption: '植物的叶子'
      }}
    ],
    options: [
      { id: 'A', content: [{ type: 'text', content: '根' }], isCorrect: false },
      { id: 'B', content: [{ type: 'text', content: '茎' }], isCorrect: false },
      { id: 'C', content: [{ type: 'text', content: '叶' }], isCorrect: true },
      { id: 'D', content: [{ type: 'text', content: '花' }], isCorrect: false },
    ],
    answer: { type: 'text', content: 'C' },
    explanation: [
      { type: 'text', content: '图中展示的是植物的叶子，叶子是植物进行光合作用的主要器官。' }
    ],
    attachments: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 3,
    createdBy: 'admin',
    reviewCount: 1,
  },
  // 示例3：包含语音的听力题
  {
    id: 'q003',
    type: 'single',
    subject: 'english',
    grade: 'g4',
    chapter: '听力理解',
    knowledgePoints: ['k004'],
    difficulty: 'medium',
    score: 10,
    timeLimit: 60,
    tags: ['听力', '英语'],
    content: [
      { type: 'text', content: '听下面的录音，选择听到的单词：' },
      { type: 'audio', audio: { 
        type: 'audio',
        url: '/audio/word_apple.mp3',
        title: '听力材料',
        duration: 5,
        controls: true
      }}
    ],
    options: [
      { id: 'A', content: [{ type: 'text', content: 'apple' }], isCorrect: true },
      { id: 'B', content: [{ type: 'text', content: 'banana' }], isCorrect: false },
      { id: 'C', content: [{ type: 'text', content: 'orange' }], isCorrect: false },
      { id: 'D', content: [{ type: 'text', content: 'grape' }], isCorrect: false },
    ],
    answer: { type: 'text', content: 'A' },
    explanation: [
      { type: 'text', content: '录音中播放的单词是 "apple"，意思是苹果。' }
    ],
    attachments: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    createdBy: 'admin',
    reviewCount: 1,
  },
  // 示例4：包含视频的题目
  {
    id: 'q004',
    type: 'single',
    subject: 'science',
    grade: 'g6',
    chapter: '物理实验',
    knowledgePoints: ['k005'],
    difficulty: 'medium',
    score: 15,
    timeLimit: 120,
    tags: ['物理', '实验'],
    content: [
      { type: 'text', content: '观看下面的视频，回答问题：视频中演示的是什么物理现象？' },
      { type: 'video', video: { 
        type: 'video',
        url: '/videos/gravity_demo.mp4',
        title: '重力实验演示',
        duration: 30,
        width: 400,
        height: 225,
        poster: '/images/video_poster.jpg',
        controls: true
      }}
    ],
    options: [
      { id: 'A', content: [{ type: 'text', content: '浮力' }], isCorrect: false },
      { id: 'B', content: [{ type: 'text', content: '重力' }], isCorrect: true },
      { id: 'C', content: [{ type: 'text', content: '摩擦力' }], isCorrect: false },
      { id: 'D', content: [{ type: 'text', content: '弹力' }], isCorrect: false },
    ],
    answer: { type: 'text', content: 'B' },
    explanation: [
      { type: 'text', content: '视频中展示的是物体自由下落的现象，这是由于地球引力（重力）的作用。' }
    ],
    attachments: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 1,
    createdBy: 'admin',
    reviewCount: 2,
  },
  // 示例5：文本+图片组合题
  {
    id: 'q005',
    type: 'fill',
    subject: 'math',
    grade: 'g2',
    chapter: '图形认知',
    knowledgePoints: ['k006'],
    difficulty: 'easy',
    score: 10,
    timeLimit: 60,
    tags: ['图形', '计数'],
    content: [
      { type: 'text', content: '数一数，下图中有几个圆形？' },
      { type: 'image', image: { 
        type: 'image', 
        url: '/images/shapes_count.jpg', 
        alt: '包含圆形、方形、三角形的图片', 
        width: 300, 
        height: 200 
      }}
    ],
    answer: { type: 'text', content: '3', keywords: ['3'] },
    explanation: [
      { type: 'text', content: '图中有3个圆形。' }
    ],
    attachments: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
    createdBy: 'admin',
    reviewCount: 1,
  },
  // 示例6：包含公式的数学题
  {
    id: 'q006',
    type: 'single',
    subject: 'math',
    grade: 'g8',
    chapter: '一元二次方程',
    knowledgePoints: ['k007'],
    difficulty: 'medium',
    score: 15,
    timeLimit: 90,
    tags: ['方程', '代数'],
    content: [
      { type: 'text', content: '方程 ' },
      { type: 'formula', formula: 'x^2 - 5x + 6 = 0' },
      { type: 'text', content: ' 的两个根分别是：' }
    ],
    options: [
      { id: 'A', content: [{ type: 'text', content: 'x=2, x=3' }], isCorrect: true },
      { id: 'B', content: [{ type: 'text', content: 'x=1, x=6' }], isCorrect: false },
      { id: 'C', content: [{ type: 'text', content: 'x=-2, x=-3' }], isCorrect: false },
      { id: 'D', content: [{ type: 'text', content: 'x=2, x=-3' }], isCorrect: false },
    ],
    answer: { type: 'text', content: 'A' },
    explanation: [
      { type: 'text', content: '因式分解得：' },
      { type: 'formula', formula: '(x-2)(x-3) = 0' },
      { type: 'text', content: '，所以 x=2 或 x=3' }
    ],
    attachments: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now(),
    createdBy: 'admin',
    reviewCount: 1,
  },
  // 示例7：包含表格的题目
  {
    id: 'q007',
    type: 'fill',
    subject: 'math',
    grade: 'g4',
    chapter: '数据统计',
    knowledgePoints: ['k008'],
    difficulty: 'medium',
    score: 10,
    timeLimit: 60,
    tags: ['表格', '统计'],
    content: [
      { type: 'text', content: '根据下表，计算小明一周的平均零花钱：' },
      { type: 'table', table: { 
        rows: [
          ['星期', '零花钱（元）'],
          ['周一', '5'],
          ['周二', '3'],
          ['周三', '5'],
          ['周四', '4'],
          ['周五', '5'],
          ['周六', '10'],
          ['周日', '8']
        ],
        bordered: true,
        striped: true
      }}
    ],
    answer: { type: 'text', content: '6', keywords: ['6'] },
    explanation: [
      { type: 'text', content: '总零花钱 = 5+3+5+4+5+10+8 = 40元，平均 = 40 ÷ 7 ≈ 5.71，约等于6元。' }
    ],
    attachments: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
    createdBy: 'admin',
    reviewCount: 1,
  },
]
```

### 5.2 本地存储键设计

| 存储键 | 数据类型 | 说明 |
|--------|----------|------|
| `quiz_questions` | `Question[]` | 试题列表 |
| `quiz_papers` | `Paper[]` | 试卷列表 |
| `quiz_exam_sessions` | `ExamSession[]` | 考试会话 |
| `quiz_scores` | `ExamScore[]` | 成绩记录 |
| `quiz_wrong_questions` | `WrongQuestion[]` | 错题记录 |
| `quiz_knowledge_points` | `KnowledgePoint[]` | 知识点列表 |

## 六、API接口设计

### 6.1 题库管理接口

| 接口路径 | HTTP方法 | 功能说明 | 权限 |
|----------|----------|----------|------|
| `/api/quiz/questions` | GET | 分页获取试题列表 | 公开/用户 |
| `/api/quiz/questions/{id}` | GET | 获取单个试题 | 公开/用户 |
| `/api/quiz/questions` | POST | 创建试题 | 管理员 |
| `/api/quiz/questions/{id}` | PUT | 更新试题 | 管理员 |
| `/api/quiz/questions/{id}` | DELETE | 删除试题 | 管理员 |
| `/api/quiz/questions/search` | GET | 搜索试题 | 公开/用户 |
| `/api/quiz/questions/similarity` | POST | 查重检测 | 管理员 |
| `/api/quiz/questions/import` | POST | 批量导入（Excel） | 管理员 |
| `/api/quiz/questions/export` | POST | 批量导出（Excel） | 管理员 |
| `/api/quiz/questions/batch-status` | PUT | 批量更新状态 | 管理员 |

### 6.2 试卷管理接口

| 接口路径 | HTTP方法 | 功能说明 | 权限 |
|----------|----------|----------|------|
| `/api/quiz/papers` | GET | 分页获取试卷列表 | 公开/用户 |
| `/api/quiz/papers/{id}` | GET | 获取试卷详情 | 公开/用户 |
| `/api/quiz/papers` | POST | 创建试卷 | 管理员/教师 |
| `/api/quiz/papers/{id}` | PUT | 更新试卷 | 管理员/教师 |
| `/api/quiz/papers/{id}` | DELETE | 删除试卷 | 管理员/教师 |
| `/api/quiz/papers/{id}/questions` | POST | 添加试题到试卷 | 管理员/教师 |
| `/api/quiz/papers/{id}/questions/{qid}` | DELETE | 移除试卷中的试题 | 管理员/教师 |
| `/api/quiz/papers/smart` | POST | 智能组卷 | 管理员/教师 |
| `/api/quiz/papers/{id}/preview` | GET | 预览试卷 | 公开/用户 |
| `/api/quiz/papers/{id}/export` | GET | 导出试卷 | 公开/用户 |

### 6.3 在线考试接口

| 接口路径 | HTTP方法 | 功能说明 | 权限 |
|----------|----------|----------|------|
| `/api/quiz/exam/sessions` | POST | 创建考试会话 | 用户 |
| `/api/quiz/exam/sessions/{id}` | GET | 获取考试会话 | 用户 |
| `/api/quiz/exam/sessions/{id}/answers` | PUT | 更新答案 | 用户 |
| `/api/quiz/exam/sessions/{id}/mark` | PUT | 标记题目 | 用户 |
| `/api/quiz/exam/sessions/{id}/draft` | POST | 保存草稿 | 用户 |
| `/api/quiz/exam/sessions/{id}/submit` | POST | 提交试卷 | 用户 |
| `/api/quiz/exam/sessions/{id}/screen-switch` | POST | 记录切屏 | 用户 |
| `/api/quiz/exam/publish` | POST | 发布考试 | 管理员/教师 |
| `/api/quiz/exam/{id}/end` | POST | 结束考试 | 管理员/教师 |

### 6.4 阅卷评分接口

| 接口路径 | HTTP方法 | 功能说明 | 权限 |
|----------|----------|----------|------|
| `/api/quiz/grading/objective/{sessionId}` | POST | 自动批改客观题 | 系统 |
| `/api/quiz/grading/subjective` | POST | 人工批阅主观题 | 管理员/教师 |
| `/api/quiz/grading/subjective/batch` | POST | 批量批阅主观题 | 管理员/教师 |
| `/api/quiz/grading/{scoreId}/review` | POST | 成绩复核 | 管理员/教师 |
| `/api/quiz/grading/{scoreId}/update` | PUT | 修改分数 | 管理员/教师 |
| `/api/quiz/grading/{scoreId}/reset` | POST | 重置成绩 | 管理员/教师 |
| `/api/quiz/grading/queue` | GET | 获取待批阅队列 | 管理员/教师 |

### 6.5 成绩分析接口

| 接口路径 | HTTP方法 | 功能说明 | 权限 |
|----------|----------|----------|------|
| `/api/quiz/analysis/class/{classId}` | GET | 获取班级成绩统计 | 管理员/教师 |
| `/api/quiz/analysis/class/{classId}/ranking` | GET | 获取班级排名 | 管理员/教师/用户 |
| `/api/quiz/analysis/user/{userId}` | GET | 获取个人成绩详情 | 用户 |
| `/api/quiz/analysis/knowledge` | GET | 获取知识点分析 | 管理员/教师 |
| `/api/quiz/analysis/difficulty/{examId}` | GET | 获取难度分布 | 管理员/教师 |
| `/api/quiz/analysis/export/{examId}` | GET | 导出成绩 | 管理员/教师 |

### 6.6 错题本接口

| 接口路径 | HTTP方法 | 功能说明 | 权限 |
|----------|----------|----------|------|
| `/api/quiz/wrong/list` | GET | 获取错题列表 | 用户 |
| `/api/quiz/wrong/{id}` | PUT | 更新错题状态 | 用户 |
| `/api/quiz/wrong/{id}/master` | POST | 标记为已掌握 | 用户 |
| `/api/quiz/wrong/{id}` | DELETE | 移除错题 | 用户 |
| `/api/quiz/wrong/review` | POST | 创建复习会话 | 用户 |
| `/api/quiz/wrong/stats` | GET | 获取错题本统计 | 用户 |
| `/api/quiz/wrong/clear` | DELETE | 清空错题本 | 用户 |

## 七、UI交互设计

### 7.1 题库管理界面

**组件结构：**
- `QuestionManager.vue` - 题库管理主页面
- `QuestionForm.vue` - 试题编辑表单
- `QuestionList.vue` - 试题列表
- `QuestionPreview.vue` - 试题预览
- `BatchImportModal.vue` - 批量导入弹窗

**功能特性：**
- 分页展示、搜索筛选
- 支持所有题型编辑
- 附件上传管理
- 查重检测提示
- 批量操作（审核、迁移、删除）

### 7.2 试卷管理界面

**组件结构：**
- `PaperManager.vue` - 试卷管理主页面
- `PaperForm.vue` - 试卷编辑表单
- `PaperQuestionSelector.vue` - 试题选择器
- `SmartPaperGenerator.vue` - 智能组卷面板
- `PaperPreview.vue` - 试卷预览

**功能特性：**
- 手动选题/智能组卷
- 试卷配置（总分、时长、及格线等）
- 随机试卷设置
- 预览导出

### 7.3 在线考试界面

**组件结构：**
- `ExamPanel.vue` - 考试主面板
- `ExamQuestion.vue` - 单题展示
- `ExamNavigation.vue` - 题目导航
- `ExamTimer.vue` - 计时器
- `ExamResult.vue` - 考试结果

**功能特性：**
- 单题分页/整卷浏览
- 草稿保存、标记疑难
- 切屏检测、弹窗提醒
- 主动交卷/超时自动交卷

### 7.4 阅卷评分界面

**组件结构：**
- `GradingPanel.vue` - 阅卷主面板
- `SubjectiveGrading.vue` - 主观题批阅
- `ScoreReview.vue` - 成绩复核
- `AnswerDetail.vue` - 答题详情

**功能特性：**
- 客观题自动批改
- 主观题批量批阅
- 给分批注、成绩修改
- 答题详情回看

### 7.5 成绩分析界面

**组件结构：**
- `ScoreAnalysis.vue` - 成绩分析主页面
- `ClassRanking.vue` - 班级排名
- `KnowledgeAnalysis.vue` - 知识点分析
- `ScoreChart.vue` - 数据图表

**功能特性：**
- 班级总分排名
- 知识点薄弱项统计
- 平均分、及格率图表
- 成绩导出（Excel/PDF）

### 7.6 错题本界面

**组件结构：**
- `WrongBook.vue` - 错题本主页面
- `WrongQuestionCard.vue` - 错题卡片
- `ReviewPanel.vue` - 复习面板
- `WrongStats.vue` - 错题统计

**功能特性：**
- 按知识点/科目筛选
- 自动收录错题
- 专项复习刷题
- 掌握标记管理

## 八、防作弊机制

| 机制 | 实现方式 |
|------|----------|
| **切屏检测** | 通过 `visibilitychange` 事件监听，记录切屏次数 |
| **限时答题** | 服务器端计时，超时自动提交 |
| **禁止复制** | CSS `user-select: none` + JS 事件拦截 |
| **弹窗提醒** | 切屏时弹出警告提示 |
| **随机试卷** | 同一场考试试题顺序随机打乱 |
| **断点续答** | 定期自动保存答案，支持断点恢复 |

## 九、扩展规划

1. **AI智能批改**：主观题AI辅助批改
2. **个性化学习**：根据错题推荐练习题
3. **在线编程评测**：编程题在线编译运行
4. **家校互通**：成绩推送家长端
5. **题库协作**：多用户协作编辑题库

## 十、文件结构

```
kids-game-simple/src/
├── types/
│   ├── quiz.ts           # 试题类型定义
│   ├── paper.ts          # 试卷类型定义
│   ├── exam.ts           # 考试类型定义
│   └── grading.ts        # 评分类型定义
├── data/
│   └── mockData.ts       # Mock数据
├── services/
│   ├── quizService.ts    # 题库管理服务
│   ├── paperService.ts   # 试卷管理服务
│   ├── examService.ts    # 在线考试服务
│   ├── gradingService.ts # 阅卷评分服务
│   ├── analysisService.ts # 成绩分析服务
│   └── wrongBookService.ts # 错题本服务
├── components/
│   ├── quiz/             # 题库管理组件
│   ├── paper/            # 试卷管理组件
│   ├── exam/             # 在线考试组件
│   ├── grading/          # 阅卷评分组件
│   ├── analysis/         # 成绩分析组件
│   └── wrongBook/        # 错题本组件
└── apiClient.ts          # 后端API接口
```

---

## 实现步骤

### 阶段一：基础类型与数据层

| 步骤 | 任务 | 状态 |
|------|------|------|
| 1 | 创建类型定义文件 `types/quiz.ts` | pending |
| 2 | 创建类型定义文件 `types/paper.ts` | pending |
| 3 | 创建类型定义文件 `types/exam.ts` | pending |
| 4 | 创建类型定义文件 `types/grading.ts` | pending |
| 5 | 创建Mock数据文件 `data/mockData.ts` | pending |

### 阶段二：核心服务实现

| 步骤 | 任务 | 状态 |
|------|------|------|
| 6 | 创建题库管理服务 `services/quizService.ts` | pending |
| 7 | 创建试卷管理服务 `services/paperService.ts` | pending |
| 8 | 创建在线考试服务 `services/examService.ts` | pending |
| 9 | 创建阅卷评分服务 `services/gradingService.ts` | pending |
| 10 | 创建成绩分析服务 `services/analysisService.ts` | pending |
| 11 | 创建错题本服务 `services/wrongBookService.ts` | pending |
| 12 | 更新API客户端添加试题相关接口 | pending |

### 阶段三：UI组件开发

| 步骤 | 任务 | 状态 |
|------|------|------|
| 13 | 创建题库管理组件 | pending |
| 14 | 创建试卷管理组件 | pending |
| 15 | 创建在线考试组件 | pending |
| 16 | 创建阅卷评分组件 | pending |
| 17 | 创建成绩分析组件 | pending |
| 18 | 创建错题本组件 | pending |

### 阶段四：集成与测试

| 步骤 | 任务 | 状态 |
|------|------|------|
| 19 | 与用户服务集成 | pending |
| 20 | 与存储服务集成 | pending |
| 21 | 防作弊机制实现 | pending |
| 22 | 测试与验证 | pending |