# schema_v2.sql 修正更新说明

## 📋 更新概述

**更新时间**: 2026-03-28  
**更新原因**: 根据实际数据库结构验证，`t_theme_game_relation` 表已废弃  

---

## ✅ 最新变更

### 移除的表定义

**t_theme_game_relation** (主题游戏关联表) - **已废弃**

**原因**: 
- 该表在实际数据库中已不再使用
- 主题与游戏/应用的关联关系已通过 `t_theme_info.owner_type + owner_id` 字段管理
- 新的设计更加简洁和灵活

**影响**:
- schema_v2.sql 中移除了该表的 CREATE TABLE 语句
- 新增表数量从 11 个减少到 10 个
- 不影响现有数据和功能

---

## 📊 更新后的统计

### 新增表清单（10 个）

| 序号 | 表名 | 中文名 |
|------|------|--------|
| 1 | t_game_resource_config | 游戏资源配置表 |
| 2 | t_game_review_record | 游戏评价记录表 |
| 3 | t_game_statistics | 游戏统计表 |
| 4 | t_game_version_history | 游戏版本历史表 |
| 5 | t_leaderboard_dimension | 排行榜维度表 |
| 6 | t_user_achievement | 用户成就表 |
| 7 | t_user_action_log | 用户行为日志表 |
| 8 | t_user_level | 用户等级表 |
| 9 | t_user_request | 用户请求表 |
| 10 | t_relation_confirmation | 关系确认表 |

**注意**: `t_theme_game_relation` 已废弃，不在列表中

### 修改的表（8 个）

- t_theme_info
- t_user_theme_preference
- t_theme_assets
- t_game
- t_system_config
- t_game_session
- t_daily_stats

---

## 🔍 主题系统设计说明

### 旧设计（已废弃）

```sql
-- t_theme_info: 只管理主题基本信息
-- t_theme_game_relation: 单独维护主题与游戏的关联
```

**问题**:
- 需要额外的关联表
- 一个主题只能关联一个游戏
- 扩展性差

### 新设计（当前使用）

```sql
-- t_theme_info: 包含 owner_type + owner_id
-- owner_type: 'GAME' | 'APPLICATION'
-- owner_id: game_id | application_id
```

**优势**:
- 无需额外的关联表
- 支持多类型所有者（游戏、应用）
- 设计更简洁，查询更高效
- 扩展性强

---

## 📝 迁移指南

### 如果数据库中还有 t_theme_game_relation 表

**方案 A: 保留（向后兼容）**
```sql
-- 可以选择保留该表，但不再使用
-- 新的代码使用 owner_type + owner_id 方式
```

**方案 B: 清理（推荐）**
```sql
-- 1. 数据迁移（如果有重要数据）
INSERT INTO t_theme_info (theme_id, owner_type, owner_id, ...)
SELECT 
    t.theme_id,
    'GAME' AS owner_type,
    r.game_id AS owner_id,
    ...
FROM t_theme_game_relation r
JOIN t_theme_info t ON r.theme_id = t.theme_id;

-- 2. 删除关联表
DROP TABLE IF EXISTS t_theme_game_relation;
```

### 应用程序适配

需要检查的代码点：

1. **DAO/Mapper 层**
   - [ ] 删除 ThemeGameRelationMapper
   - [ ] 删除相关 XML 配置
   - [ ] 更新 ThemeInfoMapper 支持 owner_type/owner_id 查询

2. **Service 层**
   - [ ] 删除 ThemeGameRelationService
   - [ ] 更新 ThemeService 的主题 - 游戏关联逻辑
   - [ ] 更新通过 owner_type + owner_id 查询主题的方法

3. **Controller 层**
   - [ ] 更新主题相关的 API 接口
   - [ ] 确保前端传递正确的参数

4. **前端代码**
   - [ ] 更新主题管理界面
   - [ ] 调整主题创建/编辑表单
   - [ ] 更新主题列表查询逻辑

---

## ✅ 验证清单

### 数据库验证

- [ ] `t_theme_game_relation` 表不存在或为空
- [ ] `t_theme_info` 表中 `owner_type` 和 `owner_id` 有正确的值
- [ ] 所有主题都能通过 `owner_type + owner_id` 正确定位到所属游戏/应用

### 功能验证

- [ ] 主题列表查询正常
- [ ] 主题创建功能正常（能正确设置 owner_type 和 owner_id）
- [ ] 主题编辑功能正常
- [ ] 主题删除功能正常
- [ ] 按游戏/应用筛选主题功能正常

---

## 📚 相关文档

以下文档已同步更新：

1. ✅ `schema_v2.sql` - 移除了 t_theme_game_relation 表定义
2. ✅ `schema_v2_comparison_report.md` - 添加了废弃说明
3. ✅ `SCHEMA_FIX_SUMMARY.md` - 更新了表清单
4. ✅ `SCHEMA_FIX_EXECUTION_GUIDE.md` - 更新了验证清单

---

## 🎯 下一步行动

1. **立即可执行**
   - [ ] 在测试环境验证新的主题设计
   - [ ] 检查是否有遗留代码引用 t_theme_game_relation

2. **计划执行**
   - [ ] 更新实体类定义
   - [ ] 更新 Mapper 和 Service
   - [ ] 更新 API 文档
   - [ ] 前端代码适配

3. **长期优化**
   - [ ] 考虑是否完全删除 t_theme_game_relation 表
   - [ ] 清理相关的历史代码
   - [ ] 性能测试和调优

---

## ⚠️ 注意事项

1. **向后兼容性**
   - 如果现有代码还在使用 t_theme_game_relation，需要先完成代码迁移
   - 建议保留一段时间的历史版本以便回滚

2. **数据完整性**
   - 确保所有主题的 owner_type 和 owner_id 都有正确的值
   - 必要时可以添加 NOT NULL 约束

3. **性能考虑**
   - 为 owner_type 和 owner_id 字段添加适当的索引
   - schema_v2.sql 中已包含：`INDEX idx_owner (owner_type, owner_id)`

---

**更新完成时间**: 2026-03-28  
**状态**: ✅ 已完成  
**版本**: v2.1.1
