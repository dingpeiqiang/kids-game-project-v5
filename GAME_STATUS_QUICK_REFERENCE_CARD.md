# 游戏状态枚举 - 快速参考卡片

## 🎯 状态值映射

```
0 → DRAFT        → 草稿
1 → PENDING_REVIEW → 待审核
2 → ON_SALE      → 已上架（可玩）
3 → OFFLINE      → 已下架
4 → REJECTED     → 审核驳回
```

## 🔧 后端工具类 (Java)

**导入**: `import com.kidgame.common.util.GameStatusUtil;`

```java
// 判断状态
GameStatusUtil.isOnSale(status);        // 是否已上架
GameStatusUtil.isDraft(status);         // 是否草稿
GameStatusUtil.isPendingReview(status); // 是否待审核
GameStatusUtil.isOffline(status);       // 是否已下架
GameStatusUtil.isRejected(status);      // 是否驳回

// 操作权限
GameStatusUtil.canPlay(status);         // 可否启动
GameStatusUtil.canPublish(status);      // 可否上架
GameStatusUtil.canSubmitReview(status); // 可否提交审核

// 其他
GameStatusUtil.getStatusDescription(status); // 状态描述
GameStatusUtil.canTransition(current, target); // 状态流转验证
```

## 💻 前端工具函数 (TypeScript)

**导入**: `import { canPlay, isOnSale, ... } from '@/services/api.types';`

```typescript
// 判断状态
isOnSale(status);         // 是否已上架
isDraft(status);          // 是否草稿
isPendingReview(status);  // 是否待审核
isOffline(status);        // 是否已下架
isRejected(status);       // 是否驳回

// 操作权限
canPlay(status);          // 可否启动
canPublish(status);       // 可否上架
canUnpublish(status);     // 可否下架
canSubmitReview(status);  // 可否提交审核

// 显示相关
getGameStatusText(status);    // 状态文本
getGameStatusColor(status);   // 状态颜色
getGameStatusIcon(status);    // 状态图标
getGameStatusBgClass(status); // 背景样式类
```

## 📋 代码对比示例

### ❌ 旧代码（不推荐）
```java
// Java
if (game.getStatus() != 1) {
    throw new BusinessException("游戏不可用");
}

if (status == 2) {
    // 上架逻辑
}
```

```typescript
// TypeScript
if (gameInfo.status !== 1) {
  return { passed: false, errorMessage: '游戏已下线' };
}

if (status === 2) {
  // 上架逻辑
}
```

### ✅ 新代码（推荐）
```java
// Java
if (!GameStatusUtil.canPlay(game.getStatus())) {
    throw new BusinessException("游戏不可用");
}

if (GameStatusUtil.isOnSale(status)) {
    // 上架逻辑
}
```

```typescript
// TypeScript
if (!canPlay(gameInfo.status)) {
  return { passed: false, errorMessage: '游戏已下线' };
}

if (isOnSale(status)) {
  // 上架逻辑
}
```

## 🔄 状态流转图

```
        ┌──────────────┐
        │  DRAFT(0)    │
        │    草稿       │
        └──────┬───────┘
               │ 提交审核
               ↓
        ┌──────────────┐
        │PENDING_REVIEW│
        │   待审核      │
        └───┬─────┬────┘
            │     │
     通过   │     │ 驳回
       ↓    │     │   ↓
┌──────────┐│     │┌───────────┐
│ON_SALE(2)││     ││REJECTED(4)│
│ 已上架    ││     ││  驳回     │
└────┬─────┘│     │└─────┬─────┘
     │ 下架  │     │      │ 重新提交
     ↓       │     │      ↓
┌──────────┐│     └──────┘
│OFFLINE(3)││
│ 已下架    ││
└──────────┘┘
     ↑___________│
        上架
```

## ⚡ 常用场景

### 场景 1: 检查游戏能否启动
```java
// Java
if (!GameStatusUtil.canPlay(game.getStatus())) {
    throw new BusinessException("游戏未上架，无法启动");
}
```

```typescript
// TypeScript
if (!canPlay(game.status)) {
  alert('游戏未上架，无法启动');
}
```

### 场景 2: 显示状态标签
```vue
<!-- Vue -->
<span :style="{ color: getGameStatusColor(game.status) }">
  {{ getGameStatusIcon(game.status) }} {{ getGameStatusText(game.status) }}
</span>
```

### 场景 3: 状态流转验证
```java
// Java
if (!GameStatusUtil.canTransition(currentStatus, targetStatus)) {
    throw new BusinessException("状态流转不合法");
}
```

---

**打印此卡片作为日常开发参考！** 📇
