# 📊 数据库现状分析总结 (2026-03-23)

## 🎯 一分钟速览

### 当前问题
1. **用户表双轨制**: t_kid(319 条) + t_parent(214 条) ↔ t_user(109 条) ⚠️
2. **废弃表未清理**: t_game_lock, t_parent_limit, t_leaderboard_dimension 
3. **Schema 缺失严重**: 缺少 9 个重要表和视图/存储过程
4. **标准不统一**: 时间字段混用 (BIGINT vs DATETIME), 字符集不统一

### 立即行动项
- ✅ 已创建：`schema_v2_add_missing_tables.sql` - 补充缺失的表
- 📋 待执行：数据迁移脚本 (需 1-2 周)
- 🔧 待更新：Java Entity 类适配新结构

---

## 📈 数据库规模统计

| 类别 | 数量 | 说明 |
|------|------|------|
| **业务表** | 38 个 | 实际使用的表 |
| **备份表** | 3 个 | theme_info_backup_20250318, t_game_permission_backup_20240308 |
| **视图** | 1 个 | v_draft_statistics (草稿统计) |
| **存储过程** | 1 个 | sp_cleanup_expired_drafts (清理过期草稿) |
| **触发器** | 1 个 | tr_draft_update_version (自动版本管理) |
| **外键约束** | 5 个 | theme_assets, draft_category_relation 等 |

### 数据量 TOP10
```
t_question:          862 条 (题目)
t_game_session:      711 条 (游戏会话)
t_fatigue_points_log: 659 条 (疲劳点日志)
t_game:              667 条 (游戏)
t_answer_record:     12 条 (答题记录)
t_parent_limit:      318 条 (旧管控配置) ⚠️
t_kid:               319 条 (旧儿童表) ⚠️
t_parent:            214 条 (旧家长表) ⚠️
t_user:              109 条 (新统一用户) ✅
t_daily_stats:       115 条 (每日统计)
```

---

## 🏗️ 模块划分与关系

### 1. 用户体系 (User System)
```
┌─────────────────────────────────────┐
│  t_user (统一用户表) ✅             │
│  - user_id (PK)                     │
│  - user_type (0-儿童，1-家长，2-管理员)│
│  - fatigue_points (疲劳点)          │
│  └── 109 条记录                      │
└─────────────────────────────────────┘
           ↑ ↑ ↑
迁移中...  │ │ │
           │ │ │
┌──────────┘ │ └──────────────┐
│            │                │
▼            ▼                ▼
t_kid      t_parent      t_user_profile
(319 条)⚠️  (214 条)⚠️    (22 条)✅
```

**关键表**:
- `t_user` ✅ - 统一用户表 (包含疲劳点字段)
- `t_user_profile` ✅ - 用户扩展信息 (JSON 存储)
- `t_user_relation` ✅ - 用户关系 (支持多监护人)
- `t_kid` ⚠️ - 旧儿童表 (需迁移)
- `t_parent` ⚠️ - 旧家长表 (需迁移)

---

### 2. 游戏管理 (Game Management)
```
t_game (667 条)
├── t_game_config (58 条) - 游戏配置
├── t_game_mode_config (19 条) - 游戏模式
├── t_game_session (711 条) - 游戏会话
│   └── t_game_record (61 条) - 游戏记录
├── t_game_tag (9 条) - 游戏标签
│   └── t_game_tag_relation (38 条) - 标签关联
├── t_blocked_game (2 条) - 屏蔽游戏 ✅
└── t_game_lock (0 条) - 游戏锁定 ⚠️ 废弃
    └── t_game_permission (20 条) - 细粒度权限
```

**关键字段**:
```sql
t_game:
- game_url VARCHAR(500)    -- 独立部署地址
- game_secret VARCHAR(100) -- 游戏密钥
- game_config JSON         -- 游戏配置
- session_token            -- 会话令牌 (t_game_session)
```

---

### 3. 主题系统 (Theme System) ✅
```
theme_info (20 条)
├── theme_game_relation (22 条) - 主题游戏关联
├── theme_assets - 主题资源文件 (带 FK)
├── theme_purchase (16 条) - 购买记录
├── creator_earnings - 创作者收益
└── user_theme_preference (1 条) - 用户偏好
```

**特性**:
- ✅ 支持官方/自制主题
- ✅ 物理外键约束
- ✅ 使用 DATETIME 类型
- ✅ 自动更新时间戳

---

### 4. 草稿系统 (Draft System) ✅
```
draft (5 条)
├── draft_version - 版本历史
├── draft_category (4 条) - 分类
│   └── draft_category_relation - 分类关联
└── v_draft_statistics (视图) - 统计
    
触发器：tr_draft_update_version
存储过程：sp_cleanup_expired_drafts
```

**高级功能**:
- 自动版本管理 (触发器)
- 分类管理 (多级分类)
- 定期清理 (存储过程)
- 统计分析 (视图)

---

### 5. 排行榜 (Leaderboard)
```
t_leaderboard_config (11 条)
└── t_leaderboard_data (0 条)
    
t_leaderboard_dimension (14 条) ⚠️ 废弃
```

**维度类型**:
- SCORE - 分数
- HIGHEST_LEVEL - 最高关卡
- DURATION - 时长
- ACCURACY - 正确率

---

### 6. 管控系统 (Control & Permission)
```
新旧并存:
┌─────────────────────────────────┐
│ t_user_control_config (6 条) ✅ │
│ - 基于 user_id                   │
│ - 支持疲劳控制模式               │
│ - 新增字段:fatigue_control_mode │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ t_parent_limit (318 条) ⚠️     │
│ - 基于 kid_id/parent_id         │
│ - 即将废弃                       │
└─────────────────────────────────┘

其他:
- t_game_permission (细粒度权限)
- t_blocked_game (屏蔽游戏)
- t_fatigue_points_log (659 条日志)
```

---

## 🔴 关键问题详解

### 问题 1: 用户迁移紧迫性

**影响范围**:
- 319 个 Kid 用户
- 214 个 Parent 用户  
- 318 条管控配置
- 大量外键引用

**迁移步骤**:
```sql
1. 备份全库
2. 迁移 Kid → t_user (user_type=0)
3. 迁移 Parent → t_user (user_type=1)
4. 迁移 UserRelation
5. 迁移 UserControlConfig
6. 更新所有外键引用
7. 验证数据完整性
8. 重命名旧表 (观察 30 天)
9. 删除旧表
```

**预计时间**: 1-2 周

---

### 问题 2: Schema 缺失清单

**缺失的表** (9 个):
1. `theme_assets` - 主题资源 (带外键)
2. `t_game_config` - 游戏配置
3. `t_game_mode_config` - 游戏模式
4. `draft_category` - 草稿分类
5. `draft_category_relation` - 分类关联
6. `t_notification` - 通知消息
7. `user_theme_preference` - 用户偏好
8. `v_draft_statistics` - 统计视图
9. `sp_cleanup_expired_drafts` - 存储过程

**解决方案**:
```bash
# 执行补充脚本
mysql -u kidsgame -p kidsgame < schema_v2_add_missing_tables.sql
```

---

### 问题 3: 字段差异对比

| 表名 | 字段 | 实际数据库 | schema_v2.sql | 影响 |
|------|------|-----------|---------------|------|
| t_game | game_url | VARCHAR(500) | VARCHAR(255) | ❌ URL 可能被截断 |
| t_game | game_secret | VARCHAR(100) | VARCHAR(255) | ⚠️ 长度不一致 |
| t_system_config | config_type | ✅ 有 | ❌ 无 | ❌ 代码可能报错 |
| t_system_config | status | ✅ 有 | ❌ 无 | ❌ 无法禁用配置 |
| t_game_session | session_token | ✅ 有 | ❌ 无 | ❌ 会话验证失败 |

---

## 🛠️ 立即可执行的操作

### 操作 1: 补充缺失表 (今天)
```bash
cd kids-game-backend/kids-game-web/src/main/resources
mysql -u kidsgame -p kidsgame < schema_v2_add_missing_tables.sql
```

### 操作 2: 备份当前数据库 (今天)
```bash
mysqldump -u kidsgame -p \
  --single-transaction \
  --quick \
  kidsgame > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 操作 3: 验证数据一致性 (本周)
```sql
-- 检查用户数据一致性
SELECT 
    'Kid' as type,
    COUNT(*) as count,
    MAX(kid_id) as max_id,
    MIN(create_time) as first_create
FROM t_kid WHERE deleted = 0
UNION ALL
SELECT 'Parent', COUNT(*), MAX(parent_id), MIN(create_time) FROM t_parent WHERE deleted = 0
UNION ALL
SELECT 'User', COUNT(*), MAX(user_id), MIN(create_time) FROM t_user WHERE deleted = 0;
```

### 操作 4: 制定迁移计划 (本周)
参考：`DATABASE_GOVERNANCE_PLAN.md`

---

## 📋 文件清单

### 已创建的文档
1. **DATABASE_GOVERNANCE_PLAN.md** - 完整治理方案 (419 行)
2. **DATABASE_SUMMARY_20260323.md** - 本文档
3. **schema_v2_add_missing_tables.sql** - 补充脚本 (223 行)
4. **SCHEMA_V2_UPDATE_SUMMARY.md** - Schema 更新说明
5. **SCHEMA_V2_COMPARISON.md** - Schema 对比文档

### 相关 SQL 文件
- **ss.sql** - 实际数据库导出 (1225 行)
- **schema_v2.sql** - 设计 Schema (已更新为 v2.1)
- **schema_v2.sql.backup** - 原始 v2.0 版本

---

## 🎯 下一步行动

### 今天 (Day 1)
- [ ] 执行 `schema_v2_add_missing_tables.sql`
- [ ] 完整备份数据库
- [ ] 阅读 `DATABASE_GOVERNANCE_PLAN.md`

### 本周 (Week 1)
- [ ] 成立迁移专项小组
- [ ] 制定详细迁移计划
- [ ] 在开发环境测试迁移脚本
- [ ] 准备回滚方案

### 下周 (Week 2-3)
- [ ] 执行数据迁移
- [ ] 功能验证测试
- [ ] 性能测试
- [ ] 上线评审

---

## 📞 支持文档

如需更多信息，请参考:
- `DATABASE_GOVERNANCE_PLAN.md` - 详细治理方案
- `MIGRATION_GUIDE.md` - 迁移指南
- `SCHEMA_V2_COMPARISON.md` - Schema 对比

---

**生成时间**: 2026-03-23  
**数据来源**: ss.sql (1225 行)  
**数据库版本**: MySQL 8.0.45  
**状态**: 分析完成，等待执行
