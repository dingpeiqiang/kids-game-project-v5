package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.Game;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 游戏 Mapper（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Mapper
public interface GameManagementMapper extends BaseMapper<Game> {

    /**
     * 根据游戏编码查询游戏
     *
     * @param gameCode 游戏编码
     * @return 游戏信息
     */
    @Select("SELECT * FROM t_game WHERE game_code = #{gameCode} AND deleted = 0")
    Game selectByGameCode(@Param("gameCode") String gameCode);
}
