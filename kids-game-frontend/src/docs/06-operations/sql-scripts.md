# SQL 脚本使用指南

本文档介绍项目中使用的数据库 SQL 脚本及其使用方法。

---

## 📁 SQL 脚本位置

```
kids-game-backend/
├── *.sql                          # 根目录 SQL 脚本
├── kids-game-web/
│   └── src/main/resources/
│       ├── schema.sql            # 数据库建表脚本
│       ├── data.sql              # 初始数据脚本
│       ├── schema_v2.sql         # 数据库升级脚本
│       └── *.sql                 # 其他脚本
└── *.sql                          # 各模块 SQL 脚本
```

---

## 🎯 SQL 脚本分类

### 1. 初始化脚本

| 脚本 | 说明 | 使用场景 |
|------|------|----------|
| `schema.sql` | 数据库表结构 | 新项目初始化 |
| `data.sql` | 初始数据 | 新项目初始化 |

### 2. 主题系统脚本

| 脚本 | 说明 | 使用场景 |
|------|------|----------|
| `init-snake-themes.sql` | 贪吃蛇主题初始化 | 初始化贪吃蛇游戏主题 |
| `init-snake-official-themes.sql` | 贪吃蛇官方主题 | 添加官方主题 |
| `init-pvz-official-themes.sql` | PVZ 官方主题 | 添加 PVZ 官方主题 |
| `theme-system-migration.sql` | 主题系统迁移 | 升级主题系统 |
| `theme-system-migration-v2.sql` | 主题系统迁移 v2 | 主题系统升级 |
| `theme-system-unified-migration.sql` | 统一主题迁移 | 统一主题格式 |

### 3. 游戏配置脚本

| 脚本 | 说明 | 使用场景 |
|------|------|----------|
| `init-snake-shooter.sql` | 贪吃蛇射击游戏 | 初始化游戏数据 |
| `init-real-games.sql` | 真实游戏初始化 | 初始化游戏列表 |
| `init-houses-games.sql` | 内部游戏初始化 | 初始化内部游戏 |

### 4. 数据修复脚本

| 脚本 | 说明 | 使用场景 |
|------|------|----------|
| `fix-theme-resources-local.sql` | 修复主题资源 | 修复主题资源路径 |
| `fix-theme-config-structure.sql` | 修复主题配置结构 | 修复配置格式 |
| `fix-theme-game-code.sql` | 修复游戏代码 | 修复游戏标识 |

### 5. 统计相关脚本

| 脚本 | 说明 | 使用场景 |
|------|------|----------|
| `fix_daily_stats_table.sql` | 修复每日统计表 | 修复统计表结构 |
| `update_daily_stats.sql` | 更新每日统计 | 更新统计数据 |
| `leaderboard_schema.sql` | 排行榜结构 | 排行榜相关 |

---

## 🚀 使用方法

### 1. 命令行执行

```bash
# MySQL 命令行执行
mysql -u root -p123456 kids_game < script.sql

# 执行特定脚本
mysql -u root -p123456 kids_game < init-snake-themes.sql

# 管道执行
cat script.sql | mysql -u root -p123456 kids_game
```

### 2. Navicat/Workbench 执行

1. 打开 Navicat 或 MySQL Workbench
2. 连接到数据库
3. 选择目标数据库
4. 右键 -> 运行 SQL 文件
5. 选择脚本文件并执行

### 3. Spring Boot 执行

```bash
# 使用 run-migration.bat
cd kids-game-backend
run-migration.bat init-snake-themes.sql
```

---

## 📋 脚本执行顺序

### 新项目初始化

```bash
# 1. 执行数据库初始化脚本
mysql -u root -p123456 kids_game < schema.sql
mysql -u root -p123456 kids_game < data.sql

# 2. 执行游戏初始化脚本
mysql -u root -p123456 kids_game < init-real-games.sql
mysql -u root -p123456 kids_game < init-snake-shooter.sql

# 3. 执行主题初始化脚本（可选）
mysql -u root -p123456 kids_game < init-snake-themes.sql
```

### 主题系统升级

```bash
# 按顺序执行升级脚本
mysql -u root -p123456 kids_game < theme-system-migration.sql
mysql -u root -p123456 kids_game < theme-system-migration-v2.sql
mysql -u root -p123456 kids_game < theme-system-unified-migration.sql
```

---

## ⚠️ 注意事项

### 执行前备份

```bash
# 备份数据库
mysqldump -u root -p123456 kids_game > backup_$(date +%Y%m%d).sql
```

### 事务处理

部分脚本包含事务，使用前请确保：
- 脚本在测试环境验证通过
- 有完整的数据库备份
- 了解脚本将要修改的内容

### 字符集问题

确保执行脚本时使用正确的字符集：

```bash
# UTF-8 编码执行
mysql -u root -p123456 --default-character-set=utf8mb4 kids_game < script.sql
```

---

## 🔧 常见问题

### 问题 1：表已存在

**错误信息**: `Table 'xxx' already exists`

**解决方案**: 跳过建表语句，或先删除再重建

### 问题 2：外键约束失败

**错误信息**: `Cannot delete or update a parent row`

**解决方案**: 先删除子表数据，再删除父表数据

### 问题 3：字符集不匹配

**错误信息**: `Incorrect string value`

**解决方案**: 确保数据库和表的字符集为 `utf8mb4`

---

## 📝 编写规范

### SQL 脚本命名规范

```
{操作类型}-{目标表/功能}-{版本}.sql
```

示例：
- `init-snake-themes.sql` - 初始化贪吃蛇主题
- `fix-theme-resources-v2.sql` - 修复主题资源 v2

### 脚本头部注释

```sql
/**
 * 脚本名称: init-snake-themes.sql
 * 描述: 初始化贪吃蛇游戏主题
 * 作者: KidsGame Team
 * 日期: 2024-01-01
 * 版本: v1.0.0
 * 执行前提: schema.sql 已执行
 * 回滚方案: DELETE FROM t_theme WHERE game_code = 'snake';
 */

-- 脚本内容
```

---

**最后更新**: 2026-03-20
**版本**: v1.0.0
