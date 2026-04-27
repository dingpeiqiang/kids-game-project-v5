package com.kidgame.common.config;

import com.kidgame.common.filter.RequestCacheFilter;
import com.kidgame.common.interceptor.ControllerLogInterceptor;
import com.kidgame.common.interceptor.JwtInterceptor;
import com.kidgame.common.interceptor.LoginRateLimitInterceptor;
import com.kidgame.common.interceptor.RateLimitInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 配置
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private JwtInterceptor jwtInterceptor;

    @Autowired(required = false)
    private RateLimitInterceptor rateLimitInterceptor;

    @Autowired(required = false)
    private LoginRateLimitInterceptor loginRateLimitInterceptor;

    @Autowired
    private ControllerLogInterceptor controllerLogInterceptor;

    @Autowired
    private RequestCacheFilter requestCacheFilter;

    /**
     * 跨域配置
     * 注意：使用 allowedOriginPatterns("*") 时不能同时设置 allowCredentials(true)
     * simple-game 使用 JWT Token（Bearer Header），不依赖 Cookie，无需 credentials
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }

    /**
     * 拦截器配置
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 控制器日志拦截器（最外层，先注册）
        registry.addInterceptor(controllerLogInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/doc.html",
                        "/swagger-resources/**",
                        "/v3/api-docs/**",
                        "/webjars/**",
                        "/favicon.ico"
                );
    
        // JWT 认证拦截器
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/kid/login",
                        "/api/parent/login",
                        "/api/auth/login",        // 统一认证登录接口
                        "/api/auth/public-key",   // 获取公钥接口（登录前需要）
                        "/api/game/list",          // 游戏列表不需要登录
                        "/api/game/code/*",       // 获取游戏信息不需要登录
                        "/api/game/config/**",    // 游戏配置不需要登录
                        "/api/game/report",       // 游戏成绩上报不需要登录（独立部署模式）
                        "/api/game/verify",       // 游戏会话验证不需要登录
                        "/api/question/random",   // 随机题目不需要登录
                        "/doc.html",
                        "/swagger-resources/**",
                        "/v3/api-docs/**",
                        "/webjars/**",
                        "/favicon.ico"
                );
    
        // 接口限流拦截器（通用）- 通过配置开关控制
        if (rateLimitInterceptor != null) {
            registry.addInterceptor(rateLimitInterceptor)
                    .addPathPatterns("/api/**")
                    .order(1);
        }
        
        // 登录接口专用限流拦截器 - 通过配置开关控制
        if (loginRateLimitInterceptor != null) {
            registry.addInterceptor(loginRateLimitInterceptor)
                    .addPathPatterns("/api/**/login")
                    .order(2);
        }
    }

    /**
     * 注册请求缓存过滤器
     * 注意：ContentCachingRequestWrapper 在 preHandle 阶段无法读取内容，会导致 Controller 无法读取请求体
     * 暂时禁用此过滤器，解决登录请求体缺失的问题
     */
    // @Bean
    // public FilterRegistrationBean<RequestCacheFilter> requestCacheFilterRegistration() {
    //     FilterRegistrationBean<RequestCacheFilter> registration = new FilterRegistrationBean<>();
    //     registration.setFilter(requestCacheFilter);
    //     registration.addUrlPatterns("/*");
    //     registration.setName("requestCacheFilter");
    //     registration.setOrder(Ordered.HIGHEST_PRECEDENCE); // 最高优先级，确保最先执行
    //     return registration;
    // }
}
