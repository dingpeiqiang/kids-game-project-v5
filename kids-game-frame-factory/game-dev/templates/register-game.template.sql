-- ============================================================
-- 🎮 游戏注册脚本（通用版 v4 - 基于飞机大战实战优化）
-- ============================================================
-- 使用说明:
-- 1. 确保数据库已初始化 (schema_v2.sql)
-- 2. 修改底部的游戏配置变量
-- 3. 执行此脚本注册游戏和主题
-- 4. 上传 GTRS 资源配置到后端
--
-- 快速执行:
--   mysql -u root -p kids_game < register-game.sql
-- ============================================================

-- =============================================
-- ⭐ 游戏配置变量（修改这里）
-- =============================================
SET @GAME_CODE = '__GAME_CODE__';              -- 例如：plane-shooter（小写唯一）
SET @GAME_NAME = '__GAME_NAME__';              -- 例如：✈️ 飞机大战
SET @GAME_CATEGORY = 'SHOOTER';                -- 分类：SHOOTER/PUZZLE/MATH/LANGUAGE/SCIENCE/ART
SET @GAME_GRADE = '三年级';                    -- 适龄阶段：一年级/二年级/三年级/middle/high
SET @GAME_TAGS = '射击，飞机，战斗，闯关，经典'; -- tags: 标签列表（逗号分隔）
SET @GAME_ICON = '/themes/default/images/ui/game-icon.png';  -- 图标路径
SET @GAME_COVER = '';                          -- 封面图路径（可选）
SET @GAME_DESCRIPTION = '__DESCRIPTION__';     -- 游戏描述
SET @PLAY_GUIDE = '__PLAY_GUIDE__';            -- 玩法指南（可选）
SET @MODULE_PATH = NULL;                       -- 前端模块路径（NULL 表示使用默认）
SET @GAME_URL = 'http://localhost:3005';       -- 游戏访问地址
SET @GAME_CONFIG_JSON = '{"difficulty": ["easy", "normal", "hard"]}'; -- game_config JSON
SET @CREATOR_ID = NULL;                        -- 创建人 ID（NULL 表示系统创建）
SET @STATUS = 2;                               -- 状态：0-草稿，1-待审核，2-已上架，3-已下架，4-驳回
SET @SORT_ORDER = 10;                          -- 排序顺序
SET @IS_FEATURED = 0;                          -- 是否推荐：0-否，1-是

-- =============================================
-- 1. 注册游戏信息（完整字段版）
-- =============================================
INSERT INTO t_game (
    game_code, 
    game_name, 
    category, 
    grade, 
    tags,
    icon_url, 
    cover_url, 
    resource_url, 
    description, 
    module_path,
    game_url, 
    game_secret, 
    game_config,
    play_guide,
    status, 
    sort_order,
    is_featured,
    consume_points_per_minute,
    min_fatigue_to_start,
    online_count,
    creator_id,
    publish_time,
    create_time, 
    update_time
) VALUES (
    @GAME_CODE,                              -- game_code: 游戏标识码
    @GAME_NAME,                              -- game_name: 游戏名称
    UPPER(@GAME_CATEGORY),                   -- category: 游戏类型（大写）
    @GAME_GRADE,                             -- grade: 适合年级
    @GAME_TAGS,                              -- tags: 标签列表
    @GAME_ICON,                              -- icon_url: 图标
    @GAME_COVER,                             -- cover_url: 封面图
    NULL,                                    -- resource_url: 资源包 CDN 地址
    @GAME_DESCRIPTION,                       -- description: 游戏描述
    @MODULE_PATH,                            -- module_path: 前端模块路径
    @GAME_URL,                               -- game_url: 游戏访问地址
    NULL,                                    -- game_secret: 游戏密钥
    @GAME_CONFIG_JSON,                       -- game_config: 游戏配置 JSON
    @PLAY_GUIDE,                             -- play_guide: 玩法指南
    @STATUS,                                 -- status: 状态
    @SORT_ORDER,                             -- sort_order: 排序
    @IS_FEATURED,                            -- is_featured: 是否推荐
    1,                                       -- consume_points_per_minute: 每分钟消耗疲劳点数
    0,                                       -- min_fatigue_to_start: 启动所需最低疲劳度
    0,                                       -- online_count: 在线人数
    @CREATOR_ID,                             -- creator_id: 创建人 ID
    NULL,                                    -- publish_time: 上架时间
    UNIX_TIMESTAMP() * 1000,                 -- create_time: 创建时间
    UNIX_TIMESTAMP() * 1000                  -- update_time: 更新时间
);

-- 获取刚插入的游戏 ID
SET @game_id = LAST_INSERT_ID();

-- =============================================
-- 2. 注册游戏主题信息（必须！）
-- ⚠️ 注意：需要先获取刚插入的游戏 ID
-- =============================================
INSERT INTO t_theme_info (
    author_id,
    is_official,
    owner_type,
    owner_id,
    theme_name,
    author_name,
    price,
    status,
    download_count,
    total_revenue,
    thumbnail_url,
    description,
    config_json,
    is_default,
    created_at,
    updated_at
) VALUES (
    0,                                             -- author_id: 作者 ID
    1,                                             -- is_official: 是否官方主题
    'GAME',                                        -- owner_type: GAME/APPLICATION
    SELECT game_id FROM t_game WHERE game_code = @GAME_CODE,                                      -- owner_id: 游戏 ID（通过 LAST_INSERT_ID() 获取）
    CONCAT(@GAME_NAME, ' - 默认主题'),             -- theme_name: 主题名称
    '官方团队',                                    -- author_name: 作者名称
    0,                                             -- price: 价格（游戏币）
    'on_sale',                                     -- status: 状态 (on_sale/offline/pending)
    0,                                             -- download_count: 下载次数
    0,                                             -- total_revenue: 总收益
    @GAME_ICON,                                    -- thumbnail_url: 缩略图
    CONCAT(@GAME_NAME, '官方默认主题'),             -- description: 主题描述
    NULL,                                          -- config_json: GTRS 配置（暂时为 NULL，后续由资源生成脚本填充）
    1,                                             -- is_default: 是否为默认主题
    NOW(),                                         -- created_at: 创建时间
    NOW()                                          -- updated_at: 更新时间
);

-- =============================================
-- ✅ 注册完成!
-- =============================================
-- 说明：
-- - 游戏与主题的关联通过 t_theme_info.owner_id 字段实现
-- - 不再需要独立的关联表
-- - GTRS 配置由 generate-resources.mjs 脚本生成并更新
-- =============================================
-- 后续步骤:
-- 1. 验证数据:
--    SELECT * FROM t_game WHERE game_code = @GAME_CODE;
--    SELECT * FROM t_theme_info WHERE theme_name = CONCAT(@GAME_NAME, ' - 默认主题');
--
-- 2. 生成 GTRS 资源:
--    node generate-resources.mjs
--
-- 3. 测试游戏:
--    访问 http://localhost:3005
-- ============================================================

-- =============================================
-- 使用说明
-- =============================================
-- 1. 修改顶部的游戏配置变量
-- 2. 执行脚本：mysql -u root -p kids_game < register-game.sql
-- 3. 验证：查询下面 SELECT 语句的结果
-- 4. 生成资源：node generate-resources.mjs
-- 5. 测试：访问 http://localhost:3005
-- 
-- 注意事项：
-- - 所有时间戳使用毫秒级：UNIX_TIMESTAMP() * 1000
-- - game_code 必须唯一且小写（如 plane-shooter）
-- - category 使用大写（如 SHOOTER/PUZZLE）
-- - grade 使用中文或英文（如 三年级/primary）
-- - 必须先注册再资源生成，顺序不可颠倒！
-- =============================================

-- =============================================
-- 验证查询
-- =============================================
SELECT '✅ 游戏注册完成！' AS status;
SELECT * FROM t_game WHERE game_code = @GAME_CODE;
SELECT * FROM t_theme_info WHERE theme_name = CONCAT(@GAME_NAME, ' - 默认主题');
