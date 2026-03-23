# 数据库升级指南（从 schema_v2.sql 升级）

**日期**: 2026-03-23  
**当前状态**: 数据库 = schema_v2.sql  
**目标状态**: 游戏管理重构 v2.0  
**预计时间**: 1-3 分钟

---

## 📋 现状说明

### 您的数据库现状

✅ **当前数据库结构**: `schema_v2.sql`（旧版本）

**现有表**:
- ✅ t_game - 游戏信息表（21 个字段 + 3 个冗余统计字段）
- ✅ t_game_tag - 游戏标签表（旧结构，使用 tag_type 字段）
- ✅ t_game_tag_relation - 游戏标签关联表（旧结构，使用 id 主键）
- ✅ 其他表...

### 需要做什么？

**需要调整！** 因为我们要实现游戏管理重构 v2.0 的新功能：
- 🆕 新增 7 个表（统计表、版本历史、审核记录等）
- ✏️ 修改 t_game 表（新增 12 个字段，删除 3 个冗余字段）
- 🔄 重建标签表（更合理的结构）
- 📊 更新索引和注释

---

## 🚀 快速开始（推荐方案）

### 方法：使用快速升级脚本

这是最简单、最安全的方式！

#### 步骤 1: 备份数据库（必须！）

```bash
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  kids_game > backup_before_upgrade_$(date +%Y%m%d_%H%M%S).sql

# 验证备份
ls -lh backup_*.sql
```

#### 步骤 2: 执行快速升级脚本

```bash
mysql -u root -p kids_game < quick-upgrade-from-schema-v2.sql
```

**执行过程会自动**:
1. ✅ 备份现有数据到临时表
2. ✅ 创建 4 个新表
3. ✅ 重建标签表（保留旧数据）
4. ✅ 修改 t_game 表结构
5. ✅ 初始化 16 个标签
6. ✅ 自动验证结果

#### 步骤 3: 查看输出确认成功

**预期输出**:
```
=== 第 1 步：备份现有数据 ===
✓ t_game 表已备份
✓ t_game_tag 表已备份
✓ t_game_tag_relation 表已备份

=== 第 2 步：创建新的统计表 ===
✓ t_game_statistics 创建成功
✓ t_game_version_history 创建成功
✓ t_game_review_record 创建成功
✓ t_game_resource_config 创建成功

=== 第 3 步：重建标签表 ===
✓ t_game_tag 重建完成
✓ t_game_tag_relation 重建完成

=== 第 4 步：修改 t_game 表 ===
✓ 游戏状态已统一
✓ 已添加 12 个新字段
✓ 已删除 3 个冗余字段
✓ status 字段注释已更新
✓ 已添加 3 个新索引

=== 第 5 步：初始化标签数据 ===
✓ 已初始化 16 个标签

=== 第 6 步：验证迁移结果 ===
✓ t_game 表字段数：32
✓ t_game_tag 表字段数：11
✓ t_game_tag_relation 表字段数：4
✓ 新增表数量：4
✓ 标签数据量：16

============================================
🎉 迁移完成！所有步骤执行成功！
============================================
```

---

## 🔍 详细验证步骤

### 1. 检查表结构

```sql
-- 检查 t_game 表字段数
SELECT COUNT(*) AS field_count 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game' AND TABLE_NAME = 't_game';
-- 预期：32 个字段

-- 查看 t_game 表完整结构
DESC t_game;

-- 检查关键字段
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'kids_game'
  AND TABLE_NAME = 't_game'
  AND COLUMN_NAME IN (
    'tags', 'version', 'creator_id', 'reviewer_id',
    'review_time', 'publish_time', 'is_featured'
  );
```

### 2. 检查索引

```sql
SHOW INDEX FROM t_game;
-- 预期看到：PRIMARY, idx_category, idx_grade, idx_status, 
--            idx_tags, idx_creator, idx_featured
```

### 3. 检查新表

```sql
-- 查看所有新表
SHOW TABLES LIKE 't_game%';

-- 预期结果:
-- t_game
-- t_game_config
-- t_game_mode_config
-- t_game_permission
-- t_game_record
-- t_game_session
-- t_game_statistics           <-- 新增
-- t_game_tag
-- t_game_tag_relation
-- t_game_version_history      <-- 新增
-- t_game_review_record        <-- 新增
-- t_game_resource_config      <-- 新增
```

### 4. 检查标签数据

```sql
-- 查看标签分类
SELECT category, COUNT(*) AS count
FROM t_game_tag
GROUP BY category;

-- 预期输出:
-- category: 4 个标签
-- skill: 4 个标签
-- mode: 4 个标签
-- subject: 4 个标签

-- 查看具体标签
SELECT tag_code, tag_name, category, icon 
FROM t_game_tag 
ORDER BY sort_order;
```

### 5. 应用启动测试

```bash
cd kids-game-backend
mvn spring-boot:run
```

**检查日志**:
```
✅ MyBatis-Plus initialization completed
✅ Table 't_game' mapped successfully
✅ Table 't_game_tag' mapped successfully
✅ No schema mapping errors detected
```

### 6. API 功能测试

```bash
# 测试获取游戏列表
curl -X GET "http://localhost:8080/api/admin/games/list?page=1&size=10"

# 预期返回成功
{
  "code": 0,
  "msg": "success",
  "data": {...}
}
```

---

## ⚠️ 故障排查

### 问题 1: 迁移脚本报错 - 字段不存在

**错误信息**:
```
ERROR 1091 (42000): Can't DROP COLUMN 'total_play_count'
```

**原因**: schema_v2.sql 可能已经有这个字段

**解决方案**:
```sql
-- 手动删除字段
ALTER TABLE t_game DROP COLUMN IF EXISTS total_play_count;
ALTER TABLE t_game DROP COLUMN IF EXISTS total_play_duration;
ALTER TABLE t_game DROP COLUMN IF EXISTS average_rating;

-- 重新执行脚本
```

### 问题 2: 唯一键冲突

**错误信息**:
```
ERROR 1061 (42000): Duplicate key name 'uk_game_tag'
```

**解决方案**:
```sql
-- 先删除旧的唯一键
ALTER TABLE t_game_tag_relation DROP INDEX uk_game_tag;

-- 重新执行脚本
```

### 问题 3: 数据丢失担忧

**如果您担心数据丢失**:

```sql
-- 检查备份表是否存在
SHOW TABLES LIKE '%backup%';

-- 如果存在，说明数据已安全备份
-- 可以手动恢复:
-- TRUNCATE TABLE t_game;
-- INSERT INTO t_game SELECT * FROM t_game_backup_20260323;
```

---

## 🔄 回滚方案

### 如果需要回滚到升级前

```sql
-- 停止应用

-- 恢复 t_game 表
TRUNCATE TABLE t_game;
INSERT INTO t_game SELECT * FROM t_game_backup_20260323;

-- 恢复 t_game_tag 表
TRUNCATE TABLE t_game_tag;
INSERT INTO t_game_tag SELECT * FROM t_game_tag_backup_20260323;

-- 恢复 t_game_tag_relation 表
TRUNCATE TABLE t_game_tag_relation;
INSERT INTO t_game_tag_relation SELECT * FROM t_game_tag_relation_backup_20260323;

-- 删除新表
DROP TABLE IF EXISTS t_game_statistics;
DROP TABLE IF EXISTS t_game_version_history;
DROP TABLE IF EXISTS t_game_review_record;
DROP TABLE IF EXISTS t_game_resource_config;

-- 验证恢复
SELECT COUNT(*) FROM t_game;
```

---

## 📊 升级前后对比

### t_game 表

| 项目 | 升级前 | 升级后 | 变化 |
|------|--------|--------|------|
| 字段数 | 24 | 32 | +8 |
| status 含义 | 0-禁用，1-启用 | 0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回 | ✅ 完善 |
| 统计字段 | 有（冗余） | 无（移至统计表） | ✅ 优化 |
| 索引数 | 3 | 6 | ✅ 增强 |
| 新功能支持 | ❌ | ✅ | ✅ 完整 |

### t_game_tag 表

| 项目 | 升级前 | 升级后 | 变化 |
|------|--------|--------|------|
| 字段数 | 6 | 11 | +5 |
| 类型字段 | tag_type | category | ✅ 更清晰 |
| 图标支持 | ❌ | ✅ | ✅ 新增 |
| 状态管理 | ❌ | ✅ | ✅ 新增 |
| 更新时间 | ❌ | ✅ | ✅ 新增 |

### 新增表

| 表名 | 用途 | 字段数 |
|------|------|--------|
| t_game_statistics | 游戏统计 | 18 |
| t_game_version_history | 版本历史 | 11 |
| t_game_review_record | 审核记录 | 8 |
| t_game_resource_config | 资源配置 | 12 |

---

## 📝 重要提醒

### 必须做的

1. ✅ **执行前必须备份数据库**
2. ✅ **在测试环境先验证**
3. ✅ **检查备份表是否创建成功**
4. ✅ **升级后验证数据完整性**

### 可选做的

1. ⭕ 创建数据库视图兼容旧应用
2. ⭕ 编写性能测试验证
3. ⭕ 监控慢查询日志
4. ⭕ 更新应用配置

---

## 📞 相关文档

- 📄 [DATABASE_MIGRATION_STRATEGY.md](file://DATABASE_MIGRATION_STRATEGY.md) - 详细的迁移策略分析
- 📄 [SCHEMA_CONSISTENCY_CHECK.md](file://SCHEMA_CONSISTENCY_CHECK.md) - Schema 一致性核对报告
- 📄 [SCHEMA_FIX_SUMMARY.md](file://SCHEMA_FIX_SUMMARY.md) - Schema 修复总结
- 📄 [MIGRATION_EXECUTION_GUIDE.md](file://MIGRATION_EXECUTION_GUIDE.md) - 通用迁移指南
- 📄 [GAME_MANAGEMENT_QUICK_START.md](file://GAME_MANAGEMENT_QUICK_START.md) - 快速开始指南

---

## 📈 执行清单

### 执行前
- [ ] 备份数据库
- [ ] 通知相关人员
- [ ] 准备回滚方案
- [ ] 准备测试用例

### 执行中
- [ ] 执行快速升级脚本
- [ ] 检查每一步输出
- [ ] 记录任何警告或错误

### 执行后
- [ ] 验证表结构（32 字段）
- [ ] 验证索引（6 个）
- [ ] 验证标签数据（16 个）
- [ ] 启动应用测试
- [ ] 调用 API 测试
- [ ] 监控性能指标

---

**结论**: 

✅ **是的，需要调整数据库！**

但是非常简单：
1. 执行 `quick-upgrade-from-schema-v2.sql` 脚本
2. 自动完成所有升级步骤
3. 1-3 分钟内完成

**风险等级**: 🟢 低风险（有完整备份和回滚方案）  
**推荐指数**: ⭐⭐⭐⭐⭐ 强烈推荐

---

**最后更新**: 2026-03-23  
**版本**: v2.0.0  
**状态**: ✅ 可立即执行
