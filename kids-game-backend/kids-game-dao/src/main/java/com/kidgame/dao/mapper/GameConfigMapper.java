package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameConfigEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 游戏配置 Mapper
 */
@Mapper
public interface GameConfigMapper extends BaseMapper<GameConfigEntity> {
}
