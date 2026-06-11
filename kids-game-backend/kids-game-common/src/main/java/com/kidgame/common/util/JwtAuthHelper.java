package com.kidgame.common.util;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * 从 JWT 过滤器写入的 request 属性解析当前用户
 */
public final class JwtAuthHelper {

    private JwtAuthHelper() {
    }

    public static Long resolveUserId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            return null;
        }
        try {
            return Long.parseLong(userId.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Integer resolveUserType(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        Object userType = request.getAttribute("userType");
        if (userType instanceof Number) {
            return ((Number) userType).intValue();
        }
        return null;
    }

    /** 儿童端：userId 即 kidId */
    public static Long resolveKidId(HttpServletRequest request) {
        Integer type = resolveUserType(request);
        if (type != null && type != 0) {
            return null;
        }
        return resolveUserId(request);
    }

    public static void assertAdmin(HttpServletRequest request) {
        Integer type = resolveUserType(request);
        if (type == null || type != 2) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "需要管理员权限");
        }
    }

    public static void assertKidSelf(Long requestedKidId, HttpServletRequest request) {
        Long tokenKidId = resolveKidId(request);
        if (tokenKidId != null && requestedKidId != null && !tokenKidId.equals(requestedKidId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "无权访问该儿童答题数据");
        }
    }
}