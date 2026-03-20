package com.kidgame.service;

import com.kidgame.dao.entity.GamePermission;

import java.util.List;

/**
 * 游戏权限服务接口（支持所有用户类型）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
public interface GamePermissionService {

    // ========== 基础 CRUD ==========

    /**
     * 创建权限
     *
     * @param permission 权限信息
     * @return 权限ID
     */
    Long createPermission(GamePermission permission);

    /**
     * 更新权限
     *
     * @param permission 权限信息
     */
    void updatePermission(GamePermission permission);

    /**
     * 删除权限
     *
     * @param permissionId 权限ID
     */
    void deleteById(Long permissionId);

    /**
     * 删除游戏权限（按用户和游戏）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     */
    void deletePermission(Long userId, Integer userType, Long gameId);

    // ========== 查询接口 ==========

    /**
     * 设置游戏权限
     *
     * @param permission 权限信息
     * @return 权限
     */
    GamePermission setPermission(GamePermission permission);

    /**
     * 批量设置游戏权限
     *
     * @param permissions 权限列表
     * @return 权限列表
     */
    List<GamePermission> batchSetPermissions(List<GamePermission> permissions);

    /**
     * 获取用户对游戏的权限（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @return 权限
     */
    GamePermission getPermission(Long userId, Integer userType, Long gameId);

    /**
     * 获取用户所有游戏权限（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @return 权限列表
     */
    List<GamePermission> getUserPermissions(Long userId, Integer userType);

    /**
     * 获取游戏的所有用户权限
     *
     * @param gameId 游戏ID
     * @return 权限列表
     */
    List<GamePermission> getGamePermissions(Long gameId);

    /**
     * 查询用户的游戏权限（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @return 权限列表
     */
    List<GamePermission> getPermissions(Long userId, Integer userType, Long gameId);

    /**
     * 获取资源的所有用户权限（支持多资源类型）
     *
     * @param resourceType 资源类型
     * @param resourceId 资源ID
     * @return 权限列表
     */
    List<GamePermission> getResourcePermissions(String resourceType, Long resourceId);

    // ========== 权限检查 ==========

    /**
     * 检查是否允许启动游戏（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @return 是否允许
     */
    boolean checkGameStart(Long userId, Integer userType, Long gameId);

    /**
     * 检查游戏是否被屏蔽（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @return 是否被屏蔽
     */
    boolean isGameBlocked(Long userId, Integer userType, Long gameId);

    /**
     * 检查是否允许操作资源
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param resourceType 资源类型
     * @param resourceId 资源ID
     * @param operation 操作类型
     * @return 是否允许
     */
    boolean checkPermission(Long userId, Integer userType, String resourceType, Long resourceId, String operation);

    // ========== 便捷方法 ==========

    /**
     * 屏蔽游戏（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     */
    void blockGame(Long userId, Integer userType, Long gameId);

    /**
     * 取消屏蔽游戏（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     */
    void unblockGame(Long userId, Integer userType, Long gameId);

    /**
     * 批量屏蔽游戏（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameIds 游戏ID列表
     */
    void batchBlockGames(Long userId, Integer userType, List<Long> gameIds);

    /**
     * 批量取消屏蔽游戏（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameIds 游戏ID列表
     */
    void batchUnblockGames(Long userId, Integer userType, List<Long> gameIds);

    /**
     * 设置限时权限（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @param maxMinutes 最大时长（分钟）
     */
    void setLimitTimePermission(Long userId, Integer userType, Long gameId, Integer maxMinutes);

    /**
     * 设置限次权限（支持所有用户类型）
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @param maxCount 最大次数
     */
    void setLimitCountPermission(Long userId, Integer userType, Long gameId, Integer maxCount);

    /**
     * 更新权限类型
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @param permissionType 权限类型
     */
    void updatePermissionType(Long userId, Integer userType, Long gameId, String permissionType);

    /**
     * 更新时间限制
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @param timeLimitMinutes 时间限制（分钟）
     */
    void updateTimeLimit(Long userId, Integer userType, Long gameId, Integer timeLimitMinutes);

    /**
     * 更新次数限制
     *
     * @param userId 用户ID
     * @param userType 用户类型
     * @param gameId 游戏ID
     * @param countLimit 次数限制
     */
    void updateCountLimit(Long userId, Integer userType, Long gameId, Integer countLimit);

    // ========== 以下方法标记为废弃，但保留以兼容旧代码 ==========

    /**
     * @deprecated 使用 getPermission(Long userId, Integer userType, Long gameId) 替代
     */
    @Deprecated
    default GamePermission getPermission(Long userId, Long gameId) {
        return getPermission(userId, GamePermission.UserType.KID, gameId);
    }

    /**
     * @deprecated 使用 getUserPermissions(Long userId, Integer userType) 替代
     */
    @Deprecated
    default List<GamePermission> getUserPermissions(Long userId) {
        return getUserPermissions(userId, GamePermission.UserType.KID);
    }

    /**
     * @deprecated 使用 isGameBlocked(Long userId, Integer userType, Long gameId) 替代
     */
    @Deprecated
    default boolean isGameBlocked(Long kidId, Long gameId) {
        return isGameBlocked(kidId, GamePermission.UserType.KID, gameId);
    }

    /**
     * @deprecated 使用 blockGame(Long userId, Integer userType, Long gameId) 替代
     */
    @Deprecated
    default void blockGame(Long kidId, Long gameId) {
        blockGame(kidId, GamePermission.UserType.KID, gameId);
    }

    /**
     * @deprecated 使用 unblockGame(Long userId, Integer userType, Long gameId) 替代
     */
    @Deprecated
    default void unblockGame(Long kidId, Long gameId) {
        unblockGame(kidId, GamePermission.UserType.KID, gameId);
    }

    /**
     * @deprecated 使用 batchBlockGames(Long userId, Integer userType, List<Long> gameIds) 替代
     */
    @Deprecated
    default void batchBlockGames(Long kidId, List<Long> gameIds) {
        batchBlockGames(kidId, GamePermission.UserType.KID, gameIds);
    }

    /**
     * @deprecated 使用 batchUnblockGames(Long userId, Integer userType, List<Long> gameIds) 替代
     */
    @Deprecated
    default void batchUnblockGames(Long kidId, List<Long> gameIds) {
        batchUnblockGames(kidId, GamePermission.UserType.KID, gameIds);
    }

    /**
     * @deprecated 使用 setLimitTimePermission(Long userId, Integer userType, Long gameId, Integer maxMinutes) 替代
     */
    @Deprecated
    default void setLimitTimePermission(Long kidId, Long gameId, Integer maxMinutes) {
        setLimitTimePermission(kidId, GamePermission.UserType.KID, gameId, maxMinutes);
    }

    /**
     * @deprecated 使用 setLimitCountPermission(Long userId, Integer userType, Long gameId, Integer maxCount) 替代
     */
    @Deprecated
    default void setLimitCountPermission(Long kidId, Long gameId, Integer maxCount) {
        setLimitCountPermission(kidId, GamePermission.UserType.KID, gameId, maxCount);
    }

    /**
     * @deprecated 使用 updatePermissionType(Long userId, Integer userType, Long gameId, String permissionType) 替代
     */
    @Deprecated
    default void updatePermissionType(Long userId, Long gameId, String permissionType) {
        updatePermissionType(userId, GamePermission.UserType.KID, gameId, permissionType);
    }

    /**
     * @deprecated 使用 updateTimeLimit(Long userId, Integer userType, Long gameId, Integer timeLimitMinutes) 替代
     */
    @Deprecated
    default void updateTimeLimit(Long userId, Long gameId, Integer timeLimitMinutes) {
        updateTimeLimit(userId, GamePermission.UserType.KID, gameId, timeLimitMinutes);
    }

    /**
     * @deprecated 使用 updateCountLimit(Long userId, Integer userType, Long gameId, Integer countLimit) 替代
     */
    @Deprecated
    default void updateCountLimit(Long userId, Long gameId, Integer countLimit) {
        updateCountLimit(userId, GamePermission.UserType.KID, gameId, countLimit);
    }

    /**
     * @deprecated 使用 getPermissions(Long userId, Integer userType, Long gameId) 替代
     */
    @Deprecated
    default List<GamePermission> getPermissions(Long kidId, Long gameId) {
        return getPermissions(kidId, GamePermission.UserType.KID, gameId);
    }
}
