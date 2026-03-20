package com.kidgame.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT 安全配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "security.jwt")
public class JwtConfig {
    
    /**
     * JWT 密钥（生产环境应使用环境变量或配置中心）
     */
    private String secret = "kids-game-platform-secret-key-for-jwt-token-generation-2024";
    
    /**
     * Token 过期时间（毫秒）默认 7 天
     */
    private Long expiration = 604800000L;
    
    /**
     * Refresh Token 过期时间（毫秒）默认 30 天
     */
    private Long refreshExpiration = 2592000000L;
}
