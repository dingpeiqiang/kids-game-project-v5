package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GamePermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 游戏权限Mapper
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Mapper
public interface GamePermissionMapper extends BaseMapper<GamePermission> {

    /**
     * 查询用户的游戏权限（支持所有用户类型）
     *
     * @param userId 用户 ID
     * @param userType 用户类型
     * @param gameId 游戏 ID
     * @return 权限列表
     */
    List<GamePermission> selectPermissions(@Param("userId") Long userId, @Param("userType") Integer userType, @Param("gameId") Long gameId);

    /**
     * 检查游戏是否被屏蔽（支持所有用户类型）
     *
     * @param userId 用户 ID
     * @param userType 用户类型
     * @param gameId 游戏 ID
     * @return 是否被屏蔽
     */
    boolean isGameBlocked(@Param("userId") Long userId, @Param("userType") Integer userType, @Param("gameId") Long gameId);

    // ========== 以下方法标记为废弃，但保留以兼容旧代码 ==========

    /**
     * @deprecated 使用 selectPermissions(Long userId, Integer userType, Long gameId) 替代
     */
    @Deprecated
    default List<GamePermission> selectPermissions(Long kidId, Long gameId) {
        return selectPermissions(kidId, GamePermission.UserType.KID, gameId);
    }

    /**
     * @deprecated 使用 isGameBlocked(Long userId, Integer userType, Long gameId) 替代
     */
    @Deprecated
    default boolean isGameBlocked(Long kidId, Long gameId) {
        return isGameBlocked(kidId, GamePermission.UserType.KID, gameId);
    }
}
