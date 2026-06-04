package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.BaseUser;
import org.apache.ibatis.annotations.Mapper;

/**
 * 统一用户Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface BaseUserMapper extends BaseMapper<BaseUser> {
}
