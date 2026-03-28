-- 查询数据库实际结构
SELECT CONCAT('SHOW CREATE TABLE ', table_name, ';') 
FROM information_schema.tables 
WHERE table_schema = 'kidgame' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
