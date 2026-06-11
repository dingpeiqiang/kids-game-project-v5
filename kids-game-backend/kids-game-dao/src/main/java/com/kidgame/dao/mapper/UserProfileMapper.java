package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.UserProfile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 用户扩展信息Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface UserProfileMapper extends BaseMapper<UserProfile> {

    /**
     * 检查家长手机号是否已注册
     * @param phone 手机号
     * @return 存在返回1，不存在返回0
     */
    @Select("SELECT COUNT(*) FROM t_user_profile WHERE profile_type = 'PARENT_INFO' AND JSON_EXTRACT(ext_info_json, '$.phone') = #{phone} AND deleted = 0")
    int countByParentPhone(@Param("phone") String phone);
}
