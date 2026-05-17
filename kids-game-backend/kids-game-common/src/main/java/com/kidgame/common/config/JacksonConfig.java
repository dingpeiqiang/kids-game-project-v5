package com.kidgame.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Jackson 配置
 * 配置 JSON 序列化和反序列化策略
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Configuration
public class JacksonConfig {

    /**
     * 配置 ObjectMapper
     * 设置属性命名策略为 SNAKE_CASE（蛇形命名/下划线命名）
     * 例如：tariffCode -> tariff_code, userId -> user_id
     */
    @Bean
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        return builder
            // 设置命名策略为蛇形命名（下划线）
            .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
            // 忽略 null 值字段（可选，根据需求调整）
            // .serializationInclusion(JsonInclude.Include.NON_NULL)
            .build();
    }
}
