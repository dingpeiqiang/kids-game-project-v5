package com.kidgame.common.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * 控制器日志切面
 * 用于记录 Controller 层的请求和响应信息
 */
@Slf4j
@Aspect
@Component
public class ControllerLogAspect {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 定义切点：Controller 包下的所有公共方法
     */
    @Pointcut("execution(public * com.kidgame.web.controller..*.*(..))")
    public void controllerPoint() {
    }

    /**
     * 环绕通知：记录请求和响应
     */
    @Around("controllerPoint()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        HttpServletResponse response = attributes.getResponse();

        // 获取请求信息
        String uri = request.getRequestURI();
        String method = request.getMethod();
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();

        // 打印请求日志
        log.info("========== 请求开始: {}.{} ==========", className, methodName);
        log.info("请求 URI: {}", uri);
        log.info("请求方法：{}", method);
        log.info("请求 IP: {}", getClientIp(request));
        
        // 打印请求参数
        printRequestParams(request);
        
        // 打印请求体（如果是 JSON 等格式）
        printRequestBody(request);

        long startTime = System.currentTimeMillis();
        Object result;

            // 执行目标方法
            result = joinPoint.proceed();
            
            long endTime = System.currentTimeMillis();
            
            // 打印响应日志
            log.info("========== 请求结束：{}.{} 耗时：{}ms ==========", className, methodName, (endTime - startTime));
            log.info("响应状态：{}", response != null ? response.getStatus() : "N/A");
            
            // 打印响应数据（排除文件下载等二进制响应）
            if (result != null && !(result instanceof MultipartFile)) {
                try {
                    String resultJson = objectMapper.writeValueAsString(result);
                    // 如果响应数据过长，截断显示
                    if (resultJson.length() > 5000) {
                        resultJson = resultJson.substring(0, 5000) + "... [已截断]";
                    }
                    log.info("响应数据：{}", resultJson);
                } catch (Exception e) {
                    log.warn("序列化响应数据失败：{}", e.getMessage());
                    log.info("响应数据 (toString): {}", result.toString());
                }
            } else {
                log.info("响应数据：null 或 文件流");
            }
            
            return result;
            

    }

    /**
     * 打印请求参数
     */
    private void printRequestParams(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
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
                
                String body = getRequestBody(request);
                if (body != null && !body.isEmpty()) {
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
     * 获取请求体内容
     * 支持从 ContentCachingRequestWrapper 中读取缓存的请求体
     */
    private String getRequestBody(HttpServletRequest request) throws IOException {
        // 检查是否是 ContentCachingRequestWrapper
        if (request instanceof org.springframework.web.util.ContentCachingRequestWrapper) {
            org.springframework.web.util.ContentCachingRequestWrapper wrapper = 
                (org.springframework.web.util.ContentCachingRequestWrapper) request;
            byte[] content = wrapper.getContentAsByteArray();
            if (content.length > 0) {
                return new String(content, StandardCharsets.UTF_8);
            }
        }
        
        // 如果不是包装器，尝试从原始流中读取
        StringBuilder sb = new StringBuilder();
        try (InputStream inputStream = request.getInputStream();
             BufferedReader reader = new BufferedReader(
                     new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
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
