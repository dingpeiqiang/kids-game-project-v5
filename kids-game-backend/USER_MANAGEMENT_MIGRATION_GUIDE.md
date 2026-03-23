# 用户管理系统 - 数据库迁移指南

## 📋 概述

本文档说明如何为用户管理系统进行数据库迁移和初始化。

**版本**: v1.0.0  
**日期**: 2026-03-23  
**基于**: schema_v2.sql

---

## 🎯 迁移内容

### 1. 扩展现有表结构
- ✅ `t_user` - 添加安全和审计字段
- ✅ `t_user_control_config` - 添加疲劳控制模式、内容管控字段

### 2. 新增表结构
- ✅ `t_user_action_log` - 用户行为日志
- ✅ `t_user_request` - 申请审批记录
- ✅ `t_user_achievement` - 用户成就系统
- ✅ `t_user_level` - 用户等级系统
- ✅ `t_relation_confirmation` - 关系确认表

### 3. 新增功能
- 🔐 账号安全（登录失败次数、锁定机制）
- 📊 行为审计（完整的行为日志）
- 🏆 成长系统（等级、成就）
- 📝 审批流程（申请 - 审批机制）
- 👥 关系确认（绑定/解绑确认流程）

---

## 🚀 快速开始

### 前置条件

1. **已安装 MySQL 8.0+**
2. **已有数据库**（基于 schema_v2.sql 创建）
3. **MySQL 客户端工具**（如 MySQL Workbench、Navicat 等）

### 执行步骤

#### 步骤 1：备份现有数据

```bash
# 备份整个数据库
mysqldump -u root -p kids_game_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 或仅备份关键表
mysqldump -u root -p kids_game_db t_user t_user_relation t_user_control_config > backup_key_tables.sql
```

#### 步骤 2：执行迁移脚本

```bash
# 方式 1: 使用命令行
mysql -u root -p kids_game_db < user-management-migration.sql

# 方式 2: 使用 MySQL Workbench
# 打开 user-management-migration.sql 文件，点击 Execute
```

#### 步骤 3：验证迁移结果

```sql
-- 检查新增的表
SHOW TABLES LIKE 't_user_%';

-- 应该看到：
-- t_user_action_log
-- t_user_achievement
-- t_user_level
-- t_user_request
-- t_relation_confirmation

-- 检查扩展字段
DESC t_user;
DESC t_user_control_config;
```

#### 步骤 4：（可选）加载测试数据

**⚠️ 警告：测试数据仅用于开发/测试环境，生产环境请勿执行！**

```bash
# 加载测试数据
mysql -u root -p kids_game_db < user-management-test-data.sql
```

测试数据包含：
- 2 个管理员
- 5 个家长
- 10 个儿童
- 完整的亲子关系
- 管控配置
- 等级和成就数据
- 模拟行为日志

---

## 📦 迁移详情

### 1. t_user 表扩展

**新增字段**：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `password_salt` | VARCHAR(50) | 密码加密盐值 |
| `login_failure_count` | INT DEFAULT 0 | 登录失败次数 |
| `locked_until` | BIGINT | 锁定截止时间（毫秒） |

**作用**：增强账号安全性，支持登录失败锁定机制。

### 2. t_user_control_config 表扩展

**新增字段**：

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `fatigue_point_threshold` | INT | 60 | 疲劳点阈值（分钟） |
| `rest_duration` | INT | 15 | 强制休息时长（分钟） |
| `fatigue_control_mode` | VARCHAR(10) | SOFT | 疲劳控制模式：SOFT/HARD/OFF |
| `game_category_whitelist` | TEXT | NULL | 游戏类型白名单（JSON） |
| `difficulty_limit` | VARCHAR(10) | ALL | 难度限制：ALL/EASY/MEDIUM/HARD |
| `spending_limit` | INT | 0 | 消费限额（游戏币/天） |

**作用**：支持更细粒度的管控配置。

### 3. 新增表详解

#### t_user_action_log（用户行为日志）

记录所有用户行为，用于安全审计和数据分析。

```sql
CREATE TABLE t_user_action_log (
    log_id BIGINT PRIMARY KEY,
    user_id BIGINT,
    user_type TINYINT,
    action_type VARCHAR(50),  -- LOGIN/LOGOUT/PLAY_GAME/ANSWER/PURCHASE
    ip_address VARCHAR(50),
    device_info VARCHAR(255),
    location VARCHAR(100),
    extra_data JSON,
    create_time BIGINT
);
```

**索引**：
- `idx_user_time`: (user_id, create_time) - 查询用户行为历史
- `idx_action_type`: (action_type) - 统计某类行为
- `idx_ip`: (ip_address) - 安全分析

#### t_user_request（申请审批表）

支持儿童向家长提交申请（延长时长、解锁游戏等）。

```sql
CREATE TABLE t_user_request (
    request_id BIGINT PRIMARY KEY,
    requester_id BIGINT,        -- 申请人（儿童）
    approver_id BIGINT,         -- 审批人（家长）
    request_type VARCHAR(50),   -- EXTEND_TIME/UNLOCK_GAME/PURCHASE_THEME
    status TINYINT,             -- 0-待审批，1-已通过，2-已拒绝，3-已取消
    request_params JSON,
    reason VARCHAR(500),
    approval_opinion VARCHAR(500)
);
```

#### t_user_achievement（成就系统）

用户成就追踪和展示。

```sql
CREATE TABLE t_user_achievement (
    achievement_id BIGINT PRIMARY KEY,
    user_id BIGINT,
    achievement_code VARCHAR(50),  -- first_login/game_master/等
    achievement_name VARCHAR(100),
    progress INT,                   -- 当前进度
    target_value INT,               -- 目标值
    status TINYINT                  -- 0-进行中，1-已完成，2-已领取
);
```

#### t_user_level（等级系统）

用户等级和经验值管理。

```sql
CREATE TABLE t_user_level (
    level_id BIGINT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    current_level INT,
    current_exp INT,
    total_exp INT,
    level_title VARCHAR(50)  -- 新手/学霸/高手/等
);
```

---

## 🔧 存储过程和函数

**⚠️ 重要说明**：本项目采用 Spring Boot 编码实现业务逻辑，不使用数据库存储过程、函数和触发器。

### 替代方案

#### 6.1 用户注册初始化

**原触发器实现** → **改为 Service 层实现**

```java
@Service
public class UserServiceImpl implements UserService {
    
    @Autowired
    private UserLevelRepository userLevelRepository;
    
    @Autowired
    private FatiguePointLogRepository fatiguePointLogRepository;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public BaseUser register(UserRegisterDTO dto) {
        // 创建用户
        BaseUser user = new BaseUser();
        // ... 设置用户属性
        baseUserMapper.insert(user);
        
        // 初始化用户等级（替代触发器）
        initializeUserLevel(user.getUserId());
        
        // 初始化疲劳点（仅儿童用户）
        if (user.getUserType() == UserType.KID.getCode()) {
            initializeFatiguePoints(user.getUserId());
        }
        
        return user;
    }
    
    private void initializeUserLevel(Long userId) {
        UserLevel level = new UserLevel();
        level.setUserId(userId);
        level.setCurrentLevel(1);
        level.setCurrentExp(0);
        level.setNextLevelExp(100);
        level.setLevelTitle("新手");
        userLevelRepository.save(level);
    }
    
    private void initializeFatiguePoints(Long userId) {
        FatiguePointLog log = new FatiguePointLog();
        log.setUserId(userId);
        log.setChangeType(FatigueChangeType.RESET);
        log.setChangePoints(10);
        log.setCurrentPoints(10);
        log.setRelatedType("SYSTEM");
        log.setRemark("新用户注册赠送 10 点疲劳点");
        fatiguePointLogRepository.save(log);
    }
}
```

#### 6.2 用户等级计算

**原数据库函数** → **改为 Java 工具类**

```java
@Component
public class UserLevelCalculator {
    
    /**
     * 根据总经验值计算等级
     * 算法：每级所需经验 = 上一级 * 1.5
     */
    public int calculateLevel(int totalExp) {
        int level = 1;
        int requiredExp = 100;
        int accumulatedExp = 0;
        
        while (accumulatedExp + requiredExp <= totalExp) {
            level++;
            accumulatedExp += requiredExp;
            requiredExp = (int) Math.floor(requiredExp * 1.5);
        }
        
        return level;
    }
    
    /**
     * 计算下一级所需经验
     */
    public int getNextLevelExp(int currentLevel) {
        return (int) (100 * Math.pow(1.5, currentLevel - 1));
    }
}
```

#### 6.3 过期申请清理

**原存储过程** → **改为定时任务**

```java
@Component
@Slf4j
public class RequestCleanupScheduler {
    
    @Autowired
    private UserRequestRepository userRequestRepository;
    
    /**
     * 每天凌晨 2 点清理过期申请
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredRequests() {
        int daysToKeep = 7; // 保留 7 天
        LocalDateTime expireTime = LocalDateTime.now().minusDays(daysToKeep);
        
        int deletedCount = userRequestRepository.deleteExpiredRequests(expireTime);
        log.info("清理过期申请完成，删除 {} 条记录", deletedCount);
    }
}

// Repository 接口
public interface UserRequestRepository extends JpaRepository<UserRequest, Long> {
    @Modifying
    @Query("DELETE FROM UserRequest r WHERE r.status = 0 " +
           "AND r.expireTime IS NOT NULL " +
           "AND r.expireTime < :expireTime")
    int deleteExpiredRequests(@Param("expireTime") LocalDateTime expireTime);
}
```

#### 6.4 疲劳点每日重置

**原触发器/事件** → **改为定时任务**

```java
@Component
@Slf4j
public class FatigueResetScheduler {
    
    @Autowired
    private FatiguePointsService fatiguePointsService;
    
    /**
     * 每天早上 6 点重置所有用户的疲劳点
     */
    @Scheduled(cron = "0 0 6 * * ?")
    @Transactional
    public void resetDailyFatiguePoints() {
        List<BaseUser> allUsers = baseUserMapper.selectList(null);
        
        for (BaseUser user : allUsers) {
            fatiguePointsService.resetDailyFatiguePoints(
                user.getUserId(), 
                user.getUserType()
            );
        }
        
        log.info("疲劳点每日重置完成，处理用户数：{}", allUsers.size());
    }
}
```

---

### sp_cleanup_expired_requests ❌ 已移除

**替代方案**：使用 `RequestCleanupScheduler` 定时任务

```java
@Autowired
private RequestCleanupScheduler requestCleanupScheduler;

// 手动调用（可选）
requestCleanupScheduler.cleanupExpiredRequests();
```

### fn_calculate_user_level ❌ 已移除

**替代方案**：使用 `UserLevelCalculator` 工具类

```java
@Autowired
private UserLevelCalculator levelCalculator;

int level = levelCalculator.calculateLevel(totalExp);
```

---

清理过期的申请记录。

```sql
CALL sp_cleanup_expired_requests(7);  -- 清理 7 天前的过期申请
```

### fn_calculate_user_level

根据总经验值计算用户等级。

```sql
SELECT fn_calculate_user_level(1500) AS user_level;  -- 返回等级
```

---

## 📊 视图和统计

### v_user_relation_stats

关系统计视图 - 查看每个家长的子女数量。

```sql
SELECT * FROM v_user_relation_stats;
```

### v_kid_guardian_stats

儿童监护人统计 - 查看每个儿童的监护人信息。

```sql
SELECT * FROM v_kid_guardian_stats;
```

### v_user_activity_stats

用户活跃度统计 - 查看用户活跃天数和行为次数。

```sql
SELECT * FROM v_user_activity_stats WHERE active_days >= 3;
```

---

## ⚠️ 注意事项

### 1. 数据兼容性

- ✅ 所有变更都是**向后兼容**的
- ✅ 使用 `ADD COLUMN IF NOT EXISTS` 避免重复添加
- ✅ 使用逻辑删除（deleted 字段）不影响现有数据

### 2. 性能影响

- 新增索引会在写入时略微增加开销
- 建议在低峰期执行迁移
- 大表（如 t_user）添加索引可能需要较长时间

### 3. 触发器

迁移脚本会创建以下触发器：

- `trg_after_user_insert` - 用户注册时自动初始化等级和疲劳点

**注意**：如果已有其他触发器，请检查命名冲突。

---

## 🔍 验证清单

迁移完成后，请执行以下检查：

```sql
-- 1. 检查表数量
SELECT COUNT(*) AS table_count 
FROM information_schema.tables 
WHERE table_schema = 'kids_game_db' 
  AND table_name LIKE 't_user%';
-- 应该返回 >= 7

-- 2. 检查 t_user 字段
SHOW FULL COLUMNS FROM t_user;
-- 确认新增字段：password_salt, login_failure_count, locked_until

-- 3. 检查管控配置字段
SHOW FULL COLUMNS FROM t_user_control_config;
-- 确认新增字段：fatigue_point_threshold, rest_duration, fatigue_control_mode 等

-- 4. 检查存储过程
SHOW PROCEDURE STATUS WHERE Db = 'kids_game_db';
-- 应该看到：sp_cleanup_expired_requests

-- 5. 检查函数
SHOW FUNCTION STATUS WHERE Db = 'kids_game_db';
-- 应该看到：fn_calculate_user_level

-- 6. 检查触发器
SHOW TRIGGERS WHERE `Database` = 'kids_game_db';
-- 应该看到：trg_after_user_insert

-- 7. 检查视图
SHOW FULL TABLES WHERE table_type = 'VIEW';
-- 应该看到多个 v_开头的视图
```

---

## 🔄 回滚方案

如果需要回滚迁移：

### 方式 1：从备份恢复

```bash
mysql -u root -p kids_game_db < backup_YYYYMMDD_HHMMSS.sql
```

### 方式 2：手动删除新增对象

```sql
-- 删除新增表
DROP TABLE IF EXISTS t_user_action_log;
DROP TABLE IF EXISTS t_user_request;
DROP TABLE IF EXISTS t_user_achievement;
DROP TABLE IF EXISTS t_user_level;
DROP TABLE IF EXISTS t_relation_confirmation;

-- 删除扩展字段
ALTER TABLE t_user 
    DROP COLUMN password_salt,
    DROP COLUMN login_failure_count,
    DROP COLUMN locked_until;

-- 删除存储过程
DROP PROCEDURE IF EXISTS sp_cleanup_expired_requests;
DROP FUNCTION IF EXISTS fn_calculate_user_level;

-- 删除触发器
DROP TRIGGER IF EXISTS trg_after_user_insert;

-- 删除视图
DROP VIEW IF EXISTS v_user_relation_stats;
DROP VIEW IF EXISTS v_kid_guardian_stats;
DROP VIEW IF EXISTS v_user_activity_stats;
```

---

## 📞 问题排查

### 常见问题

#### Q1: 执行迁移时报错 "Column already exists"

**原因**：某些字段可能已经存在。

**解决**：迁移脚本已使用 `IF NOT EXISTS`，如果仍报错，手动检查表结构：

```sql
DESC t_user;
```

#### Q2: 触发器创建失败

**原因**：可能与现有触发器冲突。

**解决**：检查现有触发器：

```sql
SHOW TRIGGERS WHERE `Database` = 'kids_game_db';
```

如果已有同名触发器，先备份再删除：

```sql
DROP TRIGGER trg_after_user_insert;
```

#### Q3: 测试数据插入失败

**原因**：用户名已存在。

**解决**：测试数据仅用于新环境。如果已有数据，请先清空或修改测试数据中的用户名。

---

## 📈 后续步骤

迁移完成后，继续以下步骤：

1. ✅ **Entity 实体类开发** - 对应新增表的 Java 实体
2. ✅ **Repository 层开发** - 数据访问接口
3. ✅ **Service 层开发** - 业务逻辑实现
4. ✅ **Controller 层开发** - API 接口暴露
5. ✅ **前端组件开发** - 用户管理 UI

---

## 📚 相关文档

- [schema_v2.sql](./schema_v2.sql) - 基础数据库结构
- [USER_MANAGEMENT_IMPLEMENTATION_PLAN.md](../USER_MANAGEMENT_IMPLEMENTATION_PLAN.md) - 实施计划
- [ai-coding-guide.md](../../kids-game-frontend/src/docs/03-development/ai-coding-guide.md) - AI 编码指南

---

**迁移完成时间**: 预计 5-10 分钟  
**风险等级**: 低  
**建议执行人员**: DBA 或后端开发人员  

如有问题，请联系技术负责人。
