package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameTag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 游戏标签 Mapper
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Mapper
public interface GameTagMapper extends BaseMapper<GameTag> {
}
