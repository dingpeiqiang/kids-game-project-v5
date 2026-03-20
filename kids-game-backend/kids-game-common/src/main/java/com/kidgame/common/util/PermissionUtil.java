package com.kidgame.common.util;

import java.util.Collection;
import java.util.List;

/**
 * 权限校验工具类
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
public class PermissionUtil {

    /**
     * 检查是否拥有权限
     *
     * @param userPermissions 用户权限列表
     * @param requiredPermission 需要的权限
     * @return 是否拥有权限
     */
    public static boolean hasPermission(Collection<String> userPermissions, String requiredPermission) {
        if (userPermissions == null || userPermissions.isEmpty()) {
            return false;
        }

        // 超级管理员拥有所有权限
        if (userPermissions.contains("*") || userPermissions.contains("*:*:*")) {
            return true;
        }

        // 精确匹配
        if (userPermissions.contains(requiredPermission)) {
            return true;
        }

        // 模糊匹配
        for (String permission : userPermissions) {
            if (matchPermission(permission, requiredPermission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 匹配权限（支持通配符）
     *
     * @param pattern 权限模式（如 kid:game:*）
     * @param permission 具体权限（如 kid:game:play）
     * @return 是否匹配
     */
    private static boolean matchPermission(String pattern, String permission) {
        if (pattern == null || permission == null) {
            return false;
        }

        if (pattern.equals("*")) {
            return true;
        }

        String[] patternParts = pattern.split(":");
        String[] permissionParts = permission.split(":");

        if (patternParts.length > permissionParts.length) {
            return false;
        }

        for (int i = 0; i < patternParts.length; i++) {
            if (!"*".equals(patternParts[i]) && !patternParts[i].equals(permissionParts[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * 检查是否拥有任一权限
     *
     * @param userPermissions 用户权限列表
     * @param requiredPermissions 需要的权限列表
     * @return 是否拥有任一权限
     */
    public static boolean hasAnyPermission(Collection<String> userPermissions, String... requiredPermissions) {
        if (requiredPermissions == null || requiredPermissions.length == 0) {
            return false;
        }

        for (String permission : requiredPermissions) {
            if (hasPermission(userPermissions, permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检查是否拥有所有权限
     *
     * @param userPermissions 用户权限列表
     * @param requiredPermissions 需要的权限列表
     * @return 是否拥有所有权限
     */
    public static boolean hasAllPermissions(Collection<String> userPermissions, String... requiredPermissions) {
        if (requiredPermissions == null || requiredPermissions.length == 0) {
            return true;
        }

        for (String permission : requiredPermissions) {
            if (!hasPermission(userPermissions, permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 检查是否拥有角色
     *
     * @param userRoles 用户角色列表
     * @param requiredRole 需要的角色
     * @return 是否拥有角色
     */
    public static boolean hasRole(Collection<String> userRoles, String requiredRole) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }

        return userRoles.contains(requiredRole);
    }

    /**
     * 检查是否拥有任一角色
     *
     * @param userRoles 用户角色列表
     * @param requiredRoles 需要的角色列表
     * @return 是否拥有任一角色
     */
    public static boolean hasAnyRole(Collection<String> userRoles, String... requiredRoles) {
        if (requiredRoles == null || requiredRoles.length == 0) {
            return false;
        }

        for (String role : requiredRoles) {
            if (hasRole(userRoles, role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检查是否管理员
     *
     * @param userRoles 用户角色列表
     * @return 是否是管理员
     */
    public static boolean isAdmin(Collection<String> userRoles) {
        return hasAnyRole(userRoles, "ROLE_ADMIN", "ROLE_SUPER_ADMIN");
    }

    /**
     * 检查是否家长
     *
     * @param userRoles 用户角色列表
     * @return 是否是家长
     */
    public static boolean isParent(Collection<String> userRoles) {
        return hasRole(userRoles, "ROLE_PARENT");
    }

    /**
     * 检查是否儿童
     *
     * @param userRoles 用户角色列表
     * @return 是否是儿童
     */
    public static boolean isKid(Collection<String> userRoles) {
        return hasRole(userRoles, "ROLE_KID");
    }

    /**
     * 检查数据权限（自己、部门、全部）
     *
     * @param dataScope 数据权限范围
     * @param currentUserId 当前用户ID
     * @param targetUserId 目标用户ID
     * @return 是否有权限
     */
    public static boolean checkDataScope(String dataScope, Long currentUserId, Long targetUserId) {
        if ("ALL".equals(dataScope)) {
            // 全部数据
            return true;
        } else if ("DEPT".equals(dataScope)) {
            // 部门数据（暂未实现）
            // TODO: 实现部门权限检查
            return false;
        } else if ("SELF".equals(dataScope)) {
            // 个人数据
            return currentUserId.equals(targetUserId);
        }

        return false;
    }
}
