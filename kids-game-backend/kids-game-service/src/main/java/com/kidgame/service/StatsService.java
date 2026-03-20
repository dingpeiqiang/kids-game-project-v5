package com.kidgame.service;

import com.kidgame.dao.entity.DailyStats;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 统计服务接口
 */
public interface StatsService {

    /**
     * 获取指定日期的统计数据
     */
    DailyStats getDailyStats(LocalDate statDate);

    /**
     * 获取今日统计数据
     */
    DailyStats getTodayStats();

    /**
     * 增加游戏时长统计
     */
    void incrementGameDuration(int minutes);

    /**
     * 增加游戏次数统计
     */
    void incrementGameCount();

    /**
     * 增加答题统计
     */
    void incrementAnswerStats(boolean isCorrect);

    /**
     * 记录疲劳点发放
     */
    void recordFatiguePointsGranted(int points);

    /**
     * 记录疲劳点消耗
     */
    void recordFatiguePointsConsumed(int points);

    /**
     * 汇总昨日统计数据
     */
    void summarizeYesterdayStats();

    /**
     * 获取最近N天的统计数据
     */
    List<DailyStats> getRecentStats(int days);

    /**
     * 获取儿童游戏统计
     */
    Map<String, Object> getKidGameStats(Long kidId);

    /**
     * 获取儿童答题统计
     */
    Map<String, Object> getKidAnswerStats(Long kidId);
}
