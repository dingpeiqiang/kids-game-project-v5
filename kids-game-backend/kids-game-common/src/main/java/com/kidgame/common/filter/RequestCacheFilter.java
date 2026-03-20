package com.kidgame.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;

/**
 * 请求缓存过滤器
 * 用于缓存请求体，支持重复读取（解决日志打印后 Controller 无法读取的问题）
 */
@Slf4j
@Component
@Order(1) // 确保在拦截器之前执行
public class RequestCacheFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // 只处理 POST/PUT/PATCH 请求
        String method = request.getMethod();
        if ("POST".equalsIgnoreCase(method) || 
            "PUT".equalsIgnoreCase(method) || 
            "PATCH".equalsIgnoreCase(method)) {
            
            // 使用 ContentCachingRequestWrapper 包装所有 POST/PUT/PATCH 请求
            // 这样可以支持重复读取请求体，解决日志切面和控制器读取冲突的问题
            ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
            filterChain.doFilter(wrappedRequest, response);
            return;
        }
        
        // 其他请求直接放行
        filterChain.doFilter(request, response);
    }
}
