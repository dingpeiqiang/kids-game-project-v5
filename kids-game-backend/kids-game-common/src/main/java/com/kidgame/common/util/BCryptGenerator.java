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
     * 用法：运行 main 方法，从命令行传入要哈希的密码
     * 示例：java BCryptGenerator password123
     */
    public static void main(String[] args) {
        // 从命令行参数获取密码
        if (args.length == 0) {
            System.out.println("===========================================");
            System.out.println("BCrypt Password Generator");
            System.out.println("===========================================");
            System.out.println("\n用法: java BCryptGenerator <password>");
            System.out.println("示例: java BCryptGenerator mySecurePassword");
            System.out.println("\n提示：BCrypt 每次生成的哈希值都不同（随机盐值）");
            System.out.println("使用 matches() 方法验证密码即可");
            return;
        }

        String password = args[0];
        String hash = hash(password);

        System.out.println("===========================================");
        System.out.println("BCrypt Password Generator");
        System.out.println("===========================================");
        System.out.println("\nPassword: " + password);
        System.out.println("Hash: " + hash);
        System.out.println("-------------------------------------------");
        System.out.println("\n提示：BCrypt 每次生成的哈希值都不同（随机盐值）");
        System.out.println("使用 matches() 方法验证密码即可");
    }
}
