package com.kidgame.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 应用启动监听器 - 打印关键配置信息
 */
@Slf4j
@Component
public class StartupInfoPrinter implements ApplicationRunner {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @Override
    public void run(ApplicationArguments args) {
        log.info("========================================");
        log.info("应用启动配置信息");
        log.info("========================================");
        log.info("环境: {}", activeProfile);
        
        // 打印数据库连接信息（密码脱敏）
        if (datasourceUrl != null && !datasourceUrl.isEmpty()) {
            // 隐藏密码部分
            String maskedUrl = datasourceUrl.replaceAll("(password=)[^&]*", "$1***");
            log.info("数据库 URL: {}", maskedUrl);
            log.info("数据库用户名: {}", datasourceUsername);
            
            // 检查关键参数
            if (datasourceUrl.contains("allowPublicKeyRetrieval=true")) {
                log.info("✓ MySQL 公钥检索: 已启用");
            } else {
                log.warn("✗ MySQL 公钥检索: 未启用（可能导致连接失败）");
                log.warn("  当前 URL: {}", maskedUrl);
                log.warn("  请检查 docker-compose.yml 中的 SPRING_DATASOURCE_URL 环境变量");
            }
            
            if (datasourceUrl.contains("useSSL=false")) {
                log.info("✓ SSL: 已禁用");
            }
        } else {
            log.error("✗ 数据库 URL 未配置！");
        }
        
        log.info("========================================");
    }
}
