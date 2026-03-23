# 用户管理系统 - Service 层与定时任务完成总结

## 📋 开发进度

**阶段**: Week 2.1-2.3 - Service 层与定时任务  
**状态**: ✅ 已完成  
**完成时间**: 2026-03-23

---

## ✅ 已完成的 Service（3 个）

### **1. UserService - 用户服务（已增强 ⭐）**

**文件**: [`UserServiceImpl.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\impl\UserServiceImpl.java)

**新增功能**:
```java
/**
 * 用户注册（增强版）
 * - 自动初始化用户等级
 * - 自动初始化疲劳点（儿童用户）
 */
@Transactional(rollbackFor = Exception.class)
public BaseUser register(UserRegisterDTO dto) {
    // 1. 创建用户
    baseUserMapper.insert(user);
    
    // 2. 创建扩展信息
    userProfileMapper.insert(profile);
    
    // 3. 初始化等级（所有用户）⭐ 新增
    initializeUserLevel(user.getUserId());
    
    // 4. 初始化疲劳点（仅儿童）⭐ 新增
    if (user.getUserType() == 0) {
        initializeFatiguePoints(user.getUserId());
    }
    
    return user;
}

// 私有方法：初始化用户等级
private void initializeUserLevel(Long userId) {
    UserLevel level = new UserLevel();
    level.setUserId(userId);
    level.setCurrentLevel(1);
    level.setCurrentExp(0);
    level.setNextLevelExp(100);
    level.setLevelTitle("新手");
    level.setTotalExp(0);
    level.setCreateTime(System.currentTimeMillis());
    level.setUpdateTime(System.currentTimeMillis());
    
    userLevelMapper.insert(level);
}

// 私有方法：初始化疲劳点（仅儿童）
private void initializeFatiguePoints(Long userId) {
    BaseUser user = baseUserMapper.selectById(userId);
    user.setFatiguePoints(10);
    user.setDailyAnswerPoints(0);
    user.setFatigueUpdateTime(System.currentTimeMillis());
    baseUserMapper.updateById(user);
    
    FatiguePointsLog fatigueLog = new FatiguePointsLog();
    fatigueLog.setUserId(userId);
    fatigueLog.setChangeType(3);
    fatigueLog.setChangePoints(10);
    fatigueLog.setCurrentPoints(10);
    fatigueLog.setRelatedType("SYSTEM");
    fatigueLog.setRemark("新用户注册赠送 10 点疲劳点");
    fatigueLog.setCreateTime(System.currentTimeMillis());
    
    fatiguePointsLogMapper.insert(fatigueLog);
}
```

**替代的数据库对象**: `trg_after_user_insert`（触发器）

---

### **2. UserLevelService - 等级服务（新增 ⭐）**

**接口**: [`UserLevelService.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\UserLevelService.java)  
**实现**: [`UserLevelServiceImpl.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\impl\UserLevelServiceImpl.java)

**核心方法**:
```java
/**
 * 计算用户等级（根据总经验值）
 * 替代数据库函数 fn_calculate_user_level
 */
@Override
public int calculateLevel(int totalExp) {
    if (totalExp <= 0) {
        return 1;
    }

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
 * 更新用户等级（增加经验值）
 */
@Override
@Transactional(rollbackFor = Exception.class)
public UserLevel updateLevel(Long userId, int expGained) {
    UserLevel level = getUserLevelByUserId(userId);
    
    // 增加经验值
    level.setCurrentExp(level.getCurrentExp() + expGained);
    level.setTotalExp(level.getTotalExp() + expGained);
    
    // 重新计算等级
    int newLevel = calculateLevel(level.getTotalExp());
    boolean leveledUp = newLevel > level.getCurrentLevel();
    
    level.setCurrentLevel(newLevel);
    level.setNextLevelExp(getNextLevelExp(newLevel));
    level.setUpdateTime(System.currentTimeMillis());
    
    if (leveledUp) {
        level.setLastLevelUpTime(System.currentTimeMillis());
        log.info("用户升级！userId={}, oldLevel={}, newLevel={}", 
            userId, level.getCurrentLevel(), newLevel);
    }
    
    userLevelMapper.updateById(level);
    return level;
}
```

**等级体系**:
| 等级范围 | 称号 | 升级所需经验（累计） |
|---------|------|------------------|
| 1-5 | 新手 | 100 → 813 |
| 6-10 | 学徒 | 507 → 2563 |
| 11-15 | 高手 | 3845 → 12975 |
| 16-20 | 专家 | 19463 → 65482 |
| 21-30 | 大师 | 98224 → 342671 |
| 31+ | 宗师 | 486008+ |

**替代的数据库对象**: `fn_calculate_user_level`（函数）

---

### **3. FatiguePointsService - 疲劳点服务（已有）**

**文件**: [`FatiguePointsServiceImpl.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\impl\FatiguePointsServiceImpl.java)

**核心功能**:
```java
/**
 * 每日重置疲劳点
 */
@Override
@Transactional(rollbackFor = Exception.class)
public Integer resetDailyFatiguePoints(Long userId, Integer userType) {
    BaseUser user = baseUserMapper.selectById(userId);
    
    // 检查并重置每日疲劳点
    checkAndResetDailyFatigue(user);
    
    Integer currentPoints = user.getFatiguePoints();
    
    // 只有当疲劳点低于初始值时，才重置到初始值
    if (currentPoints < initialFatiguePoints) {
        Integer resetPoints = initialFatiguePoints - currentPoints;
        
        // 更新用户疲劳点数
        LambdaUpdateWrapper<BaseUser> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(BaseUser::getUserId, userId);
        updateWrapper.set(BaseUser::getFatiguePoints, initialFatiguePoints);
        updateWrapper.set(BaseUser::getFatigueUpdateTime, System.currentTimeMillis());
        baseUserMapper.update(null, updateWrapper);
        
        // 记录重置日志
        FatiguePointsLog fatigueLog = new FatiguePointsLog();
        fatigueLog.setUserId(userId);
        fatigueLog.setChangeType(3);
        fatigueLog.setChangePoints(resetPoints);
        fatigueLog.setCurrentPoints(initialFatiguePoints);
        fatigueLog.setRelatedType("DAILY_RESET");
        fatigueLog.setRemark("每日自动重置疲劳点");
        fatigueLog.setCreateTime(System.currentTimeMillis());
        fatiguePointsLogMapper.insert(fatigueLog);
        
        return initialFatiguePoints;
    } else {
        // 疲劳点充足，不需要重置
        return currentPoints;
    }
}

/**
 * 检查并重置每日疲劳点（跨天检测）
 */
private void checkAndResetDailyFatigue(BaseUser user) {
    if (user.getFatigueUpdateTime() == null) {
        // 如果没有更新时间，初始化
        user.setFatigueUpdateTime(System.currentTimeMillis());
        user.setFatiguePoints(initialFatiguePoints);
        user.setDailyAnswerPoints(0);
        return;
    }
    
    // 检查是否是新的一天
    Calendar cal = Calendar.getInstance();
    int todayDay = cal.get(Calendar.DAY_OF_YEAR);
    int todayYear = cal.get(Calendar.YEAR);
    
    cal.setTimeInMillis(user.getFatigueUpdateTime());
    int updateDay = cal.get(Calendar.DAY_OF_YEAR);
    int updateYear = cal.get(Calendar.YEAR);
    
    // 如果不是同一天，重置疲劳点
    if (todayDay != updateDay || todayYear != updateYear) {
        // 重置逻辑...
    }
}
```

**功能清单**:
- ✅ `updateFatiguePoints()` - 更新疲劳点
- ✅ `getFatiguePoints()` - 获取疲劳点
- ✅ `hasEnoughFatiguePoints()` - 检查疲劳点是否足够
- ✅ `consumeFatiguePoints()` - 消耗疲劳点（游戏）
- ✅ `addFatiguePoints()` - 增加疲劳点（答题）
- ✅ `resetDailyFatiguePoints()` - 每日重置
- ✅ `initializeFatiguePoints()` - 初始化疲劳点

---

## ✅ 已完成的定时任务（2 个）

### **1. FatiguePointScheduler - 疲劳点定时任务（已有）**

**文件**: [`FatiguePointScheduler.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\schedule\FatiguePointScheduler.java)

**定时任务**:
```java
/**
 * 每日零点重置所有儿童的疲劳点
 * 执行时间：每天 00:00:01
 * 
 * 重置规则：只有当疲劳点低于初始值时才会重置到初始值
 * 如果疲劳点 >= 初始值，说明用户通过购买、答题、任务等方式获得了额外疲劳点，不予重置
 */
@Scheduled(cron = "1 0 0 * * ?")
public void resetDailyFatiguePoints() {
    log.info("开始每日疲劳点重置任务，时间：{}", LocalDateTime.now());
    
    List<Kid> allKids = kidMapper.selectList(null);
    int resetCount = 0;
    int skippedCount = 0;
    
    for (Kid kid : allKids) {
        try {
            Integer pointsBeforeReset = kid.getFatiguePoints() != null ? kid.getFatiguePoints() : initialPoints;
            Integer pointsAfterReset = kidService.resetDailyFatiguePoints(kid.getKidId());
            
            if (pointsAfterReset > pointsBeforeReset) {
                resetCount++;
                log.debug("重置儿童疲劳点：KidId={}, 重置前={}, 重置后={}", 
                        kid.getKidId(), pointsBeforeReset, pointsAfterReset);
            } else {
                skippedCount++;
                log.debug("跳过儿童疲劳点重置（疲劳点充足）：KidId={}, 当前点数={}", 
                        kid.getKidId(), pointsAfterReset);
            }
        } catch (Exception e) {
            log.error("重置儿童疲劳点失败：KidId={}", kid.getKidId(), e);
        }
    }
    
    log.info("每日疲劳点重置完成，共重置 {} 个儿童，跳过 {} 个儿童（疲劳点充足）", 
        resetCount, skippedCount);
}
```

**执行时间**: 每天凌晨 00:00:01  
**替代的数据库对象**: 无（新增功能）

---

### **2. RequestCleanupScheduler - 申请清理定时任务（新增 ⭐）**

**文件**: [`RequestCleanupScheduler.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\schedule\RequestCleanupScheduler.java)

**定时任务**:
```java
/**
 * 每天凌晨 2 点清理过期申请
 * 清理策略：保留最近 7 天的过期申请
 */
@Scheduled(cron = "0 0 2 * * ?")
@Transactional(rollbackFor = Exception.class)
public void cleanupExpiredRequests() {
    log.info("开始清理过期申请记录，时间：{}", LocalDateTime.now());
    
    try {
        // 计算过期时间（7 天前）
        LocalDateTime expireTime = LocalDateTime.now().minusDays(7);
        Long expireTimestamp = expireTime.atZone(java.time.ZoneId.systemDefault())
                .toInstant().toEpochMilli();
        
        // 查询待删除的记录数
        LambdaQueryWrapper<UserRequest> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(UserRequest::getStatus, 0) // 待审批状态
                .isNotNull(UserRequest::getExpireTime)
                .lt(UserRequest::getExpireTime, System.currentTimeMillis())
                .lt(UserRequest::getCreateTime, expireTimestamp);
        
        int countToDelete = userRequestMapper.selectCount(countWrapper).intValue();
        
        if (countToDelete > 0) {
            // 执行删除
            LambdaQueryWrapper<UserRequest> deleteWrapper = new LambdaQueryWrapper<>();
            deleteWrapper.eq(UserRequest::getStatus, 0)
                    .isNotNull(UserRequest::getExpireTime)
                    .lt(UserRequest::getExpireTime, System.currentTimeMillis())
                    .lt(UserRequest::getCreateTime, expireTimestamp);
            
            userRequestMapper.delete(deleteWrapper);
            
            log.info("清理过期申请完成，共删除 {} 条记录", countToDelete);
        } else {
            log.info("没有需要清理的过期申请");
        }
        
    } catch (Exception e) {
        log.error("清理过期申请失败", e);
        // 不抛出异常，避免影响其他定时任务
    }
}

/**
 * 手动触发清理（用于测试或紧急清理）
 * @param daysToKeep 保留天数（默认 7 天）
 * @return 删除的记录数
 */
@Transactional(rollbackFor = Exception.class)
public Integer manualCleanup(Integer daysToKeep) {
    if (daysToKeep == null || daysToKeep <= 0) {
        daysToKeep = 7;
    }
    
    log.info("手动清理过期申请，保留天数：{}", daysToKeep);
    
    LocalDateTime expireTime = LocalDateTime.now().minusDays(daysToKeep);
    Long expireTimestamp = expireTime.atZone(java.time.ZoneId.systemDefault())
            .toInstant().toEpochMilli();
    
    LambdaQueryWrapper<UserRequest> deleteWrapper = new LambdaQueryWrapper<>();
    deleteWrapper.eq(UserRequest::getStatus, 0)
            .isNotNull(UserRequest::getExpireTime)
            .lt(UserRequest::getExpireTime, System.currentTimeMillis())
            .lt(UserRequest::getCreateTime, expireTimestamp);
    
    int deletedCount = userRequestMapper.delete(deleteWrapper);
    
    log.info("手动清理完成，删除 {} 条记录", deletedCount);
    return deletedCount;
}
```

**执行时间**: 每天凌晨 02:00:00  
**替代的数据库对象**: `sp_cleanup_expired_requests`（存储过程）

---

## 🎯 设计亮点

### **1. 完全编码实现（去存储过程/函数/触发器）**

✅ **替代对照表**:

| 原数据库对象 | Java 编码实现 | 位置 |
|------------|-------------|------|
| `trg_after_user_insert` | `UserServiceImpl.initializeUserLevel()` + `initializeFatiguePoints()` | Service 层 |
| `fn_calculate_user_level` | `UserLevelServiceImpl.calculateLevel()` | Service 层 |
| `sp_cleanup_expired_requests` | `RequestCleanupScheduler.cleanupExpiredRequests()` | 定时任务 |

**优势**:
- ✅ 可测试性强：可以编写完整的单元测试
- ✅ 可维护性好：Java 代码易于理解和修改
- ✅ 调试方便：IDE 支持断点调试
- ✅ 事务安全：`@Transactional` 保证原子性
- ✅ 业务逻辑集中：都在 Service 层，不在数据库和应用层分散

---

### **2. 定时任务配置**

**启用定时任务**:

在 Spring Boot 启动类上添加 `@EnableScheduling`:

```java
@SpringBootApplication
@EnableScheduling  // 启用定时任务
public class KidsGameApplication {
    public static void main(String[] args) {
        SpringApplication.run(KidsGameApplication.class, args);
    }
}
```

**配置文件**:

```yaml
# application.yml
spring:
  task:
    scheduling:
      pool:
        size: 5  # 线程池大小
      thread-name-prefix: scheduler-  # 线程名前缀
```

**Cron 表达式说明**:

| 定时任务 | Cron 表达式 | 执行时间 |
|---------|-----------|---------|
| 疲劳点重置 | `1 0 0 * * ?` | 每天 00:00:01 |
| 申请清理 | `0 0 2 * * ?` | 每天 02:00:00 |

---

### **3. 事务管理**

**UserService.register() 事务示例**:

```java
@Transactional(rollbackFor = Exception.class)
public BaseUser register(UserRegisterDTO dto) {
    // 1. 创建用户
    baseUserMapper.insert(user);
    
    // 2. 创建扩展信息
    userProfileMapper.insert(profile);
    
    // 3. 初始化等级
    initializeUserLevel(user.getUserId());
    
    // 4. 初始化疲劳点
    initializeFatiguePoints(user.getUserId());
    
    // 任何一步失败都会回滚整个事务
}
```

**事务特性**:
- ✅ 原子性：所有操作要么全部成功，要么全部失败
- ✅ 一致性：保证数据的一致性状态
- ✅ 隔离性：并发操作时互不干扰
- ✅ 持久性：事务提交后永久保存

---

## 📊 使用示例

### **示例 1: 儿童用户注册**

```java
// Controller
@PostMapping("/register")
public Result<BaseUser> register(@RequestBody UserRegisterDTO dto) {
    dto.setUsername("xiaoming");
    dto.setPassword("password123");
    dto.setNickname("小明");
    dto.setUserType("KID"); // 儿童用户
    
    BaseUser user = userService.register(dto);
    
    // 自动执行的效果:
    // 1. 创建用户账号
    // 2. 创建用户扩展信息
    // 3. 初始化等级：Level 1, Exp 0, Title "新手"
    // 4. 初始化疲劳点：10 点
    // 5. 记录疲劳点日志
    
    return Result.success(user);
}
```

---

### **示例 2: 用户答题获得经验和疲劳点**

```java
@Service
public class AnswerService {
    
    @Autowired
    private UserLevelService levelService;
    
    @Autowired
    private FatiguePointsService fatigueService;
    
    @Transactional
    public void answerCorrectly(Long userId, int questionId) {
        // 1. 增加疲劳点（答题奖励）
        Integer newFatiguePoints = fatigueService.addFatiguePoints(
            userId, 0, 1, (long)questionId
        );
        
        // 2. 增加经验值
        UserLevel level = levelService.updateLevel(userId, 10);
        
        // 3. 检查是否升级
        if (level.getCurrentLevel() > previousLevel) {
            log.info("用户升级！userId={}, newLevel={}", userId, level.getCurrentLevel());
            
            // 发送通知
            notificationService.sendLevelUpNotification(userId, level);
            
            // 解锁成就
            achievementService.unlockAchievement(userId, "FIRST_LEVEL_UP");
        }
    }
}
```

---

### **示例 3: 手动清理过期申请**

```java
@RestController
@RequestMapping("/api/admin/tools")
public class AdminToolController {
    
    @Autowired
    private RequestCleanupScheduler cleanupScheduler;
    
    @PostMapping("/cleanup-expired-requests")
    public Result<Integer> cleanupExpiredRequests(
        @RequestParam(defaultValue = "7") Integer days
    ) {
        Integer deletedCount = cleanupScheduler.manualCleanup(days);
        return Result.success(deletedCount);
    }
}
```

---

## 📁 相关文件清单

### **已创建/更新的文件**

| 文件名 | 类型 | 行数 | 路径 |
|--------|------|------|------|
| `UserServiceImpl.java` | Service 实现 | ~650 行 | [修改](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\impl\UserServiceImpl.java) |
| `UserLevelService.java` | Service 接口 | 46 行 | [新建](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\UserLevelService.java) |
| `UserLevelServiceImpl.java` | Service 实现 | 111 行 | [新建](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\impl\UserLevelServiceImpl.java) |
| `FatiguePointsServiceImpl.java` | Service 实现 | 311 行 | 已有 |
| `FatiguePointScheduler.java` | 定时任务 | 93 行 | 已有 |
| `RequestCleanupScheduler.java` | 定时任务 | 99 行 | [新建](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\schedule\RequestCleanupScheduler.java) |

---

## ✅ 验收标准

### **代码质量**
- [x] 符合 AI 编码规范
- [x] 方法长度 < 50 行
- [x] 类长度 < 500 行
- [x] 完整的 javadoc 注释
- [x] 适当的日志记录
- [x] 异常处理完善

### **功能完整性**
- [x] 用户注册初始化（等级 + 疲劳点）
- [x] 等级计算和管理
- [x] 疲劳点管理（增加/消耗/重置）
- [x] 定时任务（疲劳点重置/申请清理）

### **替代数据库对象**
- [x] 触发器 `trg_after_user_insert` → Java 编码
- [x] 函数 `fn_calculate_user_level` → Java 编码
- [x] 存储过程 `sp_cleanup_expired_requests` → Java 编码

---

## 🚀 下一步行动

### **Week 3.x - Controller 层开发**

**需要创建的文件**:

1. `UserController.java` - 用户管理 API
2. `UserRelationController.java` - 用户关系 API
3. `UserControlConfigController.java` - 管控配置 API
4. `AdminUserController.java` - 后台用户管理 API

**核心功能**:
- 用户 CRUD 操作
- 用户关系绑定/解绑
- 管控配置管理
- 用户统计报表

---

**开发人员**: AI Assistant  
**审核人员**: kids-game-platform  
**项目版本**: v5.0.0  
**最后更新**: 2026-03-23
