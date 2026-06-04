package com.kidgame.common.interceptor;

import com.kidgame.common.annotation.RequireLogin;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT认证拦截器
 */
@Slf4j
@Component
public class JwtInterceptor implements HandlerInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 处理 OPTIONS 预检请求（CORS）
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return false; // OPTIONS 请求不需要后续处理
        }

        // 如果不是映射到Controller方法，直接通过
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        RequireLogin requireLogin = handlerMethod.getMethodAnnotation(RequireLogin.class);

        // 如果方法或类上有@RequireLogin注解，则需要验证token
        if (requireLogin != null) {
            String token = getTokenFromRequest(request);

            if (token == null || token.isEmpty()) {
                log.warn("请求未携带token: {}", request.getRequestURI());
                throw new BusinessException(ErrorCode.TOKEN_MISSING_OBJ);
            }

            try {
                // 验证token
                Claims claims = jwtUtil.parseToken(token);

                // 验证token是否有效
                if (!jwtUtil.validateToken(token)) {
                    log.warn("Token已过期或无效: {}", request.getRequestURI());
                    throw new BusinessException(ErrorCode.TOKEN_INVALID_OBJ);
                }

                // 获取用户信息
                String userId = claims.get("userId", String.class);
                String role = claims.get("role", String.class);
                String kidId = claims.get("kidId", String.class);
                String parentId = claims.get("parentId", String.class);

                // 验证角色
                String[] requiredRoles = requireLogin.roles();
                if (requiredRoles.length > 0) {
                    boolean roleMatched = false;
                    for (String requiredRole : requiredRoles) {
                        if (requiredRole.equals(role)) {
                            roleMatched = true;
                            break;
                        }
                    }
                    if (!roleMatched) {
                        log.warn("角色不匹配: 需要 {}, 实际 {}", requiredRoles, role);
                        throw new BusinessException(ErrorCode.FORBIDDEN_OBJ);
                    }
                }

                // 将用户信息放入请求属性
                request.setAttribute("userId", userId);
                request.setAttribute("kidId", kidId);
                request.setAttribute("parentId", parentId);
                request.setAttribute("role", role);

                log.debug("JWT认证通过: UserId={}, KidId={}, ParentId={}, Role={}",
                        userId, kidId, parentId, role);

                return true;

            } catch (BusinessException e) {
                throw e;
            } catch (Exception e) {
                log.error("JWT验证失败", e);
                throw new BusinessException(ErrorCode.TOKEN_INVALID_OBJ);
            }
        }

        return true;
    }

    /**
     * 从请求中获取token
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);

        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }

        // 也可以从请求参数中获取
        return request.getParameter("token");
    }
}
