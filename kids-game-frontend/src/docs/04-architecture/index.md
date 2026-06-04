# 架构设计

## 系统概述

Kids Game Project 是一个前后端分离的儿童游戏平台，采用经典的三层架构设计。

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────┐
│                  用户层                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ 儿童端  │  │ 家长端  │  │ 管理员端│         │
│  └─────────┘  └─────────┘  └─────────┘         │
└─────────────────────────────────────────────────┘
                    ↓ HTTPS
┌─────────────────────────────────────────────────┐
│                  前端层                          │
│  ┌─────────────────────────────────────────┐    │
│  │  Vue 3 + TypeScript + Vite              │    │
│  │  - 组件化开发                            │    │
│  │  - Pinia 状态管理                        │    │
│  │  - Vue Router 路由                       │    │
│  │  - Tailwind CSS 样式                     │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                    ↓ HTTP/REST API
┌─────────────────────────────────────────────────┐
│                  后端层                          │
│  ┌─────────────────────────────────────────┐    │
│  │  Spring Boot 3.x                        │    │
│  │  ├─ Controller 层 (Web 层)              │    │
│  │  ├─ Service 层 (业务逻辑)               │    │
│  │  ├─ Dao 层 (数据访问)                   │    │
│  │  └─ Common 层 (公共模块)                │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│                  数据层                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  MySQL   │  │  Redis   │  │  文件存储 │     │
│  │  主数据库 │  │  缓存    │  │  静态资源 │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
```

## 核心模块

### 用户系统

```
用户类型（t_user）
├─ 儿童用户 (KID, userType=0)
│  ├─ 疲劳点管理
│  ├─ 游戏权限
│  └─ 答题记录
├─ 家长用户 (PARENT, userType=1)
│  ├─ 子女绑定
│  ├─ 管控配置
│  └─ 监护权限
└─ 管理员用户 (ADMIN, userType=2)
   ├─ 用户管理
   ├─ 游戏管理
   └─ 系统运营
```

### 游戏系统

```
游戏管理
├─ 游戏库 (t_game)
│  ├─ 基本信息
│  ├─ 分类标签
│  └─ 年级标识
├─ 游戏权限 (t_game_permission)
│  ├─ 允许/屏蔽
│  ├─ 限时/限次
│  └─ 权限参数
└─ 游戏会话 (t_game_session)
   ├─ 开始时间
   ├─ 结束时间
   └─ 消耗疲劳点
```

### 疲劳度系统

```
疲劳值管理
├─ 疲劳点数 (fatigue_points)
│  ├─ 初始值：10
│  ├─ 范围：0-100
│  └─ 每日重置
├─ 消耗规则
│  ├─ 启动游戏：-1 点
│  └─ 不足时无法游戏
└─ 获取方式
   ├─ 答题奖励：+2 点/题
   └─ 每日上限控制
```

### 管控系统

```
家长管控
├─ 全局管控 (t_parent_limit)
│  ├─ 每日总时长
│  ├─ 单次时长
│  ├─ 允许时间段
│  └─ 疲劳点开关
├─ 游戏权限 (t_game_permission)
│  ├─ 屏蔽游戏
│  ├─ 限时游戏
│  └─ 限次游戏
└─ 用户关系 (t_user_relation)
   ├─ 监护人绑定
   ├─ 权限级别
   └─ 主监护人标识
```

## 数据模型

### 核心表结构

#### t_user (用户表)
```sql
CREATE TABLE t_user (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(255),  -- BCrypt 加密
    nickname VARCHAR(50),
    user_type TINYINT,      -- 0-KID, 1-PARENT, 2-ADMIN
    fatigue_points INT,     -- 疲劳点数
    status TINYINT,         -- 1-ACTIVE, 0-BANNED
    create_time BIGINT
);
```

#### t_game (游戏表)
```sql
CREATE TABLE t_game (
    game_id BIGINT PRIMARY KEY,
    game_name VARCHAR(100),
    category VARCHAR(50),   -- MATH/CHINESE/ENGLISH
    grade VARCHAR(20),      -- GRADE_1, GRADE_2...
    status TINYINT,         -- 1-ENABLED, 0-DISABLED
    play_count INT,
    create_time BIGINT
);
```

#### t_game_permission (游戏权限表)
```sql
CREATE TABLE t_game_permission (
    permission_id BIGINT PRIMARY KEY,
    user_id BIGINT,
    user_type TINYINT,
    game_id BIGINT,
    permission_type VARCHAR(20),  -- ALLOW/BLOCK/LIMIT_TIME/LIMIT_COUNT
    time_limit_minutes INT,
    count_limit INT,
    create_time BIGINT
);
```

#### t_parent_limit (家长管控表)
```sql
CREATE TABLE t_parent_limit (
    limit_id BIGINT PRIMARY KEY,
    kid_id BIGINT,
    parent_id BIGINT,
    daily_duration INT,       -- 每日总时长（分钟）
    single_duration INT,      -- 单次时长（分钟）
    start_time VARCHAR(8),    -- HH:mm:ss
    end_time VARCHAR(8),      -- HH:mm:ss
    enable_fatigue TINYINT,   -- 是否启用疲劳点
    blocked_games TEXT        -- 屏蔽的游戏 ID 列表（JSON）
);
```

## 接口设计

### RESTful API 规范

```
GET    /api/resource          # 获取资源列表
GET    /api/resource/{id}     # 获取单个资源
POST   /api/resource          # 创建资源
PUT    /api/resource/{id}     # 更新资源
DELETE /api/resource/{id}     # 删除资源
```

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 错误处理

```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

## 安全设计

### 认证机制

1. **JWT Token**
   - 登录成功后颁发 Token
   - Token 有效期 7 天
   - 支持刷新 Token

2. **密码加密**
   - 使用 BCrypt 加密
   - 随机盐值
   - 强度可配置

### 权限控制

1. **角色权限**
   - 儿童：游戏、答题
   - 家长：管控、查看
   - 管理员：运营管理

2. **接口鉴权**
   - JWT 拦截器验证 Token
   - 注解式权限控制
   - 细粒度到方法级别

### 数据安全

1. **SQL 注入防护**
   - MyBatis-Plus 参数化查询
   - 禁止动态 SQL 拼接

2. **XSS 防护**
   - 输入过滤
   - 输出编码
   - 内容安全策略

3. **CSRF 防护**
   - Token 验证
   - SameSite Cookie

## 性能优化

### 缓存策略

1. **Redis 缓存**
   - 用户信息缓存
   - 疲劳点缓存
   - Session 缓存

2. **缓存过期**
   - 热点数据：5 分钟
   - 一般数据：30 分钟
   - 静态数据：1 小时

### 数据库优化

1. **索引设计**
   - 主键索引
   - 唯一索引
   - 复合索引

2. **查询优化**
   - 避免 N+1 查询
   - 使用连接池
   - 分页查询

### 前端优化

1. **懒加载**
   - 路由懒加载
   - 组件懒加载
   - 图片懒加载

2. **代码分割**
   - 按模块拆分
   - 按需加载
   - Tree Shaking

## 部署架构

### 开发环境

```
本地开发
├─ 前端：http://localhost:5173
├─ 后端：http://localhost:8080
└─ 数据库：localhost:3306
```

### 生产环境（推荐）

```
生产环境
├─ Nginx 反向代理
│  ├─ 前端静态资源
│  └─ 后端 API 转发
├─ 应用服务器
│  └─ Spring Boot (Jar)
├─ 数据库集群
│  ├─ MySQL 主从复制
│  └─ Redis 哨兵模式
└─ 监控系统
   ├─ 日志收集
   └─ 性能监控
```

## 监控与日志

### 日志系统

1. **日志级别**
   - ERROR: 错误
   - WARN: 警告
   - INFO: 信息
   - DEBUG: 调试

2. **日志文件**
   - application.log
   - error.log
   - access.log

### 监控指标

1. **系统指标**
   - CPU 使用率
   - 内存使用率
   - 磁盘空间

2. **应用指标**
   - QPS (每秒请求数)
   - 响应时间
   - 错误率

3. **业务指标**
   - 活跃用户数
   - 游戏启动次数
   - 答题数量

---

**最后更新**: 2026-03-09  
**版本**: v1.0.0
