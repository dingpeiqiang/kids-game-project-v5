package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameSession;
import org.apache.ibatis.annotations.Mapper;

/**
 * 游戏会话 Mapper
 */
@Mapper
public interface GameSessionMapper extends BaseMapper<GameSession> {
}
