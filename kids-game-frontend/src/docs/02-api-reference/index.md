# API 文档

本项目提供完整的 RESTful API 接口，用于用户管理、游戏管理、答题系统等功能。

## 基本信息

- **Base URL**: `http://localhost:8080/api`
- **认证方式**: JWT Token (Header: `Authorization: Bearer {token}`)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 目录

1. [用户管理模块](#用户管理模块)
2. [用户关系管理](#用户关系管理)
3. [游戏权限管理](#游戏权限管理)
4. [用户管控配置](#用户管控配置)
5. [游戏管理](#游戏管理)
6. [答题系统](#答题系统)
7. [管理后台](#管理后台)

---

## 用户管理模块

### 1.1 用户注册

**接口**: `POST /api/user/register`

**描述**: 注册新用户（儿童、家长或管理员）

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "nickname": "string",
  "userType": "string",  // KID/PARENT/ADMIN
  "email": "string",
  "phoneNumber": "string",
  "avatarUrl": "string",
  "extInfoJson": "string"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "username": "test_kid",
    "nickname": "测试儿童",
    "userType": "KID",
    "status": "ACTIVE"
  }
}
```

### 1.2 用户登录

**接口**: `POST /api/user/login`

**描述**: 用户登录获取 Token

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "userType": "string"  // 可选
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "username": "test_kid",
    "userType": "KID",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 获取用户信息

**接口**: `GET /api/user/{userId}`

**路径参数**:
- `userId`: 用户ID

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "username": "test_kid",
    "nickname": "测试儿童",
    "avatarUrl": "http://example.com/avatar.jpg",
    "userType": "KID"
  }
}
```

### 1.4 修改密码

**接口**: `PUT /api/user/password`

**请求参数**:
- `userId`: 用户ID
- `oldPassword`: 旧密码
- `newPassword`: 新密码

---

## 用户关系管理

### 2.1 绑定监护人与儿童

**接口**: `POST /api/user-relation/bind`

**描述**: 创建监护人与儿童的绑定关系

**请求参数**:
- `guardianUserId`: 监护人 ID
- `kidUserId`: 儿童 ID
- `relationType`: 关系类型 (FATHER/MOTHER/GUARDIAN)
- `isPrimary`: 是否为主监护人 (默认false)
- `permissionLevel`: 权限级别 (FULL/PARTIAL/VIEW_ONLY)

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "relationId": 1,
    "guardianUserId": 100,
    "kidUserId": 200,
    "relationType": "FATHER",
    "isPrimary": true
  }
}
```

### 2.2 获取监护人的所有儿童

**接口**: `GET /api/user-relation/guardian/{guardianUserId}/kids`

**路径参数**:
- `guardianUserId`: 监护人 ID

### 2.3 获取儿童的所有监护人

**接口**: `GET /api/user-relation/kid/{kidUserId}/guardians`

**路径参数**:
- `kidUserId`: 儿童 ID

---

## 游戏权限管理

### 3.1 设置游戏权限

**接口**: `POST /api/game-permission/set`

**描述**: 设置儿童对游戏的权限

**请求参数**:
```json
{
  "userId": 200,
  "gameId": 10,
  "permissionType": "LIMIT_TIME",  // ALLOW/BLOCK/LIMIT_TIME/LIMIT_COUNT
  "timeLimitMinutes": 30,
  "countLimit": 5,
  "remark": "限制每日 30 分钟"
}
```

**权限类型说明**:
- `ALLOW`: 允许玩
- `BLOCK`: 屏蔽
- `LIMIT_TIME`: 限制时长（分钟）
- `LIMIT_COUNT`: 限制次数

### 3.2 批量设置游戏权限

**接口**: `POST /api/game-permission/batch`

**请求参数**:
```json
[
  {
    "userId": 200,
    "gameId": 10,
    "permissionType": "ALLOW"
  },
  {
    "userId": 200,
    "gameId": 11,
    "permissionType": "BLOCK"
  }
]
```

### 3.3 检查是否允许启动游戏

**接口**: `GET /api/game-permission/check-start`

**查询参数**:
- `userId`: 用户ID
- `gameId`: 游戏 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

---

## 用户管控配置

### 4.1 创建或更新管控配置

**接口**: `POST /api/user-control-config/save`

**请求参数**:
```json
{
  "userId": 200,
  "dailyTimeLimitMinutes": 120,
  "fatiguePointMinutes": 60,
  "restDurationMinutes": 10,
  "fatigueControlMode": "SOFT",  // SOFT/HARD/OFF
  "allowedStartTime": "08:00:00",
  "allowedEndTime": "20:00:00"
}
```

### 4.2 获取用户管控配置

**接口**: `GET /api/user-control-config/user/{userId}`

### 4.3 检查是否触发疲劳点

**接口**: `GET /api/user-control-config/check-fatigue`

**查询参数**:
- `userId`: 用户ID
- `playedMinutes`: 已玩游戏时长

---

## 游戏管理

### 5.1 获取游戏列表

**接口**: `GET /api/game/list`

**查询参数**:
- `category`: 分类（可选）
- `grade`: 年级（可选）
- `page`: 页码（默认 1）
- `size`: 每页数量（默认 10）

### 5.2 获取游戏详情

**接口**: `GET /api/game/{gameId}`

### 5.3 开始游戏

**接口**: `POST /api/game/start`

**请求参数**:
- `userId`: 用户ID
- `gameId`: 游戏 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sessionId": 1001,
    "startTime": 1710000000000,
    "consumePoints": 1
  }
}
```

### 5.4 结束游戏

**接口**: `POST /api/game/end`

**请求参数**:
- `sessionId`: 会话 ID
- `score`: 得分（可选）

### 5.5 游戏心跳

**接口**: `POST /api/game/heartbeat`

**请求参数**:
- `sessionId`: 会话 ID

---

## 答题系统

### 6.1 获取随机题目

**接口**: `GET /api/question/random`

**查询参数**:
- `subject`: 科目（MATH/CHINESE/ENGLISH）
- `difficulty`: 难度（EASY/NORMAL/HARD）
- `limit`: 题目数量（默认 10）

### 6.2 提交答案

**接口**: `POST /api/question/submit`

**请求参数**:
```json
{
  "questionId": 1,
  "answer": "A",
  "userId": 200
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "correct": true,
    "pointsEarned": 2
  }
}
```

### 6.3 获取答题记录

**接口**: `GET /api/question/records`

**查询参数**:
- `userId`: 用户ID
- `page`: 页码
- `size`: 每页数量

---

## 管理后台

### 7.1 获取仪表盘数据

**接口**: `GET /api/admin/dashboard/overview`

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "totalUsers": 1000,
    "todayActiveUsers": 150,
    "totalGames": 50,
    "todayAnswerCount": 5000
  }
}
```

### 7.2 获取用户列表

**接口**: `GET /api/admin/users`

**查询参数**:
- `userType`: 用户类型（可选）
- `status`: 状态（可选）
- `page`: 页码
- `size`: 每页数量

### 7.3 更新用户状态

**接口**: `PUT /api/admin/users/{userId}/status`

**请求参数**:
- `status`: 新状态 (ACTIVE/BANNED)

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001 | 用户名已存在 |
| 1002 | 用户不存在 |
| 1003 | 密码错误 |
| 1004 | 用户已被禁用 |
| 2001 | 游戏已被屏蔽 |
| 2002 | 超过时间限制 |
| 2003 | 不在允许时间范围内 |
| 2004 | 触发疲劳点 |
| 3001 | 关系已存在 |
| 3002 | 关系不存在 |

---

## Swagger UI

访问 Swagger UI 查看在线 API 文档和测试接口：

**URL**: `http://localhost:8080/swagger-ui.html`

---

**最后更新**: 2026-03-09  
**版本**: v1.0.0
