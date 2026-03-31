-- ============================================
-- 游戏注册脚本 - 坦克大战
-- 生成时间：2026-03-31
-- ============================================

-- 插入游戏基本信息
INSERT INTO t_game (
  game_code,           -- 游戏标识码（唯一）
  game_name,           -- 游戏名称（中文）
  game_url,            -- 游戏访问地址
  game_version,        -- 游戏版本
  game_description,    -- 游戏描述
  game_type,           -- 游戏类型（ACTION=动作）
  status,              -- 状态（1=启用，0=禁用）
  created_at,          -- 创建时间（毫秒级时间戳）
  updated_at,          -- 更新时间（毫秒级时间戳）
  created_by,          -- 创建者
  updated_by           -- 更新者
) VALUES (
  'tank-battle',                   -- game_code: 坦克大战
  '坦克大战',                     -- game_name: 中文名称
  'http://localhost:5175',         -- game_url: 本地开发地址
  '1.0.0',                         -- game_version: 版本号
  '经典坦克大战网页小游戏，消灭敌人保护基地',  -- game_description: 描述
  'ACTION',                        -- game_type: 动作类型
  1,                               -- status: 启用状态
  1743408000000,                   -- created_at: 当前时间戳
  1743408000000,                   -- updated_at: 当前时间戳
  'AI Assistant',                  -- created_by: 创建者
  'AI Assistant'                   -- updated_by: 更新者
);

-- 验证插入结果
SELECT game_code, game_name, game_url, status FROM t_game WHERE game_code = 'tank-battle';
