# 通用草稿系统文档

## 概述

通用草稿系统是一个支持多种内容类型的草稿管理平台，不再局限于主题编辑器，可以支持任何需要草稿功能的业务场景。

## 核心特性

### 1. **多内容类型支持**
- 支持多种内容类型：`THEME`、`GAME_CONFIG`、`ARTICLE`、`USER_CONFIG` 等
- 可扩展的内容类型，自定义业务场景
- 统一的数据模型，通过 `contentType` 区分

### 2. **灵活的元数据**
- `metadataJson` 字段用于存储业务相关的扩展信息
- 不需要为每种业务类型创建独立字段
- 支持任意自定义数据结构

### 3. **版本管理**
- 自动保存草稿的历史版本
- 支持回滚到任意历史版本
- 可配置保留的版本数量（默认 10 个）

### 4. **关联实体**
- 支持关联到具体实体（如游戏ID、文章ID等）
- 通过 `relatedEntityType` 和 `relatedEntityId` 关联
- 支持按关联实体查询草稿

### 5. **自动清理**
- 每个用户最多 20 个草稿（可配置）
- 超过限制自动删除最旧的草稿
- 支持手动清理过期草稿

### 6. **权限控制**
- 只能访问和操作自己的草稿
- 基于作者的权限验证
- 支持作者类型（用户/管理员）

## 数据库设计

### 主表：`draft`

| 字段 | 类型 | 说明 |
|------|------|------|
| draft_id | BIGINT | 草稿ID（主键） |
| author_id | BIGINT | 作者ID |
| author_type | VARCHAR(20) | 作者类型：USER/ADMIN |
| content_type | VARCHAR(50) | 内容类型：THEME/GAME_CONFIG/ARTICLE等 |
| draft_name | VARCHAR(255) | 草稿名称 |
| draft_title | VARCHAR(255) | 草稿标题（可选） |
| content_json | TEXT | 草稿内容JSON |
| metadata_json | TEXT | 元数据JSON（扩展字段） |
| thumbnail_url | VARCHAR(500) | 缩略图URL |
| related_entity_type | VARCHAR(50) | 关联实体类型 |
| related_entity_id | BIGINT | 关联实体ID |
| status | VARCHAR(20) | 状态：draft/archived/published |
| content_size | INT | 内容大小（字节） |
| version | INT | 草稿版本号 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| published_at | DATETIME | 发布时间 |
| tags | VARCHAR(500) | 标签（逗号分隔） |
| remark | TEXT | 备注说明 |

### 版本历史表：`draft_version`

| 字段 | 类型 | 说明 |
|------|------|------|
| version_id | BIGINT | 版本ID（主键） |
| draft_id | BIGINT | 草稿ID（外键） |
| version | INT | 版本号 |
| content_json | TEXT | 快照内容JSON |
| metadata_json | TEXT | 快照元数据JSON |
| change_log | VARCHAR(255) | 变更说明 |
| created_at | DATETIME | 创建时间 |
| created_by | BIGINT | 创建人ID |

### 分类表：`draft_category`（可选）

支持草稿分类组织，用于更好地管理草稿。

## API 接口

### 基本CRUD

#### 1. 保存草稿
```
POST /api/draft
```

请求参数：
```typescript
{
  contentType: 'THEME',              // 内容类型（必填）
  draftName: '我的主题草稿',          // 草稿名称（必填）
  draftTitle: '主题标题',            // 草稿标题（可选）
  contentJson: '{...}',             // 内容JSON（必填）
  metadataJson: '{...}',             // 元数据JSON（可选）
  thumbnailUrl: 'https://...',      // 缩略图URL（可选）
  relatedEntityType: 'GAME',        // 关联实体类型（可选）
  relatedEntityId: 1,                // 关联实体ID（可选）
  tags: '标签1,标签2',               // 标签（可选）
  remark: '备注说明'                 // 备注（可选）
}
```

#### 2. 获取草稿详情
```
GET /api/draft/{draftId}
```

#### 3. 删除草稿
```
DELETE /api/draft/{draftId}
```

### 查询操作

#### 4. 获取我的草稿列表
```
GET /api/draft/my?contentType=THEME
```

#### 5. 根据关联实体查询草稿
```
GET /api/draft/related?relatedEntityType=GAME&relatedEntityId=1
```

### 版本管理

#### 6. 获取草稿版本历史
```
GET /api/draft/{draftId}/versions
```

#### 7. 回滚到指定版本
```
POST /api/draft/{draftId}/rollback/{version}
```

### 批量操作

#### 8. 批量删除草稿
```
DELETE /api/draft/batch
```

请求体：
```json
[1, 2, 3]  // 草稿ID列表
```

### 统计操作

#### 9. 获取草稿统计信息
```
GET /api/draft/statistics
```

返回：
```json
{
  "totalCount": 10,
  "totalSize": 102400,
  "byContentType": {
    "THEME": 5,
    "GAME_CONFIG": 3,
    "ARTICLE": 2
  },
  "byStatus": {
    "draft": 8,
    "published": 2
  }
}
```

## 前端使用

### 1. 导入服务

```typescript
import { draftApi, DraftContentType, type Draft } from '@/services/draft-api.service'
```

### 2. 保存草稿

```typescript
// 保存主题草稿
const response = await draftApi.saveDraft({
  contentType: DraftContentType.THEME,
  draftName: '我的主题草稿',
  draftTitle: '主题标题',
  contentJson: JSON.stringify(themeData),
  metadataJson: JSON.stringify({
    ownerType: 'GAME',
    ownerId: 1,
    themeName: '我的主题'
  }),
  thumbnailUrl: 'https://example.com/thumb.png',
  relatedEntityType: 'GAME',
  relatedEntityId: 1
})
```

### 3. 获取草稿列表

```typescript
// 获取所有草稿
const allDrafts = await draftApi.getMyDrafts()

// 获取指定类型的草稿
const themeDrafts = await draftApi.getMyDrafts(DraftContentType.THEME)
```

### 4. 恢复草稿

```typescript
// 获取草稿详情
const draft = await draftApi.getDraftDetail(draftId)

// 解析内容
const themeData = JSON.parse(draft.contentJson)

// 恢复到编辑器
editorData.value = themeData
```

### 5. 版本管理

```typescript
// 获取版本历史
const versions = await draftApi.getDraftVersions(draftId)

// 回滚到指定版本
await draftApi.rollbackToVersion(draftId, version)
```

## 扩展到其他业务场景

### 场景1：游戏配置草稿

```typescript
// 保存游戏配置草稿
await draftApi.saveDraft({
  contentType: DraftContentType.GAME_CONFIG,
  draftName: '游戏配置草稿',
  contentJson: JSON.stringify(gameConfigData),
  metadataJson: JSON.stringify({
    gameId: 1,
    gameCode: 'PLANE_SHOOTER',
    difficulty: 'normal'
  }),
  relatedEntityType: 'GAME',
  relatedEntityId: 1
})
```

### 场景2：文章内容草稿

```typescript
// 保存文章草稿
await draftApi.saveDraft({
  contentType: DraftContentType.ARTICLE,
  draftName: '文章草稿',
  draftTitle: '如何玩好游戏',
  contentJson: JSON.stringify(articleData),
  metadataJson: JSON.stringify({
    articleId: 1,
    category: '攻略',
    author: '小明'
  }),
  thumbnailUrl: 'https://example.com/cover.jpg'
})
```

### 场景3：自定义内容类型

```typescript
// 自定义内容类型
const CUSTOM_TYPE = 'LEVEL_DESIGN' as any

// 保存关卡设计草稿
await draftApi.saveDraft({
  contentType: CUSTOM_TYPE,
  draftName: '关卡设计草稿',
  contentJson: JSON.stringify(levelData),
  metadataJson: JSON.stringify({
    levelId: 1,
    difficulty: 'hard',
    estimatedTime: 600
  }),
  relatedEntityType: 'LEVEL',
  relatedEntityId: 1
})
```

## 配置常量

### DraftContentType（内容类型枚举）

```typescript
enum DraftContentType {
  THEME = 'THEME',              // 主题草稿
  GAME_CONFIG = 'GAME_CONFIG',  // 游戏配置草稿
  ARTICLE = 'ARTICLE',          // 文章草稿
  USER_CONFIG = 'USER_CONFIG',  // 用户配置草稿
}
```

### DraftStatus（草稿状态枚举）

```typescript
enum DraftStatus {
  DRAFT = 'draft',        // 草稿
  ARCHIVED = 'archived',  // 已归档
  PUBLISHED = 'published' // 已发布
}
```

## 配置参数

### 后端配置

```java
// 最大草稿数量
private static final int MAX_DRAFT_COUNT = 20;

// 保留的历史版本数量
private static final int KEEP_VERSION_COUNT = 10;
```

## 部署步骤

### 1. 执行数据库迁移

```bash
cd kids-game-backend
mysql -u root -p kids_game < draft-system-migration.sql
```

### 2. 重新编译后端

```bash
mvn clean install -DskipTests
```

### 3. 重启后端服务

根据部署方式重启后端服务。

### 4. 前端无需额外配置

前端已集成通用草稿服务，直接使用即可。

## 迁移指南

### 从旧版主题草稿迁移

旧版主题草稿使用独立的 `theme_draft` 表，需要迁移到通用 `draft` 表：

```sql
-- 迁移主题草稿到通用草稿表
INSERT INTO draft (
    author_id, author_type, content_type, draft_name, draft_title,
    content_json, metadata_json, thumbnail_url, status,
    content_size, version, created_at, updated_at
)
SELECT
    author_id, 'USER', 'THEME', draft_name, theme_name,
    config_json, JSON_OBJECT('ownerType', owner_type, 'ownerId', owner_id),
    thumbnail_url, 'draft', size, 1, created_at, updated_at
FROM theme_draft;

-- 删除旧表（可选）
DROP TABLE IF EXISTS theme_draft;
```

## 最佳实践

### 1. 元数据设计

在 `metadataJson` 中存储业务相关的关键信息，便于后续查询和关联：

```json
{
  "ownerType": "GAME",
  "ownerId": 1,
  "gameCode": "PLANE_SHOOTER",
  "authorName": "小明",
  "tags": ["简单", "儿童友好"]
}
```

### 2. 内容类型规范

统一使用大写字母和下划线：

```typescript
const CONTENT_TYPE = 'LEVEL_DESIGN'  // ✓ 推荐
const CONTENT_TYPE = 'LevelDesign'  // ✗ 不推荐
```

### 3. 草稿命名规范

建议使用有意义的草稿名称：

```
✓ 推荐：飞机大战-冬季主题-v1
✓ 推荐：算术游戏-儿童友好配色
✗ 不推荐：草稿1
✗ 不推荐：未命名
```

### 4. 版本管理

- 保存重要节点：在完成阶段性工作时保存草稿
- 定期清理：定期清理不需要的历史版本
- 回滚谨慎：回滚操作不可逆，请谨慎操作

## 性能优化

### 1. 分页查询

草稿列表默认不分页，如需要可以添加分页支持：

```typescript
const drafts = await draftApi.getMyDrafts(DraftContentType.THEME, {
  page: 1,
  pageSize: 20
})
```

### 2. 懒加载

只加载草稿列表，点击时再加载详情：

```typescript
// 草稿列表（轻量级）
const drafts = await draftApi.getMyDrafts(DraftContentType.THEME)

// 点击时加载详情（包含完整内容）
const detail = await draftApi.getDraftDetail(draftId)
```

### 3. 索引优化

数据库已添加以下索引：
- `idx_author (author_id, author_type)`
- `idx_content_type (content_type)`
- `idx_status (status)`
- `idx_updated_at (updated_at)`
- `idx_related (related_entity_type, related_entity_id)`

## 常见问题

### Q: 如何扩展支持新的内容类型？

A: 直接使用自定义的 `contentType` 即可，无需修改数据库：

```typescript
const CUSTOM_TYPE = 'MY_CUSTOM_TYPE' as any
await draftApi.saveDraft({
  contentType: CUSTOM_TYPE,
  draftName: '自定义草稿',
  contentJson: JSON.stringify(data)
})
```

### Q: 如何批量导出草稿？

A: 使用草稿下载功能：

```typescript
// 获取所有草稿
const drafts = await draftApi.getMyDrafts()

// 批量下载
drafts.list.forEach(draft => {
  downloadDraft(draft)
})
```

### Q: 如何清理过期草稿？

A: 可以手动清理或设置定时任务：

```typescript
// 清理30天前的主题草稿
// 后端支持：DELETE /api/draft/batch（需要扩展）
```

### Q: 草稿和正式内容的区别？

A:
- **草稿**：未发布的内容，可以随时修改和删除
- **正式内容**：已发布的内容，通常有自己的业务表

草稿可以作为正式内容的前置状态，审核通过后转换为正式内容。

## 总结

通用草稿系统提供了：
1. ✅ 多内容类型支持
2. ✅ 灵活的元数据
3. ✅ 完整的版本管理
4. ✅ 自动清理机制
5. ✅ 权限控制
6. ✅ 可扩展的API

适用于各种需要草稿功能的业务场景，如主题编辑、游戏配置、内容创作等。
