-- 更新t_kid表结构（添加username和password字段）
-- 如果表已存在但缺少字段，执行此脚本

-- 检查并添加username字段（先允许NULL，避免已有数据冲突）
SET @dbname = DATABASE();
SET @tablename = 't_kid';
SET @columnname = 'username';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT ''用户名''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 检查并添加password字段
SET @columnname = 'password';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) NULL COMMENT ''加密密码''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 如果表中已有数据但没有username和password，填充默认值
UPDATE t_kid SET username = CONCAT('user_', kid_id), password = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi' WHERE username IS NULL OR username = '';
UPDATE t_kid SET password = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi' WHERE password IS NULL OR password = '';

-- 确保字段唯一性（注意：如果已存在重复username，此步骤会失败）
ALTER TABLE t_kid MODIFY COLUMN username VARCHAR(50) UNIQUE NOT NULL;
ALTER TABLE t_kid MODIFY COLUMN password VARCHAR(255) NOT NULL;
