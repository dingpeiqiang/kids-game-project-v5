# 🎮 飞机大战游戏注册指南

**最后更新**: 2026-03-25  
**游戏名称**: 飞机大战  
**游戏代码**: PLANE_SHOOTER  
**运行端口**: http://localhost:3003

---

## 📋 注册内容

本次注册包括：

1. ✅ **游戏配置** - 将飞机大战注册到平台游戏列表
2. ✅ **默认主题** - 星际战士主题（免费）
3. ✅ **备用主题** - 红色闪电主题（免费）
4. ✅ **GTRS 资源** - 完整的主题资源配置

---

## 🚀 方式一：一键注册（推荐）

### Windows 用户

双击运行批处理文件：
```bash
register-plane-shooter.bat
```

**执行流程**:
1. 自动检测 MySQL 安装
2. 提示输入数据库密码
3. 执行 SQL 脚本
4. 显示执行结果

---

## 🔧 方式二：手动注册

### 步骤 1：准备环境

确保以下条件满足：
- [ ] MySQL 服务已启动
- [ ] kids_game 数据库存在
- [ ] 有数据库操作权限

### 步骤 2：执行 SQL 脚本

打开命令行，进入后端目录：
```bash
cd kids-game-backend

# 执行注册脚本
mysql -h localhost -P 3306 -u root -p kids_game < init-plane-shooter.sql
```

**输入数据库密码后按回车**。

### 步骤 3：验证结果

登录 MySQL 查看：
```sql
-- 查询游戏是否注册成功
SELECT game_id, game_code, game_name, status 
FROM t_game 
WHERE game_code = 'PLANE_SHOOTER';

-- 查询主题是否注册成功
SELECT theme_id, theme_name, owner_type, price, status 
FROM t_theme_info 
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER');
```

---

## 📊 注册数据详情

### 游戏信息

| 字段 | 值 |
|------|-----|
| **游戏代码** | PLANE_SHOOTER |
| **游戏名称** | 飞机大战 |
| **类型** | SHOOTER（射击类） |
| **年级** | 三年级 |
| **状态** | 1（上线） |
| **排序** | 2 |
| **URL** | http://localhost:3003 |
| **描述** | 经典太空射击游戏！驾驶战机，击落敌机，收集道具，挑战最高分！ |

### 主题信息

#### 主题 1：星际战士主题（默认）

| 字段 | 值 |
|------|-----|
| **主题 ID** | 自动生成 |
| **主题名称** | 星际战士主题 |
| **所有者类型** | GAME |
| **价格** | 0（免费） |
| **状态** | on_sale（可售） |
| **描述** | 飞机大战的默认星际战士主题，包含蓝色战机和经典太空背景 |

**资源配置**:
- ✅ 玩家飞机：蓝色战机
- ✅ 敌机：3 种类型（basic/fast/tank）
- ✅ Boss：紫色大型敌机
- ✅ 子弹：玩家/敌机各一种
- ✅ 道具：武器/生命/护盾
- ✅ 背景：星空
- ✅ BGM：4 首背景音乐
- ✅ 音效：6 个游戏音效

#### 主题 2：红色闪电主题（备用）

| 字段 | 值 |
|------|-----|
| **主题名称** | 红色闪电主题 |
| **价格** | 0（免费） |
| **描述** | 红色涂装的闪电战机主题 |

**特色**:
- ✅ 红色涂装战机
- ✅ 相同的敌机和道具
- ✅ 相同的音频资源

---

## 🎯 注册后的操作

### 1. 刷新平台页面

访问 Kids Game 平台首页，应该能看到新注册的飞机大战游戏。

### 2. 测试游戏

点击飞机大战图标，应该能：
- ✅ 加载游戏页面
- ✅ 看到开始界面
- ✅ 控制飞机移动
- ✅ 发射子弹
- ✅ 击毁敌机得分

### 3. 切换主题

在游戏设置或主题选择界面，应该能看到两个可用主题：
- 星际战士主题（蓝色）
- 红色闪电主题（红色）

---

## 🐛 常见问题

### Q1: "未找到 MySQL 命令行工具"

**解决方案**:
```bash
# 方案 A: 添加 MySQL 到系统 PATH
# 编辑环境变量，添加 MySQL 的 bin 目录路径

# 方案 B: 使用完整路径
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h localhost -u root -p kids_game < init-plane-shooter.sql
```

### Q2: "数据库不存在"

**解决方案**:
```sql
-- 创建数据库
CREATE DATABASE kids_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 然后重新执行注册脚本
```

### Q3: "Access denied"

**解决方案**:
```bash
# 使用有权限的用户
mysql -h localhost -u admin_user -p kids_game < init-plane-shooter.sql

# 或者授予权限
GRANT ALL PRIVILEGES ON kids_game.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Q4: "游戏已存在"

**说明**: SQL 使用了 `ON DUPLICATE KEY UPDATE`，会自动更新现有记录。

**验证**:
```sql
SELECT * FROM t_game WHERE game_code = 'PLANE_SHOOTER';
```

### Q5: "主题重复"

**说明**: SQL 使用了 `WHERE NOT EXISTS` 条件，不会重复插入。

**验证**:
```sql
SELECT theme_name FROM t_theme_info WHERE owner_type = 'GAME';
```

---

## 📞 手动验证清单

注册完成后，请执行以下验证：

### 数据库验证

```sql
-- 1. 检查游戏是否存在
SELECT COUNT(*) AS game_count 
FROM t_game 
WHERE game_code = 'PLANE_SHOOTER';
-- 应该返回 1

-- 2. 检查主题数量
SELECT COUNT(*) AS theme_count 
FROM t_theme_info 
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER');
-- 应该返回 2（星际战士 + 红色闪电）

-- 3. 检查主题详情
SELECT theme_id, theme_name, price, status 
FROM t_theme_info 
WHERE owner_type = 'GAME'
ORDER BY theme_id DESC
LIMIT 5;
```

### 功能验证

- [ ] 平台首页显示飞机大战图标
- [ ] 点击图标可以进入游戏
- [ ] 游戏可以正常加载
- [ ] 可以选择不同主题
- [ ] 游戏控制正常
- [ ] 得分系统正常

---

## 🎨 GTRS 资源配置

### 资源路径映射

游戏使用的资源路径：
```
/images/scene/
├── player_blue.png      → /themes/default/images/scene/player_blue.png
├── player_red.png       → /themes/default/images/scene/player_red.png
├── enemy_basic.png      → /themes/default/images/scene/enemy_basic.png
├── enemy_fast.png       → /themes/default/images/scene/enemy_fast.png
├── enemy_tank.png       → /themes/default/images/scene/enemy_tank.png
├── boss.png             → /themes/default/images/scene/boss.png
├── bullet_player.png    → /themes/default/images/scene/bullet_player.png
├── bullet_enemy.png     → /themes/default/images/scene/bullet_enemy.png
├── powerup_weapon.png   → /themes/default/images/scene/powerup_weapon.png
├── powerup_health.png   → /themes/default/images/scene/powerup_health.png
├── powerup_shield.png   → /themes/default/images/scene/powerup_shield.png
└── bg_stars.png         → /themes/default/images/scene/bg_stars.png

/audio/
├── bgm_main.mp3         → /themes/default/audio/bgm_main.mp3
├── bgm_gameplay.mp3     → /themes/default/audio/bgm_gameplay.mp3
├── bgm_boss.mp3         → /themes/default/audio/bgm_boss.mp3
├── bgm_gameover.mp3     → /themes/default/audio/bgm_gameover.mp3
├── button_click.mp3     → /themes/default/audio/button_click.mp3
├── shoot.mp3            → /themes/default/audio/shoot.mp3
├── explosion.mp3        → /themes/default/audio/explosion.mp3
├── powerup.mp3          → /themes/default/audio/powerup.mp3
├── levelup.mp3          → /themes/default/audio/levelup.mp3
└── gameover.mp3         → /themes/default/audio/gameover.mp3
```

### 颜色配置

主题颜色方案：
```json
{
  "colors": {
    "primary": "#4ade80",      // 主色调（绿色）
    "secondary": "#22c55e",    // 次要色
    "background": "#0f0f2d",   // 背景色（深蓝黑）
    "surface": "#1a1a2e",      // 表面色
    "text": "#ffffff",         // 文字色
    "accent": "#fbbf24",       // 强调色（金色）
    "success": "#22c55e",      // 成功色
    "warning": "#f59e0b",      // 警告色（橙色）
    "error": "#ef4444"         // 错误色（红色）
  }
}
```

---

## 📈 数据统计

注册后，系统会统计：
- 游戏下载次数
- 主题下载次数
- 游戏时长
- 玩家得分

这些数据可以在后台管理系统中查看。

---

## 🔄 更新和卸载

### 更新游戏配置

修改 `init-plane-shooter.sql` 中的配置，然后重新执行。

### 删除游戏

```sql
-- 删除主题
DELETE FROM t_theme_info 
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'PLANE_SHOOTER');

-- 删除游戏
DELETE FROM t_game 
WHERE game_code = 'PLANE_SHOOTER';
```

---

## ✅ 完成标志

注册成功的标志：
- ✅ 数据库中有了 `PLANE_SHOOTER` 游戏记录
- ✅ 数据库中有了 2 个相关主题记录
- ✅ 平台首页可以看到飞机大战图标
- ✅ 可以点击并开始游戏
- ✅ 游戏可以正常运行

---

## 📞 技术支持

遇到问题？

1. 查看本文档的"常见问题"部分
2. 检查数据库日志
3. 验证 MySQL 服务状态
4. 确认网络连接正常

---

**祝你注册顺利！** 🎮✈️🚀

**文档版本**: v1.0  
**最后更新**: 2026-03-25
