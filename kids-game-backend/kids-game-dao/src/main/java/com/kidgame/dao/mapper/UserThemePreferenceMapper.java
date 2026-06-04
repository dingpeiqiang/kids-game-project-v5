package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.UserThemePreference;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 用户主题偏好 Mapper 接口
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface UserThemePreferenceMapper extends BaseMapper<UserThemePreference> {

    /**
     * 获取用户当前主题
     *
     * @param userId 用户 ID
     * @param ownerType 所有者类型（GAME/APPLICATION）
     * @param ownerId 所有者 ID
     * @return 用户当前主题偏好
     */
    @Select("SELECT * FROM user_theme_preference WHERE user_id = #{userId} AND owner_type = #{ownerType} AND owner_id = #{ownerId} AND is_active = 1")
    UserThemePreference selectUserCurrentTheme(@Param("userId") Long userId, 
                                                @Param("ownerType") String ownerType, 
                                                @Param("ownerId") Long ownerId);

    /**
     * 获取用户对游戏的当前主题 ID
     *
     * @param userId 用户 ID
     * @param ownerType 所有者类型
     * @param ownerId 所有者 ID
     * @return 主题 ID
     */
    @Select("SELECT theme_id FROM user_theme_preference WHERE user_id = #{userId} AND owner_type = #{ownerType} AND owner_id = #{ownerId} AND is_active = 1")
    Long selectUserCurrentThemeId(@Param("userId") Long userId,
                                   @Param("ownerType") String ownerType,
                                   @Param("ownerId") Long ownerId);
}
