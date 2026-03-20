package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 今日统计数据 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class TodayStatsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 日期
     */
    private String date;

    /**
     * 新增用户数
     */
    private Integer newUsers;

    /**
     * 活跃用户数
     */
    private Integer activeUsers;

    /**
     * 游戏次数
     */
    private Integer gameCount;

    /**
     * 游戏时长（分钟）
     */
    private Long gameDuration;

    /**
     * 答题次数
     */
    private Integer answerCount;

    /**
     * 答对数量
     */
    private Integer correctAnswers;

    /**
     * 每小时活跃用户趋势（24 小时）
     */
    private List<HourlyStat> hourlyActiveUsers;

    /**
     * 每小时数据
     */
    @Data
    public static class HourlyStat implements Serializable {
        private static final long serialVersionUID = 1L;
        private Integer hour;
        private Integer value;
    }
}
