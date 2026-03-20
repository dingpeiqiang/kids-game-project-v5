package com.kidgame.common.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 登录接口限流 Interceptor
 */
@Slf4j
@Component
public class LoginRateLimitInterceptor implements HandlerInterceptor {

    private static final Map<String, AtomicInteger> ipRequestCount = new ConcurrentHashMap<>();
    private static final Map<String, Long> ipLastRequestTime = new ConcurrentHashMap<>();
    
    /**
     * 每分钟最多允许 10 次登录请求
     */
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long CLEANUP_INTERVAL_MS = 60000; // 1 分钟

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 只拦截 Controller 方法
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        String uri = request.getRequestURI();

        // 只拦截登录接口
        if (!uri.contains("/login")) {
            return true;
        }

        // 跳过预检请求
        if (CorsUtils.isPreFlightRequest(request)) {
            return true;
        }

        String ip = getClientIp(request);
        long currentTime = System.currentTimeMillis();

        // 清理过期记录
        cleanExpiredRecords(currentTime);

        // 获取并更新计数
        AtomicInteger count = ipRequestCount.computeIfAbsent(ip, k -> new AtomicInteger(0));
        Long lastTime = ipLastRequestTime.get(ip);

        // 如果是首次请求或超过清理间隔，重置计数
        if (lastTime == null || (currentTime - lastTime > CLEANUP_INTERVAL_MS)) {
            count.set(1);
            ipLastRequestTime.put(ip, currentTime);
            log.info("IP {} 首次登录请求", ip);
            return true;
        }

        // 增加计数
        int currentCount = count.incrementAndGet();
        log.debug("IP {} 登录请求次数：{}", ip, currentCount);

        // 检查是否超过限制
        if (currentCount > MAX_REQUESTS_PER_MINUTE) {
            log.warn("IP {} 登录请求过于频繁，已限制访问。当前次数：{}", ip, currentCount);
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            try {
                response.getWriter().write("{\"code\":429,\"msg\":\"操作过于频繁，请稍后再试\"}");
            } catch (Exception e) {
                log.error("写入响应失败", e);
            }
            return false;
        }

        return true;
    }

    /**
     * 获取客户端真实 IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // IPv6 localhost 转换
        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            ip = "127.0.0.1";
        }
        // 取第一个 IP（如果是代理链）
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 清理过期的记录
     */
    private void cleanExpiredRecords(long currentTime) {
        // 清理超过 1 分钟的请求计数
        ipRequestCount.entrySet().removeIf(entry -> {
            String ip = entry.getKey();
            Long lastTime = ipLastRequestTime.get(ip);
            return lastTime != null && (currentTime - lastTime) > CLEANUP_INTERVAL_MS;
        });
        
        // 清理超过 2 分钟的最后访问时间
        ipLastRequestTime.entrySet().removeIf(entry -> 
            (currentTime - entry.getValue()) > CLEANUP_INTERVAL_MS * 2
        );
    }
}
