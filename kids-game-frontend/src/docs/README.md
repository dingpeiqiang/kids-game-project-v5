# 项目手册

欢迎使用 Kids Game Project 项目手册！

## 📖 目录导航

### 快速开始
- [环境要求](./01-quick-start/index.md#环境要求)
- [一键启动](./01-quick-start/index.md#一键启动)
- [访问地址](./01-quick-start/index.md#访问地址)
- [默认账号](./01-quick-start/index.md#默认账号)

### API 参考
- [用户管理](./02-api-reference/index.md#用户管理模块)
- [游戏管理](./02-api-reference/index.md#游戏管理)
- [答题系统](./02-api-reference/index.md#答题系统)
- [管理后台](./02-api-reference/index.md#管理后台)
- [错误码说明](./02-api-reference/index.md#错误码说明)

### 开发指南
- [环境配置](./03-development/index.md#环境配置)
- [项目结构](./03-development/index.md#项目结构)
- [编码规范](./03-development/index.md#编码规范)
- [开发流程](./03-development/index.md#开发流程)
- [调试技巧](./03-development/index.md#调试技巧)
- [测试指南](./03-development/index.md#测试指南)

### 架构设计
- [系统概述](./04-architecture/index.md#系统概述)
- [技术架构](./04-architecture/index.md#技术架构)
- [核心模块](./04-architecture/index.md#核心模块)
- [数据模型](./04-architecture/index.md#数据模型)
- [安全设计](./04-architecture/index.md#安全设计)
- [性能优化](./04-architecture/index.md#性能优化)

---

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- Java 17
- MySQL 8.0+
- Redis

### 一键启动
```bash
# Windows
start-all.bat
```

### 访问地址
- 前端首页：http://localhost:5173
- 管理后台：http://localhost:5173/admin/dashboard
- API 文档：http://localhost:8080/doc.html

---

## 🎮 项目介绍

Kids Game Project 是一个面向儿童的在线游戏平台，包含完整的用户管理系统、游戏库、家长管控、疲劳度管理等核心功能。

### 核心功能
- ✅ 儿童用户系统 - 支持注册、登录、疲劳点管理
- ✅ 家长管理中心 - 游戏时长限制、屏蔽游戏、答题记录查看
- ✅ 在线答题游戏 - 数学、语文、英语等多科目
- ✅ 积分排行榜 - 激励儿童学习
- ✅ 疲劳度保护 - 防止过度游戏
- ✅ 管理员运营后台 - 用户管理、游戏管理、数据统计

### 用户类型
- **儿童用户**: 可以玩游戏、答题
- **家长用户**: 可以管理子女的游戏权限
- **管理员**: 系统运营管理

---

## 💻 技术栈

### 前端
- Vue 3 + TypeScript
- Vite 构建工具
- Tailwind CSS 样式
- Pinia 状态管理
- Vue Router 路由

### 后端
- Spring Boot 3.x
- MyBatis Plus ORM
- MySQL 数据库
- Redis 缓存
- Knife4j API 文档
- JWT 认证

### 游戏引擎
- Phaser 3.80
- TypeScript

---

## 📚 开发指南

### 代码规范
请参考 [编码规范](./03-development/index.md#编码规范)

### 开发流程
参考 [开发流程](./03-development/index.md#开发流程) 了解 Git 分支管理和提交规范

### 调试技巧
查看 [调试技巧](./03-development/index.md#调试技巧) 学习如何快速定位问题

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/example/kids-game-project)
- [项目 Wiki](https://github.com/example/kids-game-project/wiki)
- [问题反馈](https://github.com/example/kids-game-project/issues)

---

**最后更新**: 2026-03-09  
**版本**: v1.0.0
