package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameTagRelation;
import org.apache.ibatis.annotations.Mapper;

/**
 * 游戏标签关联 Mapper
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Mapper
public interface GameTagRelationMapper extends BaseMapper<GameTagRelation> {
}
