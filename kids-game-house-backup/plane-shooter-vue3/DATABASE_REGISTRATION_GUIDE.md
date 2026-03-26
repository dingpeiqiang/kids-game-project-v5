# 🚀 飞机大战游戏 - 数据库注册指南

**创建时间**: 2026-03-26  
**游戏名称**: 飞机大战 (Plane Shooter)  
**游戏代码**: `plane-shooter`  
**端口号**: 8081

---

## 📋 注册前准备

### 检查清单

- [x] ✅ 游戏开发完成，可正常运行
- [x] ✅ 开发服务器运行在 http://localhost:8081
- [x] ✅ SQL 脚本已准备：`register-game.sql`
- [ ] ⏳ 等待执行 SQL 脚本

---

## 🔧 执行方式

### 方式一：使用 MySQL 命令行工具 (推荐)

#### 步骤 1: 连接到 MySQL 数据库

```bash
# Windows PowerShell
mysql -u root -p

# 输入密码后登录
```

#### 步骤 2: 选择数据库

```sql
-- 切换到正确的数据库 (根据你的实际数据库名)
USE your_database_name;
```

#### 步骤 3: 执行 SQL 脚本

```bash
# 方法 A: 在 MySQL 命令行中
source D:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/plane-shooter-vue3/register-game.sql;

# 方法 B: 使用重定向
mysql -u root -p your_database_name < "D:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/plane-shooter-vue3/register-game.sql"
```

#### 步骤 4: 验证插入结果

```sql
-- 查询刚注册的游戏
SELECT * FROM t_game WHERE game_code = 'plane-shooter';

-- 查看主题信息
SELECT * FROM t_theme_info WHERE game_id IN (
  SELECT game_id FROM t_game WHERE game_code = 'plane-shooter'
);
```

---

### 方式二：使用 Navicat/phpMyAdmin 等 GUI 工具

#### 步骤 1: 打开 SQL 文件

```
文件 → 打开 → 选择 register-game.sql
```

#### 步骤 2: 连接到数据库

```
连接 → 选择你的数据库连接
```

#### 步骤 3: 执行查询

```
点击"运行"或按 Ctrl+R
```

#### 步骤 4: 刷新表查看

```
右键 t_game 表 → 刷新
查找 game_code = 'plane-shooter' 的记录
```

---

## 📝 SQL 脚本详解

### 第一部分：注册游戏到 t_game 表

```sql
INSERT INTO t_game (
    game_code,        -- 'plane-shooter'
    game_name,        -- '飞机大战'
    category,         -- 'SHOOTER' (射击类)
    grade,            -- '三年级'
    icon_url,         -- 'http://localhost:8081/favicon.ico'
    cover_url,        -- '' (空)
    description,      -- 游戏描述
    game_url,         -- 'http://localhost:8081'
    module_path,      -- NULL
    status,           -- 1 (active)
    sort_order,       -- 20 (排序位置)
    consume_points_per_minute,  -- 1 (每分钟消耗积分)
    create_time,      -- 当前时间戳
    update_time       -- 当前时间戳
) VALUES (...)
ON DUPLICATE KEY UPDATE
    -- 如果已存在则更新
    game_name = VALUES(game_name),
    category = VALUES(category),
    -- ... 其他字段
```

**关键点**:
- ✅ 使用 `ON DUPLICATE KEY UPDATE` 避免重复插入
- ✅ `game_code` 是唯一键，用于判断是否重复
- ✅ `sort_order = 20` 确保在贪吃蛇之后显示

### 第二部分：注册默认主题到 t_theme_info 表

```sql
INSERT INTO t_theme_info (
    theme_name,       -- '飞机大战 - 默认主题'
    owner_id,         -- (关联到 game_id)
    config_json,      -- GTRS JSON 配置
    is_default,       -- true (默认主题)
    is_official,      -- true (官方主题)
    source,           -- 'official'
    status,           -- 'active'
    -- ... 其他字段
) VALUES (...)
```

**GTRS 配置内容**:
```json
{
  "$comment": "GTRS v1.0.0 飞机大战游戏内置默认主题",
  "specMeta": {
    "compatibleVersion": "1.0.0",
    "specName": "GTRS",
    "specVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "plane_shooter_default",
    "gameId": "plane-shooter",
    "themeName": "飞机大战 - 默认主题",
    "isDefault": true
  },
  "resources": {
    "images": {
      "scene": {
        "background": {
          "key": "background",
          "src": "/themes/default/assets/scene/background.png"
        },
        // ... 其他场景图片
      },
      "sprite": {
        "player_plane": {
          "key": "player_plane",
          "src": "/themes/default/assets/sprite/player_plane.png"
        },
        // ... 其他精灵图
      }
    },
    "audio": {
      "bgm": {
        "bgm_main": {
          "key": "bgm_main",
          "src": "/themes/default/assets/audio/bgm_main.wav"
        },
        // ... 其他 BGM
      },
      "effect": {
        "effect_fire": {
          "key": "effect_fire",
          "src": "/themes/default/assets/audio/effect_fire.wav"
        },
        // ... 其他音效
      }
    }
  }
}
```

---

## ⚠️ 常见问题与解决方案

### 问题 1: 数据库不存在

**错误信息**:
```
ERROR 1049 (42000): Unknown database 'your_database_name'
```

**解决方案**:
```sql
-- 创建数据库
CREATE DATABASE your_database_name 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 然后重新执行 SQL 脚本
```

### 问题 2: 权限不足

**错误信息**:
```
ERROR 1044 (42000): Access denied for user 'root'@'localhost'
```

**解决方案**:
```bash
# 使用有权限的用户登录
mysql -u admin -p

# 或者授予权限
GRANT ALL PRIVILEGES ON your_database_name.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 问题 3: 游戏已存在

**现象**: 执行后无反应或提示影响 0 行

**原因**: 使用了 `ON DUPLICATE KEY UPDATE`，如果数据没变化则不更新

**验证**:
```sql
SELECT game_code, game_name, status 
FROM t_game 
WHERE game_code = 'plane-shooter';
```

**强制更新** (如果需要):
```sql
UPDATE t_game 
SET update_time = UNIX_TIMESTAMP() * 1000,
    status = 1
WHERE game_code = 'plane-shooter';
```

### 问题 4: 外键约束失败

**错误信息**:
```
ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails
```

**原因**: `owner_id` 引用了不存在的 `game_id`

**解决方案**: 先插入游戏，再插入主题

```sql
-- 1. 先插入游戏
INSERT INTO t_game (...) VALUES (...);

-- 2. 查询生成的 game_id
SELECT game_id FROM t_game WHERE game_code = 'plane-shooter';

-- 3. 使用正确的 game_id 插入主题
INSERT INTO t_theme_info (..., owner_id = <上一步查到的 game_id>, ...) VALUES (...);
```

---

## 🎯 完整执行流程示例

### 实际执行命令 (PowerShell)

```powershell
# 1. 进入 SQL 脚本目录
cd D:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-house\plane-shooter-vue3

# 2. 执行 SQL 脚本
Get-Content register-game.sql | mysql -u root -p your_password your_database_name

# 3. 验证结果
mysql -u root -p your_password your_database_name -e "SELECT * FROM t_game WHERE game_code='plane-shooter';"
```

### 预期输出

```
+----------+---------------+-------------+---------+----------+
| game_id  | game_code     | game_name   | status  | sort_ord |
+----------+---------------+-------------+---------+----------+
| 123      | plane-shooter | 飞机大战     | 1       | 20       |
+----------+---------------+-------------+---------+----------+

+------------+------------------------+-----------+
| theme_id   | theme_name             | is_default|
+------------+------------------------+-----------+
| 456        | 飞机大战 - 默认主题     | 1         |
+------------+------------------------+-----------+
```

---

## ✅ 验证清单

### 数据库验证

- [ ] t_game 表中存在 `game_code = 'plane-shooter'` 的记录
- [ ] `status = 1` (active 状态)
- [ ] `game_url = 'http://localhost:8081'`
- [ ] t_theme_info 表中存在对应的默认主题
- [ ] 主题的 `config_json` 包含完整的 GTRS 配置

### 功能验证

- [ ] 访问 http://localhost:8081 正常显示游戏
- [ ] 所有资源加载成功 (无 404 错误)
- [ ] 游戏可以正常开始
- [ ] WASD 控制正常
- [ ] 射击系统正常
- [ ] 敌机生成正常
- [ ] 道具系统正常

---

## 🔄 后续步骤

### 步骤 1: 平台集成测试

1. **登录平台后台**
   - 访问管理平台
   - 使用管理员账号登录

2. **查看游戏列表**
   - 导航到游戏管理页面
   - 查找"飞机大战"游戏
   - 确认显示正常

3. **测试游戏启动**
   - 点击"开始游戏"按钮
   - 验证游戏加载
   - 测试完整玩法

### 步骤 2: 生产环境部署

1. **构建生产版本**
   ```bash
   cd plane-shooter-complete
   npm run build
   ```

2. **上传到服务器**
   ```bash
   # 使用 FTP 或 SCP 上传 dist 目录
   scp -r dist/* user@server:/var/www/plane-shooter/
   ```

3. **更新数据库 game_url**
   ```sql
   UPDATE t_game 
   SET game_url = 'https://your-domain.com/plane-shooter/'
   WHERE game_code = 'plane-shooter';
   ```

4. **配置 Nginx**
   ```nginx
   location /plane-shooter {
       alias /var/www/plane-shooter;
       try_files $uri $uri/ /index.html;
   }
   ```

5. **重启 Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

---

## 📞 参考资料

### SQL 脚本位置
- 📄 [`register-game.sql`](./register-game.sql)

### 相关文档
- 📖 [游戏配置与主题系统架构规范](memory://游戏配置与主题系统架构规范)
- 📋 [游戏与主题核心表结构规范](memory://游戏与主题核心表结构规范)

### 技术参考
- 💾 MySQL 官方文档：https://dev.mysql.com/doc/
- 🔧 Source 命令用法：https://dev.mysql.com/doc/refman/8.0/en/source-command.html

---

## 🎉 注册成功标志

当你看到以下内容时，说明注册成功:

```sql
-- 查询结果
mysql> SELECT game_code, game_name, status FROM t_game WHERE game_code = 'plane-shooter';
+---------------+-----------+--------+
| game_code     | game_name | status |
+---------------+-----------+--------+
| plane-shooter | 飞机大战   | 1      |
+---------------+-----------+--------+

-- 控制台输出
Query OK, 1 row affected (0.05 sec)
```

**恭喜！飞机大战已成功注册到数据库!** 🎮✨

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant  
**状态**: ⏳ 等待执行 SQL 脚本
