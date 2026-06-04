package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * 游戏统计 DTO（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
public class GameStatisticsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 游戏 ID
     */
    private Long gameId;

    /**
     * 开始日期
     */
    private LocalDate startDate;

    /**
     * 结束日期
     */
    private LocalDate endDate;

    // ========== 基础统计 ==========

    /**
     * 总游玩次数
     */
    private Integer totalPlayCount;

    /**
     * 独立玩家数
     */
    private Integer uniquePlayers;

    /**
     * 总时长 (秒)
     */
    private Long totalDuration;

    /**
     * 平均时长 (秒)
     */
    private Double averageDuration;

    // ========== 评分统计 ==========

    /**
     * 平均分数
     */
    private Double averageScore;

    /**
     * 最高分
     */
    private Integer maxScore;

    /**
     * 最低分
     */
    private Integer minScore;

    // ========== 满意度统计 ==========

    /**
     * 点赞数
     */
    private Integer likeCount;

    /**
     * 踩数
     */
    private Integer dislikeCount;

    /**
     * 收藏数
     */
    private Integer favoriteCount;

    /**
     * 满意度 (%)
     */
    private Double satisfactionRate;

    // ========== 留存统计 ==========

    /**
     * 次日留存率 (%)
     */
    private Double nextDayRetention;

    /**
     * 周留存率 (%)
     */
    private Double weekRetention;

    // ========== 疲劳度统计 ==========

    /**
     * 总消耗疲劳度
     */
    private Integer totalFatigueConsumed;

    /**
     * 人均消耗疲劳度
     */
    private Integer averageFatiguePerPlayer;
}
