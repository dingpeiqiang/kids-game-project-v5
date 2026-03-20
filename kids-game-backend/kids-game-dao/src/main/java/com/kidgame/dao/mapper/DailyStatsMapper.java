package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.DailyStats;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;

/**
 * 每日统计Mapper
 */
@Mapper
public interface DailyStatsMapper extends BaseMapper<DailyStats> {

    /**
     * 根据统计日期查询
     */
    @Select("SELECT * FROM t_daily_stats WHERE stat_date = #{statDate}")
    DailyStats selectByStatDate(@Param("statDate") LocalDate statDate);

    /**
     * 查询最近N天的统计数据
     */
    @Select("SELECT * FROM t_daily_stats WHERE stat_date >= #{startDate} ORDER BY stat_date DESC")
    java.util.List<DailyStats> selectRecentStats(@Param("startDate") LocalDate startDate);
}
