#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
游戏平台解耦 - 数据库迁移脚本
使用 Python 执行 SQL 迁移
"""

import pymysql
import sys

# 数据库配置
DB_CONFIG = {
    'host': '106.54.7.205',
    'port': 3306,
    'user': 'kidsgame',
    'password': 'Kidsgame2026!Secure',
    'database': 'kidgame',
    'charset': 'utf8mb4'
}

def execute_migration():
    """执行数据库迁移"""
    conn = None
    cursor = None
    
    try:
        # 连接数据库
        print("正在连接数据库...")
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("数据库连接成功！\n")
        
        # 检查迁移是否已执行
        cursor.execute("SELECT COUNT(*) FROM t_system_config WHERE config_key = 'GAME_DECOUPLING_MIGRATION_V1'")
        result = cursor.fetchone()
        
        if result and result[0] > 0:
            print("迁移已执行，跳过")
            return True
        
        print("开始执行数据库迁移...\n")
        
        # 1. 添加 game_url 字段
        print("[1/6] 添加 game_url 字段...")
        add_column_if_not_exists(cursor, conn, "t_game", "game_url", "VARCHAR(500) NULL COMMENT '游戏访问地址URL（独立部署时使用）' AFTER resource_url")
        
        # 2. 添加 game_secret 字段
        print("[2/6] 添加 game_secret 字段...")
        add_column_if_not_exists(cursor, conn, "t_game", "game_secret", "VARCHAR(100) NULL COMMENT '游戏密钥（用于签名验证）' AFTER game_url")
        
        # 3. 添加 game_config 字段
        print("[3/6] 添加 game_config 字段...")
        add_column_if_not_exists(cursor, conn, "t_game", "game_config", "JSON NULL COMMENT '游戏配置（透传给游戏的JSON配置）' AFTER game_secret")
        
        # 4. 添加 session_token 字段
        print("[4/6] 添加 session_token 字段...")
        add_column_if_not_exists(cursor, conn, "t_game_session", "session_token", "VARCHAR(100) NULL UNIQUE COMMENT '会话令牌（用于游戏验证）' AFTER game_id")
        
        # 5. 添加索引
        print("[5/6] 添加 session_token 索引...")
        add_index_if_not_exists(cursor, conn, "t_game_session", "idx_session_token", "session_token")
        
        # 6. 更新现有游戏数据
        print("[6/6] 更新现有游戏配置...")
        cursor.execute("""
            UPDATE t_game
            SET game_config = '{"difficulty":"medium","language":"zh-CN"}'
            WHERE game_config IS NULL
        """)
        conn.commit()
        print(f"更新了 {cursor.rowcount} 条游戏记录的配置")
        
        # 标记迁移已执行
        print("\n标记迁移状态...")
        cursor.execute("""
            INSERT INTO t_system_config (config_key, config_value, description, create_time, update_time)
            VALUES ('GAME_DECOUPLING_MIGRATION_V1', '1', '游戏解耦数据库迁移V1', %s, %s)
            ON DUPLICATE KEY UPDATE config_value = '1', update_time = %s
        """, (int(sys.time() * 1000), int(sys.time() * 1000), int(sys.time() * 1000)))
        conn.commit()
        
        print("\n" + "=" * 50)
        print("数据库迁移成功完成！")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"\n数据库迁移失败: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def add_column_if_not_exists(cursor, conn, table_name, column_name, column_definition):
    """添加字段（如果不存在）"""
    try:
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND COLUMN_NAME = %s
        """, (table_name, column_name))
        
        result = cursor.fetchone()
        if result and result[0] > 0:
            print(f"  表 {table_name} 已存在字段 {column_name}，跳过")
            return
        
        sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        cursor.execute(sql)
        conn.commit()
        print(f"  成功为表 {table_name} 添加字段 {column_name}")
        
    except Exception as e:
        print(f"  添加字段 {table_name}.{column_name} 失败: {e}")
        raise

def add_index_if_not_exists(cursor, conn, table_name, index_name, column_name):
    """添加索引（如果不存在）"""
    try:
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND INDEX_NAME = %s
        """, (table_name, index_name))
        
        result = cursor.fetchone()
        if result and result[0] > 0:
            print(f"  表 {table_name} 已存在索引 {index_name}，跳过")
            return
        
        sql = f"ALTER TABLE {table_name} ADD INDEX {index_name} ({column_name})"
        cursor.execute(sql)
        conn.commit()
        print(f"  成功为表 {table_name} 添加索引 {index_name}")
        
    except Exception as e:
        print(f"  添加索引 {index_name} (表 {table_name}) 失败: {e}")
        raise

if __name__ == '__main__':
    import time
    sys.time = time.time
    
    success = execute_migration()
    sys.exit(0 if success else 1)
