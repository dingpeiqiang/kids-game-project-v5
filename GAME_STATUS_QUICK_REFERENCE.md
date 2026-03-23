# 游戏状态枚举 - 快速参考指南

## 📝 状态枚举值

| 状态码 | 枚举常量 | 中文描述 | 图标 | 颜色 |
|--------|---------|----------|------|------|
| 0 | `DRAFT` | 草稿 | 📝 | 灰色 (#6b7280) |
| 1 | `PENDING_REVIEW` | 待审核 | ⏳ | 黄色 (#f59e0b) |
| 2 | `ON_SALE` | 已上架 | 📤 | 绿色 (#10b981) |
| 3 | `OFFLINE` | 已下架 | 📥 | 红色 (#ef4444) |
| 4 | `REJECTED` | 审核驳回 | ❌ | 深红 (#dc2626) |

## 🔄 状态流转规则

```
┌─────────────┐
│   草稿      │
│  (DRAFT)    │
└──────┬──────┘
       │ 提交审核
       ▼
┌─────────────┐
│  待审核     │
│(PENDING_    │
│  REVIEW)    │
└──────┬──────┘
       │
       ├──────────────┬─────────────┐
       │ 审核通过     │ 审核驳回    │
       ▼              ▼             │
┌─────────────┐ ┌─────────────┐    │
│  已上架     │ │  审核驳回   │    │
│ (ON_SALE)   │ │ (REJECTED)  │    │
└──────┬──────┘ └──────┬──────┘    │
       │               │            │
       │ 下架          │ 重新提交   │
       ▼               │            │
┌─────────────┐        │            │
│  已下架     │────────┴────────────┘
│ (OFFLINE)   │
└──────┬──────┘
       │
       │ 上架
       ▼
┌─────────────┐
│  已上架     │ (循环)
└─────────────┘
```

## 💻 后端使用示例

### Java 代码

```java
// 1. 设置状态
game.setStatus(GameStatusEnum.DRAFT.getCode());

// 2. 获取状态枚举
GameStatusEnum status = GameStatusEnum.valueOfCode(game.getStatus());

// 3. 验证状态流转
if (status.canTransitionTo(GameStatusEnum.ON_SALE)) {
    game.setStatus(GameStatusEnum.ON_SALE.getCode());
}

// 4. 获取状态描述
String desc = status.getDescription(); // "草稿"

// 5. 判断状态类型
if (status.isFinalState()) {
    // 终态：已上架、已下架
}
if (status.isIntermediateState()) {
    // 中间状态：待审核、审核驳回
}
```

### 业务场景

#### 创建游戏
```java
game.setStatus(GameStatusEnum.DRAFT.getCode()); // 默认为草稿
```

#### 提交审核
```java
GameStatusEnum current = GameStatusEnum.valueOfCode(game.getStatus());
if (current != GameStatusEnum.DRAFT && current != GameStatusEnum.REJECTED) {
    throw new RuntimeException("当前状态不允许提交审核");
}
game.setStatus(GameStatusEnum.PENDING_REVIEW.getCode());
```

#### 审核通过
```java
GameStatusEnum current = GameStatusEnum.valueOfCode(game.getStatus());
if (current != GameStatusEnum.PENDING_REVIEW) {
    throw new RuntimeException("只有待审核状态才能审核");
}
game.setStatus(GameStatusEnum.ON_SALE.getCode());
```

#### 上下架操作
```java
// 上架
game.setStatus(GameStatusEnum.ON_SALE.getCode());

// 下架
game.setStatus(GameStatusEnum.OFFLINE.getCode());
```

## 🎨 前端使用示例

### TypeScript/Vue 代码

```typescript
import { 
  GAME_STATUS, 
  getGameStatusText, 
  getGameStatusColor,
  getGameStatusIcon,
  canPublish,
  canUnpublish,
  canSubmitReview
} from '@/services/api.types';

// 1. 状态判断
if (game.status === GAME_STATUS.ON_SALE) {
  console.log('游戏已上架');
}

// 2. 获取显示文本
const statusText = getGameStatusText(game.status); // "已上架"
const statusIcon = getGameStatusIcon(game.status); // "📤"
const statusColor = getGameStatusColor(game.status); // "#10b981"

// 3. 操作权限判断
if (canSubmitReview(game.status)) {
  // 可以提交审核：草稿 或 审核驳回
  await submitReview();
}

if (canPublish(game.status)) {
  // 可以上架：已下架 或 草稿
  await publish();
}

if (canUnpublish(game.status)) {
  // 可以下架：已上架
  await unpublish();
}
```

### 组件中的使用

```vue
<template>
  <!-- 状态标签 -->
  <div class="status-badge" :style="{ color: getGameStatusColor(game.status) }">
    {{ getGameStatusIcon(game.status) }}
    {{ getGameStatusText(game.status) }}
  </div>
  
  <!-- 智能操作按钮 -->
  <button 
    v-if="canSubmitReview(game.status)"
    @click="submitReview(game)"
  >
    📤 提交审核
  </button>
  
  <button 
    v-if="canPublish(game.status)"
    @click="publish(game)"
  >
    📤 上架
  </button>
  
  <button 
    v-if="canUnpublish(game.status)"
    @click="unpublish(game)"
  >
    📥 下架
  </button>
</template>
```

## 🎯 常见场景处理

### 场景 1: 新游戏创建流程
```
1. 创建游戏 → DRAFT (草稿)
2. 完善信息 → DRAFT (草稿)
3. 提交审核 → PENDING_REVIEW (待审核)
4. 审核通过 → ON_SALE (已上架)
   审核驳回 → REJECTED (审核驳回)
5. 重新提交 → PENDING_REVIEW (待审核)
```

### 场景 2: 游戏上下架
```
已上架游戏:
- 下架操作: ON_SALE → OFFLINE
- 重新上架: OFFLINE → ON_SALE

草稿游戏:
- 不能直接上架
- 必须先提交审核并通过
```

### 场景 3: 审核流程
```
待审核状态:
- 允许的操作: 审核通过、审核驳回
- 禁止的操作: 上架、下架、删除

审核驳回状态:
- 允许的操作: 修改后重新提交
- 禁止的操作: 上架、下架
```

## ⚠️ 错误处理

### 后端异常
```java
try {
    gameManagementService.publishGame(gameId, version, userId);
} catch (RuntimeException e) {
    // 可能的异常:
    // - "游戏不存在：xxx"
    // - "当前状态不允许上架操作。当前状态：草稿"
    log.error("上架游戏失败", e);
    throw e;
}
```

### 前端错误提示
```typescript
try {
  await adminApi.submitReview(game.gameId);
  await dialog.success('提交审核成功！');
} catch (error) {
  await dialog.error('提交审核失败：' + error.message);
}
```

## 📋 API 端点

### 后端 REST API

```http
# 提交审核
POST /api/admin/games/{gameId}/submit-review

# 审核游戏
POST /api/admin/games/{gameId}/review
Content-Type: application/json
{
  "reviewStatus": 1,        // 1-通过，2-驳回
  "reviewComment": "审核意见",
  "rejectReason": "驳回原因"
}

# 上架游戏
POST /api/admin/games/{gameId}/publish?version=1.0.0

# 下架游戏
POST /api/admin/games/{gameId}/unpublish?reason=下架原因

# 更新状态（通用）
PUT /api/admin/games/{gameId}/status
Content-Type: application/json
{
  "status": 2  // 状态码
}
```

## 🔍 调试查询

### 查询游戏状态分布
```sql
SELECT 
    CASE status
        WHEN 0 THEN '草稿'
        WHEN 1 THEN '待审核'
        WHEN 2 THEN '已上架'
        WHEN 3 THEN '已下架'
        WHEN 4 THEN '审核驳回'
        ELSE '未知'
    END AS status_name,
    COUNT(*) AS game_count
FROM t_game
WHERE deleted = 0
GROUP BY status
ORDER BY status;
```

### 查询特定状态的游戏
```sql
-- 查询所有待审核的游戏
SELECT * FROM t_game 
WHERE status = 1 AND deleted = 0
ORDER BY create_time DESC;

-- 查询所有已上架的游戏
SELECT * FROM t_game 
WHERE status = 2 AND deleted = 0
ORDER BY sort_order ASC;
```

---

**最后更新**: 2026-03-24  
**版本**: v2.0.0
