package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.GameRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 游戏记录Mapper
 */
@Mapper
public interface GameRecordMapper extends BaseMapper<GameRecord> {

    /**
     * 根据日期统计游戏数据
     */
    @Select("SELECT COUNT(*) as totalCount, SUM(duration) as totalDuration FROM t_game_record " +
            "WHERE DATE(create_time) = #{date}")
    Map<String, Object> selectGameStatsByDate(@Param("date") LocalDate date);

    /**
     * 查询指定儿童在指定日期的游戏时长
     */
    @Select("SELECT SUM(duration) as duration FROM t_game_record " +
            "WHERE user_id = #{kidId} AND DATE(create_time) = #{date}")
    Map<String, Object> selectDurationByKidAndDate(@Param("kidId") Long kidId, @Param("date") LocalDate date);

    /**
     * 查询指定儿童的总游戏时长
     */
    @Select("SELECT SUM(duration) as duration FROM t_game_record WHERE user_id = #{kidId}")
    Map<String, Object> selectTotalDurationByKid(@Param("kidId") Long kidId);

    /**
     * 查询指定儿童的游戏记录列表
     */
    @Select("SELECT * FROM t_game_record WHERE user_id = #{kidId} ORDER BY create_time DESC LIMIT #{limit}")
    List<GameRecord> selectByKidIdWithLimit(@Param("kidId") Long kidId, @Param("limit") int limit);

    /**
     * 查询指定儿童在指定日期范围的游戏记录
     */
    @Select("SELECT * FROM t_game_record WHERE user_id = #{kidId} " +
            "AND DATE(create_time) >= #{startDate} AND DATE(create_time) <= #{endDate} " +
            "ORDER BY create_time DESC")
    List<GameRecord> selectByKidIdAndDateRange(
            @Param("kidId") Long kidId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
