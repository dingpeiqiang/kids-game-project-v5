# 游戏管理重构 - 数据库设计修正说明

**日期**: 2026-03-23  
**问题**: t_game 表为什么要删除审核信息字段？  
**状态**: ✅ 已修正

---

## ❌ 原设计问题

### 错误的设计

在之前的方案中，计划在 `t_game` 表中添加以下审核字段：

```sql
-- ❌ 错误设计
ALTER TABLE t_game 
ADD COLUMN reviewer_id BIGINT COMMENT '审核人 ID',
ADD COLUMN review_time BIGINT COMMENT '审核时间',
ADD COLUMN review_comment VARCHAR(500) COMMENT '审核意见',
ADD COLUMN publish_time BIGINT COMMENT '上架时间';
```

**同时创建了** `t_game_review_record` 表：

```sql
CREATE TABLE t_game_review_record (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,      -- 审核人 ID
    review_status TINYINT NOT NULL,   -- 审核状态
    review_comment VARCHAR(500),      -- 审核意见
    reject_reason VARCHAR(500),       -- 驳回原因
    review_time BIGINT,               -- 审核时间
    create_time BIGINT
);
```

---

## 🔍 问题分析

### 1. 数据冗余（违反第三范式）

**同样的信息存储两处**：
- `t_game.reviewer_id` ↔ `t_game_review_record.reviewer_id`
- `t_game.review_time` ↔ `t_game_review_record.review_time`
- `t_game.review_comment` ↔ `t_game_review_record.review_comment`

**导致的问题**：
- ❌ 浪费存储空间
- ❌ 更新时需要同步修改两个地方
- ❌ 可能出现数据不一致

### 2. 一对多关系处理错误

**审核是一个过程**：
- 一个游戏可能被多次提交审核
- 每次审核都应该有独立记录
- 需要保留历史审核记录（追溯、审计）

**正确设计**：
```
t_game (1) ←→ (N) t_game_review_record
```

### 3. 字段语义混淆

| 字段 | 性质 | 应该在哪里 |
|------|------|-----------|
| status | 当前状态 | ✅ t_game |
| reviewer_id | 过程信息 | ❌ t_game → ✅ review_record |
| review_time | 过程信息 | ❌ t_game → ✅ review_record |
| review_comment | 过程信息 | ❌ t_game → ✅ review_record |
| publish_time | 状态时间点 | ✅ t_game |

---

## ✅ 修正后的设计

### t_game 表（最终版）

```sql
CREATE TABLE t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(50) UNIQUE NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    grade VARCHAR(20),
    
    -- 新增字段（仅 5 个）
    tags VARCHAR(500) COMMENT '标签列表（逗号分隔）',
    is_featured TINYINT DEFAULT 0 COMMENT '是否推荐：0-否，1-是',
    creator_id BIGINT COMMENT '创建人 ID',
    publish_time BIGINT COMMENT '上架时间',
    min_fatigue_to_start INT DEFAULT 0 COMMENT '启动所需最低疲劳度',
    
    -- 原有字段
    icon_url VARCHAR(255),
    cover_url VARCHAR(255),
    resource_url VARCHAR(255),
    description TEXT,
    module_path VARCHAR(255),
    game_url VARCHAR(255),
    game_secret VARCHAR(255),
    game_config JSON,
    
    -- 状态字段
    status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回',
    sort_order INT DEFAULT 0,
    consume_points_per_minute INT DEFAULT 1,
    online_count INT DEFAULT 0,
    
    -- 统计字段（保留，向后兼容）
    total_play_count BIGINT DEFAULT 0,
    total_play_duration BIGINT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT
);
```

**新增字段说明**：
- `tags` - 游戏标签（逗号分隔）
- `is_featured` - 是否推荐
- `creator_id` - 创建人 ID
- `publish_time` - 上架时间（用于统计和排序）
- `min_fatigue_to_start` - 启动所需最低疲劳度

**为什么保留 publish_time？**
- ✅ 这是游戏的**状态属性**，不是过程信息
- ✅ 每个游戏只有一个上架时间（不会重复）
- ✅ 频繁使用（统计、排序、展示）
- ✅ 查询效率高

---

### t_game_review_record 表（完整审核历史）

```sql
CREATE TABLE t_game_review_record (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    reviewer_id BIGINT NOT NULL COMMENT '审核人 ID',
    review_status TINYINT NOT NULL COMMENT '审核状态：1-通过，2-驳回',
    review_comment VARCHAR(500) COMMENT '审核意见',
    reject_reason VARCHAR(500) COMMENT '驳回原因',
    review_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '审核时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    INDEX idx_game_id (game_id),
    INDEX idx_reviewer_id (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**用途**：
- ✅ 记录所有审核历史
- ✅ 支持追溯和审计
- ✅ 分析审核流程效率
- ✅ 统计审核人员工作量

---

## 📊 使用示例

### 获取游戏基本信息

```sql
SELECT 
    game_id,
    game_name,
    tags,
    is_featured,
    creator_id,
    publish_time,
    status
FROM t_game
WHERE game_id = ?;
```

### 获取最新审核记录

```sql
SELECT 
    r.reviewer_id,
    r.review_status,
    r.review_comment,
    r.reject_reason,
    r.review_time
FROM t_game_review_record r
WHERE r.game_id = ?
ORDER BY r.review_time DESC
LIMIT 1;
```

### 获取所有审核历史

```sql
SELECT 
    r.review_status,
    r.review_comment,
    r.reject_reason,
    r.review_time,
    u.nickname AS reviewer_name
FROM t_game_review_record r
LEFT JOIN t_user u ON r.reviewer_id = u.user_id
WHERE r.game_id = ?
ORDER BY r.review_time DESC;
```

### 统计审核通过率

```sql
SELECT 
    COUNT(*) AS total_reviews,
    SUM(CASE WHEN review_status = 1 THEN 1 ELSE 0 END) AS approved_count,
    ROUND(
        SUM(CASE WHEN review_status = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) AS approval_rate
FROM t_game_review_record
WHERE game_id = ?;
```

---

## 🎯 设计原则总结

### 1. 第三范式（3NF）
- ✅ 所有非主键字段都直接依赖于主键
- ✅ 没有传递依赖
- ✅ 避免数据冗余

### 2. 职责分离
- `t_game` - 存储游戏**当前状态**和**属性**
- `t_game_review_record` - 存储审核**过程**和**历史**

### 3. 一对多关系
- 一个游戏 → 多次审核
- 用独立表记录历史
- 保留完整的审计轨迹

### 4. 查询效率
- 常用字段放在 `t_game` 表（如 `publish_time`）
- 历史详情放在 `review_record` 表
- 通过索引优化查询性能

---

## 📝 对比表格

### 字段归属决策

| 字段名 | t_game | t_game_review_record | 理由 |
|--------|--------|---------------------|------|
| **tags** | ✅ | ❌ | 游戏固有属性 |
| **is_featured** | ✅ | ❌ | 游戏推荐状态 |
| **creator_id** | ✅ | ❌ | 游戏创建者 |
| **publish_time** | ✅ | ❌ | 游戏上架时间点（唯一） |
| **min_fatigue_to_start** | ✅ | ❌ | 游戏配置参数 |
| **status** | ✅ | ❌ | 当前状态（最新） |
| **reviewer_id** | ❌ | ✅ | 审核过程信息（可能多次） |
| **review_time** | ❌ | ✅ | 审核过程信息（可能多次） |
| **review_comment** | ❌ | ✅ | 审核过程信息（可能多次） |
| **reject_reason** | ❌ | ✅ | 审核过程信息（可能多次） |
| **review_status** | ❌ | ✅ | 审核历史记录 |

### 审核状态流转

```
t_game.status:
0 (草稿) 
  → 1 (待审核) 
    → 2 (已上架) ✓
    → 4 (审核驳回) ✗
      → 重新提交 → 1 (待审核)
        → 2 (已上架) ✓
```

**每次审核都在 `t_game_review_record` 中有记录**：
```
Game #1:
├─ Review #1 (2026-03-20 10:00) - 驳回
├─ Review #2 (2026-03-21 14:30) - 驳回
└─ Review #3 (2026-03-22 09:15) - 通过 ✓
```

---

## 🔧 实施影响

### 修改内容

#### schema_v2.sql
**删除的字段**：
```sql
-- ❌ 已删除
reviewer_id BIGINT COMMENT '审核人 ID',
review_time BIGINT COMMENT '审核时间',
review_comment VARCHAR(500) COMMENT '审核意见',
```

**保留的字段**：
```sql
-- ✅ 保留
tags VARCHAR(500) COMMENT '标签列表（逗号分隔）',
is_featured TINYINT DEFAULT 0 COMMENT '是否推荐',
creator_id BIGINT COMMENT '创建人 ID',
publish_time BIGINT COMMENT '上架时间',
min_fatigue_to_start INT DEFAULT 0 COMMENT '启动所需最低疲劳度',
```

#### quick-upgrade-lite.sql
**修改前**：+8 个字段  
**修改后**：+5 个字段

---

## ✅ 验证方法

### 1. 检查字段数量

```sql
SELECT COUNT(*) 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game' AND TABLE_NAME = 't_game';
-- 预期：26 个字段（原 21 + 新增 5）
```

### 2. 检查审核字段不存在

```sql
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game' 
  AND TABLE_NAME = 't_game'
  AND COLUMN_NAME IN ('reviewer_id', 'review_time', 'review_comment');
-- 预期：0 行（这些字段不在 t_game 表中）
```

### 3. 检查审核记录表存在

```sql
SHOW TABLES LIKE 't_game_review_record';
-- 预期：1 行（表存在）

DESC t_game_review_record;
-- 预期：包含 reviewer_id, review_time, review_comment 等字段
```

---

## 📞 相关文档

| 文档 | 链接 |
|------|------|
| 轻量级迁移方案 | [`GAME_MANAGEMENT_LITE_MIGRATION.md`](file://GAME_MANAGEMENT_LITE_MIGRATION.md) |
| 轻量级 SQL 脚本 | [`quick-upgrade-lite.sql`](file://quick-upgrade-lite.sql) |
| 最终总结 | [`LITE_MIGRATION_FINAL_SUMMARY.md`](file://LITE_MIGRATION_FINAL_SUMMARY.md) |
| Schema 文件 | [`schema_v2.sql`](file://kids-game-web/src/main/resources/schema_v2.sql) |

---

**设计原则**: 符合第三范式，避免数据冗余，保持审核历史的完整性  
**修订时间**: 2026-03-23  
**状态**: ✅ 已修正并同步到所有文档
