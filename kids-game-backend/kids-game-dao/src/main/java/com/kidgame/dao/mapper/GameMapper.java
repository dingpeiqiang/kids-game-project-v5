package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Game;
import org.apache.ibatis.annotations.Mapper;

/**
 * 游戏信息 Mapper
 */
@Mapper
public interface GameMapper extends BaseMapper<Game> {
}
