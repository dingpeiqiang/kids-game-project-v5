-- ============================================================
-- 游戏注册 SQL 脚本（对应 schema_v2.sql，请勿使用旧版本表结构）
-- ============================================================
-- 使用前请替换以下占位符（带 * 为必填）：
--
--   *__GAME_CODE__        游戏唯一编码，与目录名一致（如：puzzle）
--   *__GAME_NAME__        游戏名称（如：拼图游戏）
--   *__GAME_URL__         游戏访问地址（如：http://localhost:5173）
--   *__CATEGORY__         分类：MATH / LANGUAGE / SCIENCE / ART / PUZZLE
--   *__GRADE__            适龄阶段（如：一年级、3-6岁、小学低年级）
--   *__DESCRIPTION__      游戏描述
--   *__THEME_NAME__       主题名称（如：拼图游戏 - 默认主题）
--   *__AUTHOR_NAME__      主题作者名称（如：官方团队）
--   *__THEME_DESC__       主题描述
--   *__GTRS_JSON__        完整的 GTRS v1.0.0 JSON（从 src/config/GTRS.json 复制后压缩为单行）
--
--   __TAGS__              标签（逗号分隔，可留 NULL，如：益智,休闲）
--   __ICON_URL__          游戏图标 URL（可留 NULL 或 ''）
--   __COVER_URL__         游戏封面 URL（可留 NULL 或 ''）
--   __THUMB_URL__         主题缩略图 URL（可留 ''）
--   __CREATOR_ID__        创建人用户 ID（可留 NULL）
--   __SORT_ORDER__        排序权重（默认 0，数字越大越靠前）
--   __CONSUME_POINTS__    每分钟消耗游学币（默认 1）
-- ============================================================
-- ⚠️ 重要说明：
--   - 主题表是 t_theme_info（有 t_ 前缀），时间字段为 DATETIME 类型（填 NOW()，不是毫秒）
--   - is_official=0 表示游戏方维护的主题（非平台级官方主题）
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 第 1 步：插入/更新游戏记录（幂等，重复执行安全）
-- ────────────────────────────────────────────────────────────
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    tags,
    icon_url,
    cover_url,
    resource_url,
    screenshot_urls,
    game_url,
    game_secret,
    game_config,
    description,
    play_guide,
    module_path,
    status,
    sort_order,
    is_featured,
    consume_points_per_minute,
    min_fatigue_to_start,
    online_count,
    total_play_count,
    total_play_duration,
    average_rating,
    create_time,
    update_time,
    deleted,
    creator_id,
    publish_time
)
VALUES (
    '__GAME_CODE__',                    -- * game_code         游戏唯一编码（与目录名一致）
    '__GAME_NAME__',                    -- * game_name         游戏名称
    '__CATEGORY__',                     -- * category          MATH/LANGUAGE/SCIENCE/ART/PUZZLE
    '__GRADE__',                        -- * grade             适龄阶段（如：一年级）
    NULL,                               --   tags              标签，逗号分隔（如：益智,休闲）
    NULL,                               --   icon_url          图标 URL
    NULL,                               --   cover_url         封面 URL
    NULL,                               --   resource_url      资源 CDN 地址
    NULL,                               --   screenshot_urls   截图 URL 列表（JSON 数组或逗号分隔）
    '__GAME_URL__',                     -- * game_url          游戏访问 URL（独立部署地址）
    NULL,                               --   game_secret       游戏密钥（签名校验用，暂不启用填 NULL）
    NULL,                               --   game_config       透传给游戏的 JSON 配置（可选）
    '__DESCRIPTION__',                  -- * description       游戏描述
    NULL,                               --   play_guide        操作说明（可选，富文本）
    NULL,                               --   module_path       前端模块路径（嵌入模式用，独立部署填 NULL）
    0,                                  -- * status            0=草稿（开发中），发布后改 2
    0,                                  --   sort_order        排序权重（越大越靠前）
    0,                                  --   is_featured       是否推荐：0=否，1=是
    1,                                  --   consume_points_per_minute 每分钟消耗游学币
    0,                                  --   min_fatigue_to_start      启动所需最低游学币度
    0,                                  --   online_count      在线人数（运行时自动维护）
    0,                                  --   total_play_count  累计游玩次数
    0,                                  --   total_play_duration 累计游玩时长（秒）
    0.00,                               --   average_rating    平均评分
    UNIX_TIMESTAMP(NOW()) * 1000,       --   create_time       创建时间（毫秒时间戳）
    UNIX_TIMESTAMP(NOW()) * 1000,       --   update_time       更新时间（毫秒时间戳）
    0,                                  --   deleted           逻辑删除（0=正常）
    NULL,                               --   creator_id        创建人 ID（无后台账号填 NULL）
    NULL                                --   publish_time      上架时填写（草稿阶段为 NULL）
)
ON DUPLICATE KEY UPDATE
    game_name                = VALUES(game_name),
    category                 = VALUES(category),
    grade                    = VALUES(grade),
    game_url                 = VALUES(game_url),
    icon_url                 = VALUES(icon_url),
    cover_url                = VALUES(cover_url),
    description              = VALUES(description),
    update_time              = UNIX_TIMESTAMP(NOW()) * 1000;

-- ────────────────────────────────────────────────────────────
-- 第 2 步：查询游戏 ID（后续步骤需要）
-- ────────────────────────────────────────────────────────────
SET @game_id = (
    SELECT game_id FROM t_game
    WHERE game_code = '__GAME_CODE__' AND deleted = 0
    LIMIT 1
);
SELECT CONCAT('✅ game_id = ', IFNULL(@game_id, '❌ 未找到，请检查 game_code')) AS result;

-- ────────────────────────────────────────────────────────────
-- 第 3 步：注册默认主题（幂等，重复执行安全）
-- ────────────────────────────────────────────────────────────
-- ⚠️ 替换前请确认：
--   1. __GTRS_JSON__ 必须是压缩为单行的合法 JSON（从 src/config/GTRS.json 复制后用工具压缩）
--   2. is_official=0 表示游戏方维护的主题（不是平台官方主题）
--   3. 主题表是 t_theme_info（有 t_ 前缀）
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
)
VALUES (
    0,                                  -- author_id    官方/内置主题填 0
    0,                                  -- is_official  0=游戏方维护（非平台级官方）
    'GAME',                             -- owner_type   固定填 GAME
    @game_id,                           -- owner_id     上一步查到的 game_id
    '__THEME_NAME__',                   -- theme_name   主题名称（如：拼图游戏 - 默认主题）
    '__AUTHOR_NAME__',                  -- author_name  作者名称（如：官方团队）
    0,                                  -- price        0=免费
    'on_sale',                          -- status       on_sale=上架 / offline=下架 / pending=待审核
    0,                                  -- download_count
    0,                                  -- total_revenue
    '',                                 -- thumbnail_url 缩略图（可留空）
    '__THEME_DESC__',                   -- description
    '__GTRS_JSON__',                    -- config_json  完整 GTRS v1.0.0 单行 JSON（见 src/config/GTRS.json）
    1,                                  -- is_default   1=默认主题
    NOW(),                              -- created_at   DATETIME 类型（不是毫秒时间戳！）
    NOW()                               -- updated_at
)
ON DUPLICATE KEY UPDATE
    theme_name    = VALUES(theme_name),
    description   = VALUES(description),
    thumbnail_url = VALUES(thumbnail_url),
    config_json   = VALUES(config_json),
    updated_at    = NOW();

SET @theme_id = (
    SELECT theme_id FROM t_theme_info
    WHERE owner_type = 'GAME' AND owner_id = @game_id AND is_default = 1
    LIMIT 1
);
SELECT CONCAT('✅ theme_id = ', IFNULL(@theme_id, '❌ 主题插入失败')) AS result;

-- ────────────────────────────────────────────────────────────
-- 第 4 步：上架游戏（游戏测试通过后执行）
-- ────────────────────────────────────────────────────────────
-- UPDATE t_game
-- SET    status       = 2,
--        publish_time = UNIX_TIMESTAMP(NOW()) * 1000,
--        update_time  = UNIX_TIMESTAMP(NOW()) * 1000
-- WHERE  game_code = '__GAME_CODE__' AND deleted = 0;

-- ────────────────────────────────────────────────────────────
-- 第 5 步：验证注册结果
-- ────────────────────────────────────────────────────────────
SELECT
    game_id,
    game_code,
    game_name,
    category,
    grade,
    game_url,
    CASE status
        WHEN 0 THEN '草稿'
        WHEN 1 THEN '待审核'
        WHEN 2 THEN '已上架'
        WHEN 3 THEN '已下架'
        WHEN 4 THEN '审核驳回'
        ELSE CONCAT('未知(', status, ')')
    END AS status_text,
    is_featured,
    consume_points_per_minute,
    FROM_UNIXTIME(create_time / 1000) AS created_at
FROM t_game
WHERE game_code = '__GAME_CODE__' AND deleted = 0;

-- 验证主题
SELECT
    theme_id,
    theme_name,
    owner_type,
    owner_id,
    status AS theme_status,
    is_default,
    created_at
FROM t_theme_info
WHERE owner_type = 'GAME' AND owner_id = @game_id;
