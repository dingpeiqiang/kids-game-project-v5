# 数据库迁移策略分析

**日期**: 2026-03-23  
**现状**: 当前数据库 = schema_v2.sql（旧版本）  
**目标**: 游戏管理重构 v2.0

---

## 📊 现状分析

### 当前数据库状态（schema_v2.sql）

#### t_game 表结构
```sql
CREATE TABLE t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(50) UNIQUE NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    grade VARCHAR(20),
    icon_url VARCHAR(255),
    cover_url VARCHAR(255),
    resource_url VARCHAR(255),
    description TEXT,
    module_path VARCHAR(255),
    game_url VARCHAR(255),
    game_secret VARCHAR(255),
    game_config JSON,
    
    -- ❌ 旧的状态定义（只有 2 种状态）
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    
    sort_order INT DEFAULT 0,
    consume_points_per_minute INT DEFAULT 1,
    online_count INT DEFAULT 0,
    
    -- ❌ 冗余统计字段（应该移除）
    total_play_count BIGINT DEFAULT 0,
    total_play_duration BIGINT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT,
    
    INDEX idx_category (category),
    INDEX idx_grade (grade),
    INDEX idx_status (status)
);
```

#### t_game_tag 表结构
```sql
CREATE TABLE t_game_tag (
    tag_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL,
    tag_type VARCHAR(20) DEFAULT 'CATEGORY',  -- ❌ 旧字段名
    sort_order INT DEFAULT 0,
    create_time BIGINT,
    deleted TINYINT,
    UNIQUE KEY uk_tag_name_type (tag_name, tag_type, deleted),
    INDEX idx_tag_type (tag_type)
);
```

#### t_game_tag_relation 表结构
```sql
CREATE TABLE t_game_tag_relation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,     -- ❌ 旧字段名
    game_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    create_time BIGINT,
    deleted TINYINT DEFAULT 0,                -- ❌ 有 deleted 字段
    UNIQUE KEY uk_game_tag (game_id, tag_id, deleted),
    INDEX idx_game_id (game_id),
    INDEX idx_tag_id (tag_id)
);
```

---

## 🎯 目标状态（v2.0）

### 需要新增的表（7 个）
1. ✅ t_game_statistics - 游戏统计表
2. ✅ t_game_version_history - 游戏版本历史表
3. ✅ t_game_review_record - 游戏审核记录表
4. ✅ t_game_resource_config - 游戏资源配置表
5. ✅ t_game_tag - 重构后的标签表
6. ✅ t_game_tag_relation - 重构后的标签关联表
7. ✅ t_game_backup_20260323 - 备份表

### 需要修改的表（1 个）
- **t_game** - 需要调整结构

---

## ⚠️ 关键差异对比

### t_game 表字段变更

| 操作类型 | 字段名 | 说明 |
|----------|--------|------|
| **新增** | tags | 标签列表 |
| **新增** | screenshot_urls | 截图 URLs |
| **新增** | play_guide | 玩法说明 |
| **新增** | is_featured | 是否推荐 |
| **新增** | version | 版本号 |
| **新增** | version_description | 版本说明 |
| **新增** | creator_id | 创建人 ID |
| **新增** | reviewer_id | 审核人 ID |
| **新增** | review_time | 审核时间 |
| **新增** | review_comment | 审核意见 |
| **新增** | publish_time | 上架时间 |
| **新增** | min_fatigue_to_start | 最低启动疲劳度 |
| **修改** | status | 注释从"2 状态"改为"5 状态" |
| **删除** | total_play_count | 移至 statistics 表 |
| **删除** | total_play_duration | 移至 statistics 表 |
| **删除** | average_rating | 移至 statistics 表 |
| **新增索引** | idx_tags | 标签索引 |
| **新增索引** | idx_creator | 创建人索引 |
| **新增索引** | idx_featured | 推荐标记索引 |

### t_game_tag 表变更

| 操作类型 | 字段名 | 说明 |
|----------|--------|------|
| **新增** | tag_code | 标签代码 |
| **修改** | tag_type → category | 字段重命名 |
| **新增** | icon | 图标 emoji |
| **新增** | status | 标签状态 |
| **新增** | update_time | 更新时间 |
| **删除唯一键** | uk_tag_name_type | 不再需要 |
| **修改索引** | idx_tag_type → idx_category | 索引重命名 |

### t_game_tag_relation 表变更

| 操作类型 | 字段名 | 说明 |
|----------|--------|------|
| **修改** | id → relation_id | 主键重命名 |
| **删除** | deleted | 移除逻辑删除字段 |
| **修改唯一键** | uk_game_tag | 去掉 deleted 条件 |

---

## 🔄 迁移策略

### 方案 A: 增量迁移（推荐⭐）

**适用场景**: 生产环境，有现有数据

**优点**:
- ✅ 保留现有数据
- ✅ 风险低，可回滚
- ✅ 逐步验证

**缺点**:
- ⚠️ 需要处理数据转换
- ⚠️ 迁移脚本较复杂

**执行步骤**:

#### 1. 备份现有数据
```sql
-- 备份 t_game 表
CREATE TABLE t_game_backup_20260323 LIKE t_game;
INSERT INTO t_game_backup_20260323 SELECT * FROM t_game;

-- 备份 t_game_tag 表
CREATE TABLE t_game_tag_backup_20260323 LIKE t_game_tag;
INSERT INTO t_game_tag_backup_20260323 SELECT * FROM t_game_tag;

-- 备份 t_game_tag_relation 表
CREATE TABLE t_game_tag_relation_backup_20260323 LIKE t_game_tag_relation;
INSERT INTO t_game_tag_relation_backup_20260323 SELECT * FROM t_game_tag_relation;
```

#### 2. 创建新表（不冲突）
```sql
-- 创建新的统计表等
CREATE TABLE t_game_statistics (...);
CREATE TABLE t_game_version_history (...);
CREATE TABLE t_game_review_record (...);
CREATE TABLE t_game_resource_config (...);
```

#### 3. 修改现有表结构
```sql
-- 修改 t_game 表
ALTER TABLE t_game 
  ADD COLUMN tags VARCHAR(500) AFTER grade,
  ADD COLUMN screenshot_urls TEXT AFTER tags,
  ADD COLUMN play_guide TEXT AFTER description,
  ADD COLUMN is_featured TINYINT DEFAULT 0 AFTER play_guide,
  ADD COLUMN version VARCHAR(20) DEFAULT '1.0.0' AFTER is_featured,
  ADD COLUMN version_description VARCHAR(500) AFTER version,
  ADD COLUMN creator_id BIGINT AFTER version_description,
  ADD COLUMN reviewer_id BIGINT AFTER creator_id,
  ADD COLUMN review_time BIGINT AFTER reviewer_id,
  ADD COLUMN review_comment VARCHAR(500) AFTER review_time,
  ADD COLUMN publish_time BIGINT AFTER review_comment,
  ADD COLUMN min_fatigue_to_start INT DEFAULT 0 AFTER consume_points_per_minute,
  DROP COLUMN total_play_count,
  DROP COLUMN total_play_duration,
  DROP COLUMN average_rating,
  MODIFY COLUMN status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回',
  ADD INDEX idx_tags (tags),
  ADD INDEX idx_creator (creator_id),
  ADD INDEX idx_featured (is_featured);

-- 重建 t_game_tag 表（因为要改字段名和唯一键）
DROP TABLE IF EXISTS t_game_tag_new;
CREATE TABLE t_game_tag_new (
    tag_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tag_code VARCHAR(50) UNIQUE NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT,
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- 迁移标签数据（tag_type → category）
INSERT INTO t_game_tag_new (tag_id, tag_code, tag_name, category, sort_order, create_time, deleted)
SELECT tag_id, CONCAT('tag_', tag_id), tag_name, tag_type, sort_order, create_time, deleted
FROM t_game_tag;

-- 替换旧表
DROP TABLE t_game_tag;
RENAME TABLE t_game_tag_new TO t_game_tag;

-- 重建 t_game_tag_relation 表
DROP TABLE IF EXISTS t_game_tag_relation_new;
CREATE TABLE t_game_tag_relation_new (
    relation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    create_time BIGINT,
    UNIQUE KEY uk_game_tag (game_id, tag_id),
    INDEX idx_game_id (game_id),
    INDEX idx_tag_id (tag_id)
);

-- 迁移数据
INSERT INTO t_game_tag_relation_new (relation_id, game_id, tag_id, create_time)
SELECT id, game_id, tag_id, create_time FROM t_game_tag_relation;

-- 替换旧表
DROP TABLE t_game_tag_relation;
RENAME TABLE t_game_tag_relation_new TO t_game_tag_relation;
```

#### 4. 初始化标签数据
```sql
INSERT INTO t_game_tag (tag_code, tag_name, category, icon, sort_order, status) VALUES
('puzzle', '益智', 'category', '🧩', 1, 1),
('math', '数学', 'subject', '🔢', 2, 1),
-- ... 其他标签
```

#### 5. 验证迁移结果
```sql
-- 检查字段数量
SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game' AND TABLE_NAME = 't_game';
-- 预期：32

-- 检查索引
SHOW INDEX FROM t_game;
-- 预期：7 个索引

-- 检查数据完整性
SELECT COUNT(*) FROM t_game;
SELECT COUNT(*) FROM t_game_tag;
SELECT COUNT(*) FROM t_game_tag_relation;
```

---

### 方案 B: 完全重建（仅开发环境）

**适用场景**: 开发环境，无重要数据

**优点**:
- ✅ 简单直接
- ✅ 结构清晰
- ✅ 无历史包袱

**缺点**:
- ❌ 会丢失所有数据
- ❌ 不适用于生产环境

**执行步骤**:

```bash
# 1. 删除旧库
mysql -u root -p -e "DROP DATABASE kids_game;"

# 2. 创建新库
mysql -u root -p -e "CREATE DATABASE kids_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. 导入新 schema
mysql -u root -p kids_game < schema_v2.sql

# 4. 导入迁移脚本
mysql -u root -p kids_game < game-management-refactor-migration.sql
```

---

## 📋 推荐方案

### 生产环境 → 使用方案 A（增量迁移）

**原因**:
1. ✅ 保护现有数据
2. ✅ 可以分阶段验证
3. ✅ 出现问题可快速回滚
4. ✅ 业务影响最小

### 开发/测试环境 → 使用方案 B（完全重建）

**原因**:
1. ✅ 快速部署
2. ✅ 环境干净
3. ✅ 便于测试

---

## ⚠️ 风险评估

### 高风险操作

#### 1. 删除统计字段
**风险**: 如果应用还在使用这些字段，会导致查询失败

**缓解措施**:
```sql
-- 先不要删除，先注释掉
-- ALTER TABLE t_game DROP COLUMN total_play_count;

-- 或者创建视图兼容
CREATE VIEW v_game AS
SELECT *, 0 AS total_play_count, 0 AS total_play_duration, 0.00 AS average_rating
FROM t_game;
```

#### 2. 修改 status 字段含义
**风险**: 现有数据的 status=1 会被理解为"待审核"而非"启用"

**解决方案**:
```sql
-- 迁移前统一状态
UPDATE t_game SET status = 2 WHERE status = 1;  -- 已启用的改为已上架

-- 然后再修改字段注释
ALTER TABLE t_game 
MODIFY COLUMN status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回';
```

#### 3. 标签表重建
**风险**: 标签数据丢失或映射错误

**解决方案**:
```sql
-- 仔细迁移 tag_type → category
INSERT INTO t_game_tag_new (...)
SELECT ..., tag_type AS category, ... FROM t_game_tag;
```

---

## 🎯 最终建议

### 立即可做的步骤

1. **确认环境**
   ```sql
   -- 检查当前数据库版本
   SELECT 
     TABLE_NAME, 
     COUNT(*) AS column_count
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'kids_game'
     AND TABLE_NAME IN ('t_game', 't_game_tag', 't_game_tag_relation')
   GROUP BY TABLE_NAME;
   ```

2. **选择方案**
   - 如果是**开发环境** → 方案 B（快速）
   - 如果是**生产环境** → 方案 A（安全）

3. **执行迁移**
   - 按照选择的方案执行
   - 每步都要验证
   - 发现问题立即回滚

---

**结论**: 
- ✅ **需要调整数据库**
- ✅ **生产环境用增量迁移（方案 A）**
- ✅ **开发环境用完全重建（方案 B）**
- ⚠️ **必须先备份！**

---

**制定人**: AI Assistant  
**制定时间**: 2026-03-23  
**版本**: v2.0.0  
**状态**: ✅ 待执行
