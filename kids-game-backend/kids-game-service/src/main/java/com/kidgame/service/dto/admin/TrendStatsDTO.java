package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 趋势统计数据 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class TrendStatsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 天数
     */
    private Integer days;

    /**
     * 日期列表
     */
    private List<String> dates;

    /**
     * 新增用户趋势
     */
    private List<Integer> newUsers;

    /**
     * 活跃用户趋势
     */
    private List<Integer> activeUsers;

    /**
     * 游戏次数趋势
     */
    private List<Integer> gameCounts;

    /**
     * 答题次数趋势
     */
    private List<Integer> answerCounts;

    /**
     * 游戏类型分布
     */
    private List<CategoryStat> gameCategories;

    /**
     * 答题正确率分布
     */
    private AnswerCorrectRateStat answerCorrectRate;

    /**
     * 分类统计
     */
    @Data
    public static class CategoryStat implements Serializable {
        private static final long serialVersionUID = 1L;
        private String name;
        private Integer value;
    }

    /**
     * 答题正确率统计
     */
    @Data
    public static class AnswerCorrectRateStat implements Serializable {
        private static final long serialVersionUID = 1L;
        private Integer correct;
        private Integer incorrect;
    }
}
