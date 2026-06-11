# 试题系统说明

## 架构

| 层级 | 路径 |
|------|------|
| 管理端 UI | `kids-game-frontend` → `/admin/questions` → `QuestionManagement.vue` |
| 儿童答题 | `kids-game-simple` → `/answer` → 复用 `kids-game-frontend/src/modules/answer/index.vue` |
| API | `QuestionController` `/api/question/**` |
| 业务 | `QuestionServiceImpl` + `QuestionAnswerEvaluator` |
| 数据 | `t_question`、`t_answer_record` |

## 题型

- **choice**：选项 JSON 或逗号分隔；答案支持选项全文或 `A/B/C/D`。
- **judgment**：默认选项「对/错」；答案支持对/错、true/false、A/B。
- **fill**：无选项；答案比对忽略大小写、首尾空格。

## 儿童端流程

1. 欢迎页展示今日剩余可获游学币（`ParentLimit.dailyAnswerLimit` − `today-points`）。
2. 每次会话最多 5 题；`excludeIds` 尽量避免同会话重复抽题。
3. 提交后展示解析、规范化后的正确答案；游学币受家长管控上限约束。

## 权限

- `/api/question/random`、`/submit`：需登录；儿童 Token 的 `userId` 即 `kidId`，不可代他人提交。
- `/api/question/today-points`、`/records`：儿童仅能查本人 `kidId`。
- 分页/增删改/批量状态：仅 **管理员**（`userType === 2`），见 `JwtAuthHelper.assertAdmin`。

## 本地验证

```bash
# 后端
cd kids-game-backend && mvn -q -pl kids-game-web -am compile -DskipTests

# 管理端 + 终端
pnpm --filter kids-game-frontend dev
pnpm --filter kids-game-simple dev
```

管理员在「题库管理」录入启用题目后，儿童账号登录终端进入「答题挑战」即可联调。