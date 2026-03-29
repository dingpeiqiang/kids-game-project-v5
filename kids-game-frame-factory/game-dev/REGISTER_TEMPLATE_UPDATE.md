# 注册脚本模板更新 - 基于飞机大战实战优化

## 📋 问题描述

之前的注册脚本模板（v3）存在以下问题：

1. **过于复杂**：包含了大量可选的配置表（t_game_config、t_leaderboard_config、t_game_mode_config）
2. **脱离实战**：与真实的飞机大战注册脚本不一致
3. **容易混淆**：开发者不知道哪些是必需的，哪些是可选的
4. **缺少主题注册**：没有包含 t_theme_info 表的注册

## 🎯 优化目标

基于飞机大战的真实注册脚本，创建简洁、实用的 v4 版本模板。

## ✅ 主要改进

### 改进 1：简化结构，只保留必需内容

**之前（v3）**：
```sql
-- 1. 注册游戏 (t_game)
-- 2. 游戏基础参数配置 (t_game_config) ❌ 删除
-- 3. 排行榜维度配置 (t_leaderboard_config) ❌ 删除
-- 4. 游戏模式配置 (t_game_mode_config) ❌ 删除
-- 5. 主题信息注册（可选但推荐）❌ 改为必须
```

**现在（v4）**：
```sql
-- 1. 注册游戏 (t_game) ✅ 必需
-- 2. 注册游戏主题 (t_theme_info) ✅ 必需
```

### 改进 2：与飞机大战实战保持一致

**参考对象**：`kids-game-house/games/plane-shooter/register-game.sql`

**关键特性**：
- ✅ 完整的字段列表（包含所有必需字段）
- ✅ 使用 `LAST_INSERT_ID()` 获取游戏 ID
- ✅ 通过 `owner_id` 关联游戏和主题
- ✅ GTRS 配置暂时为 NULL（由资源生成脚本填充）

### 改进 3：明确配置变量

**新增变量**：
```sql
SET @GAME_TAGS = '射击，飞机，战斗，闯关，经典';  -- tags: 标签列表
SET @GAME_COVER = '';                             -- 封面图路径
SET @PLAY_GUIDE = '__PLAY_GUIDE__';               -- 玩法指南
SET @GAME_CONFIG_JSON = '{"difficulty": [...]}';  -- game_config JSON
```

**优化说明**：
- 更清晰的注释（例如：小写唯一、分类示例）
- 更实用的默认值（例如：category 使用大写 SHOOTER）
- 更多可配置项（例如：tags、play_guide）

### 改进 4：强调正确的流程顺序

**重要提醒**（在多个位置强调）：
```
必须先注册再资源生成，顺序不可颠倒！

1. 执行注册脚本 → mysql < register-game.sql
2. 生成 GTRS 资源  → node generate-resources.mjs
3. 启动测试      → npm run dev
```

## 📊 详细对比

### 字段对比

| 字段 | v3 模板 | v4 模板 | 飞机大战实战 | 状态 |
|------|--------|--------|------------|------|
| **t_game 表** | | | | |
| game_code | ✅ | ✅ | ✅ | 保留 |
| game_name | ✅ | ✅ | ✅ | 保留 |
| category | ✅ | ✅ | ✅ | 保留 |
| grade | ✅ | ✅ | ✅ | 保留 |
| tags | ❌ (NULL) | ✅ | ✅ | **新增** |
| icon_url | ✅ | ✅ | ✅ | 保留 |
| cover_url | ✅ | ✅ | ✅ | 保留 |
| resource_url | ✅ | ✅ | ✅ | 保留 |
| description | ✅ | ✅ | ✅ | 保留 |
| module_path | ✅ | ✅ | ✅ | 保留 |
| game_url | ✅ | ✅ | ✅ | 保留 |
| game_secret | ✅ | ✅ | ✅ | 保留 |
| game_config | ❌ (NULL) | ✅ | ✅ | **新增** |
| play_guide | ❌ (NULL) | ✅ | ✅ | **新增** |
| status | ✅ | ✅ | ✅ | 保留 |
| sort_order | ✅ | ✅ | ✅ | 保留 |
| is_featured | ✅ | ✅ | ✅ | 保留 |
| consume_points_per_minute | ✅ | ✅ | ✅ | 保留 |
| min_fatigue_to_start | ✅ | ✅ | ✅ | 保留 |
| online_count | ✅ | ✅ | ✅ | 保留 |
| creator_id | ✅ | ✅ | ✅ | 保留 |
| publish_time | ✅ | ✅ | ✅ | 保留 |
| create_time | ✅ | ✅ | ✅ | 保留 |
| update_time | ✅ | ✅ | ✅ | 保留 |
| ~~deleted~~ | ✅ | ❌ | ❌ | **删除** |
| ~~total_play_count~~ | ✅ | ❌ | ❌ | **删除** |
| ~~total_play_duration~~ | ✅ | ❌ | ❌ | **删除** |
| ~~average_rating~~ | ✅ | ❌ | ❌ | **删除** |
| **t_theme_info 表** | | | | |
| 完整字段 | ❌ (注释掉) | ✅ | ✅ | **升级为必须** |
| config_json | ✅ (完整 GTRS) | ❌ (NULL) | ✅ (完整 GTRS) | **优化** |
| **其他配置表** | | | | |
| t_game_config | ✅ | ❌ | ❌ | **删除** |
| t_leaderboard_config | ✅ | ❌ | ❌ | **删除** |
| t_game_mode_config | ✅ | ❌ | ❌ | **删除** |

### 行数对比

| 项目 | v3 模板 | v4 模板 | 变化 |
|------|--------|--------|------|
| 总行数 | 211 行 | 175 行 | -36 行 ⬇️ |
| 配置变量 | 10 个 | 16 个 | +6 个 ➡️ |
| INSERT 语句 | 5 个 | 2 个 | -3 个 ⬇️ |
| 注释行数 | ~30 行 | ~40 行 | +10 行 ➡️ |

## 🚀 使用指南

### 快速开始

```bash
# 1. 复制模板到游戏目录
cp .lingma/skills/game-dev/templates/register-game.template.sql \
   kids-game-house/games/my-game/register-game.sql

# 2. 编辑配置变量
vim kids-game-house/games/my-game/register-game.sql
# 修改顶部的 SET 变量

# 3. 执行注册
mysql -u root -p kids_game < kids-game-house/games/my-game/register-game.sql

# 4. 验证
SELECT * FROM t_game WHERE game_code = 'my-game';
SELECT * FROM t_theme_info WHERE theme_name LIKE '%我的游戏%';
```

### 配置示例

```sql
-- ✈️ 飞机大战示例
SET @GAME_CODE = 'plane-shooter';
SET @GAME_NAME = '✈️ 飞机大战';
SET @GAME_CATEGORY = 'SHOOTER';
SET @GAME_GRADE = '三年级';
SET @GAME_TAGS = '射击，飞机，战斗，闯关，经典';
SET @GAME_ICON = '/themes/default/images/ui/game-icon.png';
SET @GAME_DESCRIPTION = '经典飞机大战游戏！驾驶战机消灭敌机...';
SET @PLAY_GUIDE = '触摸或鼠标拖动控制飞机移动，自动发射子弹...';
```

## ⚠️ 重要注意事项

### 1. 字段格式要求

- **game_code**: 小写且唯一（如 `plane-shooter`）
- **category**: 大写（如 `SHOOTER`、`PUZZLE`）
- **grade**: 中文或英文（如 `三年级`、`primary`）
- **tags**: 逗号分隔的字符串
- **时间戳**: UNIX_TIMESTAMP() * 1000（毫秒级）

### 2. 主题注册要求

- **必须执行**：每个游戏必须有至少一个主题
- **owner_id**: 使用 `LAST_INSERT_ID()` 自动获取
- **config_json**: 暂时为 NULL，由 `generate-resources.mjs` 填充
- **is_default**: 必须为 1（表示默认主题）

### 3. 流程顺序要求

```
❌ 错误顺序：
1. 生成资源    ← 此时还未注册，GTRS 路径错误
2. 注册游戏
3. 启动测试

✅ 正确顺序：
1. 注册游戏    ← 先创建数据库记录
2. 生成资源    ← 根据注册信息生成 GTRS
3. 启动测试    ← 一切正常
```

## 📚 相关文档

- **[飞机大战注册脚本](../../kids-game-house/games/plane-shooter/register-game.sql)** - 实战参考
- **[SKILL.md](../SKILL.md)** - 游戏开发主文档
- **[FULL_WORKFLOW.md](./docs/FULL_WORKFLOW.md)** - 完整流程指南
- **[WORKFLOW_OPTIMIZATION_SUMMARY.md](./WORKFLOW_OPTIMIZATION_SUMMARY.md)** - 流程优化总结

## 💡 最佳实践

1. **先参考再修改**
   - 查看飞机大战的注册脚本
   - 理解每个字段的作用
   - 根据实际需求调整

2. **使用变量配置**
   - 所有配置集中在顶部 SET 变量
   - 便于管理和复用
   - 减少硬编码

3. **验证必不可少**
   ```sql
   -- 验证游戏注册
   SELECT * FROM t_game WHERE game_code = 'your-game';
   
   -- 验证主题注册
   SELECT * FROM t_theme_info WHERE owner_id = (
     SELECT id FROM t_game WHERE game_code = 'your-game'
   );
   ```

4. **保持简洁**
   - 只注册必需的内容
   - 不要添加不必要的配置表
   - 让专业工具做专业事（GTRS 交给资源生成脚本）

## 🎉 总结

通过这次更新，我们将注册脚本模板从"复杂且不实用"转变为"简洁且实战化"：

- ✅ **减少了 36 行代码**（删除冗余配置）
- ✅ **增加了 6 个配置变量**（增强灵活性）
- ✅ **提升了代码质量**（与实战一致）
- ✅ **改善了开发体验**（更清晰、更易用）

**核心理念**：少即是多，实战优先！🚀
