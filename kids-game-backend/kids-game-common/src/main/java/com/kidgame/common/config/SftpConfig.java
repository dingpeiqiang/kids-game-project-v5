package com.kidgame.common.config;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * SFTP 配置类
 *
 * 支持两种认证方式：
 * 1. 密码认证 - 使用用户名和密码
 * 2. 密钥认证 - 使用私钥文件
 *
 * @author kids-game-team
 * @date 2026-03-19
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "sftp")
public class SftpConfig {

    /**
     * 是否启用SFTP
     */
    private boolean enabled = false;

    /**
     * SFTP服务器主机
     */
    private String host;

    /**
     * SFTP服务器端口（默认22）
     */
    private int port = 22;

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码（密码认证方式）
     */
    private String password;

    /**
     * 私钥文件路径（密钥认证方式）
     */
    private String privateKeyPath;

    /**
     * 私钥 passphrase
     */
    private String passphrase;

    /**
     * 基础目录 - 上传文件的根目录
     */
    private String baseDirectory = "/upload";

    /**
     * 访问基础URL - 用于构建返回的文件访问URL
     * 例如：https://cdn.example.com 或 /resources
     */
    private String baseUrl = "/resources";

    /**
     * 连接超时时间（毫秒）
     */
    private int connectionTimeout = 10000;

    /**
     * 读取超时时间（毫秒）
     */
    private int readTimeout = 30000;

    /**
     * 验证配置
     */
    @PostConstruct
    public void validate() {
        if (!enabled) {
            log.info("SFTP 功能未启用");
            return;
        }

        log.info("========== SFTP 配置信息 ==========");
        log.info("enabled: {}", enabled);
        log.info("host: {}", host);
        log.info("port: {}", port);
        log.info("username: {}", username);
        log.info("baseDirectory: {}", baseDirectory);
        log.info("baseUrl: {}", baseUrl);
        log.info("connectionTimeout: {}", connectionTimeout);
        log.info("readTimeout: {}", readTimeout);
        log.info("===================================");

        if (host == null || host.isEmpty()) {
            throw new IllegalStateException("SFTP 配置错误：host 不能为空");
        }

        if (username == null || username.isEmpty()) {
            throw new IllegalStateException("SFTP 配置错误：username 不能为空");
        }

        // 验证认证方式
        boolean hasPassword = password != null && !password.isEmpty();
        boolean hasPrivateKey = privateKeyPath != null && !privateKeyPath.isEmpty();

        if (!hasPassword && !hasPrivateKey) {
            throw new IllegalStateException("SFTP 配置错误：必须配置 password 或 privateKeyPath");
        }

        if (hasPassword && hasPrivateKey) {
            log.warn("SFTP 配置警告：同时配置了密码和私钥，将优先使用密码认证");
        }

        log.info("SFTP 配置验证通过");
        log.info("提示：请确保 SFTP 服务器 {}:{} 可访问，并且用户 {} 有写权限",
                host, port, username);
    }

    /**
     * 是否使用密钥认证
     */
    public boolean isKeyAuth() {
        return privateKeyPath != null && !privateKeyPath.isEmpty() &&
               (password == null || password.isEmpty());
    }

    /**
     * 是否使用密码认证
     */
    public boolean isPasswordAuth() {
        return password != null && !password.isEmpty();
    }
}
