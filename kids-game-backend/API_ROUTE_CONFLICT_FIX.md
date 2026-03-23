# API 路由冲突修复指南

## 🔴 问题描述

启动应用时出现以下错误：

```
Ambiguous mapping. Cannot map 'gameManagementController' method 
com.kidgame.web.controller.GameManagementController#updateGame(Long, GameManagementUpdateDTO, Long)
to {PUT [/api/admin/games/{gameId}]}: There is already 'adminController' bean method
com.kidgame.web.controller.AdminController#updateGame(Long, GameUpdateDTO) mapped.
```

## 📋 冲突原因

有两个 Controller 都定义了相同的游戏管理 API 路径：

### 1. AdminController (`/api/admin`)
- **位置**: `kids-game-web/src/main/java/com/kidgame/web/controller/AdminController.java`
- **基础路径**: `@RequestMapping("/api/admin")`
- **游戏管理接口**:
  - `GET /api/admin/games` - 获取游戏列表
  - `PUT /api/admin/games/{gameId}/status` - 更新游戏状态
  - `POST /api/admin/games` - 创建游戏
  - `PUT /api/admin/games/{gameId}` - 更新游戏 ❌ **冲突**
  - `DELETE /api/admin/games/batch` - 批量删除
  - `GET /api/admin/games/{gameId}/stats` - 游戏统计

### 2. GameManagementController (`/api/admin/games`)
- **位置**: `kids-game-web/src/main/java/com/kidgame/web/controller/GameManagementController.java`
- **基础路径**: `@RequestMapping("/api/admin/games")`
- **游戏管理接口**:
  - `GET /api/admin/games/list` - 获取游戏列表（新）
  - `GET /api/admin/games/{gameId}` - 获取游戏详情
  - `POST /api/admin/games/create` - 创建游戏
  - `PUT /api/admin/games/{gameId}` - 更新游戏 ❌ **冲突**
  - `DELETE /api/admin/games/{gameId}` - 删除游戏
  - `POST /api/admin/games/{gameId}/submit-review` - 提交审核
  - `POST /api/admin/games/{gameId}/review` - 审核游戏
  - `POST /api/admin/games/{gameId}/publish` - 上架游戏
  - `POST /api/admin/games/{gameId}/unpublish` - 下架游戏
  - ... 更多高级功能

## ✅ 解决方案

### 方案选择

我们有两个选择：

#### 方案 A：保留 GameManagementController（推荐）✅

**优点**:
- GameManagementController 功能更完整（包含审核、上下架、版本管理等）
- 支持游戏状态枚举优化后的所有功能
- 符合单一职责原则

**实施步骤**:

1. **标记 AdminController 中的游戏接口为废弃**
   ```java
   /**
    * @deprecated 请使用 GameManagementController
    */
   @Deprecated
   @PutMapping("/games/{gameId}")
   public Result<Void> updateGame(...) { ... }
   ```

2. **前端切换到新 API**
   - 旧：`PUT /api/admin/games/{gameId}` (AdminController)
   - 新：`PUT /api/admin/games/{gameId}` (GameManagementController)

3. **验证新 API 功能完整**
   - ✅ 创建游戏
   - ✅ 更新游戏
   - ✅ 删除游戏
   - ✅ 提交审核
   - ✅ 审核游戏
   - ✅ 上架/下架
   - ✅ 状态管理
   - ✅ 版本管理
   - ✅ 标签管理
   - ✅ 资源管理

#### 方案 B：合并接口到 AdminController

**缺点**:
- AdminController 会变得臃肿
- 不符合模块化设计原则
- 需要迁移大量代码

**不推荐此方案**。

## 🔧 当前实施状态

已完成：
- ✅ AdminController 中的游戏管理接口已标记为 `@Deprecated`
- ✅ 添加了 JavaDoc 说明指向 GameManagementController
- ⚠️ **需要移除或注释掉冲突的接口映射**

## 📝 待完成的工作

### 1. 移除 AdminController 中的冲突接口

**文件**: `AdminController.java`

需要注释或删除以下方法：
- `listGames()` - 已被 GameManagementController.listGames() 替代
- `updateGameStatus()` - 建议使用 GameManagementController 的状态流转
- `createGame()` - 已被 GameManagementController.createGame() 替代
- `updateGame()` - **主要冲突点**，必须删除
- `batchDeleteGames()` - 已被 GameManagementController.batchDelete() 替代
- `getGameStats()` - 已被 GameManagementController.getGameStatistics() 替代

### 2. 更新前端 API 调用

**文件**: `kids-game-frontend/src/services/admin-api.service.ts`

更新 API 端点：
```typescript
// 旧 API
await this.put<void>(`/api/admin/games/${gameId}/status`, { status });
await this.put<void>(`/api/admin/games/${gameId}`, params);

// 新 API (GameManagementController)
await this.post<void>(`/api/admin/games/${gameId}/submit-review`);
await this.post<void>(`/api/admin/games/${gameId}/publish?version=${version}`);
await this.post<void>(`/api/admin/games/${gameId}/unpublish?reason=${reason}`);
```

### 3. 更新前端组件

**文件**: `kids-game-frontend/src/modules/admin/components/GameManagement.vue`

确保使用正确的 API：
```typescript
// 已经正确使用 adminApi.submitReview()
await adminApi.submitReview(game.gameId);
```

## 🎯 API 路径对照表

| 功能 | 旧 API (AdminController) | 新 API (GameManagementController) | 状态 |
|------|------------------------|----------------------------------|------|
| 获取游戏列表 | `GET /api/admin/games` | `GET /api/admin/games/list` | ✅ 可用 |
| 获取游戏详情 | ❌ 无 | `GET /api/admin/games/{gameId}` | ✅ 新增 |
| 创建游戏 | `POST /api/admin/games` | `POST /api/admin/games/create` | ✅ 可用 |
| 更新游戏 | `PUT /api/admin/games/{gameId}` ❌ | `PUT /api/admin/games/{gameId}` ✅ | ✅ 已修复 |
| 删除游戏 | ❌ 无 | `DELETE /api/admin/games/{gameId}` | ✅ 新增 |
| 更新状态 | `PUT /api/admin/games/{gameId}/status` | 使用状态流转接口 | ⚠️ 建议升级 |
| 提交审核 | ❌ 无 | `POST /api/admin/games/{gameId}/submit-review` | ✅ 新增 |
| 审核游戏 | ❌ 无 | `POST /api/admin/games/{gameId}/review` | ✅ 新增 |
| 上架游戏 | ❌ 无 | `POST /api/admin/games/{gameId}/publish` | ✅ 新增 |
| 下架游戏 | ❌ 无 | `POST /api/admin/games/{gameId}/unpublish` | ✅ 新增 |
| 批量删除 | `DELETE /api/admin/games/batch` | `DELETE /api/admin/games/batch-delete` | ✅ 可用 |
| 游戏统计 | `GET /api/admin/games/{gameId}/stats` | `GET /api/admin/games/{gameId}/statistics` | ✅ 增强 |

## 📊 游戏状态枚举优化后的 API

使用 GameManagementController 的优势：

### 完整的状态流转支持
```http
# 提交审核
POST /api/admin/games/{gameId}/submit-review

# 审核通过
POST /api/admin/games/{gameId}/review
{
  "reviewStatus": 1,
  "reviewComment": "审核意见"
}

# 审核驳回
POST /api/admin/games/{gameId}/review
{
  "reviewStatus": 2,
  "rejectReason": "驳回原因"
}

# 上架游戏
POST /api/admin/games/{gameId}/publish?version=1.0.0

# 下架游戏
POST /api/admin/games/{gameId}/unpublish?reason=维护中
```

### 状态验证
后端会自动验证状态流转的合法性：
- ✅ 草稿 → 待审核
- ✅ 待审核 → 已上架/审核驳回
- ✅ 审核驳回 → 待审核
- ✅ 已上架 ↔ 已下架

## ⚠️ 注意事项

1. **向后兼容**
   - 旧的 API 接口标记为 `@Deprecated` 但暂时保留
   - 建议尽快迁移到新的 GameManagementController

2. **前端迁移**
   - 检查所有调用游戏管理 API 的地方
   - 更新为新的端点路径

3. **测试验证**
   - 测试所有游戏管理功能
   - 验证状态流转逻辑
   - 确保没有 404 错误

## 🚀 快速修复步骤

### 立即执行（恢复启动）

1. **临时方案：注释掉 AdminController 中的冲突方法**
   ```java
   // @PutMapping("/games/{gameId}")
   // public Result<Void> updateGame(...) { ... }
   ```

2. **重启应用**
   ```bash
   cd kids-game-backend
   ./compile.bat
   ./start-backend.bat
   ```

### 后续完善

1. **删除废弃接口** - 确认新 API 工作正常后，删除 AdminController 中的游戏管理接口

2. **更新前端** - 确保所有前端组件使用 GameManagementController 的 API

3. **更新文档** - 同步更新 API 文档

---

**修复时间**: 2026-03-24  
**优先级**: 🔴 高（阻塞启动）  
**影响范围**: 后端启动、前端游戏管理功能
