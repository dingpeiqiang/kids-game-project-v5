package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;

/**
 * 游戏统计数据 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class GameStatsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 游戏 ID
     */
    private Long gameId;

    /**
     * 总游玩次数
     */
    private Integer totalPlayCount;

    /**
     * 今日游玩次数
     */
    private Integer todayPlayCount;

    /**
     * 平均分数
     */
    private Double averageScore;

    /**
     * 收藏次数
     */
    private Integer favoriteCount;

    /**
     * 满意度（百分比）
     */
    private Double satisfactionRate;
}
