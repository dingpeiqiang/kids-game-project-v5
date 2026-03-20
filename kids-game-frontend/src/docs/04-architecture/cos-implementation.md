# 腾讯云 COS 云存储实现文档

## 概述

本项目使用腾讯云 COS (Cloud Object Storage) 作为静态资源存储解决方案，支持主题资源、游戏资源的上传和管理。

## 快速配置

### 1. 获取密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/cos)
2. 进入「访问管理」→「访问密钥」
3. 获取 `SecretId` 和 `SecretKey`

### 2. 配置环境变量

```bash
COS_SECRET_ID=你的SecretId
COS_SECRET_KEY=你的SecretKey
COS_BUCKET=kids-game-resources
COS_REGION=ap-guangzhou
```

### 3. 初始化存储桶

1. 在腾讯云控制台创建存储桶
2. 设置为**公有读私有写**
3. 配置 CORS 跨域规则

---

## 核心实现

### 凭证管理

系统采用临时凭证机制，通过后端签发STS临时凭证给前端：

```java
// 凭证有效期配置
- 凭证有效期: 30分钟 ~ 2小时
- 前端直传: 支持最大500MB文件
- 安全策略: 限制上传目录和操作权限
```

### 文件上传流程

```
前端请求凭证 → 后端验证权限 → 签发临时凭证 → 前端直传COS
```

### 目录结构

```
kids-game-resources/
├── themes/              # 主题资源
│   └── {gameId}/
│       └── {themeId}/
├── games/               # 游戏资源
│   └── {gameCode}/
├── avatars/             # 用户头像
└── temp/                # 临时文件
```

---

## 相关文档

- [COS快速开始5分钟](../kids-game-backend/COS_QUICKSTART_5MINUTES.md)
- [COS临时凭证实现](../kids-game-backend/COS_TEMPORARY_CREDENTIAL.md)
- [COS后端实现](../kids-game-backend/COS_BACKEND_IMPLEMENTATION.md)

---

**最后更新**: 2026-03-20
