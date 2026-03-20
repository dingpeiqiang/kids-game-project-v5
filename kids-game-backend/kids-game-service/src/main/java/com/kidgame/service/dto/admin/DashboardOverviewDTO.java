package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;

/**
 * 仪表盘概览数据 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class DashboardOverviewDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 总用户数
     */
    private Integer totalUsers;

    /**
     * 今日新增用户数
     */
    private Integer todayNewUsers;

    /**
     * 活跃用户数（今日）
     */
    private Integer activeUsers;

    /**
     * 在线用户数
     */
    private Integer onlineUsers;

    /**
     * 游戏总数
     */
    private Integer totalGames;

    /**
     * 已上架游戏数
     */
    private Integer publishedGames;

    /**
     * 题目总数
     */
    private Integer totalQuestions;

    /**
     * 答题总数（累计）
     */
    private Integer totalAnswers;

    /**
     * 今日答题数
     */
    private Integer todayAnswers;

    /**
     * 答题正确率（百分比）
     */
    private Double answerCorrectRate;

    /**
     * 总游戏时长（分钟）
     */
    private Long totalGameDuration;

    /**
     * 今日游戏时长（分钟）
     */
    private Long todayGameDuration;
}
