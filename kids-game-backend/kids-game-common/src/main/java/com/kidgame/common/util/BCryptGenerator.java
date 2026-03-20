package com.kidgame.common.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * BCrypt 密码生成工具
 * 用于生成 BCrypt 加密的密码哈希值
 */
public class BCryptGenerator {

    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * 生成 BCrypt 哈希
     * @param rawPassword 原始密码
     * @return BCrypt 哈希值
     */
    public static String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    /**
     * 验证密码是否匹配
     * @param rawPassword 原始密码
     * @param hashedPassword BCrypt 哈希值
     * @return 是否匹配
     */
    public static boolean matches(String rawPassword, String hashedPassword) {
        return encoder.matches(rawPassword, hashedPassword);
    }

    /**
     * 主方法 - 用于生成密码哈希
     */
    public static void main(String[] args) {
        // 生成常用密码的 BCrypt 哈希
        String[] passwords = {"admin123", "123456", "password"};

        System.out.println("===========================================");
        System.out.println("BCrypt Password Generator");
        System.out.println("===========================================");

        for (String password : passwords) {
            String hash = hash(password);
            System.out.println("\nPassword: " + password);
            System.out.println("Hash: " + hash);
            System.out.println("-------------------------------------------");
        }

        // 特别说明：每次运行生成的哈希值都不同（因为盐值随机）
        // 但都可以验证通过
        System.out.println("\n提示：BCrypt 每次生成的哈希值都不同（随机盐值）");
        System.out.println("使用 matches() 方法验证密码即可");
    }
}
