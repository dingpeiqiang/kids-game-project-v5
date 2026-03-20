package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.LeaderboardConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 游戏排行榜配置 Mapper 接口
 */
@Mapper
public interface LeaderboardConfigMapper extends BaseMapper<LeaderboardConfig> {

    /**
     * 查询游戏的排行榜配置列表
     * @param gameId 游戏 ID
     * @return 排行榜配置列表
     */
    List<LeaderboardConfig> selectByGameId(@Param("gameId") Long gameId);

    /**
     * 查询游戏的某个维度配置
     * @param gameId 游戏 ID
     * @param dimensionCode 维度代码
     * @return 排行榜配置
     */
    LeaderboardConfig selectByGameIdAndDimension(
        @Param("gameId") Long gameId, 
        @Param("dimensionCode") String dimensionCode
    );
}
