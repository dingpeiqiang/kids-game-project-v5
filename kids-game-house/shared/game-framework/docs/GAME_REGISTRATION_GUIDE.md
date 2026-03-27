# 🎮 游戏注册流程指南

**版本**: v1.0.0  
**日期**: 2026-03-27  
**适用范围**: 所有新游戏上线流程

---

## 📋 目录

1. [概述](#概述)
2. [注册前准备](#注册前准备)
3. [数据库注册流程](#数据库注册流程)
4. [主题配置流程](#主题配置流程)
5. [资源部署流程](#资源部署流程)
6. [测试验证流程](#测试验证流程)
7. [上线发布流程](#上线发布流程)
8. [常见问题](#常见问题)

---

## 概述

### 游戏注册流程图

```
┌─────────────┐
│ 1. 准备工作 │
│ - 游戏代码   │
│ - GTRS 主题  │
│ - 文档资料   │
└──────┬──────┘
       ↓
┌─────────────┐
│ 2. 数据库注册│
│ - 游戏信息   │
│ - 默认主题   │
└──────┬──────┘
       ↓
┌─────────────┐
│ 3. 资源配置  │
│ - 上传资源   │
│ - 配置 CDN   │
└──────┬──────┘
       ↓
┌─────────────┐
│ 4. 测试验证  │
│ - 功能测试   │
│ - 性能测试   │
└──────┬──────┘
       ↓
┌─────────────┐
│ 5. 上线发布  │
│ - 生产部署   │
│ - 监控告警   │
└─────────────┘
```

---

## 注册前准备

### 1. 游戏基本信息

| 字段 | 要求 | 示例 |
|------|------|------|
| **游戏 Code** | 大写英文 + 下划线 | `SNAKE`, `PLANE_SHOOTER` |
| **游戏名称** | 中文名称，2-20 字 | `贪吃蛇`, `飞机大战` |
| **游戏类型** | 从枚举选择 | `ACTION`, `PUZZLE`, `STRATEGY` |
| **适用年级** | 一年级 - 六年级 | `三年级` |
| **游戏描述** | 50-200 字介绍 | `经典的贪吃蛇游戏...` |
| **图标 URL** | 128x128 PNG | `/images/icon.png` |
| **封面图 URL** | 800x600 JPG | `/images/cover.jpg` |

---

### 2. GTRS 主题包

必须包含：
- ✅ 完整的 `config.json`（符合 GTRS 规范）
- ✅ 所有图片资源（按规范命名和分类）
- ✅ 所有音频资源（BGM 和 SFX）
- ✅ Schema 校验通过报告

**目录结构**:
```
themes/<game_code>_default/
├── config.json          # GTRS 配置
├── images/              # 图片资源
└── audio/               # 音频资源
```

---

### 3. 技术文档

- ✅ 游戏 README.md
- ✅ 开发文档（如有特殊功能）
- ✅ 测试报告
- ✅ 性能基准数据

---

## 数据库注册流程

### Step 1: 准备 SQL 脚本

创建 `register-<game_code>.sql` 文件：

```sql
-- ============================================
-- <游戏名称> 游戏注册 SQL 脚本
-- 说明：将游戏注册到数据库
-- 创建时间：YYYY-MM-DD
-- ============================================
```

---

### Step 2: 插入游戏记录

```sql
-- 1. 在游戏表中注册新游戏
INSERT INTO t_game (
    game_code,                      -- 游戏 Code（大写）
    game_name,                      -- 游戏名称（中文）
    category,                       -- 类型（枚举值）
    grade,                          -- 适用年级
    icon_url,                       -- 图标 URL
    cover_url,                      -- 封面图 URL
    description,                    -- 游戏描述
    game_url,                       -- 游戏访问 URL
    module_path,                    -- 模块路径（Vue 路由）
    status,                         -- 状态：1=active, 0=inactive
    sort_order,                     -- 排序序号
    consume_points_per_minute,      -- 每分钟消耗积分
    create_time,
    update_time
) VALUES (
    'SNAKE',                        -- 游戏 code
    '贪吃蛇',                       -- 游戏名称
    'ACTION',                       -- 类型：动作类
    '三年级',                       -- 适用年级
    '/themes/snake_default/images/icon.png',  -- 图标
    '/themes/snake_default/images/cover.jpg', -- 封面
    '经典的贪吃蛇游戏！控制蛇的方向，吃掉更多食物，挑战最高分！支持多种难度和主题切换。',
    'http://localhost:3001',        -- 端口号 3001
    '/games/snake',                 -- 模块路径
    1,                              -- 状态：active
    1,                              -- 排序
    1,                              -- 每分钟消耗积分
    UNIX_TIMESTAMP() * 1000,
    UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    category = VALUES(category),
    grade = VALUES(grade),
    icon_url = VALUES(icon_url),
    description = VALUES(description),
    game_url = VALUES(game_url),
    status = VALUES(status),
    sort_order = VALUES(sort_order),
    update_time = VALUES(update_time);
```

---

### Step 3: 插入默认主题

```sql
-- 2. 插入游戏的默认主题
INSERT INTO t_theme_info (
    theme_name,                     -- 主题名称
    author_id,                      -- 作者 ID（系统管理员为 1）
    author_name,                    -- 作者名称
    owner_type,                     -- 所有者类型：'GAME' 或 'USER'
    owner_id,                       -- 所有者 ID（游戏 ID 或用户 ID）
    price,                          -- 价格（免费为 0）
    status,                         -- 状态：'on_sale', 'off_sale'
    thumbnail_url,                  -- 缩略图 URL
    description,                    -- 主题描述
    config_json,                    -- GTRS 配置 JSON
    download_count,                 -- 下载次数
    total_revenue,                  -- 总收入
    created_at,
    updated_at
)
SELECT 
    '贪吃蛇默认主题',                -- 主题名称
    1,                              -- 系统管理员
    '系统管理员',                    -- 作者名称
    'GAME',                         -- 游戏主题
    (SELECT game_id FROM t_game WHERE game_code = 'SNAKE'),  -- 自动获取游戏 ID
    0,                              -- 免费主题
    'on_sale',                      -- 上架状态
    '/themes/snake_default/images/thumbnail.jpg',
    '贪吃蛇游戏默认主题，经典的绿色蛇身和红色食物，简洁明快的视觉风格。',
    '{
      "specMeta": {
        "specName": "GTRS",
        "specVersion": "1.0.0"
      },
      "themeInfo": {
        "themeId": "snake_default",
        "themeName": "贪吃蛇默认主题",
        "isDefault": true
      },
      "globalStyle": {
        "primaryColor": "#4ade80",
        "secondaryColor": "#ef4444",
        "bgColor": "#1a1a2e"
      },
      "resources": {
        "images": {
          "scene": {
            "scene_bg_main": {
              "src": "/themes/snake_default/images/scene/bg_main.png",
              "type": "image/png",
              "alias": "主背景"
            }
          }
        },
        "audio": {
          "bgm": {
            "bgm_main": {
              "src": "/themes/snake_default/audio/bgm/bgm_main.mp3",
              "volume": 0.6,
              "loop": true
            }
          },
          "effect": {
            "sfx_eat": {
              "src": "/themes/snake_default/audio/sfx/sfx_eat.wav",
              "volume": 0.8
            }
          }
        }
      }
    }',
    0,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM t_theme_info 
    WHERE theme_name = '贪吃蛇默认主题' 
    AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'SNAKE')
);
```

---

### Step 4: 验证插入结果

```sql
-- 3. 查询验证游戏信息
SELECT 
    game_id AS '游戏 ID',
    game_code AS '游戏代码',
    game_name AS '游戏名称',
    category AS '类型',
    grade AS '年级',
    game_url AS '游戏 URL',
    status AS '状态'
FROM t_game
WHERE game_code = 'SNAKE';

-- 4. 查询验证主题信息
SELECT 
    theme_id AS '主题 ID',
    theme_name AS '主题名称',
    owner_type AS '所有者类型',
    owner_id AS '所有者 ID',
    price AS '价格',
    status AS '状态',
    description AS '描述'
FROM t_theme_info
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'SNAKE')
ORDER BY theme_id;

-- 5. 完成提示
SELECT '✅ 游戏注册完成！' AS '执行结果';
```

---

### Step 5: 执行 SQL 脚本

```bash
# 1. 连接到数据库
mysql -u root -p kids_game_platform

# 2. 执行注册脚本
source /path/to/register-snake.sql

# 3. 检查输出
# 应该看到：
# ✅ 游戏注册完成！
# 游戏 ID | 游戏代码 | 游戏名称 | ...
# 1 | SNAKE | 贪吃蛇 | ...
```

---

## 主题配置流程

### Step 1: 准备 GTRS 配置文件

参考 [GTRS 资源规范](./GTRS_RESOURCE_SPECIFICATION.md) 创建 `config.json`

---

### Step 2: 上传资源文件

```bash
# 1. 创建主题目录
mkdir -p public/themes/snake_default/{images,audio}

# 2. 复制资源文件
cp -r themes/snake_default/images/* public/themes/snake_default/images/
cp -r themes/snake_default/audio/* public/themes/snake_default/audio/

# 3. 设置权限
chmod -R 755 public/themes/snake_default/
```

---

### Step 3: 配置 CDN（如使用）

```nginx
# Nginx 配置示例
location /themes/ {
    alias /var/www/kids-game/public/themes/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 测试验证流程

### Step 1: 功能测试

参考 [游戏测试要求](./GAME_TEST_REQUIREMENTS.md) 执行完整测试

**测试清单**:
- [ ] 游戏可以正常启动
- [ ] 主题正确加载
- [ ] 所有资源无 404 错误
- [ ] 音频播放正常
- [ ] 游戏逻辑正确
- [ ] 分数统计准确
- [ ] 难度切换正常

---

### Step 2: 性能测试

**关键指标**:

| 指标 | 要求 | 测量方法 |
|------|------|---------|
| **首屏加载** | < 3 秒 | Chrome DevTools |
| **资源加载** | < 5 秒 | Network 面板 |
| **帧率** | ≥ 60 FPS | Performance 面板 |
| **内存占用** | < 256MB | Memory 面板 |
| **CPU 占用** | < 30% | System Monitor |

---

### Step 3: 兼容性测试

**浏览器兼容**:
- [ ] Chrome 最新版
- [ ] Firefox 最新版
- [ ] Safari 最新版
- [ ] Edge 最新版

**设备兼容**:
- [ ] 桌面端（1920x1080）
- [ ] 平板端（1024x768）
- [ ] 手机端（375x667）

---

### Step 4: GTRS 规范校验

```bash
# 1. Schema 校验
node tools/validate-gtrs.js themes/snake_default/config.json

# 2. 资源完整性检查
node tools/check-resources.js themes/snake_default/

# 3. 生成报告
node tools/generate-report.js themes/snake_default/ > report.md
```

**预期输出**:
```
✅ Schema 校验通过
✅ 所有资源文件存在
✅ 命名符合规范
✅ 文件大小符合要求
```

---

## 上线发布流程

### Step 1: 生产环境部署

```bash
# 1. 构建生产版本
cd games/snake
npm run build

# 2. 上传到服务器
scp -r dist/* user@server:/var/www/kids-game/games/snake/

# 3. 部署主题
scp -r themes/snake_default/* user@server:/var/www/kids-game/public/themes/snake_default/
```

---

### Step 2: 更新生产数据库

```bash
# 1. 连接生产数据库
mysql -h prod-db-host -u root -p kids_game_platform

# 2. 执行注册脚本
source register-snake.sql

# 3. 验证数据
SELECT * FROM t_game WHERE game_code = 'SNAKE';
```

---

### Step 3: 配置反向代理

```nginx
# Nginx 配置
server {
    listen 80;
    server_name kids-game.com;
    
    location /games/snake {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### Step 4: 监控配置

**监控指标**:
- ✅ 游戏在线人数
- ✅ 平均游戏时长
- ✅ 错误日志数量
- ✅ 服务器负载
- ✅ 响应时间

**告警阈值**:
- ⚠️ 错误率 > 1%
- ⚠️ 响应时间 > 2 秒
- ⚠️ CPU 占用 > 80%
- ⚠️ 内存占用 > 1GB

---

## 完整示例

### 贪吃蛇游戏注册完整流程

#### 1. 准备文件

```
snake-registration/
├── register-snake.sql           # SQL 注册脚本
├── themes/
│   └── snake_default/
│       ├── config.json          # GTRS 配置
│       ├── images/              # 图片资源
│       └── audio/               # 音频资源
└── README.md                    # 说明文档
```

---

#### 2. 执行注册

```bash
# 进入目录
cd snake-registration

# 执行 SQL
mysql -u root -p kids_game_platform < register-snake.sql

# 验证
mysql -u root -p kids_game_platform -e "SELECT * FROM t_game WHERE game_code='SNAKE';"
```

---

#### 3. 部署资源

```bash
# 复制主题到公共目录
cp -r themes/snake_default /var/www/kids-game/public/themes/

# 设置权限
chown -R www-data:www-data /var/www/kids-game/public/themes/snake_default
chmod -R 755 /var/www/kids-game/public/themes/snake_default
```

---

#### 4. 测试访问

```bash
# 启动游戏服务
cd games/snake
npm run dev

# 访问浏览器
http://localhost:3001

# 检查控制台
# 应显示：
# ✅ GTRS 主题已加载：贪吃蛇默认主题
# ✅ 游戏启动成功
```

---

## 常见问题

### Q1: 游戏 Code 重复怎么办？

**A**: 使用 `ON DUPLICATE KEY UPDATE` 语法会自动更新现有记录。

```sql
INSERT INTO t_game (...) VALUES (...)
ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    ...
```

---

### Q2: 主题配置 JSON 太长怎么办？

**A**: 可以使用外部文件存储，数据库中只存引用路径。

```sql
INSERT INTO t_theme_info (..., config_json_path, ...)
VALUES (..., '/themes/snake_default/config.json', ...);
```

---

### Q3: 如何回滚注册？

**A**: 创建回滚 SQL 脚本：

```sql
-- 删除主题
DELETE FROM t_theme_info 
WHERE owner_type = 'GAME' 
  AND owner_id = (SELECT game_id FROM t_game WHERE game_code = 'SNAKE');

-- 删除游戏
DELETE FROM t_game WHERE game_code = 'SNAKE';
```

---

### Q4: 游戏上线后如何更新？

**A**: 
1. 更新游戏代码并重新构建
2. 更新版本号
3. 通知用户刷新页面
4. 监控错误日志

---

### Q5: 如何添加多个主题？

**A**: 对每个主题执行一次 INSERT：

```sql
-- 主题 2
INSERT INTO t_theme_info (...) VALUES (...);

-- 主题 3
INSERT INTO t_theme_info (...) VALUES (...);
```

---

## 附录

### A. SQL 脚本模板

提供标准模板文件：
- `register-game-template.sql`
- `rollback-game-template.sql`
- `update-game-template.sql`

---

### B. 检查清单

#### 注册前检查
- [ ] 游戏代码已完成并通过测试
- [ ] GTRS 主题包已准备完整
- [ ] 所有文档已编写完成
- [ ] 性能指标达标

---

#### 注册时检查
- [ ] SQL 脚本无语法错误
- [ ] 游戏信息填写完整
- [ ] 主题配置 JSON 格式正确
- [ ] 资源路径配置正确

---

#### 注册后检查
- [ ] 游戏可以在列表中找到
- [ ] 点击可以正常进入游戏
- [ ] 主题正确加载
- [ ] 所有功能正常
- [ ] 性能指标正常

---

**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**版本**: v1.0.0
