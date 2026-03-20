package com.kidgame.web.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 数据库迁移工具控制器
 * 
 * 用于手动触发数据库迁移
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/migration")
public class DatabaseMigrationController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String MIGRATION_KEY = "GAME_DECOUPLING_MIGRATION_V1";

    /**
     * 检查迁移状态
     */
    @GetMapping("/status")
    public Map<String, Object> checkMigrationStatus() {
        Map<String, Object> result = new HashMap<>();
        boolean executed = isMigrationExecuted();
        result.put("migrationKey", MIGRATION_KEY);
        result.put("executed", executed);
        result.put("message", executed ? "迁移已执行" : "迁移未执行");
        return result;
    }

    /**
     * 手动执行迁移
     */
    @PostMapping("/execute")
    public Map<String, Object> executeMigration() {
        Map<String, Object> result = new HashMap<>();

        try {
            if (isMigrationExecuted()) {
                result.put("success", false);
                result.put("message", "迁移已执行，无需重复执行");
                return result;
            }

            log.info("开始执行游戏解耦数据库迁移...");

            // 1. 添加 game_url 字段
            addColumnIfNotExists("t_game", "game_url", "VARCHAR(500) NULL COMMENT '游戏访问地址URL（独立部署时使用）' AFTER resource_url");

            // 2. 添加 game_secret 字段
            addColumnIfNotExists("t_game", "game_secret", "VARCHAR(100) NULL COMMENT '游戏密钥（用于签名验证）' AFTER game_url");

            // 3. 添加 game_config 字段
            addColumnIfNotExists("t_game", "game_config", "JSON NULL COMMENT '游戏配置（透传给游戏的JSON配置）' AFTER game_secret");

            // 4. 添加 session_token 字段
            addColumnIfNotExists("t_game_session", "session_token", "VARCHAR(100) NULL UNIQUE COMMENT '会话令牌（用于游戏验证）' AFTER game_id");

            // 5. 添加索引
            addIndexIfNotExists("t_game_session", "idx_session_token", "session_token");

            // 6. 更新现有游戏数据
            updateExistingGameConfig();

            // 标记迁移已执行
            markMigrationExecuted();

            log.info("游戏解耦数据库迁移执行成功！");

            result.put("success", true);
            result.put("message", "迁移执行成功");
            return result;

        } catch (Exception e) {
            log.error("数据库迁移执行失败", e);
            result.put("success", false);
            result.put("message", "迁移执行失败: " + e.getMessage());
            result.put("error", e.toString());
            return result;
        }
    }

    /**
     * 检查迁移是否已执行
     */
    private boolean isMigrationExecuted() {
        try {
            String sql = "SELECT COUNT(*) FROM t_system_config WHERE config_key = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, MIGRATION_KEY);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 标记迁移已执行
     */
    private void markMigrationExecuted() {
        try {
            String sql = """
                INSERT INTO t_system_config (config_key, config_value, description, create_time, update_time)
                VALUES (?, '1', '游戏解耦数据库迁移V1', ?, ?)
                ON DUPLICATE KEY UPDATE config_value = '1', update_time = ?
                """;
            long now = System.currentTimeMillis();
            jdbcTemplate.update(sql, MIGRATION_KEY, now, now, now);
        } catch (Exception e) {
            log.warn("标记迁移状态失败", e);
        }
    }

    /**
     * 添加字段（如果不存在）
     */
    private void addColumnIfNotExists(String tableName, String columnName, String columnDefinition) {
        try {
            String checkSql = """
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """;
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, tableName, columnName);

            if (count != null && count > 0) {
                log.info("表 {} 已存在字段 {}，跳过添加", tableName, columnName);
                return;
            }

            String alterSql = String.format("ALTER TABLE %s ADD COLUMN %s %s", tableName, columnName, columnDefinition);
            log.info("执行 SQL: {}", alterSql);
            jdbcTemplate.execute(alterSql);
            log.info("成功为表 {} 添加字段 {}", tableName, columnName);

        } catch (Exception e) {
            log.error("添加字段 {}.{} 失败", tableName, columnName, e);
            throw new RuntimeException("添加字段失败", e);
        }
    }

    /**
     * 添加索引（如果不存在）
     */
    private void addIndexIfNotExists(String tableName, String indexName, String columnName) {
        try {
            String checkSql = """
                SELECT COUNT(*)
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
                """;
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, tableName, indexName);

            if (count != null && count > 0) {
                log.info("表 {} 已存在索引 {}，跳过添加", tableName, indexName);
                return;
            }

            String alterSql = String.format("ALTER TABLE %s ADD INDEX %s (%s)", tableName, indexName, columnName);
            log.info("执行 SQL: {}", alterSql);
            jdbcTemplate.execute(alterSql);
            log.info("成功为表 {} 添加索引 {}", tableName, indexName);

        } catch (Exception e) {
            log.error("添加索引 {} (表 {}) 失败", indexName, tableName, e);
            throw new RuntimeException("添加索引失败", e);
        }
    }

    /**
     * 更新现有游戏数据
     */
    private void updateExistingGameConfig() {
        try {
            String sql = """
                UPDATE t_game
                SET game_config = '{"difficulty":"medium","language":"zh-CN"}'
                WHERE game_config IS NULL
                """;
            int updated = jdbcTemplate.update(sql);
            log.info("更新了 {} 条游戏记录的配置", updated);
        } catch (Exception e) {
            log.warn("更新游戏配置失败", e);
        }
    }
}
