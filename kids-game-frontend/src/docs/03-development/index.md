# 开发指南

本指南将帮助您快速上手项目开发，包括环境配置、编码规范、最佳实践等。

## 📋 目录

1. [环境配置](#环境配置)
2. [项目结构](#项目结构)
3. [编码规范](#编码规范)
4. [开发流程](#开发流程)
5. [调试技巧](#调试技巧)
6. [测试指南](#测试指南)

---

## 环境配置

### 后端环境

#### 1. JDK 配置

```bash
# 检查 Java 版本（需要 17+）
java -version

# 设置 JAVA_HOME（Windows）
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

#### 2. Maven 配置

编辑 `settings.xml` (通常位于 `~/.m2/`):

```xml
<mirrors>
  <mirror>
    <id>aliyun</id>
    <name>Aliyun Maven</name>
    <url>https://maven.aliyun.com/repository/public</url>
    <mirrorOf>central</mirrorOf>
  </mirror>
</mirrors>
```

#### 3. IDE 配置

推荐使用 **IntelliJ IDEA**:
- 安装 Lombok 插件
- 配置代码格式化模板
- 启用注解处理（Annotation Processing）

### 前端环境

#### 1. Node.js 配置

```bash
# 检查 Node 版本（需要 16+）
node -v

# 检查 npm 版本
npm -v

# 配置淘宝镜像（可选）
npm config set registry https://registry.npmmirror.com
```

#### 2. VSCode 扩展推荐

- Volar (Vue 开发)
- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense

---

## 项目结构

### 后端结构

```
kids-game-backend/
├── kids-game-common/          # 公共模块
│   ├── annotation/            # 自定义注解
│   ├── config/                # 配置类
│   ├── constant/              # 常量定义
│   ├── exception/             # 异常定义
│   ├── filter/                # 过滤器
│   ├── handler/               # 处理器
│   ├── interceptor/           # 拦截器
│   └── util/                  # 工具类
├── kids-game-dao/             # 数据访问层
│   ├── entity/                # 实体类
│   └── mapper/                # Mapper 接口
├── kids-game-service/         # 业务逻辑层
│   ├── dto/                   # 数据传输对象
│   ├── impl/                  # 服务实现
│   └── schedule/              # 定时任务
└── kids-game-web/             # Web 层
    ├── controller/            # 控制器
    └── config/                # Web 配置
```

### 前端结构

```
kids-game-frontend/
├── src/
│   ├── components/            # 通用组件
│   │   ├── game/              # 游戏组件
│   │   └── ui/                # UI 组件
│   ├── core/                  # 核心功能
│   │   ├── config/            # 配置
│   │   ├── network/           # 网络请求
│   │   ├── store/             # 状态管理
│   │   └── utils/             # 工具函数
│   ├── modules/               # 业务模块
│   │   ├── admin/             # 管理后台
│   │   ├── answer/            # 答题模块
│   │   ├── game/              # 游戏模块
│   │   ├── home/              # 首页
│   │   ├── kids-home/         # 儿童首页
│   │   ├── login/             # 登录
│   │   ├── parent/            # 家长中心
│   │   └── register/          # 注册
│   ├── router/                # 路由配置
│   ├── services/              # API 服务
│   ├── styles/                # 全局样式
│   ├── docs/                  # 项目文档
│   ├── App.vue                # 根组件
│   └── main.ts                # 入口文件
└── public/                    # 静态资源
```

---

## 编码规范

### 命名规范

#### Java 后端

```java
// ✅ 正确 - 类名使用大驼峰
public class UserServiceImpl {}

// ✅ 正确 - 方法名使用小驼峰
public void updateUser() {}

// ✅ 正确 - 变量名使用小驼峰
private String userName;

// ✅ 正确 - 常量全大写
private static final int MAX_RETRY_COUNT = 3;
```

#### TypeScript 前端

```typescript
// ✅ 正确 - 组件文件 PascalCase
UserProfile.vue

// ✅ 正确 - 工具文件 kebab-case
date-util.ts

// ✅ 正确 - 变量和函数 camelCase
const userName: string = '张三';
function getUserInfo(): void {}
```

### 代码质量

#### 单一职责原则

```java
// ✅ 正确 - 方法职责单一
@Override
public Parent login(ParentLoginDTO dto) {
    validateLoginParams(dto);
    String phone = dto.getPhone().trim();
    Parent parent = getOrRegisterParent(phone, dto.getPassword());
    return parent;
}

// ❌ 错误 - 方法过长，包含过多逻辑
@Override
public Parent login(ParentLoginDTO dto) {
    // 50+ 行的逻辑...
}
```

#### 避免魔法值

```java
// ✅ 正确 - 使用常量
if (game.getStatus() == GameConstants.GameStatus.ENABLED) {
    // ...
}

// ❌ 错误 - 使用魔法值
if (game.getStatus() == 1) {
    // ...
}
```

### 注释规范

#### 类注释

```java
/**
 * 儿童用户业务服务实现
 * 
 * 提供儿童用户的登录、注册、疲劳点管理等功能
 * 
 * @author KidsGame
 * @since 1.0.0
 */
@Service
public class KidServiceImpl implements KidService {
    // ...
}
```

#### 方法注释

```java
/**
 * 验证登录参数
 * 
 * 检查手机号和密码的有效性，包括非空校验和格式校验
 * 
 * @param dto 登录请求对象
 * @throws BusinessException 参数校验失败时抛出
 */
private void validateLoginParams(ParentLoginDTO dto) {
    // ...
}
```

---

## 开发流程

### 1. 分支管理

```bash
# 主分支
main          # 生产环境
develop       # 开发分支

# 功能分支
feature/user-login     # 用户登录功能
feature/game-module    # 游戏模块

# 修复分支
fix/login-bug          # 修复登录 bug
```

### 2. Git 提交规范

```bash
# 格式：<type>(<scope>): <subject>

# 新功能
feat(login): 添加用户登录功能

# Bug 修复
fix(service): 修复登录验证逻辑

# 文档更新
docs(readme): 更新快速开始指南

# 重构
refactor(service): 提取登录验证方法

# 样式调整
style(format): 代码格式化

# 性能优化
perf(cache): 优化缓存策略
```

### 3. 开发步骤

```bash
# 1. 从 develop 创建功能分支
git checkout develop
git checkout -b feature/new-feature

# 2. 开发和提交
git add .
git commit -m "feat(module): 添加新功能"

# 3. 推送到远程
git push origin feature/new-feature

# 4. 创建 Pull Request
# 在 GitHub/GitLab 上创建 PR，请求合并到 develop

# 5. Code Review
# 等待团队成员审查代码

# 6. 合并分支
# Review 通过后合并到 develop
```

---

## 调试技巧

### 后端调试

#### 1. 日志查看

```bash
# 实时查看日志
tail -f kids-game-backend/logs/application.log

# 搜索错误日志
grep "ERROR" kids-game-backend/logs/application.log
```

#### 2. 远程调试

在 IDEA 中配置远程调试:
1. Run -> Edit Configurations
2. 添加 Remote JVM Debug
3. Host: localhost, Port: 5005
4. 启动后端时添加参数：
   ```bash
   -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
   ```

#### 3. 断点调试

在关键位置设置断点:
- Controller 入口
- Service 业务逻辑
- Mapper 数据库操作

### 前端调试

#### 1. 浏览器开发工具

```javascript
// Chrome DevTools (F12)
// Console 面板
console.log('调试信息');
console.error('错误信息');
console.warn('警告信息');

// Sources 面板设置断点
// Network 面板查看请求
```

#### 2. Vue DevTools

安装 Vue Devtools 扩展:
- 查看组件树
- 检查响应式数据
- 追踪事件

#### 3. 网络请求调试

```typescript
// 在 API 服务中添加日志
async function loadData() {
  console.log('开始加载数据...');
  try {
    const response = await fetch('/api/data');
    console.log('响应:', response);
    const data = await response.json();
    console.log('数据:', data);
    return data;
  } catch (error) {
    console.error('加载失败:', error);
    throw error;
  }
}
```

---

## 测试指南

### 单元测试

#### Java 单元测试

```java
@SpringBootTest
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Test
    void testRegister_Success() {
        // 准备数据
        KidRegisterDTO dto = new KidRegisterDTO();
        dto.setUsername("test_kid");
        dto.setPassword("123456");
        
        // 执行测试
        Kid kid = userService.register(dto);
        
        // 验证结果
        assertNotNull(kid);
        assertEquals("test_kid", kid.getUsername());
    }
}
```

#### TypeScript 单元测试

```typescript
import { describe, it, expect } from 'vitest';
import { kidApi } from '@/services/kid-api.service';

describe('KidApiService', () => {
  it('should login successfully', async () => {
    const result = await kidApi.login('kid1', '123456');
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
```

### 集成测试

#### API 接口测试

```bash
# 使用 curl 测试
curl -X POST http://localhost:8080/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用 Postman 测试
# 导入 Postman 集合（如果有）
```

---

## 最佳实践

### 1. 数据库操作

```java
// ✅ 使用事务保证一致性
@Transactional(rollbackFor = Exception.class)
public void register(KidRegisterDTO dto) {
    // 创建儿童账号
    Kid kid = createKid(dto);
    
    // 绑定家长关系
    bindParentRelation(kid.getId(), dto.getParentId());
    
    // 创建默认管控规则
    createDefaultLimit(kid.getId());
}
```

### 2. 异常处理

```java
// ✅ 统一异常处理
try {
    userService.register(dto);
} catch (BusinessException e) {
    log.error("注册失败：{}", e.getMessage(), e);
    throw e;
} catch (Exception e) {
    log.error("系统异常：{}", e.getMessage(), e);
    throw new BusinessException(ErrorCode.SYSTEM_ERROR);
}
```

### 3. 缓存使用

```java
// ✅ 使用 Redis 缓存热点数据
@Cacheable(value = "user", key = "#userId")
public User getUserById(Long userId) {
    return userMapper.selectById(userId);
}

// ✅ 更新时清除缓存
@CacheEvict(value = "user", key = "#user.userId")
public void updateUser(User user) {
    userMapper.updateById(user);
}
```

### 4. 安全性

```java
// ✅ 密码加密存储
String hashedPassword = BCrypt.hashpw(password);

// ✅ SQL 注入防护（使用 MyBatis-Plus）
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.eq("username", username);  // 自动参数化

// ✅ XSS 防护
@JsonSerialize(using = XssSerializer.class)
private String content;
```

---

## 相关文档

- [API 参考](../02-api-reference/) - 详细接口文档
- [编码规范](./CODING_STANDARDS.md) - 完整编码规范
- [架构设计](../04-architecture/) - 系统架构说明

---

**最后更新**: 2026-03-09  
**版本**: v1.0.0
