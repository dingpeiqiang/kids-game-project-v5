# 游戏主题系统 - 数据库脚本汇总

**版本**: V3.0  
**更新时间**: 2026-03-16 00:20 GMT+8

---

## 📁 脚本清单

| 序号 | 脚本文件 | 说明 | 行数 |
|------|----------|------|------|
| 1 | `theme-system-migration-v3.sql` | 主题系统完整迁移脚本 | ~80 行 |
| 2 | `theme-init-data.sql` | 主题初始化数据（可选） | ~30 行 |
| 3 | `theme-test-data.sql` | 主题测试数据（可选） | ~50 行 |

---

## 📋 脚本 1：theme-system-migration-v3.sql

**文件位置**: `kids-game-backend/theme-system-migration-v3.sql`

**功能**: 创建主题系统所有数据库表

### 创建的表（3 张）

#### 1. theme_info - 主题信息表
```sql
CREATE TABLE `theme_info` (
    theme_id         BIGINT       -- 主题 ID（主键）
    author_id        BIGINT       -- 作者 ID
    theme_name       VARCHAR(100) -- 主题名称
    author_name      VARCHAR(50)  -- 作者名称
    price            INT          -- 价格（游戏币）
    status           VARCHAR(20)  -- 状态：on_sale/offline/pending
    download_count   INT          -- 下载次数
    total_revenue    INT          -- 总收益
    thumbnail_url    VARCHAR(500) -- 缩略图 URL
    description      TEXT         -- 描述
    config_json      JSON         -- 主题配置（资源/样式）
    applicable_scope VARCHAR(50)  -- 适用范围：all/specific
    created_at       DATETIME     -- 创建时间
    updated_at       DATETIME     -- 更新时间
)
```

**索引**:
- `PRIMARY KEY (theme_id)`
- `INDEX idx_author_id (author_id)`
- `INDEX idx_status (status)`
- `INDEX idx_applicable_scope (applicable_scope)`

---

#### 2. theme_game_relation - 主题 - 游戏关系表
```sql
CREATE TABLE `theme_game_relation` (
    relation_id  BIGINT       -- 关系 ID（主键）
    theme_id     BIGINT       -- 主题 ID（外键）
    game_id      BIGINT       -- 游戏 ID
    game_code    VARCHAR(50)  -- 游戏代码
    is_default   TINYINT      -- 是否默认主题
    sort_order   INT          -- 排序权重
    created_at   DATETIME     -- 创建时间
)
```

**索引**:
- `PRIMARY KEY (relation_id)`
- `UNIQUE KEY uk_theme_game (theme_id, game_id)`
- `INDEX idx_game_id (game_id)`
- `INDEX idx_game_code (game_code)`
- `INDEX idx_is_default (is_default)`
- `FOREIGN KEY (theme_id) REFERENCES theme_info(theme_id) ON DELETE CASCADE`

---

#### 3. theme_assets - 主题资源表（可选）
```sql
CREATE TABLE `theme_assets` (
    asset_id    BIGINT       -- 资产 ID（主键）
    theme_id    BIGINT       -- 主题 ID（外键）
    asset_key   VARCHAR(100) -- 资源键
    asset_type  VARCHAR(20)  -- 资源类型：image/audio/font/other
    file_path   VARCHAR(500) -- 文件路径
    file_size   INT          -- 文件大小（字节）
    file_hash   VARCHAR(64)  -- 文件哈希
    created_at  DATETIME     -- 创建时间
)
```

**索引**:
- `PRIMARY KEY (asset_id)`
- `INDEX idx_theme_id (theme_id)`
- `INDEX idx_asset_key (asset_key)`
- `FOREIGN KEY (theme_id) REFERENCES theme_info(theme_id) ON DELETE CASCADE`

---

### 初始化数据

```sql
-- 1. 创建通用主题
INSERT INTO theme_info 
(author_id, theme_name, author_name, price, status, applicable_scope, config_json) 
VALUES 
(1, '经典复古主题', '游戏官方', 0, 'on_sale', 'all', 
 '{"default": {"name": "经典复古", "assets": {}, "styles": {"color_primary": "#42b983"}}}');

-- 2. 创建专属主题
INSERT INTO theme_info 
(author_id, theme_name, author_name, price, status, applicable_scope, config_json) 
VALUES 
(1, '贪吃蛇专属主题', '游戏官方', 100, 'on_sale', 'specific', 
 '{"default": {"name": "贪吃蛇专属", "assets": {"snake_body": "images/snake.png"}}}');

-- 3. 设置默认主题
INSERT INTO theme_game_relation 
(theme_id, game_id, game_code, is_default, sort_order) 
VALUES 
(1, 1, 'snake-vue3', 1, 1);

-- 4. 关联主题到多个游戏
INSERT INTO theme_game_relation 
(theme_id, game_id, game_code, is_default, sort_order) 
VALUES 
(1, 1, 'snake-vue3', 0, 2),
(1, 2, 'snake-shooter', 0, 1),
(1, 3, 'plane-shooter', 0, 1);
```

---

## 📋 脚本 2：theme-init-data.sql（可选）

**文件位置**: `kids-game-backend/theme-init-data.sql`

**功能**: 为所有现有游戏创建默认主题

```sql
-- ============================================
-- 主题系统初始化数据
-- ============================================

-- 1. 创建官方默认主题
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `price`, `status`, `applicable_scope`, `config_json`) 
VALUES 
(1, '官方默认主题', '游戏官方', 0, 'on_sale', 'all', 
 '{"default": {
    "name": "官方默认",
    "author": "游戏官方",
    "assets": {},
    "styles": {
      "color_text": "#ffffff",
      "color_primary": "#42b983",
      "color_btn_bg": "#333333",
      "font_size_title": "40px",
      "border_radius_btn": "8px"
    }
  }}');

-- 2. 获取刚创建的主题 ID
SET @default_theme_id = LAST_INSERT_ID();

-- 3. 关联到所有已启用的游戏
INSERT INTO `theme_game_relation` 
(`theme_id`, `game_id`, `game_code`, `is_default`, `sort_order`)
SELECT @default_theme_id, game_id, game_code, 1, 1
FROM `game`
WHERE `status` = 1;

-- 4. 创建更多示例主题

-- 炫酷科技主题
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `price`, `status`, `applicable_scope`, `config_json`) 
VALUES 
(1, '炫酷科技', '游戏官方', 50, 'on_sale', 'all', 
 '{"default": {
    "name": "炫酷科技",
    "assets": {},
    "styles": {
      "color_text": "#00ffff",
      "color_primary": "#0080ff",
      "color_btn_bg": "#004080",
      "font_size_title": "36px",
      "border_radius_btn": "12px"
    }
  }}');

-- 可爱卡通主题
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `price`, `status`, `applicable_scope`, `config_json`) 
VALUES 
(1, '可爱卡通', '游戏官方', 30, 'on_sale', 'all', 
 '{"default": {
    "name": "可爱卡通",
    "assets": {},
    "styles": {
      "color_text": "#ff69b4",
      "color_primary": "#ffb6c1",
      "color_btn_bg": "#ffc0cb",
      "font_size_title": "32px",
      "border_radius_btn": "20px"
    }
  }}');

-- 5. 关联新主题到所有游戏
SET @theme2_id = (SELECT theme_id FROM theme_info WHERE theme_name = '炫酷科技');
SET @theme3_id = (SELECT theme_id FROM theme_info WHERE theme_name = '可爱卡通');

INSERT INTO `theme_game_relation` 
(`theme_id`, `game_id`, `game_code`, `is_default`, `sort_order`)
SELECT @theme2_id, game_id, game_code, 0, 2
FROM `game`
WHERE `status` = 1;

INSERT INTO `theme_game_relation` 
(`theme_id`, `game_id`, `game_code`, `is_default`, `sort_order`)
SELECT @theme3_id, game_id, game_code, 0, 3
FROM `game`
WHERE `status` = 1;
```

---

## 📋 脚本 3：theme-test-data.sql（可选）

**文件位置**: `kids-game-backend/theme-test-data.sql`

**功能**: 创建测试数据（开发/测试环境使用）

```sql
-- ============================================
-- 主题系统测试数据
-- ============================================

-- 1. 创建多个测试主题
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `price`, `status`, `applicable_scope`, `config_json`, `download_count`, `total_revenue`) 
VALUES 
(1, '测试主题 1', '测试用户 1', 0, 'on_sale', 'all', '{"default": {"name": "测试 1", "styles": {"color_primary": "#FF0000"}}}', 100, 0),
(1, '测试主题 2', '测试用户 2', 20, 'on_sale', 'all', '{"default": {"name": "测试 2", "styles": {"color_primary": "#00FF00"}}}', 50, 1000),
(1, '测试主题 3', '测试用户 3', 50, 'on_sale', 'specific', '{"default": {"name": "测试 3", "styles": {"color_primary": "#0000FF"}}}', 30, 1500),
(1, '测试主题 4', '测试用户 4', 100, 'on_sale', 'all', '{"default": {"name": "测试 4", "styles": {"color_primary": "#FFFF00"}}}', 20, 2000),
(1, '测试主题 5', '测试用户 5', 0, 'offline', 'all', '{"default": {"name": "测试 5", "styles": {"color_primary": "#FF00FF"}}}', 10, 0);

-- 2. 创建测试购买记录
INSERT INTO `theme_purchase` 
(`theme_id`, `buyer_id`, `price_paid`, `purchase_time`, `is_refunded`)
VALUES 
(1, 2, 0, NOW(), 0),
(2, 2, 20, NOW(), 0),
(2, 3, 20, NOW(), 0),
(3, 3, 50, NOW(), 0),
(4, 4, 100, NOW(), 0);

-- 3. 创建测试收益记录
INSERT INTO `creator_earnings` 
(`creator_id`, `theme_id`, `amount`, `status`, `created_at`)
VALUES 
(1, 2, 20, 'pending', NOW()),
(1, 2, 20, 'pending', NOW()),
(1, 3, 50, 'pending', NOW()),
(1, 4, 100, 'withdrawn', NOW());

-- 4. 为特定游戏创建专属主题
INSERT INTO `theme_info` 
(`author_id`, `theme_name`, `author_name`, `price`, `status`, `applicable_scope`, `config_json`) 
VALUES 
(1, '贪吃蛇金色主题', '游戏官方', 200, 'on_sale', 'specific', 
 '{"default": {"name": "金色贪吃蛇", "assets": {"snake_body": "images/golden_snake.png"}}}'),
(1, '飞机大战星空主题', '游戏官方', 150, 'on_sale', 'specific', 
 '{"default": {"name": "星空飞机", "assets": {"plane": "images/starry_plane.png"}}}');

-- 5. 关联专属主题到对应游戏
INSERT INTO `theme_game_relation` 
(`theme_id`, `game_id`, `game_code`, `is_default`, `sort_order`)
VALUES 
((SELECT theme_id FROM theme_info WHERE theme_name = '贪吃蛇金色主题'), 
 (SELECT game_id FROM game WHERE game_code = 'snake-vue3' LIMIT 1), 
 'snake-vue3', 0, 4),
((SELECT theme_id FROM theme_info WHERE theme_name = '飞机大战星空主题'), 
 (SELECT game_id FROM game WHERE game_code = 'plane-shooter' LIMIT 1), 
 'plane-shooter', 0, 2);
```

---

## 🚀 执行步骤

### 1. 执行主迁移脚本（必须）
```bash
mysql -u kidsgame -p'Kidsgame2026!Secure' kids_game < theme-system-migration-v3.sql
```

### 2. 执行初始化脚本（推荐）
```bash
mysql -u kidsgame -p'Kidsgame2026!Secure' kids_game < theme-init-data.sql
```

### 3. 执行测试脚本（可选 - 仅开发环境）
```bash
# 仅开发/测试环境执行
mysql -u kidsgame -p'Kidsgame2026!Secure' kids_game < theme-test-data.sql
```

---

## 📊 表结构总览

```
┌─────────────────────────┐
│   theme_info            │  ← 主题信息（独立）
│   - theme_id (PK)       │
│   - author_id           │
│   - theme_name          │
│   - applicable_scope    │
│   - config_json         │
│   - price               │
│   - status              │
└──────────┬──────────────┘
           │ 1
           │
           │ N
           │
┌──────────▼──────────────┐
│   theme_game_relation   │  ← 关系表（多对多）
│   - relation_id (PK)    │
│   - theme_id (FK)       │
│   - game_id             │
│   - game_code           │
│   - is_default          │
└──────────┬──────────────┘
           │ N
           │
           │ 1
           │
┌──────────▼──────────────┐
│   game                  │  ← 游戏表（已存在）
│   - game_id (PK)        │
│   - game_code           │
└─────────────────────────┘

┌─────────────────────────┐
│   theme_purchase        │  ← 购买记录
│   - purchase_id (PK)    │
│   - theme_id (FK)       │
│   - buyer_id            │
│   - price_paid          │
└─────────────────────────┘

┌─────────────────────────┐
│   creator_earnings      │  ← 创作者收益
│   - earnings_id (PK)    │
│   - creator_id          │
│   - theme_id (FK)       │
│   - amount              │
│   - status              │
└─────────────────────────┘

┌─────────────────────────┐
│   theme_assets          │  ← 主题资源（可选）
│   - asset_id (PK)       │
│   - theme_id (FK)       │
│   - asset_key           │
│   - file_path           │
└─────────────────────────┘
```

---

## ⚠️ 注意事项

### 1. 执行顺序
- ✅ 先执行 `theme-system-migration-v3.sql`（创建表）
- ✅ 再执行 `theme-init-data.sql`（初始化数据）
- ⏳ 最后执行 `theme-test-data.sql`（测试数据，可选）

### 2. 外键约束
- `theme_game_relation.theme_id` → `theme_info.theme_id` (CASCADE DELETE)
- `theme_assets.theme_id` → `theme_info.theme_id` (CASCADE DELETE)
- 删除主题时，关联的关系和资源会自动删除

### 3. 唯一约束
- `theme_game_relation` 表中 `(theme_id, game_id)` 必须唯一
- 同一主题对同一游戏只能有一条关系记录

### 4. 索引优化
- 查询主题列表：使用 `idx_status` 和 `idx_applicable_scope`
- 查询游戏主题：使用 `idx_game_id` 和 `idx_game_code`
- 查询默认主题：使用 `idx_is_default`

### 5. 数据一致性
- 创建主题后，必须通过 `theme_game_relation` 关联到游戏
- 设置默认主题时，确保主题已关联到该游戏
- 删除主题前，检查是否有未完成的购买记录

---

## 📞 常用查询 SQL

### 查询游戏的所有主题
```sql
SELECT t.* 
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_id = 1 AND r.game_code = 'snake-vue3'
  AND t.status = 'on_sale'
ORDER BY r.is_default DESC, r.sort_order ASC;
```

### 查询主题的关联游戏
```sql
SELECT r.game_id, r.game_code, r.is_default
FROM theme_game_relation r
WHERE r.theme_id = 1
ORDER BY r.is_default DESC, r.sort_order ASC;
```

### 查询游戏的默认主题
```sql
SELECT t.*
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_id = 1 AND r.is_default = 1
LIMIT 1;
```

### 查询通用主题
```sql
SELECT * FROM theme_info
WHERE applicable_scope = 'all' AND status = 'on_sale'
ORDER BY created_at DESC;
```

### 查询专属主题
```sql
SELECT t.*, r.game_code
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE t.applicable_scope = 'specific' AND r.game_id = 1;
```

---

## 📁 文件位置

```
kids-game-backend/
├── theme-system-migration-v3.sql    ← 主迁移脚本
├── theme-init-data.sql              ← 初始化数据（可选）
├── theme-test-data.sql              ← 测试数据（可选）
└── THEME_DATABASE_SCRIPTS.md        ← 本文档
```

---

*文档生成时间：2026-03-16 00:20 GMT+8*
