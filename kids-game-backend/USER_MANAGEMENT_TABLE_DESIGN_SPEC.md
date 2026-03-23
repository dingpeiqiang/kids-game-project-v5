# 用户管理系统 - 数据库表设计规范

## 📋 概述

本文档说明用户管理系统中各张表的**逻辑删除（deleted 字段）设计规范**，确保数据模型的一致性和合理性。

---

## 🎯 设计原则

### **核心思想**
根据数据的**业务性质**和**生命周期**决定是否需要逻辑删除：

1. ✅ **需要 deleted 字段**：业务实体可能"被删除"，但需要保留历史记录
2. ❌ **不需要 deleted 字段**：历史数据、日志记录、状态流转等审计依据

---

## 📊 表分类详解

### 第一类：需要 deleted 字段的表（业务实体）

这些表代表**业务实体**，在业务操作中可能被"删除"（软删除）。

#### 1. t_user（用户主表）
```sql
deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除'
```

**理由**：
- 用户账号可能被注销
- 需要保留历史数据（游戏记录、答题记录等）
- 符合 GDPR 等法规要求（可导出个人数据）

#### 2. t_user_relation（用户关系表）
```sql
deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
```

**理由**：
- 监护关系可能解除
- 需要保留历史关系记录
- 避免硬删除导致外键约束问题

#### 3. t_user_control_config（管控配置表）
```sql
deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
```

**理由**：
- 管控配置可能被删除
- 需要保留配置历史
- 便于审计和追溯

#### 4. t_game（游戏表）
```sql
deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
```

**理由**：
- 游戏可能下架
- 保留游戏记录（用户玩过的游戏）
- 数据统计完整性

#### 5. t_question（题目表）
```sql
deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
```

**理由**：
- 题目可能作废
- 答题记录需要关联题目
- 保证历史数据完整性

---

### 第二类：不需要 deleted 字段的表（历史/日志/状态）

这些表记录**历史数据**、**日志**或**状态流转**，不应支持删除操作。

#### 1. t_user_action_log（用户行为日志表）❌ 无 deleted

**表结构**：
```sql
CREATE TABLE t_user_action_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_type TINYINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,  -- LOGIN/LOGOUT/PLAY_GAME/ANSWER
    action_desc VARCHAR(500),
    ip_address VARCHAR(50),
    device_info VARCHAR(255),
    location VARCHAR(100),
    extra_data JSON,
    create_time BIGINT
    -- ❌ 没有 deleted 字段
);
```

**理由**：
- ✅ **审计追踪**：记录所有用户行为，用于安全审计
- ✅ **不可篡改性**：日志一旦创建就不应修改或删除
- ✅ **合规要求**：满足网络安全法等法规的日志留存要求
- ✅ **数据分析**：完整的用户行为数据用于分析

**数据清理策略**：
```sql
-- 使用物理删除（定期清理过期日志）
DELETE FROM t_user_action_log 
WHERE create_time < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 YEAR)) * 1000;
```

---

#### 2. t_user_request（申请记录表）❌ 无 deleted

**表结构**：
```sql
CREATE TABLE t_user_request (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT NOT NULL,
    approver_id BIGINT,
    request_type VARCHAR(50) NOT NULL,
    request_params JSON,
    status TINYINT DEFAULT 0,  -- 0-待审批，1-已通过，2-已拒绝，3-已取消
    reason VARCHAR(500),
    approval_opinion VARCHAR(500),
    approval_time BIGINT,
    expire_time BIGINT,
    create_time BIGINT,
    update_time BIGINT
    -- ❌ 没有 deleted 字段
);
```

**理由**：
- ✅ **流程审计**：记录完整的申请 - 审批流程
- ✅ **状态自包含**：通过 `status` 字段管理生命周期（包括"已取消"状态）
- ✅ **历史追溯**：便于追溯审批历史和决策依据
- ✅ **数据分析**：统计审批通过率、响应时间等指标

**生命周期管理**：
```java
// 通过状态变更管理，而不是删除
public enum RequestStatus {
    PENDING(0, "待审批"),
    APPROVED(1, "已通过"),
    REJECTED(2, "已拒绝"),
    CANCELLED(3, "已取消");  // ← 使用状态而非删除
    
    private final int code;
    private final String desc;
}
```

---

#### 3. t_user_achievement（用户成就表）❌ 无 deleted

**表结构**：
```sql
CREATE TABLE t_user_achievement (
    achievement_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_code VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    progress INT DEFAULT 0,
    target_value INT DEFAULT 1,
    status TINYINT DEFAULT 0,  -- 0-进行中，1-已完成，2-已领取
    completed_time BIGINT,
    claimed_time BIGINT,
    create_time BIGINT,
    update_time BIGINT
    -- ❌ 没有 deleted 字段
);
```

**理由**：
- ✅ **成长记录**：记录用户的完整成长历程
- ✅ **荣誉展示**：用户成就勋章墙
- ✅ **不可撤销性**：成就是用户努力的成果，不应"删除"
- ✅ **数据统计**：统计成就完成率、活跃度等

---

#### 4. t_user_level（用户等级表）❌ 无 deleted

**表结构**：
```sql
CREATE TABLE t_user_level (
    level_id BIGINT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    current_level INT DEFAULT 1,
    current_exp INT DEFAULT 0,
    total_exp INT DEFAULT 0,
    level_title VARCHAR(50),
    last_level_up_time BIGINT,
    create_time BIGINT,
    update_time BIGINT
    -- ❌ 没有 deleted 字段
);
```

**理由**：
- ✅ **等级历史**：记录用户等级变化历史
- ✅ **一对一关系**：每个用户只有一个等级记录，跟随用户一生
- ✅ **升级追溯**：记录上次升级时间，便于分析升级速度
- ✅ **数据一致性**：与用户表强关联，不应独立删除

---

#### 5. t_fatigue_points_log（疲劳点流水表）❌ 无 deleted

**表结构**：
```sql
CREATE TABLE t_fatigue_points_log (
    log_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    change_type TINYINT,  -- 1-游戏消耗，2-答题获得，3-每日重置
    change_points INT,
    current_points INT,
    related_id BIGINT,
    related_type VARCHAR(20),
    remark VARCHAR(255),
    create_time BIGINT
    -- ❌ 没有 deleted 字段
);
```

**理由**：
- ✅ **财务对账**：类似银行流水，必须完整准确
- ✅ **积分追溯**：便于核对积分变动
- ✅ **审计要求**：满足积分系统审计要求
- ✅ **纠纷处理**：出现积分争议时有据可查

---

#### 6. t_relation_confirmation（关系确认表）❌ 无 deleted

**表结构**：
```sql
CREATE TABLE t_relation_confirmation (
    confirmation_id BIGINT PRIMARY KEY,
    relation_id BIGINT NOT NULL,
    confirmation_type VARCHAR(20) NOT NULL,  -- BIND-绑定，UNBIND-解绑，TRANSFER-转移
    confirmor_id BIGINT NOT NULL,
    confirmor_type TINYINT NOT NULL,
    status TINYINT DEFAULT 0,  -- 0-待确认，1-已确认，2-已拒绝，3-已过期
    token VARCHAR(100),
    expire_time BIGINT,
    create_time BIGINT,
    update_time BIGINT
    -- ❌ 没有 deleted 字段
);
```

**理由**：
- ✅ **确认流程**：记录完整的确认流程
- ✅ **状态管理**：通过 status 字段管理生命周期
- ✅ **审计依据**：关系变更的确认凭证
- ✅ **超时处理**：通过 expire_time 和 status 管理，无需删除

---

## 📐 设计总结

### **判断流程图**

```
开始 → 这张表记录什么？
         ↓
    ┌────┴────┐
    │ 业务实体 │      历史/日志/状态
    │ (用户/游戏)│      (日志/流水/成就)
    └────┬────┘      └────┬────┘
         ↓                 ↓
    需要 deleted       不需要 deleted
         ↓                 ↓
    软删除业务实体    保留完整历史
    保留关联数据     状态管理生命周期
```

### **对比表**

| 维度 | 需要 deleted 的表 | 不需要 deleted 的表 |
|------|-----------------|-------------------|
| **数据类型** | 业务实体 | 日志、流水、历史 |
| **删除需求** | 业务上需要"删除" | 业务上不应删除 |
| **生命周期** | 可创建、可删除 | 只增不改（或仅状态变更） |
| **数据价值** | 当前数据重要 | 历史数据同样重要 |
| **典型场景** | 用户、商品、订单 | 日志、流水、成就 |
| **替代方案** | 软删除标记 | 状态字段、归档策略 |

---

## 🔧 实施建议

### **对于需要 deleted 的表**

1. **统一字段定义**：
   ```sql
   deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除'
   ```

2. **统一查询条件**：
   ```java
   // MyBatis-Plus 自动处理
   @TableLogic
   private Integer deleted;
   
   // 查询时自动添加 AND deleted = 0
   List<User> users = userMapper.selectList(null);
   ```

3. **索引优化**：
   ```sql
   CREATE INDEX idx_deleted ON t_user(deleted);
   ```

### **对于不需要 deleted 的表**

1. **明确文档说明**：
   ```sql
   -- ⚠️ 注意：日志表不支持删除，定期物理清理
   CREATE TABLE t_user_action_log (...);
   ```

2. **归档策略**：
   ```sql
   -- 定期将历史数据迁移到归档表
   CREATE TABLE t_user_action_log_history LIKE t_user_action_log;
   
   INSERT INTO t_user_action_log_history
   SELECT * FROM t_user_action_log
   WHERE create_time < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH)) * 1000;
   ```

3. **分区表（可选）**：
   ```sql
   -- 按月分区，便于管理
   ALTER TABLE t_user_action_log 
   PARTITION BY RANGE (create_time) (
       PARTITION p202601 VALUES LESS THAN (1675209600000),
       PARTITION p202602 VALUES LESS THAN (1677628800000),
       ...
   );
   ```

---

## ✅ 检查清单

在设计新表时，请回答以下问题：

- [ ] 这张表记录的是业务实体还是历史数据？
- [ ] 业务上是否需要"删除"这个概念？
- [ ] 删除后是否会影响其他数据的完整性？
- [ ] 是否需要长期保留用于审计或分析？
- [ ] 是否可以用状态字段替代删除标记？

**如果答案是"历史数据/不需要删除/影响完整性/需要保留"** → **不添加 deleted 字段**

**如果答案是"业务实体/需要删除/不影响/不需要"** → **添加 deleted 字段**

---

## 📚 相关文档

- [user-management-migration.sql](./user-management-migration.sql) - 数据库迁移脚本
- [USER_MANAGEMENT_CODING_IMPLEMENTATION.md](./USER_MANAGEMENT_CODING_IMPLEMENTATION.md) - 编码实现方案
- [ai-coding-guide.md](../../kids-game-frontend/src/docs/03-development/ai-coding-guide.md) - AI 编码指南

---

**文档版本**: v1.0  
**最后更新**: 2026-03-23  
**维护人员**: 数据库架构团队
