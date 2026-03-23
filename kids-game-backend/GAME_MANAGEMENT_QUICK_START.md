# 游戏管理功能重构 - 快速开始指南

## 📋 概述

本次重构为游戏管理系统带来了全新的架构，包括：
- ✅ 完整的审核流程（草稿 → 待审核 → 已上架/驳回）
- ✅ 版本管理系统
- ✅ 标签分类体系
- ✅ 统计分析功能
- ✅ 资源管理功能
- ✅ 批量操作支持

## 🚀 快速开始步骤

### 第一步：执行数据库迁移

1. **备份现有数据**
```bash
mysqldump -u your_user -p your_database > backup_$(date +%Y%m%d).sql
```

2. **执行迁移脚本**
```bash
cd kids-game-backend
mysql -u your_user -p your_database < game-management-refactor-migration.sql
```

3. **验证表结构**
```sql
-- 检查新表是否创建成功
SHOW TABLES LIKE 't_game%';

-- 检查标签数据是否初始化
SELECT COUNT(*) FROM t_game_tag;

-- 查看游戏表新字段
DESC t_game;
```

### 第二步：编译后端代码

```bash
cd kids-game-backend
mvn clean compile
```

### 第三步：启动后端服务

```bash
# 方式 1: 使用 Maven
mvn spring-boot:run

# 方式 2: 使用编译脚本
./compile.bat
./start-backend.bat
```

### 第四步：测试 API 接口

#### 4.1 测试健康检查
```bash
curl http://localhost:8080/api/admin/games/list
```

#### 4.2 测试创建游戏
```bash
curl -X POST http://localhost:8080/api/admin/games/create \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "gameCode": "TEST_GAME_001",
    "gameName": "测试游戏",
    "category": "math",
    "grade": "preschool",
    "description": "这是一个测试游戏",
    "consumePointsPerMinute": 1,
    "status": 0
  }'
```

#### 4.3 测试获取游戏列表
```bash
curl "http://localhost:8080/api/admin/games/list?page=1&size=10"
```

#### 4.4 测试提交审核
```bash
curl -X POST http://localhost:8080/api/admin/games/1/submit-review \
  -H "X-User-Id: 1"
```

#### 4.5 测试审核游戏
```bash
curl -X POST http://localhost:8080/api/admin/games/1/review \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "reviewStatus": 1,
    "reviewComment": "审核通过，游戏质量良好"
  }'
```

#### 4.6 测试上架游戏
```bash
curl -X POST "http://localhost:8080/api/admin/games/1/publish?version=1.0.0" \
  -H "X-User-Id: 1"
```

## 📖 API 接口文档

### 基础 URL
```
http://localhost:8080/api/admin/games
```

### 主要接口列表

#### 1. 游戏 CRUD
- `GET /list` - 获取游戏列表（分页）
- `GET /{gameId}` - 获取游戏详情
- `POST /create` - 创建游戏
- `PUT /{gameId}` - 更新游戏
- `DELETE /{gameId}` - 删除游戏

#### 2. 上下架管理
- `POST /{gameId}/publish` - 上架游戏
- `POST /{gameId}/unpublish` - 下架游戏

#### 3. 审核管理
- `POST /{gameId}/submit-review` - 提交审核
- `POST /{gameId}/review` - 审核游戏
- `GET /pending-review` - 获取待审核游戏列表

#### 4. 版本管理
- `POST /{gameId}/versions` - 发布新版本
- `GET /{gameId}/versions` - 获取版本历史
- `POST /{gameId}/versions/{versionId}/rollback` - 回滚版本

#### 5. 标签管理
- `POST /{gameId}/tags` - 添加标签
- `DELETE /{gameId}/tags/{tagId}` - 移除标签
- `GET /{gameId}/tags` - 获取游戏标签列表

#### 6. 资源管理
- `POST /{gameId}/resources` - 上传资源
- `GET /{gameId}/resources` - 获取资源列表
- `DELETE /{gameId}/resources/{resourceKey}` - 删除资源

#### 7. 批量操作
- `POST /batch-publish` - 批量上架
- `POST /batch-unpublish` - 批量下架
- `DELETE /batch-delete` - 批量删除

#### 8. 数据统计
- `GET /{gameId}/statistics` - 获取详细统计
- `GET /{gameId}/trends` - 获取趋势数据
- `POST /{gameId}/export` - 导出游戏数据

## 🔧 常见问题排查

### 问题 1: 编译错误 - 找不到 Result 类
**解决方案**: 确保导入正确的包路径
```java
import com.kidgame.common.model.Result;
```

### 问题 2: 数据库表不存在
**解决方案**: 重新执行 SQL 迁移脚本
```bash
mysql -u your_user -p your_database < game-management-refactor-migration.sql
```

### 问题 3: Mapper 注入失败
**解决方案**: 检查 Mapper 接口是否添加了 `@Mapper` 注解

### 问题 4: Service 方法返回空数据
**解决方案**: 检查 Service 实现类中的 TODO 方法，需要逐步完善

## 📝 下一步工作

### 立即可做
1. ✅ 运行数据库迁移脚本
2. ✅ 编译并启动后端服务
3. ✅ 测试基础 CRUD 接口
4. ✅ 测试审核流程

### 后续完善
1. [ ] 完善 Service 层的 TODO 方法实现
2. [ ] 创建剩余的 Mapper（版本、审核、统计、资源相关）
3. [ ] 开发前端页面
4. [ ] 编写单元测试
5. [ ] 性能优化

## 🎯 核心特性说明

### 1. 审核流程
```
草稿 (0) 
  ↓
提交审核 → 待审核 (1)
  ↓
审核通过 (2) → 上架销售
  ↓
审核驳回 (4) → 修改后重新提交
```

### 2. 游戏状态
- `0` - 草稿
- `1` - 待审核
- `2` - 已上架（可售）
- `3` - 已下架
- `4` - 审核驳回

### 3. 标签系统
支持多级分类：
- **科目类**: math, chinese, english, science
- **技能类**: memory, logic, creativity, reaction
- **模式类**: single_player, multi_player, offline, online

### 4. 版本管理
每次上架必须指定版本号（如：1.0.0, 1.1.0），系统自动记录版本历史，支持一键回滚。

## 📞 技术支持

如有问题，请查看：
1. 后端日志：`kids-game-backend/logs/`
2. API 文档：`http://localhost:8080/doc.html`
3. 数据库表结构：`game-management-refactor-migration.sql`

---

**最后更新时间**: 2026-03-23  
**版本**: v2.0.0
