package com.kidgame.common.interceptor;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.util.RedisUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 接口限流拦截器
 */
@Slf4j
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private RedisUtil redisUtil;

    @Value("${kidgame.api.rate-limit-per-minute:100}")
    private int defaultRateLimit;

    @Value("${kidgame.api.rate-limit-per-minute.answer:10}")
    private int answerRateLimit;

    private static final String RATE_LIMIT_PREFIX = "api:limit:";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();
        String ip = getClientIp(request);
        String key = RATE_LIMIT_PREFIX + uri + ":" + ip;

        // 根据接口类型设置不同的限流规则
        int limit = getRateLimitByUri(uri);

        // 获取当前计数
        Integer currentCount = (Integer) redisUtil.get(key);

        if (currentCount == null) {
            // 第一次请求，设置计数和过期时间
            redisUtil.set(key, 1, 60);
        } else {
            // 检查是否超过限制
            if (currentCount >= limit) {
                log.warn("接口限流触发: URI={}, IP={}, Count={}", uri, ip, currentCount);
                throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS_OBJ);
            }

            // 增加计数
            redisUtil.increment(key, 1);
        }

        log.debug("接口限流检查通过: URI={}, IP={}, Count={}/{}", uri, ip, currentCount != null ? currentCount + 1 : 1, limit);

        return true;
    }

    /**
     * 根据URI获取限流值
     */
    private int getRateLimitByUri(String uri) {
        if (uri.contains("/answer/")) {
            return answerRateLimit;
        }
        return defaultRateLimit;
    }

    /**
     * 获取客户端IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // 处理多级代理的情况
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }
}
