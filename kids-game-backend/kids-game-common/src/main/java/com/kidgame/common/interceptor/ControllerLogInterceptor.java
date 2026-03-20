package com.kidgame.common.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 控制器日志拦截器
 * 用于记录 Controller 层的请求和响应信息
 */
@Slf4j
@Component
public class ControllerLogInterceptor implements HandlerInterceptor {

    @Autowired
    private ObjectMapper objectMapper;

    private static final ThreadLocal<Long> startTimeHolder = new ThreadLocal<>();

    /**
     * 在 Controller 方法执行前调用
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 只处理 Controller 方法
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        String className = handlerMethod.getBeanType().getName();
        String methodName = handlerMethod.getMethod().getName();

        // 获取请求信息
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // 打印请求日志
        log.info("========== 请求开始：{}.{} ==========", className, methodName);
        log.info("请求 URI: {}", uri);
        log.info("请求方法：{}", method);
        log.info("请求 IP: {}", getClientIp(request));

        // 打印请求参数
        printRequestParams(request);

        // 注意：不要在 preHandle 阶段读取请求体，否则会导致 Controller 无法读取
        // 请求体打印在 afterCompletion 阶段处理

        // 记录开始时间
        startTimeHolder.set(System.currentTimeMillis());

        return true;
    }

    /**
     * 在 Controller 方法执行后调用
     */
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        if (!(handler instanceof HandlerMethod)) {
            return;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        String className = handlerMethod.getBeanType().getName();
        String methodName = handlerMethod.getMethod().getName();

        long startTime = startTimeHolder.get();
        long endTime = System.currentTimeMillis();

        // 打印响应日志
        log.info("========== 请求结束：{}.{} 耗时：{}ms ==========", className, methodName, (endTime - startTime));
        log.info("响应状态：{}", response.getStatus());

        // 清理 ThreadLocal
        startTimeHolder.remove();
    }

    /**
     * 打印请求参数
     */
    private void printRequestParams(HttpServletRequest request) {
        var parameterMap = request.getParameterMap();
        if (parameterMap != null && !parameterMap.isEmpty()) {
            log.info("请求参数:");
            parameterMap.forEach((key, values) -> {
                if (values != null && values.length > 0) {
                    if (values.length == 1) {
                        log.info("  {}: {}", key, values[0]);
                    } else {
                        log.info("  {}: {}", key, String.join(", ", values));
                    }
                }
            });
        } else {
            log.info("请求参数：无");
        }
    }

    /**
     * 打印请求体
     */
    private void printRequestBody(HttpServletRequest request) {
        try {
            String contentType = request.getContentType();
            if (contentType != null && (
                    contentType.contains("application/json") ||
                            contentType.contains("text/plain") ||
                            contentType.contains("application/xml"))) {

                // 从缓存中读取请求体（不会消耗输入流）
                byte[] contentBytes = getContentFromRequest(request);
                
                if (contentBytes != null && contentBytes.length > 0) {
                    String body = new String(contentBytes, StandardCharsets.UTF_8);

                    // 格式化 JSON
                    if (contentType.contains("application/json")) {
                        try {
                            Object jsonObj = objectMapper.readTree(body);
                            String prettyJson = objectMapper.writerWithDefaultPrettyPrinter()
                                    .writeValueAsString(jsonObj);
                            log.info("请求体 (JSON): \n{}", prettyJson);
                        } catch (Exception e) {
                            log.info("请求体：{}", body);
                        }
                    } else {
                        log.info("请求体：{}", body);
                    }
                } else {
                    log.info("请求体：空");
                }
            } else if (contentType != null && contentType.contains("multipart/form-data")) {
                log.info("请求类型：FormData (不打印具体文件内容)");
            }
        } catch (Exception e) {
            log.warn("读取请求体失败：{}", e.getMessage());
        }
    }

    /**
     * 从请求中获取内容（支持 ContentCachingRequestWrapper）
     */
    private byte[] getContentFromRequest(HttpServletRequest request) {
        // 如果是 ContentCachingRequestWrapper，直接从缓存获取
        if (request instanceof ContentCachingRequestWrapper) {
            ContentCachingRequestWrapper wrapper = (ContentCachingRequestWrapper) request;
            return wrapper.getContentAsByteArray();
        }
        
        // 否则尝试直接读取（可能只能读取一次）
        try {
            return request.getInputStream().readAllBytes();
        } catch (Exception e) {
            log.debug("无法读取请求体：{}", e.getMessage());
            return null;
        }
    }

    /**
     * 获取客户端 IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            ip = "127.0.0.1";
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
