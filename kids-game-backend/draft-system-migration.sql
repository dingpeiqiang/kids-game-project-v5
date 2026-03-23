-- ============================================
-- 通用草稿系统数据库迁移脚本
-- ============================================
-- 说明：这是一个通用的草稿系统，支持多种内容类型的草稿存储
-- 支持的内容类型：THEME, GAME_CONFIG, ARTICLE, USER_CONFIG 等
-- ============================================

USE kids_game;

-- 删除旧的主题草稿表（如果存在）
DROP TABLE IF EXISTS theme_draft;

-- 创建通用草稿表
CREATE TABLE draft (
    draft_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '草稿ID',
    
    -- 作者信息
    author_id BIGINT NOT NULL COMMENT '作者ID',
    author_type VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '作者类型：USER-用户, ADMIN-管理员',
    
    -- 内容类型（核心）
    content_type VARCHAR(50) NOT NULL COMMENT '内容类型：THEME-主题, GAME_CONFIG-游戏配置, ARTICLE-文章, USER_CONFIG-用户配置等',
    
    -- 草稿基本信息
    draft_name VARCHAR(255) NOT NULL COMMENT '草稿名称',
    draft_title VARCHAR(255) COMMENT '草稿标题（可选）',
    
    -- 草稿内容（JSON格式）
    content_json TEXT NOT NULL COMMENT '草稿内容JSON',
    
    -- 元数据（JSON格式，用于存储自定义字段）
    metadata_json TEXT COMMENT '元数据JSON，用于存储业务相关的扩展信息',
    
    -- 缩略图
    thumbnail_url VARCHAR(500) COMMENT '缩略图URL',
    
    -- 关联信息（可选，用于关联到具体实体）
    related_entity_type VARCHAR(50) COMMENT '关联实体类型',
    related_entity_id BIGINT COMMENT '关联实体ID',
    
    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '状态：draft-草稿, archived-已归档, published-已发布',
    
    -- 数据大小
    content_size INT DEFAULT 0 COMMENT '内容大小（字节）',
    
    -- 版本信息
    version INT DEFAULT 1 COMMENT '草稿版本号',
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    published_at DATETIME COMMENT '发布时间',
    
    -- 标签（逗号分隔）
    tags VARCHAR(500) COMMENT '标签（逗号分隔）',
    
    -- 备注
    remark TEXT COMMENT '备注说明',
    
    INDEX idx_author (author_id, author_type),
    INDEX idx_content_type (content_type),
    INDEX idx_status (status),
    INDEX idx_updated_at (updated_at),
    INDEX idx_related (related_entity_type, related_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用草稿表';

-- 创建草稿版本历史表（支持草稿历史版本）
CREATE TABLE draft_version (
    version_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '版本ID',
    draft_id BIGINT NOT NULL COMMENT '草稿ID',
    version INT NOT NULL COMMENT '版本号',
    
    -- 快照内容
    content_json TEXT NOT NULL COMMENT '快照内容JSON',
    metadata_json TEXT COMMENT '快照元数据JSON',
    
    -- 变更说明
    change_log VARCHAR(255) COMMENT '变更说明',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    created_by BIGINT COMMENT '创建人ID',
    
    UNIQUE KEY uk_draft_version (draft_id, version),
    INDEX idx_draft_id (draft_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (draft_id) REFERENCES draft(draft_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='草稿版本历史表';

-- 创建草稿分类表（可选，用于组织草稿）
CREATE TABLE draft_category (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
    category_code VARCHAR(50) NOT NULL UNIQUE COMMENT '分类代码',
    content_type VARCHAR(50) COMMENT '支持的内容类型（空表示支持所有类型）',
    parent_id BIGINT COMMENT '父分类ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    description VARCHAR(255) COMMENT '分类描述',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_parent (parent_id),
    INDEX idx_content_type (content_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='草稿分类表';

-- 创建草稿-分类关联表
CREATE TABLE draft_category_relation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    draft_id BIGINT NOT NULL COMMENT '草稿ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_draft_category (draft_id, category_id),
    INDEX idx_draft_id (draft_id),
    INDEX idx_category_id (category_id),
    
    FOREIGN KEY (draft_id) REFERENCES draft(draft_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES draft_category(category_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='草稿分类关联表';

-- ============================================
-- 插入默认分类数据
-- ============================================
INSERT INTO draft_category (category_name, category_code, content_type, sort_order, description) VALUES
('主题草稿', 'THEME_DRAFT', 'THEME', 1, 'GTRS主题编辑器草稿'),
('游戏配置', 'GAME_CONFIG_DRAFT', 'GAME_CONFIG', 2, '游戏配置草稿'),
('内容创作', 'CONTENT_DRAFT', NULL, 3, '通用内容创作草稿');

-- ============================================
-- 创建视图：草稿统计
-- ============================================
CREATE OR REPLACE VIEW v_draft_statistics AS
SELECT 
    author_id,
    author_type,
    content_type,
    status,
    COUNT(*) as draft_count,
    SUM(content_size) as total_size,
    MIN(created_at) as first_created_at,
    MAX(updated_at) as last_updated_at
FROM draft
GROUP BY author_id, author_type, content_type, status;

-- ============================================
-- 创建存储过程：清理过期草稿
-- ============================================
DELIMITER $$

CREATE PROCEDURE sp_cleanup_expired_drafts(
    IN p_days INT,
    IN p_author_id BIGINT,
    IN p_content_type VARCHAR(50)
)
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    
    DELETE FROM draft 
    WHERE status = 'draft'
      AND updated_at < DATE_SUB(NOW(), INTERVAL p_days DAY)
      AND (p_author_id IS NULL OR author_id = p_author_id)
      AND (p_content_type IS NULL OR content_type = p_content_type);
    
    SET deleted_count = ROW_COUNT();
    
    SELECT deleted_count as deleted_drafts;
END$$

DELIMITER ;

-- ============================================
-- 创建触发器：草稿更新时自动保存版本历史
-- ============================================
DELIMITER $$

CREATE TRIGGER tr_draft_update_version
AFTER UPDATE ON draft
FOR EACH ROW
BEGIN
    -- 如果内容发生变化且不是版本号更新，则保存版本历史
    IF OLD.content_json != NEW.content_json THEN
        -- 插入版本历史
        INSERT INTO draft_version (draft_id, version, content_json, metadata_json, created_by)
        VALUES (NEW.draft_id, NEW.version, NEW.content_json, NEW.metadata_json, NEW.author_id);
        
        -- 更新版本号
        UPDATE draft SET version = NEW.version + 1 WHERE draft_id = NEW.draft_id;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- 说明文档
-- ============================================
/*
字段说明：

draft 表：
- content_type: 支持的内容类型枚举
  * THEME: GTRS主题
  * GAME_CONFIG: 游戏配置
  * ARTICLE: 文章/内容
  * USER_CONFIG: 用户配置
  * 其他自定义类型

- status: 草稿状态
  * draft: 草稿状态
  * archived: 已归档
  * published: 已发布（从草稿正式发布）

- metadata_json: 元数据，用于存储业务相关的扩展信息
  例如：主题相关的游戏ID、作者信息等

版本历史：
- 每次草稿内容更新时自动保存快照
- 支持回滚到历史版本
- 最多保留 N 个历史版本（可配置）

分类系统：
- 支持多级分类
- 支持按内容类型过滤
- 一个草稿可以属于多个分类

使用示例：

1. 保存主题草稿
INSERT INTO draft (author_id, content_type, draft_name, content_json, metadata_json)
VALUES (1, 'THEME', '我的主题草稿', '{...}', '{"ownerType": "GAME", "ownerId": 1}');

2. 查询用户的所有草稿
SELECT * FROM draft WHERE author_id = 1;

3. 查询主题类型的草稿
SELECT * FROM draft WHERE content_type = 'THEME';

4. 查询统计信息
SELECT * FROM v_draft_statistics WHERE author_id = 1;

5. 清理30天前的草稿
CALL sp_cleanup_expired_drafts(30, NULL, NULL);
*/
