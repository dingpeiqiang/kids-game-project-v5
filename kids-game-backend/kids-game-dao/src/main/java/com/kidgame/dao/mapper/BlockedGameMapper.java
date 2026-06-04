package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.BlockedGame;
import org.apache.ibatis.annotations.Mapper;

/**
 * 屏蔽游戏Mapper
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Mapper
public interface BlockedGameMapper extends BaseMapper<BlockedGame> {
}
