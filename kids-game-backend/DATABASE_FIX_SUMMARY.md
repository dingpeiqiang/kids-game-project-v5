# 数据库表设计修正说明

## 📋 问题发现

在审查 `user-management-migration.sql` 时发现 **逻辑不一致** 的问题：

### **问题描述**

1. ✅ **正确设计**：`t_user_action_log` 表 **没有** `deleted` 字段（日志表不应支持删除）
2. ❌ **错误使用**：在视图和统计查询中使用了 `al.deleted = 0` 条件

---

## 🔧 已修正的问题

### **问题 1: v_user_activity_stats 视图**

**文件位置**：`user-management-migration.sql` 第 201 行

**修正前**：
```sql
LEFT JOIN t_user_action_log al ON u.user_id = al.user_id AND al.deleted = 0
```

**修正后**：
```sql
-- ⚠️ 注意：t_user_action_log 没有 deleted 字段，直接关联查询
LEFT JOIN t_user_action_log al ON u.user_id = al.user_id
```

---

### **问题 2: 测试数据统计查询**

**文件位置**：`user-management-test-data.sql` 第 247 行

**修正前**：
```sql
(SELECT COUNT(*) FROM t_user_action_log WHERE deleted = 0) AS action_logs;
```

**修正后**：
```sql
(SELECT COUNT(*) FROM t_user_action_log) AS action_logs;  -- ⚠️ t_user_action_log 没有 deleted 字段
```

---

## 📊 完整表结构审查

### **所有新增表的 deleted 字段状态**

| 表名 | deleted 字段 | 是否正确 | 备注 |
|------|------------|---------|------|
| t_user_action_log | ❌ 无 | ✅ 正确 | 日志表，不应删除 |
| t_user_request | ❌ 无 | ✅ 正确 | 申请记录是历史数据 |
| t_user_achievement | ❌ 无 | ✅ 正确 | 成就是用户成长历史 |
| t_user_level | ❌ 无 | ✅ 正确 | 等级跟随用户一生 |
| t_relation_confirmation | ❌ 无 | ✅ 正确 | 确认记录是审计依据 |
| t_user | ✅ 有 | ✅ 正确 | 业务实体，需要软删除 |
| t_user_relation | ✅ 有 | ✅ 正确 | 关系可能解除 |
| t_user_control_config | ✅ 有 | ✅ 正确 | 配置可能删除 |

---

## ✅ 验证清单

已验证以下场景 **不再有 deleted 字段引用错误**：

- [x] 视图定义中的 JOIN 条件
- [x] 统计查询的 WHERE 条件
- [x] 测试数据的 COUNT 查询
- [x] 存储过程（已移除，改为编码实现）
- [x] 触发器（已移除，改为编码实现）

---

## 📚 相关文档

- [USER_MANAGEMENT_TABLE_DESIGN_SPEC.md](./USER_MANAGEMENT_TABLE_DESIGN_SPEC.md) - 表设计规范详细说明
- [user-management-migration.sql](./user-management-migration.sql) - 主迁移脚本
- [user-management-test-data.sql](./user-management-test-data.sql) - 测试数据脚本

---

## 🎯 设计原则重申

### **不需要 deleted 字段的表**
- ✅ 日志类表（t_user_action_log）
- ✅ 流水类表（t_fatigue_points_log）
- ✅ 成就类表（t_user_achievement）
- ✅ 等级类表（t_user_level）
- ✅ 流程记录类表（t_user_request, t_relation_confirmation）

**理由**：这些表记录历史数据、审计轨迹或状态流转，应永久保留。

### **需要 deleted 字段的表**
- ✅ 业务实体类表（t_user, t_game, t_question）
- ✅ 关系类表（t_user_relation）
- ✅ 配置类表（t_user_control_config）

**理由**：这些表代表业务实体，在业务操作中可能需要"删除"（软删除）。

---

## ⚠️ 重要提醒

在编写 SQL 查询时，请务必：

1. **先检查表结构**：确认是否有 deleted 字段
2. **遵循设计规范**：参考 `USER_MANAGEMENT_TABLE_DESIGN_SPEC.md`
3. **代码审查**：PR 时重点检查 deleted 字段的使用

---

**修正完成时间**: 2026-03-23  
**影响范围**: user-management-migration.sql, user-management-test-data.sql  
**修正人员**: AI Assistant
