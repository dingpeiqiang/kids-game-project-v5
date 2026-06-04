package com.kidgame.common.config;

import com.kidgame.common.filter.JwtAuthenticationFilter;
import com.kidgame.common.handler.CustomAccessDeniedHandler;
import com.kidgame.common.handler.CustomAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 配置
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    /**
     * 安全过滤链配置
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用 CSRF（使用 JWT 不需要）
            .csrf(AbstractHttpConfigurer::disable)
            
            // 配置 CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 异常处理
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            
            // 配置会话管理（无状态）
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // 配置授权规则
            .authorizeHttpRequests(auth -> auth
                // 公开端点（不需要认证）
                .requestMatchers(
                    "/api/auth/**",
                    "/api/kid/login",
                    "/api/kid/register",
                    "/api/parent/login",
                    "/api/parent/register",
                    "/api/user/login",
                    "/api/user/register",
                    "/api/user/refresh-token",

                    // Swagger 文档
                    "/doc.html",
                    "/swagger-resources/**",
                    "/v3/api-docs/**",
                    "/webjars/**",
                    "/favicon.ico",

                    // Actuator 健康检查（Docker healthcheck 需要）
                    "/actuator/health",
                    "/actuator/info",

                    // 游戏相关公开接口
                    "/api/game/list",
                    "/api/game/code/*",
                    "/api/game/config/**",
                    "/api/game/report",
                    "/api/game/verify",
                    "/api/question/random",
                    
                    // 排行榜公开接口
                    "/api/leaderboard/top",
                    
                    // 套餐查询公开接口（AI表单系统调用）
                    "/tariff/**"
                ).permitAll()
                
                // 需要认证的端点
                .requestMatchers("/api/**").authenticated()
                
                // 其他所有请求需要认证
                .anyRequest().authenticated()
            )
            
            // 添加 JWT 过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    /**
     * CORS 配置
     * 注意：simple-game 使用 JWT Bearer Token，不依赖 Cookie，无需 allowCredentials
     * 使用 allowedOriginPatterns("*") 放通所有来源（通过 Nginx 代理部署）
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 放通所有来源（JWT 无状态，无需限制 Origin）
        configuration.setAllowedOriginPatterns(List.of("*"));
        
        // 允许的方法
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // 允许的头部
        configuration.setAllowedHeaders(List.of("*"));
        
        // 暴露的头部
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "X-Refresh-Token"
        ));
        
        // 注意：allowedOriginPatterns("*") 时不能设置 allowCredentials(true)
        // simple-game 使用 JWT Bearer Token，不需要 credentials
        
        // 预检请求缓存时间
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    /**
     * 密码加密器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
