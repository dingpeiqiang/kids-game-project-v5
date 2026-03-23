# ParentLimit 迁移到 UserControlConfig 指南

## 📋 概述

本文档提供从废弃的 `ParentLimit` 表迁移到新的 `UserControlConfig` 表的完整指南。

## 🎯 迁移目标

- **旧架构**: `t_parent_limit` 表（基于 `parentId` + `kidId`）
- **新架构**: `t_user_control_config` 表（基于 `userId` + `guardianId`）

## 🔄 核心差异

| 特性 | ParentLimit | UserControlConfig |
|------|-------------|-------------------|
| 主键 | limit_id | config_id |
| 家长 ID | parentId | guardianId (可选) |
| 儿童 ID | kidId | userId (统一用户 ID) |
| 表名 | t_parent_limit | t_user_control_config |
| 状态 | ❌ 已废弃 | ✅ 推荐使用 |

## 📝 代码迁移示例

### 1. Entity 使用方式

**旧代码:**
```java
@Autowired
private ParentLimitMapper parentLimitMapper;

LambdaQueryWrapper<ParentLimit> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(ParentLimit::getKidId, kidId)
       .eq(ParentLimit::getParentId, parentId);
ParentLimit limit = parentLimitMapper.selectOne(wrapper);
```

**新代码:**
```java
@Autowired
private UserControlConfigMapper userControlConfigMapper;

LambdaQueryWrapper<UserControlConfig> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(UserControlConfig::getUserId, kidId)
       .eq(UserControlConfig::getGuardianId, parentId);
UserControlConfig config = userControlConfigMapper.selectOne(wrapper);
```

### 2. Service 方法替换

| 旧方法 | 新方法 |
|--------|--------|
| `getParentLimit(kidId)` | `getUserControlConfigByKidId(kidId)` |
| `updateParentLimit(dto)` | `updateUserControlConfig(dto)` |
| `blockGame(kidId, gameId)` | `addBlockedGame(userId, gameId)` |
| `unblockGame(kidId, gameId)` | `removeBlockedGame(userId, gameId)` |

### 3. DTO 转换

**ParentLimitDTO → UserControlConfigDTO**

```java
// 旧方式
ParentLimitDTO dto = new ParentLimitDTO();
dto.setKidId(kidId);
dto.setParentId(parentId);
dto.setDailyDuration(60);

// 新方式
UserControlConfigDTO dto = new UserControlConfigDTO();
dto.setUserId(kidId);
dto.setGuardianId(parentId);
dto.setDailyDuration(60);
```

## 🔧 需要修改的文件

### 高优先级（核心业务逻辑）

1. **ParentServiceImpl.java**
   - `getParentLimit()` 方法
   - `updateParentLimit()` 方法
   - `addChild()` 方法中创建默认管控规则
   - `blockGame()`, `unblockGame()` 等方法

2. **GameServiceImpl.java**
   - `checkGamePermission()` 方法中的时长检查
   - `isInAllowedTime()` 方法
   - `isDailyDurationExceeded()` 方法
   - `getBlockedGameIds()` 方法

3. **QuestionServiceImpl.java**
   - `submitAnswer()` 方法中的疲劳点计算

### 中等优先级（辅助功能）

4. **ParentController.java**
   - `/api/parent/limit` 接口
   - `/api/parent/game/block` 接口
   - 其他相关接口

5. **测试类**
   - `ParentServiceTest.java`
   - `GameServiceTest.java`

## 📊 数据库迁移 SQL

```sql
-- 从 t_parent_limit 迁移到 t_user_control_config
INSERT INTO t_user_control_config (
    user_id, 
    guardian_id, 
    daily_duration, 
    single_duration, 
    allowed_time_start, 
    allowed_time_end, 
    answer_get_points, 
    daily_answer_limit, 
    blocked_games_json,
    create_time, 
    update_time, 
    deleted
)
SELECT 
    pl.kid_id AS user_id,
    pl.parent_id AS guardian_id,
    pl.daily_duration,
    pl.single_duration,
    pl.allowed_time_start,
    pl.allowed_time_end,
    pl.answer_get_points,
    pl.daily_answer_limit,
    pl.blocked_games AS blocked_games_json,
    pl.create_time,
    pl.update_time,
    pl.deleted
FROM t_parent_limit pl
WHERE pl.deleted = 0;
```

## ⚠️ 注意事项

1. **向后兼容性**: 
   - 旧的 API 接口暂时保留，标记为 `@Deprecated`
   - 建议在新代码中使用新的数据结构

2. **数据一致性**:
   - 迁移后需要确保 `t_parent_limit` 和 `t_user_control_config` 数据同步
   - 建议使用触发器或定时任务保持双写

3. **逐步迁移策略**:
   - 第一阶段：添加 `UserControlConfig` 相关代码，保留 `ParentLimit`
   - 第二阶段：逐步将业务逻辑切换到 `UserControlConfig`
   - 第三阶段：删除 `ParentLimit` 相关代码

## ✅ 迁移检查清单

- [ ] 更新所有 Entity 引用
- [ ] 更新所有 Mapper 引用
- [ ] 更新所有 Service 方法
- [ ] 更新 Controller API
- [ ] 执行数据库迁移脚本
- [ ] 更新单元测试
- [ ] 更新集成测试
- [ ] 验证生产环境数据

## 📚 相关文件

- Entity: `kids-game-dao/src/main/java/com/kidgame/dao/entity/UserControlConfig.java`
- Mapper: `kids-game-dao/src/main/java/com/kidgame/dao/mapper/UserControlConfigMapper.java`
- Service: `kids-game-service/src/main/java/com/kidgame/service/UserControlConfigService.java`

## 🆘 常见问题

**Q: 为什么要迁移到 UserControlConfig？**
A: 新架构采用统一用户表 (`t_user`)，通过 `user_type`区分用户类型，更加灵活和可扩展。

**Q: 迁移会影响现有功能吗？**
A: 如果按照本指南逐步迁移，不会影响现有功能。建议在测试环境充分验证后再上线。

**Q: 可以同时支持两种架构吗？**
A: 可以，但会增加维护成本。建议设定一个明确的迁移时间表。

---

*最后更新时间：2026-03-23*
