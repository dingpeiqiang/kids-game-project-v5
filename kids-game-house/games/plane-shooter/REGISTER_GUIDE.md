# 📝 飞机大战游戏注册指南

本文档介绍如何将飞机大战游戏注册到平台数据库。

---

## 🎯 注册方式

提供两种注册方式，选择其一即可：

### 方式一：SQL 脚本（推荐）⭐
**适用场景**: 直接操作数据库，快速部署  
**优点**: 简单直接，无需额外依赖  
**文件**: `register-game.sql`

### 方式二：Node.js API
**适用场景**: 集成到自动化流程  
**优点**: 可编程，支持参数配置  
**文件**: `register-game-api.js`

---

## 📋 前置准备

### 1. 确认游戏信息

| 项目 | 值 |
|------|-----|
| 游戏代码 | `plane-shooter` |
| 游戏名称 | `飞机大战` |
| 分类 | `ACTION` (动作类) |
| 年级 | `一年级` |
| 状态 | `2` (已上架/可见) |

### 2. 准备数据库连接

确保可以访问平台数据库：
- MySQL 5.7+ 或 MariaDB 10.3+
- 具有 `INSERT`, `UPDATE`, `SELECT` 权限
- 字符集：`utf8mb4`

### 3. 确认游戏 URL

替换占位符 `__GAME_URL__` 为实际地址：
- **本地开发**: `http://localhost:5173`
- **测试环境**: `http://your-test-domain.com`
- **生产环境**: `https://your-production-domain.com`

---

## 🚀 方式一：SQL 脚本注册

### 步骤 1：编辑 SQL 脚本

打开 `register-game.sql`，找到第 55 行：

```sql
'__GAME_URL__',  -- ⚠️ 请替换
```

修改为：

```sql
'http://localhost:5173',  -- ✅ 实际地址
```

### 步骤 2：执行 SQL 脚本

在 MySQL 客户端中执行：

```bash
# 方法 1: 使用 mysql 命令
mysql -u your_username -p your_database < register-game.sql

# 方法 2: 在 MySQL 交互界面
source /path/to/register-game.sql
```

### 步骤 3：检查输出

成功执行后，会看到类似输出：

```
✅ game_id = 123
✅ theme_id = 456
```

### 步骤 4：验证结果

```sql
-- 查询游戏记录
SELECT game_id, game_code, game_name, status, game_url 
FROM t_game 
WHERE game_code = 'plane-shooter';

-- 查询主题记录
SELECT theme_id, theme_name, owner_type, owner_id, is_default
FROM t_theme_info
WHERE owner_type = 'GAME' AND owner_id = (
    SELECT game_id FROM t_game WHERE game_code = 'plane-shooter'
);
```

---

## 🚀 方式二：Node.js API 注册

### 步骤 1：安装依赖（如未安装）

```bash
npm install
```

### 步骤 2：运行注册脚本

#### 基础用法（本地开发）

```bash
npm run register -- --url http://localhost:5173
```

或直接执行：

```bash
node register-game-api.js --url http://localhost:5173
```

#### 完整参数示例

```bash
node register-game-api.js \
  --url http://localhost:5173 \
  --creator 123
```

### 步骤 3：查看输出

成功运行后，会看到：

```
✈️ 飞机大战游戏注册器 (Node.js API 版)

🎮 开始注册游戏...

📝 步骤 1: 准备游戏数据
✅ 游戏数据:
{
  "game_code": "plane-shooter",
  "game_name": "飞机大战",
  ...
}

📝 步骤 2: 读取 GTRS 配置
✅ GTRS 配置加载成功
   主题代码：plane_shooter_default
   资源数量：图片 12 个

...

✅ 游戏注册准备完成！
============================================================
游戏信息:
  游戏代码：plane-shooter
  游戏名称：飞机大战
  访问地址：http://localhost:5173
  ...

下一步操作:
  1. 在 MySQL 客户端执行：source register-game.sql
  2. 检查输出确认 game_id 和 theme_id
  3. 访问游戏平台验证是否显示
```

### 步骤 4：手动执行 SQL

Node.js 脚本会生成配置数据，但仍需执行 SQL 脚本完成注册：

```bash
mysql -u your_username -p your_database < register-game.sql
```

---

## 📊 注册数据说明

### 游戏表 (t_game)

| 字段 | 值 | 说明 |
|------|-----|------|
| game_code | `plane-shooter` | 游戏唯一标识 |
| game_name | `飞机大战` | 游戏名称 |
| category | `ACTION` | 分类（动作类） |
| grade | `一年级` | 适合年级 |
| status | `2` | 已上架（前台可见） |
| game_url | `http://localhost:5173` | 游戏访问地址 |
| icon_url | `/themes/plane_shooter_default/images/player.png` | 图标 |
| sort_order | `4` | 排序顺序 |

### 主题表 (t_theme_info)

| 字段 | 值 | 说明 |
|------|-----|------|
| theme_name | `飞机大战 - 星空蓝` | 主题名称 |
| owner_type | `GAME` | 所有者类型 |
| owner_id | `{game_id}` | 关联游戏 ID |
| is_default | `1` | 默认主题 |
| is_official | `0` | 非平台官方（游戏方维护） |
| config_json | `{GTRS JSON}` | 完整 GTRS 配置 |

---

## 🔍 常见问题

### Q1: 提示"Duplicate entry"错误？
**A**: 游戏已注册，脚本会自动更新现有记录（幂等操作）。

### Q2: game_id 查询不到？
**A**: 检查：
1. game_code 是否正确 (`plane-shooter`)
2. deleted 字段是否为 0
3. 数据库连接是否正确

### Q3: 主题注册失败？
**A**: 可能原因：
1. game_id 未正确获取
2. GTRS.json 格式错误
3. config_json 不是合法 JSON

### Q4: 如何修改已注册的游戏信息？
**A**: 有两种方式：

**方式 1**: 直接修改 SQL 脚本后重新执行
```sql
UPDATE t_game
SET game_url = 'http://new-url.com',
    update_time = UNIX_TIMESTAMP(NOW()) * 1000
WHERE game_code = 'plane-shooter';
```

**方式 2**: 在数据库管理工具中直接编辑

### Q5: 如何删除已注册的游戏？
**A**: 执行删除语句（谨慎操作）：
```sql
-- 软删除（推荐）
UPDATE t_game SET deleted = 1 WHERE game_code = 'plane-shooter';

-- 硬删除（不推荐，除非确定不再需要）
DELETE FROM t_game WHERE game_code = 'plane-shooter';
```

---

## 🎯 最佳实践

### 1. 环境分离

不同环境使用不同的 game_url：

```bash
# 开发环境
node register-game-api.js --url http://localhost:5173

# 测试环境
node register-game-api.js --url http://test.your-domain.com

# 生产环境
node register-game-api.js --url https://www.your-domain.com
```

### 2. 备份数据库

注册前备份相关表：

```bash
mysqldump -u your_username -p your_database t_game t_theme_info > backup_games.sql
```

### 3. 使用事务

在 SQL 脚本中添加事务控制（已包含在 register-game.sql 中）：

```sql
START TRANSACTION;
-- 插入游戏
-- 插入主题
COMMIT;
```

### 4. 幂等性设计

register-game.sql 使用 `ON DUPLICATE KEY UPDATE`，可重复执行：

```sql
INSERT INTO t_game (...) VALUES (...)
ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    ...
```

---

## 📞 获取帮助

### 查看脚本帮助

```bash
node register-game-api.js --help
```

### 检查 GTRS 配置

```bash
# 验证 GTRS.json 格式
cat public/themes/plane_shooter_default/GTRS.json | jq .
```

### 查看日志

注册过程中的详细日志会输出到控制台，如有错误会显示堆栈跟踪。

---

## 🎉 注册完成检查清单

- [ ] 已替换 `__GAME_URL__` 为实际地址
- [ ] 已执行 `register-game.sql` 或 `register-game-api.js`
- [ ] 确认输出中包含 `game_id` 和 `theme_id`
- [ ] 验证查询返回正确的游戏信息
- [ ] 访问游戏平台页面确认显示
- [ ] 测试游戏可以正常加载和游玩

---

## 📚 相关文档

- [README.md](./README.md) - 完整项目说明
- [QUICK_START.md](./QUICK_START.md) - 快速启动指南
- [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md) - 游戏设计文档

---

**祝您注册顺利！🎮✨**

如有问题，请查看控制台输出或联系数据库管理员。
