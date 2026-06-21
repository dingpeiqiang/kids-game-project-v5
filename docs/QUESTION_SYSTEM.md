# 试题与练习系统说明

> 对标粉笔/作业帮，支持 7 种题型、错题本、收藏夹、学习报告、班级任务。

## 架构

| 层级 | 路径 |
|------|------|
| 管理端 UI | `kids-game-frontend` → `modules/admin/components/` → `QuestionManagement.vue` / `SubjectManagement.vue` / `KnowledgePointManagement.vue` |
| 儿童答题 | `kids-game-frontend` → `modules/answer/index.vue` |
| 错题本 | `kids-game-frontend` → `modules/wrong-book/index.vue` |
| 收藏夹 | `kids-game-frontend` → `modules/collection/index.vue` |
| 学习报告 | `kids-game-frontend` → `modules/learning-report/index.vue` |
| 家长报表 | `kids-game-frontend` → `modules/parent/components/ParentLearningReport.vue` |
| 教师端 | `kids-game-frontend` → `modules/teacher/`（班级管理 / 练习任务 / 班级学情） |
| API | `QuestionController`、`PracticeController`、`WrongBookController`、`CollectionController`、`KnowledgePointController`、`SubjectController`、`ClassController`、`AssignmentController`、`LearningReportController`、`ParentReportController` |
| 业务 | `QuestionServiceImpl` + `QuestionAnswerEvaluator` + `PracticeService` / `WrongBookService` / `CollectionService` / `ClassService` / `AssignmentService` / `LearningReportService` / `ParentReportService` |
| 数据 | `t_question`、`t_answer_record`、`t_knowledge_point`、`t_wrong_question`、`t_collection`、`t_daily_session`、`t_class`、`t_class_member`、`t_practice_assignment`、`t_assignment_completion` |

## 题型（7 种）

| 题型 | type 值 | 答案格式 | 说明 |
|------|---------|----------|------|
| 单选 | `single` | 选项全文或 `A` | 兼容历史 `choice` |
| 多选 | `multiple` | `A,C,D`（逗号分隔字母） | 全对才正确 |
| 判断 | `judge` | `对` / `错` | 兼容历史 `judgment` |
| 填空 | `fill` | `北京\|\|\|上海`（多空用 `\|\|\|`，备选答案用 `\|`） | 支持容错模式 |
| 简答 | `short_answer` | 文本 | 关键词全包含判对，否则需人工复核 |
| 图片题 | `image` | 按 `answerMode`（single/multiple/text） | 题干含图片 |
| 音频题 | `audio` | 按 `answerMode` | 题干含音频 |

### 填空题约定

- 多空分隔符：`|||`（如 `北京|||上海|||广州`）
- 同空备选答案：`|`（如 `北京|北平|||上海|沪`）
- `fillConfig` JSON：`{ "tolerance": "IGNORE_CASE", "caseSensitive": false, "ignoreWhitespace": true, "ignorePunctuation": false }`
- 容错模式：`EXACT` / `IGNORE_CASE` / `IGNORE_WHITESPACE` / `IGNORE_PUNCTUATION` / `KEYWORD`

### 简答题约定

- `shortAnswerKeywords` JSON 数组：`["关键词1", "关键词2"]`
- 用户答案包含全部关键词判对，否则判错（需人工复核）
- 返回 `matchedKeywords` 提示已匹配的关键词

## 数据模型

### t_question（扩展）

新增字段：`subject_id`、`knowledge_points`（JSON ID 数组）、`tags`（JSON 字符串数组）、`media_urls`（JSON 媒体数组）、`score`、`time_limit`、`answer_mode`、`fill_config`、`short_answer_keywords`。

### t_answer_record（扩展）

新增字段：`session_id`、`subject_id`、`knowledge_point_ids`、`question_type`、`difficulty`、`is_marked`、`is_collected`、`is_wrong`。

### 新增表

| 表 | 用途 |
|----|------|
| `t_knowledge_point` | 知识点树（parentId/code/chapter） |
| `t_wrong_question` | 错题本（wrongCount/masteryLevel/nextReviewTime） |
| `t_collection` | 题目收藏（note） |
| `t_daily_session` | 每日练习会话（source: DAILY/RECOMMEND/WRONG_REVIEW/ASSIGNMENT） |
| `t_class` | 班级（inviteCode） |
| `t_class_member` | 班级成员（role: TEACHER/STUDENT） |
| `t_practice_assignment` | 教师练习任务 |
| `t_assignment_completion` | 任务完成情况 |

## 儿童端流程

### 每日练习会话

1. 欢迎页选择题目数量（5/10/15/20）和难度（全部/简单/中等/困难）。
2. 调 `practiceApi.start` 创建会话，`practiceApi.nextQuestion` 逐题获取。
3. 支持：题号导航、倒计时（`timeLimit`）、标记（🚩）、收藏（⭐）、图文解析。
4. 提交调 `practiceApi.submit`，答错自动加入错题本。
5. 完成调 `practiceApi.finish`，展示统计弹窗（答题数/正确率/游学币）。
6. 会话接口失败时回退到 `questionApi.getRandom` 逐题随机抽取。

### 错题本

- 分页查询（`wrongBookApi.page`）、待复习列表（`listDueReview`）。
- 复习判分（`review`）：答对 masteryLevel+1（上限 3），答错重置。
- 标记已掌握（`markMastered`）、移出错题本（`remove`）。

### 收藏夹

- 分页查询（`collectionApi.page`）、收藏/取消（`toggle`）、检查状态（`check`）。

### 学习报告

- 总览（`overview`）：累计答题/正确率/游学币/练习时长/错题数/收藏数/连续天数。
- 答题趋势（`trend`）：CSS 柱状图，支持 7/30 天。
- 知识点掌握度（`knowledgeMastery`）、学科分布（`subjectDistribution`）、难度分析（`difficultyAnalysis`）。
- 最近答题记录（`recent`）。

## 家长端

- 孩子学情报表（`ParentLearningReport.vue`）：
  - 孩子选择（多孩子切换）。
  - 总览（`parentReportApi.kidOverview`）。
  - 答题趋势（`kidTrend`，7/30 天）。
  - 薄弱知识点（`kidWeakPoints`，正确率 < 60%）。
  - 错题本概览（`kidWrongBook`）。
  - 最近答题（`kidRecent`）。

## 教师端

- **班级管理**：创建/编辑/解散班级，邀请码加入，查看成员/学生。
- **练习任务**：布置任务（班级/学科/知识点/难度/题量/题型/截止时间/奖励），查看完成情况。
- **班级学情**：班级整体统计 + 学生个人学情。

## 管理端

- **学科管理**（`SubjectManagement.vue`）：学科 CRUD。
- **知识点管理**（`KnowledgePointManagement.vue`）：树形结构，按学科查看，支持新增子节点/编辑/删除。
- **题库管理**（`QuestionManagement.vue`）：7 种题型，学科/知识点/难度/关键词筛选，富表单编辑（知识点树多选、动态选项、填空配置、简答关键词、媒体附件）。

## 权限

| 接口 | 权限 |
|------|------|
| `/api/question/random`、`/submit` | 登录即可；儿童不可代他人提交 |
| `/api/question/today-points`、`/records` | 儿童仅查本人 |
| `/api/question/page`、增删改、批量状态 | 管理员 |
| `/api/subject/list`、`/api/knowledge-point/list`、`/tree` | 登录即可 |
| `/api/subject` 增删改、`/api/knowledge-point` 增删改 | 管理员 |
| `/api/practice/**`、`/api/wrong-book/**`、`/api/collection/**` | 登录即可（按 token 解析 userId） |
| `/api/learning-report/**` | 登录即可（按 token 解析 userId） |
| `/api/parent/report/kid/{kidId}/**` | 管理员或儿童本人（家长关系校验后续扩展） |
| `/api/class` 创建/更新/删除 | 班级创建者 |
| `/api/assignment` 创建/更新/删除 | 任务创建者 |

## 本地验证

```bash
# 后端
cd kids-game-backend && mvn -q -pl kids-game-web -am compile -DskipTests

# 前端
cd kids-game-frontend && npm run type-check
cd kids-game-frontend && npm run dev
```

## 数据库迁移

执行 `kids-game-backend/kids-game-web/src/main/resources/schema_v3_question.sql` 增量迁移脚本（ALTER + CREATE TABLE）。
