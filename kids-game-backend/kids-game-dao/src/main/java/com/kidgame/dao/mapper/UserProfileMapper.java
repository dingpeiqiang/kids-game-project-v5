package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.UserProfile;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户扩展信息Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface UserProfileMapper extends BaseMapper<UserProfile> {
}
