# -*- coding: utf-8 -*-
"""
BCrypt 密码哈希生成器 - 用于生成测试用户的密码哈希

使用方法：
1. 运行此脚本
2. 复制输出的哈希值到 SQL 脚本
3. 使用对应的明文密码登录

依赖安装：
pip install bcrypt
"""

import bcrypt

def generate_bcrypt_hash(password, rounds=10):
    """生成 BCrypt 哈希"""
    salt = bcrypt.gensalt(rounds=rounds)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password, hashed):
    """验证密码"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

if __name__ == '__main__':
    print("=" * 50)
    print("BCrypt 密码哈希生成器")
    print("=" * 50)
    print()
    
    # 测试密码
    test_password = "password123"
    
    # 生成密码哈希
    password_hash = generate_bcrypt_hash(test_password)
    
    print(f"明文密码：{test_password}")
    print(f"BCrypt 哈希：{password_hash}")
    print()
    
    # 验证密码
    is_valid = verify_password(test_password, password_hash)
    print(f"密码验证结果：{is_valid}")
    print()
    
    # 生成更多测试密码的哈希
    passwords = [
        "Admin@123",
        "Parent@2026",
        "Kid@Game2026",
        "Test@123456"
    ]
    
    print("=" * 50)
    print("其他测试密码哈希:")
    print("=" * 50)
    for pwd in passwords:
        pwd_hash = generate_bcrypt_hash(pwd)
        print(f"{pwd} -> {pwd_hash}")
    
    print()
    print("=" * 50)
    print("SQL INSERT 语句示例:")
    print("=" * 50)
    print("-- admin 用户（密码：password123）")
    print("INSERT INTO t_user (user_type, username, password, nickname, status) VALUES")
    print(f"(2, 'admin', '{password_hash}', '超级管理员', 1);")
    print()
    print("-- parent1 用户（密码：password123）")
    print("INSERT INTO t_user (user_type, username, password, nickname, status) VALUES")
    print(f"(1, 'parent1', '{password_hash}', '张妈妈', 1);")
    print()
    print("-- kid001 用户（密码：password123）")
    print("INSERT INTO t_user (user_type, username, password, nickname, status) VALUES")
    print(f"(0, 'kid001', '{password_hash}', '张小宝', 1);")
