package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;

/**
 * 每日统计表
 */
@Data
@TableName("t_daily_stats")
public class DailyStats {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 统计日期
     */
    private LocalDate statDate;

    /**
     * 总用户数
     */
    private Integer totalUsers;

    /**
     * 活跃用户数
     */
    private Integer activeUsers;

    /**
     * 新增用户数
     */
    private Integer newUsers;

    /**
     * 总游戏时长(分钟)
     */
    private Long totalGameDuration;

    /**
     * 总游戏次数
     */
    private Integer totalGameCount;

    /**
     * 总答题数
     */
    private Integer totalAnswerCount;

    /**
     * 答对数量
     */
    private Integer correctAnswerCount;

    /**
     * 发放疲劳点总数
     */
    private Integer totalFatiguePoints;

    /**
     * 消耗疲劳点总数
     */
    private Integer totalConsumedPoints;

    /**
     * 创建时间 (毫秒时间戳)
     */
    private Long createTime;

    /**
     * 更新时间 (毫秒时间戳)
     */
    private Long updateTime;
}
