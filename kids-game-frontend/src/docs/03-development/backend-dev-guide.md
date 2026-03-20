# 后端开发指南

## 📁 项目结构

```
kids-game-backend/
├── kids-game-common/         # 公共模块
│   ├── src/main/java/com/kidgame/common/
│   │   ├── config/          # 配置类（SecurityConfig, WebConfig）
│   │   ├── constant/         # 常量定义
│   │   ├── exception/        # 异常处理
│   │   ├── interceptor/      # 拦截器
│   │   ├── result/           # 统一响应
│   │   ├── utils/            # 工具类
│   │   └── aspect/           # 切面
│   └── pom.xml
│
├── kids-game-dao/           # 数据访问层
│   ├── src/main/java/com/kidgame/dao/
│   │   ├── entity/           # 实体类
│   │   ├── mapper/           # MyBatis Mapper
│   │   └── package-info.java
│   └── pom.xml
│
├── kids-game-service/       # 业务逻辑层
│   ├── src/main/java/com/kidgame/service/
│   │   ├── dto/              # 数据传输对象
│   │   └── impl/             # Service 实现
│   └── pom.xml
│
├── kids-game-web/           # Web 层
│   ├── src/main/java/com/kidgame/web/
│   │   └── controller/       # Controller
│   ├── src/main/resources/
│   │   └── application.yml   # 配置文件
│   └── pom.xml
│
└── pom.xml                  # 父 POM
```

---

## 🚀 快速开始

### 编译项目
```bash
cd kids-game-backend
mvn clean compile -DskipTests
```

### 启动服务
```bash
cd kids-game-web
mvn spring-boot:run
```

### 完整构建
```bash
cd kids-game-backend
mvn clean install -DskipTests
```

---

## 📋 常用脚本

| 脚本 | 功能 |
|------|------|
| `compile.bat` | 编译项目 |
| `rebuild-backend.bat` | 清理并重新构建 |
| `start-backend.bat` | 启动后端 |
| `run-migration.bat` | 运行数据库迁移 |
| `export-ddl.bat` | 导出 DDL |

---

## 🎯 编码规范

### 命名规范

```java
// 包名：全小写
com.kidgame.service.impl

// 类名：PascalCase
public class UserServiceImpl { }

// 方法名：camelCase，动词开头
public void updateUser() { }
public User getUserById() { }

// 变量：camelCase
private String userName;

// 常量：全大写下划线
public static final int MAX_RETRY_COUNT = 3;
```

### 实体类规范

```java
@Data
@TableName("t_kid")
public class Kid {
    @TableId(type = IdType.AUTO)
    private Long kidId;              // 主键：{业务}_id
    
    @TableField(fill = FieldFill.INSERT)
    private Long createTime;         // 毫秒时间戳
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updateTime;
    
    @TableLogic
    private Integer deleted;         // 逻辑删除
}
```

### 异常处理

```java
// 正确：使用业务异常
if (kid == null) {
    throw new BusinessException(ErrorCode.KID_NOT_FOUND);
}

// 禁止：直接抛出 RuntimeException
throw new RuntimeException("用户不存在");  // 禁止
```

### 日志规范

```java
// ✅ 正确：参数化日志
log.info("用户登录成功。Username: {}, UserId: {}", username, userId);

// ❌ 禁止：字符串拼接
log.info("用户登录成功。" + username);  // 禁止
```

### 事务规范

```java
@Transactional(rollbackFor = Exception.class)
public void register(KidRegisterDTO dto) {
    // 业务逻辑
}
```

---

## 📝 数据库规范

**权威定义**：`kids-game-db-sql.sql` - 以 SQL 文件为准

```sql
-- 表名：小写 + 下划线
CREATE TABLE `t_kid` (
    `kid_id` bigint NOT NULL AUTO_INCREMENT COMMENT '儿童ID',
    `username` varchar(50) NOT NULL COMMENT '用户名',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`kid_id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB COMMENT='儿童用户表';
```

**同步原则**：修改实体类 → 必须同步更新 SQL 文件

---

## 🔧 接口日志

### 功能说明

系统使用 `ControllerLogInterceptor` 统一打印接口日志：

```java
// 位置：kids-game-common/.../interceptor/ControllerLogInterceptor.java

// 请求日志
2026-03-13 22:30:15 INFO - ========== 请求开始 ==========
2026-03-13 22:30:15 INFO - 请求 URI: /api/user/login
2026-03-13 22:30:15 INFO - 请求方法：POST
2026-03-13 22:30:15 INFO - 请求 IP: 127.0.0.1
2026-03-13 22:30:15 INFO - 请求体 (JSON): {"username": "test", "password": "***"}

// 响应日志
2026-03-13 22:30:16 INFO - ========== 请求结束 耗时：150ms ==========
```

### 配置说明

在 `application.yml` 中调整日志级别：

```yaml
logging:
  level:
    com.kidgame.common.interceptor.ControllerLogInterceptor: info
```

### 敏感信息

⚠️ 密码等敏感字段会在日志中明文显示，生产环境建议降低日志级别。

---

## 📂 后端文档索引

| 文档 | 说明 |
|------|------|
| `kids-game-backend/THEME_INTEGRATION_GUIDE.md` | 游戏主题集成指南 |
| `kids-game-backend/THEME_QUICK_START.md` | 主题系统快速开始 |
| `kids-game-backend/CONTROLLER_LOG_GUIDE.md` | 接口日志功能说明 |
| `kids-game-backend/COS_TEMPORARY_CREDENTIAL.md` | 腾讯云 COS 上传功能 |

---

**最后更新**: 2026-03-20
