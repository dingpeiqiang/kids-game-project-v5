package com.kidgame.common.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT 安全配置
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "security.jwt")
public class JwtConfig {

    /**
     * 已知的弱默认密钥黑名单，禁止在生产环境使用
     */
    private static final String[] WEAK_DEFAULT_SECRETS = {
        "kids-game-platform-secret-key-for-jwt-token-generation-2024",
        "kids-game-platform-secret-key",
        "secret",
        "change-me"
    };

    /**
     * JWT 密钥（必须通过环境变量 JWT_SECRET 注入，不再提供默认值）
     */
    private String secret;

    /**
     * Token 过期时间（毫秒）默认 7 天
     */
    private Long expiration = 604800000L;

    /**
     * Refresh Token 过期时间（毫秒）默认 30 天
     */
    private Long refreshExpiration = 2592000000L;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @PostConstruct
    public void validateSecret() {
        boolean isProd = "prod".equalsIgnoreCase(activeProfile);
        if (secret == null || secret.isBlank()) {
            if (isProd) {
                throw new IllegalStateException(
                    "生产环境必须通过环境变量 JWT_SECRET 设置 JWT 密钥，禁止留空");
            }
            // 非生产环境使用随机密钥，重启后 token 失效（可接受）
            secret = "dev-only-random-" + System.nanoTime();
            log.warn("未配置 JWT_SECRET，非生产环境使用临时随机密钥，重启后所有 token 将失效");
            return;
        }
        for (String weak : WEAK_DEFAULT_SECRETS) {
            if (weak.equals(secret)) {
                if (isProd) {
                    throw new IllegalStateException(
                        "生产环境禁止使用已知的弱默认 JWT 密钥，请通过环境变量 JWT_SECRET 设置高强度密钥");
                }
                log.warn("检测到弱默认 JWT 密钥，非生产环境可继续运行，生产环境将拒绝启动");
            }
        }
        if (secret.length() < 32) {
            log.warn("JWT 密钥长度不足 32 字符，建议使用更长的随机密钥");
        }
    }
}
