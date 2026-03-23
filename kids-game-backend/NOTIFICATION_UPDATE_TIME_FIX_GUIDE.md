# t_notification 表 update_time 字段默认值修复指南

## 📋 问题描述

**错误信息**：
```
Field 'update_time' doesn't have a default value
```

**原因分析**：
- `t_notification` 表的 `update_time` 字段定义为 `BIGINT NOT NULL`，但**没有 DEFAULT 值**
- 当 INSERT 操作不指定 `update_time` 时，MySQL 无法确定值，导致报错

---

## 🔍 问题诊断

### **步骤 1: 检查字段定义**

```sql
-- 查看表结构
DESC t_notification;

-- 检查 create_time 和 update_time 的默认值
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_notification' 
  AND COLUMN_NAME IN ('create_time', 'update_time');
```

**预期结果**：
- `create_time`: 应该有 DEFAULT 值 `(UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000)`
- `update_time`: **没有 DEFAULT 值** ← 问题所在

---

## 🔧 解决方案

### **方案 1: 执行修复脚本（推荐 ⭐）**

**一键修复**：

```bash
# 使用命令行
mysql -u root -p kids_game_db < fix-notification-update-time.sql

# 或使用 MySQL Workbench
# 打开 fix-notification-update-time.sql 文件，点击 Execute
```

**修复脚本**：[`fix-notification-update-time.sql`](./fix-notification-update-time.sql)

---

### **方案 2: 手动执行 ALTER TABLE**

```sql
-- 为 update_time 添加默认值（当前时间戳毫秒）
ALTER TABLE t_notification
MODIFY COLUMN update_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间';
```

**验证**：

```sql
-- 查看修改后的表结构
DESC t_notification;

-- 测试 INSERT（不指定 update_time）
INSERT INTO t_notification (
    user_id, 
    user_type, 
    type, 
    title, 
    content, 
    status, 
    is_read, 
    create_time, 
    deleted
) VALUES (
    1, 
    0, 
    'TEST', 
    '测试通知', 
    '这是一条测试通知', 
    0, 
    0, 
    UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 
    0
);

-- 应该成功插入，且 update_time 自动填充
SELECT notification_id, title, create_time, update_time
FROM t_notification
WHERE title = '测试通知';
```

---

### **方案 3: 更新 schema_v2.sql（已自动完成）**

**预防将来问题**：已更新 `schema_v2.sql`，确保新创建的表有正确的默认值。

**修改内容**：

```sql
-- 修改前
create_time BIGINT NOT NULL COMMENT '创建时间',
update_time BIGINT NOT NULL COMMENT '更新时间',

-- 修改后
create_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
update_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
```

---

## 📊 完整的表结构（修复后）

```sql
CREATE TABLE t_notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '通知 ID',
    user_id BIGINT NOT NULL COMMENT '接收者用户 ID',
    user_type TINYINT NOT NULL COMMENT '用户类型：0-儿童，1-家长',
    type VARCHAR(50) NOT NULL COMMENT '通知类型',
    title VARCHAR(255) NOT NULL COMMENT '标题',
    content TEXT COMMENT '内容',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-待处理，1-已接受，2-已拒绝，3-已过期',
    is_read TINYINT NOT NULL DEFAULT 0 COMMENT '通知状态：0-未读，1-已读',
    related_id BIGINT DEFAULT NULL COMMENT '关联的数据 ID',
    sender_id BIGINT DEFAULT NULL COMMENT '发送者 ID',
    sender_type TINYINT DEFAULT NULL COMMENT '发送者类型：0-儿童，1-家长',
    extra_data JSON DEFAULT NULL COMMENT '扩展数据（JSON 格式）',
    create_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间', -- ← 已修复
    expire_time BIGINT DEFAULT NULL COMMENT '过期时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    
    INDEX idx_user (user_id, user_type),
    INDEX idx_status (status),
    INDEX idx_is_read (is_read),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知消息表';
```

---

## ✅ 验证清单

修复完成后，请执行以下检查：

- [ ] **字段默认值检查**：`update_time` 有 DEFAULT 值
- [ ] **INSERT 测试**：不指定 `update_time` 也能成功插入
- [ ] **自动填充验证**：`update_time` 自动设置为当前时间戳
- [ ] **时间格式化验证**：时间戳可以正确转换为可读格式

**验证 SQL**：

```sql
-- 1. 检查字段默认值
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND TABLE_NAME = 't_notification' 
  AND COLUMN_NAME IN ('create_time', 'update_time');
-- update_time 的 COLUMN_DEFAULT 应该是：unix_timestamp(current_timestamp()) * 1000

-- 2. 测试 INSERT
INSERT INTO t_notification (
    user_id, user_type, type, title, content, 
    status, is_read, create_time, deleted
) VALUES (
    1, 0, 'TEST', '验证测试', '测试内容', 
    0, 0, UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000, 0
);

-- 3. 验证自动填充
SELECT 
    notification_id,
    title,
    create_time,
    update_time,
    FROM_UNIXTIME(create_time / 1000) AS create_time_fmt,
    FROM_UNIXTIME(update_time / 1000) AS update_time_fmt
FROM t_notification
WHERE title = '验证测试'
ORDER BY notification_id DESC
LIMIT 1;

-- 4. 清理测试数据
DELETE FROM t_notification WHERE title = '验证测试';
```

---

## 🎯 字段用途说明

### **为什么需要 update_time 字段？**

`t_notification` 表用于系统通知消息，`update_time` 字段记录：

- **通知修改时间**：当通知内容被修改时更新
- **状态变更时间**：当通知状态改变时（如已读、已处理）更新
- **最后活跃时间**：便于追踪通知的生命周期

**示例场景**：

```java
// Java Service 层代码示例
@Transactional
public void markAsRead(Long notificationId) {
    Notification notification = notificationMapper.selectById(notificationId);
    if (notification != null) {
        notification.setIsRead(1);
        notification.setUpdateTime(System.currentTimeMillis()); // ← 自动更新时间
        notificationMapper.updateById(notification);
    }
}
```

---

## 📚 相关修复

### **类似问题的其他表**

检查其他表是否也有同样的问题：

```sql
-- 查找所有没有默认值的 NOT NULL BIGINT 时间字段
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'kids_game_db' 
  AND DATA_TYPE = 'bigint'
  AND COLUMN_NAME IN ('create_time', 'update_time')
  AND IS_NULLABLE = 'NO'
  AND COLUMN_DEFAULT IS NULL;
```

**如果发现其他表也有同样问题**，使用相同的方法修复：

```sql
ALTER TABLE {表名}
MODIFY COLUMN {字段名} BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '{注释}';
```

---

## 🛠️ MyBatis-Plus 自动填充

为了在 Java 代码中自动填充 `update_time`，可以配置 MyBatis-Plus 的自动填充功能：

```java
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {
    
    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createTime", Long.class, System.currentTimeMillis());
        this.strictInsertFill(metaObject, "updateTime", Long.class, System.currentTimeMillis());
    }
    
    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", Long.class, System.currentTimeMillis());
    }
}

// Entity 类上添加注解
@TableField(fill = FieldFill.INSERT_UPDATE)
private Long updateTime;
```

这样即使数据库有默认值，Java 代码也会自动设置时间戳，双重保障！

---

## 📁 已创建的文件

| 文件名 | 用途 |
|--------|------|
| [`fix-notification-update-time.sql`](./fix-notification-update-time.sql) | **修复脚本**（可直接执行） |
| [`NOTIFICATION_UPDATE_TIME_FIX_GUIDE.md`](./NOTIFICATION_UPDATE_TIME_FIX_GUIDE.md) | **详细指南**（本文档） |
| [`schema_v2.sql`](./kids-game-web/src/main/resources/schema_v2.sql) | **已更新**的完整表结构 |

---

## ⚠️ 注意事项

1. **生产环境谨慎操作**：先在测试环境验证
2. **备份数据**：虽然 ALTER TABLE 不会丢失数据，但仍建议备份
3. **业务低峰期**：大表 ALTER 可能锁表
4. **兼容性问题**：如果使用 MyBatis-Plus 自动填充，数据库默认值作为备用方案

---

**修复完成时间**: 预计 3 分钟  
**风险等级**: 低（仅修改字段默认值）  
**建议执行人员**: 开发人员或 DBA
