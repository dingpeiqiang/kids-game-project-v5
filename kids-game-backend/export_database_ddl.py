#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
导出完整数据库 DDL 脚本
用于备份数据库表结构
"""

import pymysql
import sys
import io
from datetime import datetime

# 数据库配置
DB_CONFIG = {
    'host': '106.54.7.205',
    'port': 3306,
    'user': 'kidsgame',
    'password': 'Kidsgame2026!Secure',
    'database': 'kidgame',
    'charset': 'utf8mb4'
}

def export_ddl():
    """导出数据库 DDL"""
    conn = None
    cursor = None
    
    try:
        # 连接数据库
        print("=" * 60)
        print("正在连接数据库...")
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("数据库连接成功！")
        print("=" * 60)
        print()
        
        # 获取所有表名
        print("正在获取表列表...")
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = %s
            ORDER BY TABLE_NAME
        """, (DB_CONFIG['database'],))
        
        tables = [row[0] for row in cursor.fetchall()]
        print(f"共找到 {len(tables)} 张表")
        print()
        
        # 创建输出文件
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f'database_ddl_export_{timestamp}.sql'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            # 写入文件头
            f.write("-- =====================================================\n")
            f.write(f"-- 数据库 DDL 导出\n")
            f.write(f"-- 数据库：{DB_CONFIG['database']}\n")
            f.write(f"-- 导出时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- 表数量：{len(tables)}\n")
            f.write("-- =====================================================\n\n")
            
            # 设置 SQL_MODE
            f.write("SET NAMES utf8mb4;\n")
            f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
            
            # 导出每张表的 DDL
            for i, table_name in enumerate(tables, 1):
                print(f"[{i}/{len(tables)}] 导出表：{table_name}")
                
                # 获取建表语句
                cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
                result = cursor.fetchone()
                create_table_sql = result[1]
                
                # 写入建表语句
                f.write(f"-- -------------------------------------------\n")
                f.write(f"-- 表结构：{table_name}\n")
                f.write(f"-- -------------------------------------------\n\n")
                f.write(f"DROP TABLE IF EXISTS `{table_name}`;\n\n")
                f.write(f"{create_table_sql};\n\n")
                
                # 如果有外键约束，也导出
                cursor.execute("""
                    SELECT 
                        CONSTRAINT_NAME,
                        TABLE_NAME,
                        COLUMN_NAME,
                        REFERENCED_TABLE_NAME,
                        REFERENCED_COLUMN_NAME
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = %s
                      AND TABLE_NAME = %s
                      AND REFERENCED_TABLE_NAME IS NOT NULL
                """, (DB_CONFIG['database'], table_name))
                
                foreign_keys = cursor.fetchall()
                if foreign_keys:
                    f.write(f"-- 外键约束:\n")
                    for fk in foreign_keys:
                        f.write(f"--   {fk[0]}: {fk[2]} -> {fk[3]}.{fk[4]}\n")
                    f.write("\n")
            
            # 写入文件尾
            f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
            f.write("\n-- =====================================================\n")
            f.write("-- 数据库 DDL 导出完成\n")
            f.write("-- =====================================================\n")
        
        print()
        print("=" * 60)
        print(f"DDL 导出完成！")
        print(f"输出文件：{output_file}")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n导出失败：{e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    success = export_ddl()
    sys.exit(0 if success else 1)
