# 签到功能实现说明

## 概述

simple-game 游戏的签到功能现在已经完全实现，并且能够同步到后端数据库。用户在首页点击签到按钮后，签到数据会同时保存到本地 localStorage 和后端数据库中。

## 功能特性

1. **每日签到奖励**：用户每天可以签到一次，获得金币和经验值奖励
2. **连续签到奖励**：连续签到天数越多，奖励越丰厚
3. **数据同步**：签到数据同步到后端数据库，支持多设备同步
4. **降级策略**：当后端不可用时，自动降级到本地模式，保证用户体验

## 技术实现

### 后端实现

#### 1. 数据库表结构

创建了 `t_user_sign_in` 表用于存储用户签到记录：

```sql
CREATE TABLE IF NOT EXISTS `t_user_sign_in` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `sign_in_date` varchar(10) NOT NULL COMMENT '签到日期 (格式: yyyy-MM-dd)',
  `consecutive_days` int(11) NOT NULL DEFAULT '1' COMMENT '连续签到天数',
  `coins_reward` int(11) NOT NULL DEFAULT '50' COMMENT '获得的金币奖励',
  `exp_reward` int(11) NOT NULL DEFAULT '0' COMMENT '获得经验值奖励',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `sign_in_date`) COMMENT '用户日期唯一索引',
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_sign_in_date` (`sign_in_date`) COMMENT '签到日期索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户签到记录表';
```

#### 2. 后端 API 接口

实现了三个签到相关的 API 接口：

- `POST /api/signin/collect` - 用户签到领奖
- `GET /api/signin/info` - 获取用户签到信息
- `GET /api/signin/today` - 检查用户今天是否已签到

#### 3. 奖励规则

- **基础奖励**：每天签到获得 50 金币
- **连续奖励**：连续签到第 N 天额外获得 (N-1) * 10 金币（最多奖励 7 天）
- **经验奖励**：连续签到 3 天及以上额外获得 20 经验值

示例：
- 第 1 天：50 金币
- 第 2 天：60 金币
- 第 3 天：70 金币 + 20 经验
- 第 7 天：110 金币 + 20 经验

### 前端实现

#### 1. API 客户端

在 `apiClient.ts` 中添加了三个签到相关的 API 调用函数：

```typescript
export async function apiCollectDailyReward(): Promise<{ ok: boolean; data?: SignInResponseData; msg?: string }>
export async function apiGetSignInInfo(): Promise<{ ok: boolean; data?: SignInInfoData; msg?: string }>
export async function apiHasSignedInToday(): Promise<{ ok: boolean; data?: boolean; msg?: string }>
```

#### 2. 用户服务

修改了 `userService.ts` 中的 `collectDailyReward()` 方法，使其支持异步调用并与后端同步：

- 优先尝试同步到后端
- 如果后端失败，自动降级到本地模式
- 保持与原有逻辑的兼容性

#### 3. UI 更新

修改了 `userUI.ts` 中的签到按钮事件处理，支持异步调用。

## 使用方法

### 1. 部署数据库表

执行 SQL 脚本创建签到表：

```bash
mysql -u root -p kids_game < docker/mysql/create_sign_in_table.sql
```

### 2. 重启后端服务

重新编译并启动后端服务，使新的控制器和服务生效。

### 3. 测试签到功能

1. 登录 simple-game 游戏
2. 点击右上角用户头像打开"我的"页面
3. 在"每日签到"区域点击"🎁 签到领奖"按钮
4. 查看签到奖励和连续签到天数

## 注意事项

1. **游客模式**：游客用户只能使用本地签到功能，数据不会同步到后端
2. **网络问题**：当后端不可用时，系统会自动降级到本地模式，不影响用户使用
3. **数据一致性**：登录后，系统会优先使用后端数据，确保多设备间的数据一致性
4. **连续签到计算**：连续签到天数基于后端数据库记录计算，如果昨天没有签到，今天会从第 1 天重新开始

## 未来优化建议

1. 添加签到日历视图，让用户更直观地看到签到历史
2. 实现周签到奖励和月签到奖励
3. 添加签到提醒功能
4. 实现签到排行榜，激励用户持续签到
5. 添加特殊日期的额外奖励（如节假日双倍奖励）

## 相关文件

### 后端文件
- `kids-game-backend/kids-game-dao/src/main/java/com/kidgame/dao/entity/UserSignIn.java` - 签到实体类
- `kids-game-backend/kids-game-dao/src/main/java/com/kidgame/dao/mapper/UserSignInMapper.java` - 签到 Mapper
- `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/UserSignInService.java` - 签到服务接口
- `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/impl/UserSignInServiceImpl.java` - 签到服务实现
- `kids-game-backend/kids-game-web/src/main/java/com/kidgame/web/controller/UserSignInController.java` - 签到控制器
- `docker/mysql/create_sign_in_table.sql` - 数据库建表脚本

### 前端文件
- `kids-game-house/games/simple-game/src/services/apiClient.ts` - API 客户端
- `kids-game-house/games/simple-game/src/services/userService.ts` - 用户服务
- `kids-game-house/games/simple-game/src/services/userUI.ts` - 用户界面