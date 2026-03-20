package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameModeConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 游戏模式配置 Mapper
 */
@Mapper
public interface GameModeConfigMapper extends BaseMapper<GameModeConfig> {
    
    /**
     * 根据游戏 ID 获取模式配置列表
     */
    @Select("SELECT * FROM t_game_mode_config WHERE game_id = #{gameId} AND deleted = 0 ORDER BY sort_order")
   List<GameModeConfig> selectByGameId(Long gameId);
    
    /**
     * 根据游戏 ID 和模式类型获取配置
     */
    @Select("SELECT * FROM t_game_mode_config WHERE game_id = #{gameId} AND mode_type = #{modeType} AND deleted = 0")
  GameModeConfig selectByGameIdAndModeType(Long gameId, String modeType);
}
