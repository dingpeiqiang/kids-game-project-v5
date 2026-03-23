# 用户管理系统 - 编码实现方案

## 📋 概述

本文档说明用户管理系统中**不使用数据库函数、存储过程和触发器**，完全采用 Spring Boot 编码实现业务逻辑的详细方案。

**设计原则**：
- ✅ 业务逻辑在 Service 层实现
- ✅ 定时任务使用 `@Scheduled`
- ✅ 事务管理使用 `@Transactional`
- ✅ 更符合 Spring Boot 最佳实践
- ✅ 更易测试和维护

---

## 🎯 需要编码实现的功能

### 1. 用户注册初始化（原触发器）

#### 功能描述
用户注册时自动初始化：
- 用户等级（Level 1，经验 0）
- 疲劳点（儿童用户赠送 10 点）
- 成就追踪（记录初始成就）

#### 实现位置
`UserService.register()` 方法

#### 代码示例

```java
@Service
@Slf4j
public class UserServiceImpl extends ServiceImpl<BaseUserMapper, BaseUser> 
        implements UserService {
    
    @Autowired
    private UserLevelRepository userLevelRepository;
    
    @Autowired
    private FatiguePointLogRepository fatiguePointLogRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public BaseUser register(UserRegisterDTO dto) {
        // 1. 创建用户
        BaseUser user = new BaseUser();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname());
        user.setUserType(dto.getUserType());
        user.setStatus(UserStatus.NORMAL.getCode());
        user.setFatiguePoints(0);
        user.setDailyAnswerPoints(0);
        
        baseUserMapper.insert(user);
        log.info("用户注册成功。UserId: {}, Username: {}", user.getUserId(), user.getUsername());
        
        // 2. 初始化用户等级（替代触发器）
        initializeUserLevel(user.getUserId());
        
        // 3. 如果是儿童用户，初始化疲劳点（替代触发器）
        if (UserType.KID.getCode().equals(user.getUserType())) {
            initializeFatiguePoints(user.getUserId());
        }
        
        return user;
    }
    
    /**
     * 初始化用户等级
     */
    private void initializeUserLevel(Long userId) {
        UserLevel level = new UserLevel();
        level.setUserId(userId);
        level.setCurrentLevel(1);
        level.setCurrentExp(0);
        level.setNextLevelExp(100);
        level.setLevelTitle("新手");
        level.setTotalExp(0);
        
        userLevelRepository.save(level);
        log.debug("初始化用户等级。UserId: {}", userId);
    }
    
    /**
     * 初始化疲劳点
     */
    private void initializeFatiguePoints(Long userId) {
        // 设置初始疲劳点为 10
        BaseUser user = baseUserMapper.selectById(userId);
        user.setFatiguePoints(10);
        baseUserMapper.updateById(user);
        
        // 记录日志
        FatiguePointLog log = new FatiguePointLog();
        log.setUserId(userId);
        log.setChangeType(FatigueChangeType.RESET.getCode());
        log.setChangePoints(10);
        log.setCurrentPoints(10);
        log.setRelatedType("SYSTEM");
        log.setRemark("新用户注册赠送 10 点疲劳点");
        log.setCreateTime(System.currentTimeMillis());
        
        fatiguePointLogRepository.save(log);
        log.debug("初始化疲劳点。UserId: {}, Points: 10", userId);
    }
}
```

---

### 2. 用户等级计算（原数据库函数）

#### 功能描述
根据总经验值计算用户等级。

**算法**：每级所需经验 = 上一级 * 1.5

#### 实现位置
`UserLevelCalculator` 工具类

#### 代码示例

```java
@Component
@Slf4j
public class UserLevelCalculator {
    
    /**
     * 根据总经验值计算等级
     * @param totalExp 总经验值
     * @return 等级
     */
    public int calculateLevel(int totalExp) {
        if (totalExp <= 0) {
            return 1;
        }
        
        int level = 1;
        int requiredExp = 100;  // 第 1 级到第 2 级需要 100 经验
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
     * @param currentLevel 当前等级
     * @return 下一级所需经验
     */
    public int getNextLevelExp(int currentLevel) {
        return (int) (100 * Math.pow(1.5, currentLevel - 1));
    }
    
    /**
     * 计算升级到下一级还需要的经验
     * @param currentLevel 当前等级
     * @param currentExp   当前经验
     * @return 还需经验
     */
    public int getExpNeededForNextLevel(int currentLevel, int currentExp) {
        int nextLevelExp = getNextLevelExp(currentLevel);
        return Math.max(0, nextLevelExp - currentExp);
    }
}
```

#### 使用方式

```java
@Service
public class UserLevelService {
    
    @Autowired
    private UserLevelCalculator levelCalculator;
    
    @Autowired
    private UserLevelRepository userLevelRepository;
    
    /**
     * 更新用户等级（当获得经验时调用）
     */
    @Transactional
    public UserLevel updateLevel(Long userId, int expGained) {
        UserLevel level = userLevelRepository.findByUserId(userId);
        
        // 增加经验
        level.setCurrentExp(level.getCurrentExp() + expGained);
        level.setTotalExp(level.getTotalExp() + expGained);
        
        // 重新计算等级
        int newLevel = levelCalculator.calculateLevel(level.getTotalExp());
        level.setCurrentLevel(newLevel);
        
        // 更新下一级所需经验
        level.setNextLevelExp(levelCalculator.getNextLevelExp(newLevel));
        
        // 检查是否升级
        if (newLevel > level.getCurrentLevel()) {
            log.info("用户升级！UserId: {}, NewLevel: {}", userId, newLevel);
            // 可以发送通知、解锁成就等
        }
        
        return userLevelRepository.save(level);
    }
}
```

---

### 3. 过期申请清理（原存储过程）

#### 功能描述
每天凌晨清理过期未处理的申请记录。

#### 实现位置
`RequestCleanupScheduler` 定时任务

#### 代码示例

```java
@Component
@Slf4j
public class RequestCleanupScheduler {
    
    @Autowired
    private UserRequestRepository userRequestRepository;
    
    /**
     * 每天凌晨 2 点清理过期申请
     * 保留策略：7 天前的过期申请
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredRequests() {
        try {
            LocalDateTime expireTime = LocalDateTime.now().minusDays(7);
            
            int deletedCount = userRequestRepository.deleteExpiredRequests(expireTime);
            
            log.info("清理过期申请完成，删除 {} 条记录", deletedCount);
        } catch (Exception e) {
            log.error("清理过期申请失败", e);
            // 不抛出异常，避免影响其他定时任务
        }
    }
}

// Repository 接口
@Repository
public interface UserRequestRepository extends JpaRepository<UserRequest, Long> {
    
    @Modifying
    @Query("DELETE FROM UserRequest r WHERE r.status = :status " +
           "AND r.expireTime IS NOT NULL " +
           "AND r.expireTime < :expireTime")
    int deleteExpiredRequests(@Param("expireTime") LocalDateTime expireTime,
                              @Param("status") Integer status);
}
```

#### 手动调用（可选）

```java
@RestController
@RequestMapping("/api/admin/tools")
public class AdminToolController {
    
    @Autowired
    private RequestCleanupScheduler cleanupScheduler;
    
    @PostMapping("/cleanup-expired-requests")
    public Result<Integer> cleanupExpiredRequests() {
        // 手动触发清理（用于测试或紧急清理）
        cleanupScheduler.cleanupExpiredRequests();
        return Result.success(0); // 实际应该返回删除数量
    }
}
```

---

### 4. 疲劳点每日重置（原数据库事件）

#### 功能描述
每天早上 6 点重置所有用户的疲劳点到初始值（10 点）。

#### 实现位置
`FatigueResetScheduler` 定时任务

#### 代码示例

```java
@Component
@Slf4j
public class FatigueResetScheduler {
    
    @Autowired
    private FatiguePointsService fatiguePointsService;
    
    @Autowired
    private BaseUserMapper baseUserMapper;
    
    /**
     * 每天早上 6 点重置所有用户的疲劳点
     */
    @Scheduled(cron = "0 0 6 * * ?")
    @Transactional
    public void resetDailyFatiguePoints() {
        long startTime = System.currentTimeMillis();
        
        try {
            // 查询所有用户（可分页处理）
            List<BaseUser> allUsers = baseUserMapper.selectList(null);
            
            int successCount = 0;
            int failedCount = 0;
            
            for (BaseUser user : allUsers) {
                try {
                    fatiguePointsService.resetDailyFatiguePoints(
                        user.getUserId(), 
                        user.getUserType()
                    );
                    successCount++;
                } catch (Exception e) {
                    log.error("重置用户疲劳点失败。UserId: {}", user.getUserId(), e);
                    failedCount++;
                }
            }
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("疲劳点每日重置完成，成功：{}, 失败：{}, 耗时：{}ms", 
                     successCount, failedCount, duration);
            
        } catch (Exception e) {
            log.error("疲劳点批量重置失败", e);
        }
    }
}

// Service 层实现
@Service
public class FatiguePointsServiceImpl implements FatiguePointsService {
    
    @Autowired
    private FatiguePointLogRepository fatiguePointLogRepository;
    
    @Autowired
    private BaseUserMapper baseUserMapper;
    
    @Override
    @Transactional
    public Integer resetDailyFatiguePoints(Long userId, Integer userType) {
        // 获取用户
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        
        // 重置为初始值 10 点
        int initialPoints = 10;
        user.setFatiguePoints(initialPoints);
        user.setDailyAnswerPoints(0);
        user.setFatigueUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
        
        // 记录日志
        FatiguePointLog log = new FatiguePointLog();
        log.setUserId(userId);
        log.setChangeType(FatigueChangeType.RESET.getCode());
        log.setChangePoints(initialPoints);
        log.setCurrentPoints(initialPoints);
        log.setRelatedType("SYSTEM");
        log.setRemark("每日疲劳点重置");
        log.setCreateTime(System.currentTimeMillis());
        
        fatiguePointLogRepository.save(log);
        
        log.info("用户疲劳点已重置。UserId: {}, Points: {}", userId, initialPoints);
        return initialPoints;
    }
}
```

---

## 📊 定时任务配置

### 启用定时任务

在 Spring Boot 启动类上添加 `@EnableScheduling`：

```java
@SpringBootApplication
@EnableScheduling  // 启用定时任务
public class KidsGameApplication {
    public static void main(String[] args) {
        SpringApplication.run(KidsGameApplication.class, args);
    }
}
```

### 配置文件

```yaml
# application.yml
spring:
  task:
    scheduling:
      pool:
        size: 5  # 线程池大小
      thread-name-prefix: scheduler-  # 线程名前缀
```

---

## 🔍 测试方案

### 单元测试

```java
@SpringBootTest
class UserServiceTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserLevelRepository levelRepository;
    
    @Test
    void testRegister_ShouldInitializeLevelAndFatigue() {
        // 准备数据
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("test_kid");
        dto.setPassword("password123");
        dto.setNickname("测试儿童");
        dto.setUserType(UserType.KID.getCode());
        
        // 执行注册
        BaseUser user = userService.register(dto);
        
        // 验证用户创建
        assertNotNull(user.getUserId());
        assertEquals(UserType.KID.getCode(), user.getUserType());
        
        // 验证等级初始化
        UserLevel level = levelRepository.findByUserId(user.getUserId());
        assertNotNull(level);
        assertEquals(1, level.getCurrentLevel());
        assertEquals(0, level.getCurrentExp());
        
        // 验证疲劳点初始化
        assertEquals(10, user.getFatiguePoints());
    }
}
```

### 集成测试

```java
@SpringBootTest
class SchedulerIntegrationTest {
    
    @Autowired
    private RequestCleanupScheduler cleanupScheduler;
    
    @Autowired
    private UserRequestRepository requestRepository;
    
    @Test
    @Transactional
    void testCleanupExpiredRequests() {
        // 准备测试数据
        UserRequest expiredRequest = new UserRequest();
        expiredRequest.setRequestType("EXTEND_TIME");
        expiredRequest.setStatus(0); // 待审批
        expiredRequest.setExpireTime(System.currentTimeMillis() - 86400000); // 1 天前过期
        requestRepository.save(expiredRequest);
        
        // 执行清理
        cleanupScheduler.cleanupExpiredRequests();
        
        // 验证已删除
        Optional<UserRequest> deleted = requestRepository.findById(expiredRequest.getRequestId());
        assertTrue(deleted.isEmpty());
    }
}
```

---

## ⚖️ 对比分析

### 数据库对象 vs 编码实现

| 维度 | 数据库对象 | 编码实现 | 优势 |
|------|-----------|---------|------|
| **可维护性** | 较难维护，需 DBA 技能 | 易于维护，开发人员即可 | ✅ 编码实现 |
| **可测试性** | 难以单元测试 | 完善的单元测试支持 | ✅ 编码实现 |
| **调试难度** | 难以调试 | IDE 断点调试 | ✅ 编码实现 |
| **版本控制** | 需单独管理 SQL | Git 版本控制 | ✅ 编码实现 |
| **性能** | 略优（数据库层执行） | 稍逊（应用层执行） | ⚠️ 数据库对象 |
| **移植性** | 依赖特定数据库 | 数据库无关 | ✅ 编码实现 |
| **学习曲线** | 需 SQL 专业知识 | Java 开发人员熟悉 | ✅ 编码实现 |

### 选择编码实现的理由

1. ✅ **团队技能匹配**：Java 开发人员更熟悉编码而非 SQL 编程
2. ✅ **测试驱动**：完善的单元测试和集成测试支持
3. ✅ **持续集成**：更容易融入 CI/CD 流程
4. ✅ **代码审查**：符合常规代码审查流程
5. ✅ **重构友好**：IDE 支持更好的重构工具
6. ✅ **文档完整**：JavaDoc 和代码注释更规范

---

## 📁 相关文件清单

### 需要创建的 Java 文件

```
kids-game-service/
├── src/main/java/com/kidgame/service/
│   ├── UserService.java                 # 用户服务接口
│   ├── UserServiceImpl.java             # 用户服务实现 ⭐
│   ├── UserLevelService.java            # 等级服务
│   ├── UserLevelServiceImpl.java        # 等级服务实现
│   ├── FatiguePointsService.java        # 疲劳点服务
│   └── FatiguePointsServiceImpl.java    # 疲劳点服务实现
│
├── src/main/java/com/kidgame/scheduler/
│   ├── RequestCleanupScheduler.java     # 申请清理定时任务 ⭐
│   └── FatigueResetScheduler.java       # 疲劳点重置定时任务 ⭐
│
├── src/main/java/com/kidgame/util/
│   └── UserLevelCalculator.java         # 等级计算工具类 ⭐
│
└── src/main/java/com/kidgame/repository/
    ├── UserLevelRepository.java         # 等级 Repository ⭐
    ├── UserRequestRepository.java       # 申请 Repository ⭐
    └── FatiguePointLogRepository.java   # 疲劳点日志 Repository ⭐
```

---

## 🚀 实施步骤

### Step 1: 创建 Entity 实体类
- [ ] UserLevel.java
- [ ] UserRequest.java
- [ ] FatiguePointLog.java
- [ ] UserAchievement.java

### Step 2: 创建 Repository 接口
- [ ] UserLevelRepository
- [ ] UserRequestRepository
- [ ] FatiguePointLogRepository
- [ ] UserAchievementRepository

### Step 3: 实现 Service 层
- [ ] UserServiceImpl（包含初始化逻辑）
- [ ] UserLevelServiceImpl
- [ ] FatiguePointsServiceImpl

### Step 4: 创建工具类
- [ ] UserLevelCalculator

### Step 5: 实现定时任务
- [ ] RequestCleanupScheduler
- [ ] FatigueResetScheduler

### Step 6: 编写单元测试
- [ ] UserServiceTest
- [ ] UserLevelServiceTest
- [ ] SchedulerTest

### Step 7: 集成测试
- [ ] 注册流程集成测试
- [ ] 定时任务集成测试

---

## ✅ 验收标准

1. ✅ **功能完整性**：所有原数据库对象的功能都有编码实现
2. ✅ **测试覆盖**：单元测试覆盖率 > 80%
3. ✅ **性能指标**：单次操作响应时间 < 200ms
4. ✅ **代码质量**：无严重代码异味，符合 SonarQube 标准
5. ✅ **文档完整**：JavaDoc 完整，关键逻辑有注释

---

**文档版本**: v1.0  
**最后更新**: 2026-03-23  
**状态**: 待实施
