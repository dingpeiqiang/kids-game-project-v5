# 🎮 坦克大战游戏注册指南

**版本**: v1.0  
**创建日期**: 2026-03-26  
**最后更新**: 2026-03-26

---

## 📋 目录

1. [前置条件](#前置条件)
2. [快速注册](#快速注册)
3. [手动注册](#手动注册)
4. [验证结果](#验证结果)
5. [故障排查](#故障排查)

---

## ✅ 前置条件

### 1. MySQL 数据库
确保 MySQL 服务已启动并且可以访问:

```bash
# 检查 MySQL 是否运行
mysql --version
```

### 2. 数据库存在
确保 `kids_game_platform` 数据库已创建:

```sql
CREATE DATABASE kids_game_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 资源文件就绪
确保游戏资源已生成到正确位置:

```
kids-game-house/tank-battle-vue3/public/themes/default/
├── images/     (38 张图片)
└── audio/      (11 首音频)
```

---

## 🚀 快速注册

### Windows 用户

双击运行批处理脚本:

```bash
register-game.bat
```

或命令行执行:

```cmd
cd kids-game-house\tank-battle-vue3
register-game.bat
```

### Linux/Mac 用户

```bash
cd kids-game-house/tank-battle-vue3
mysql -u root -p kids_game_platform < register-game.sql
```

---

## 📝 手动注册

### 步骤 1: 登录 MySQL

```bash
mysql -u root -p
```

### 步骤 2: 选择数据库

```sql
USE kids_game_platform;
```

### 步骤 3: 执行 SQL 脚本

```sql
SOURCE /path/to/register-game.sql;
```

或直接复制粘贴 `register-game.sql` 的内容执行。

---

## 🔍 验证结果

### 1. 检查游戏注册

```sql
SELECT 
    game_id,
    game_code,
    game_name,
    category,
    grade,
    game_url,
    status
FROM t_game
WHERE game_code = 'TANK_BATTLE';
```

**预期结果**:
```
game_id | game_code   | game_name | category | grade  | game_url            | status
--------|-------------|-----------|----------|--------|---------------------|--------
xxx     | TANK_BATTLE | 坦克大战   | STRATEGY | 三年级  | http://localhost:3002 | 1
```

### 2. 检查主题注册

```sql
SELECT 
    theme_id,
    theme_name,
    owner_type,
    owner_id,
    price,
    status,
    description
FROM t_theme_info
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'TANK_BATTLE');
```

**预期结果**:
```
theme_id | theme_name   | owner_type | owner_id | price | status | description
---------|--------------|------------|----------|-------|--------|-------------
xxx      | 钢铁防线主题   | GAME       | xxx      | 0     | on_sale| 坦克大战默认主题...
```

### 3. 检查 GTRS 配置

```sql
SELECT config_json FROM t_theme_info WHERE theme_name = '钢铁防线主题';
```

应该看到完整的 JSON 配置，包含:
- colors (颜色配置)
- assets (资源路径)
- audio (音频配置)

---

## 🔧 故障排查

### 问题 1: MySQL 命令未找到

**错误信息**:
```
'mysql' is not recognized as an internal or external command
```

**解决方案**:

#### Windows:
将 MySQL 添加到 PATH:
```cmd
setx PATH "%PATH%;C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

然后重新打开命令行窗口。

#### Linux/Mac:
```bash
export PATH=$PATH:/usr/local/mysql/bin
```

或在 `.bashrc` / `.zshrc` 中添加永久配置。

---

### 问题 2: 数据库不存在

**错误信息**:
```
ERROR 1049 (42000): Unknown database 'kids_game_platform'
```

**解决方案**:
```sql
CREATE DATABASE kids_game_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 问题 3: 权限不足

**错误信息**:
```
ERROR 1045 (28000): Access denied for user 'root'@'localhost'
```

**解决方案**:

1. 使用正确密码登录
2. 或者重置 root 密码:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

---

### 问题 4: 外键约束失败

**错误信息**:
```
ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails
```

**解决方案**:

确保先插入 `t_game`,再插入 `t_theme_info`。SQL 脚本中已经使用子查询自动获取 `game_id`:

```sql
owner_id = (SELECT game_id FROM t_game WHERE game_code = 'TANK_BATTLE')
```

---

### 问题 5: 重复注册

**错误信息**:
```
ERROR 1062 (23000): Duplicate entry for key
```

**解决方案**:

脚本已使用 `ON DUPLICATE KEY UPDATE` 和 `WHERE NOT EXISTS`,可以安全重复执行。

如需完全重置:
```sql
-- 删除主题
DELETE FROM t_theme_info 
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'TANK_BATTLE');

-- 删除游戏
DELETE FROM t_game WHERE game_code = 'TANK_BATTLE';
```

然后重新执行注册脚本。

---

## 📊 表结构说明

### t_game 表

| 字段 | 类型 | 说明 |
|------|------|------|
| game_id | BIGINT | 主键 ID |
| game_code | VARCHAR(50) | 游戏代码 (唯一) |
| game_name | VARCHAR(100) | 游戏名称 |
| category | VARCHAR(50) | 游戏类型 |
| grade | VARCHAR(50) | 适用年级 |
| icon_url | VARCHAR(255) | 图标 URL |
| cover_url | VARCHAR(255) | 封面 URL |
| description | TEXT | 描述 |
| game_url | VARCHAR(255) | 游戏地址 |
| module_path | VARCHAR(255) | 模块路径 |
| status | INT | 状态 (1=启用) |
| sort_order | INT | 排序 |
| consume_points_per_minute | INT | 每分钟消耗积分 |
| create_time | BIGINT | 创建时间 (毫秒时间戳) |
| update_time | BIGINT | 更新时间 (毫秒时间戳) |

### t_theme_info 表

| 字段 | 类型 | 说明 |
|------|------|------|
| theme_id | BIGINT | 主键 ID |
| theme_name | VARCHAR(100) | 主题名称 |
| author_id | BIGINT | 作者 ID |
| author_name | VARCHAR(50) | 作者名称 |
| owner_type | VARCHAR(20) | 所有者类型 (GAME/USER) |
| owner_id | BIGINT | 所有者 ID (game_id 或 user_id) |
| price | DECIMAL(10,2) | 价格 |
| status | VARCHAR(20) | 状态 (on_sale/draft/archived) |
| thumbnail_url | VARCHAR(255) | 缩略图 URL |
| description | TEXT | 描述 |
| config_json | JSON | GTRS 配置 |
| download_count | INT | 下载次数 |
| total_revenue | DECIMAL(10,2) | 总收入 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

---

## 🎯 注册后操作

### 1. 启动后端服务

```bash
cd kids-game-backend
mvn spring-boot:run
```

或运行编译后的程序:
```bash
java -jar kids-game-web/target/kids-game-web.jar
```

### 2. 启动前端服务

```bash
cd kids-game-house/tank-battle-vue3
npm run dev
```

### 3. 访问游戏

浏览器打开：**http://localhost:3002**

### 4. 在平台中查看

访问 Kids Game Platform 首页，应该能在游戏列表中看到"坦克大战"。

---

## 📞 技术支持

如遇到其他问题，请检查:

1. **日志文件**: 后端控制台输出
2. **数据库日志**: MySQL error log
3. **网络请求**: 浏览器开发者工具 Network 标签

---

## ✅ 完成清单

- [ ] MySQL 服务正常运行
- [ ] `kids_game_platform` 数据库存在
- [ ] 执行 `register-game.bat` (Windows) 或 SQL 脚本
- [ ] 验证游戏注册成功 (查询 `t_game`)
- [ ] 验证主题注册成功 (查询 `t_theme_info`)
- [ ] 启动后端服务
- [ ] 启动前端开发服务器
- [ ] 在浏览器中访问游戏
- [ ] 在游戏平台中看到坦克大战

---

**注册成功**! 🎉 开始享受您的坦克大战游戏之旅吧!

---

**文档维护者**: Kids Game Platform Team  
**最后更新**: 2026-03-26
