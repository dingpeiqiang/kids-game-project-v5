package com.kidgame.common.filter;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * JWT 认证过滤器
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String DEVICE_FINGERPRINT_HEADER = "X-Device-Fingerprint";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        try {
            // 从请求中提取 JWT Token
            String token = resolveToken(request);
            
            if (StringUtils.hasText(token)) {
                // 验证 Token 是否有效
                if (jwtUtil.validateToken(token)) {
                    // 解析 Token 获取用户信息
                    Claims claims = jwtUtil.parseToken(token);
                    
                    // 设置认证信息到 SecurityContext
                    setAuthentication(claims, request);
                    
                    log.debug("JWT 认证通过：UserId={}, Role={}", 
                        claims.get("userId"), claims.get("role"));
                } else {
                    log.warn("Token 无效或已过期：{}", request.getRequestURI());
                }
            }
        } catch (BusinessException e) {
            log.warn("JWT 认证失败：{}，继续处理请求", e.getMessage());
            // 不抛出异常，允许请求继续处理（由 SecurityConfig 的 permitAll 控制是否允许访问）
        } catch (Exception e) {
            log.error("JWT 认证异常：{}", e.getMessage(), e);
            // 不抛出异常，允许请求继续处理
        }
        
        filterChain.doFilter(request, response);
    }

    /**
     * 从请求中提取 Token
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        
        // 也支持从参数中获取（用于 WebSocket 等场景）
        return request.getParameter("token");
    }

    /**
     * 设置认证信息到 SecurityContext
     */
    private void setAuthentication(Claims claims, HttpServletRequest request) {
        String userId = claims.get("userId", String.class);
        String role = claims.get("role", String.class);
        Integer userType = claims.get("userType", Integer.class);
        String kidId = claims.get("kidId", String.class);
        String parentId = claims.get("parentId", String.class);
        String deviceFingerprint = request.getHeader(DEVICE_FINGERPRINT_HEADER);
        
        // 构建认证后的用户 authorities
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if (StringUtils.hasText(role)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        
        // 创建认证令牌
        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(
                userId,
                null,
                authorities
            );
        
        // 将用户信息放入请求属性（供后续使用）
        request.setAttribute("userId", userId);
        request.setAttribute("userType", userType);  // 存储数字类型（0=KID, 1=PARENT, 2=ADMIN）
        request.setAttribute("kidId", kidId);
        request.setAttribute("parentId", parentId);
        request.setAttribute("role", role);
        request.setAttribute("deviceFingerprint", deviceFingerprint);
        
        // 设置到 SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
