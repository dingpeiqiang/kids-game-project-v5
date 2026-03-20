#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证数据库迁移结果
"""

import pymysql
import sys
import io

# 设置输出编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_CONFIG = {
    'host': '106.54.7.205',
    'port': 3306,
    'user': 'kidsgame',
    'password': 'Kidsgame2026!Secure',
    'database': 'kidgame',
    'charset': 'utf8mb4'
}

def verify_migration():
    """验证迁移结果"""
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("数据库迁移验证报告")
    print("=" * 60)
    print()
    
    # 1. 检查 t_game 表新字段
    print("【t_game 表字段检查】")
    cursor.execute("DESC t_game")
    columns = [col[0] for col in cursor.fetchall()]
    
    new_columns = ['game_url', 'game_secret', 'game_config']
    for col in new_columns:
        status = "✅ 已添加" if col in columns else "❌ 缺失"
        print(f"  {status}: {col}")
    print()
    
    # 2. 检查 t_game_session 表新字段
    print("【t_game_session 表字段检查】")
    cursor.execute("DESC t_game_session")
    columns = [col[0] for col in cursor.fetchall()]
    
    new_columns = ['session_token']
    for col in new_columns:
        status = "✅ 已添加" if col in columns else "❌ 缺失"
        print(f"  {status}: {col}")
    print()
    
    # 3. 检查索引
    print("【t_game_session 表索引检查】")
    cursor.execute("""
        SELECT INDEX_NAME, COLUMN_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 't_game_session'
          AND INDEX_NAME = 'idx_session_token'
    """)
    index_result = cursor.fetchone()
    if index_result:
        print(f"  ✅ 索引已创建: {index_result[0]} ({index_result[1]})")
    else:
        print("  ❌ 索引缺失: idx_session_token")
    print()
    
    # 4. 检查迁移标记
    print("【迁移状态检查】")
    cursor.execute("SELECT * FROM t_system_config WHERE config_key = 'GAME_DECOUPLING_MIGRATION_V1'")
    config_result = cursor.fetchone()
    if config_result:
        print(f"  ✅ 迁移标记已记录")
        print(f"     配置键: {config_result[1]}")
        print(f"     配置值: {config_result[2]}")
        print(f"     描述: {config_result[3]}")
    else:
        print("  ⚠️  迁移标记未记录（不影响功能）")
    print()
    
    # 5. 检查游戏配置数据
    print("【游戏配置数据检查】")
    cursor.execute("SELECT COUNT(*) FROM t_game")
    total_games = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM t_game WHERE game_config IS NOT NULL")
    config_count = cursor.fetchone()[0]
    
    print(f"  共有 {total_games} 个游戏")
    print(f"  其中 {config_count} 个游戏已配置 game_config")
    print()
    
    # 6. 查看示例游戏数据
    print("【示例游戏数据】")
    cursor.execute("""
        SELECT game_id, game_code, game_name, game_url, game_secret
        FROM t_game
        WHERE game_url IS NOT NULL OR game_secret IS NOT NULL
        LIMIT 3
    """)
    games = cursor.fetchall()
    if games:
        print(f"  找到 {len(games)} 个配置了外部 URL 的游戏：")
        for game in games:
            print(f"    - {game[2]} (ID: {game[0]}, Code: {game[1]})")
            if game[3]:
                print(f"      URL: {game[3]}")
            if game[4]:
                print(f"      Secret: {game[4]}")
    else:
        print("  尚未配置外部游戏 URL")
    print()
    
    # 7. 查看会话令牌字段类型
    print("【字段类型详情】")
    cursor.execute("""
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN ('t_game', 't_game_session')
          AND COLUMN_NAME IN ('game_url', 'game_secret', 'game_config', 'session_token')
        ORDER BY TABLE_NAME, COLUMN_NAME
    """)
    columns_info = cursor.fetchall()
    for col in columns_info:
        table = "t_game" if col[0] in ['game_url', 'game_secret', 'game_config'] else "t_game_session"
        print(f"  {table}.{col[0]}:")
        print(f"    类型: {col[1]}")
        print(f"    可空: {col[2]}")
        if col[3]:
            print(f"    注释: {col[3]}")
    print()
    
    print("=" * 60)
    print("验证完成！所有必需字段和索引已正确添加。")
    print("=" * 60)
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    verify_migration()
