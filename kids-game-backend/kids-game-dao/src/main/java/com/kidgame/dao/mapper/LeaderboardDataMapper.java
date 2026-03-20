package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.LeaderboardData;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 游戏排行榜数据 Mapper 接口
 */
@Mapper
public interface LeaderboardDataMapper extends BaseMapper<LeaderboardData> {

    /**
     * 查询排行榜数据（带排名）
     * @param gameId 游戏 ID
     * @param dimensionCode 维度代码
     * @param rankType 排行类型
     * @param rankDate 排行日期（日榜使用）
     * @param rankMonth 排行月份（月榜使用）
     * @param rankYear 排行年份（年榜使用）
     * @param limit 返回数量限制
     * @return 排行榜数据列表（带排名）
     */
    List<Map<String, Object>> selectLeaderboardWithRank(
        @Param("gameId") Long gameId,
        @Param("dimensionCode") String dimensionCode,
        @Param("rankType") String rankType,
        @Param("rankDate") String rankDate,
        @Param("rankMonth") String rankMonth,
        @Param("rankYear") String rankYear,
        @Param("limit") Integer limit
    );

    /**
     * 查询用户的最佳排名
     * @param userId 用户 ID
     * @param gameId 游戏 ID
     * @param dimensionCode 维度代码
     * @return 用户最佳排名
     */
    Map<String, Object> selectUserBestRank(
        @Param("userId") Long userId,
        @Param("gameId") Long gameId,
        @Param("dimensionCode") String dimensionCode
    );

    /**
     * 更新或插入排行榜数据（取最大值）
     * @param data 排行榜数据
     * @return 影响行数
     */
    int upsertMax(LeaderboardData data);

    /**
     * 更新或插入排行榜数据（取最小值，用于时间、步数等越少越好的维度）
     * @param data 排行榜数据
     * @return 影响行数
     */
    int upsertMin(LeaderboardData data);
}
