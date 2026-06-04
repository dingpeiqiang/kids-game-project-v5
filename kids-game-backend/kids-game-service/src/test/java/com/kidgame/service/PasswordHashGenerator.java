package com.kidgame.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 密码哈希生成器 - 用于生成测试用户的 BCrypt 密码
 * 
 * 使用方法：
 * 1. 运行 main 方法
 * 2. 复制输出的哈希值到 SQL 脚本
 * 3. 使用对应的明文密码登录
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        
        // 测试密码
        String testPassword = "password123";
        
        System.out.println("=================================");
        System.out.println("BCrypt 密码哈希生成器");
        System.out.println("=================================");
        System.out.println();
        
        // 生成密码哈希
        String hash = encoder.encode(testPassword);
        
        System.out.println("明文密码：" + testPassword);
        System.out.println("BCrypt 哈希：" + hash);
        System.out.println();
        
        // 验证密码
        boolean matches = encoder.matches(testPassword, hash);
        System.out.println("密码验证结果：" + matches);
        System.out.println();
        
        // 生成更多测试密码的哈希
        String[] passwords = {
            "Admin@123",
            "Parent@2026",
            "Kid@Game2026",
            "Test@123456"
        };
        
        System.out.println("=================================");
        System.out.println("其他测试密码哈希:");
        System.out.println("=================================");
        for (String password : passwords) {
            String pwdHash = encoder.encode(password);
            System.out.println(password + " -> " + pwdHash);
        }
        
        System.out.println();
        System.out.println("=================================");
        System.out.println("SQL INSERT 语句示例:");
        System.out.println("=================================");
        System.out.println("-- admin 用户（密码：password123）");
        System.out.println("INSERT INTO t_user (user_type, username, password, nickname, status) VALUES");
        System.out.println("(2, 'admin', '" + hash + "', '超级管理员', 1);");
        System.out.println();
        System.out.println("-- parent1 用户（密码：password123）");
        System.out.println("INSERT INTO t_user (user_type, username, password, nickname, status) VALUES");
        System.out.println("(1, 'parent1', '" + hash + "', '张妈妈', 1);");
        System.out.println();
        System.out.println("-- kid001 用户（密码：password123）");
        System.out.println("INSERT INTO t_user (user_type, username, password, nickname, status) VALUES");
        System.out.println("(0, 'kid001', '" + hash + "', '张小宝', 1);");
    }
}
