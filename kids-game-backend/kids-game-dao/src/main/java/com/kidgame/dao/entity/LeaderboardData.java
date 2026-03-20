package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 游戏排行榜数据实体
 */
@Data
@TableName("t_leaderboard_data")
public class LeaderboardData implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 数据 ID
     */
    @TableId(value = "data_id", type = IdType.AUTO)
    private Long dataId;

    /**
     * 游戏 ID
     */
    private Long gameId;

    /**
     * 用户 ID
     */
    private Long userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 头像 URL
     */
    private String avatarUrl;

    /**
     * 维度代码
     */
    private String dimensionCode;

    /**
     * 维度值（统一用 BIGINT 存储，不同类型在应用层转换）
     */
    private Long dimensionValue;

    /**
     * 小数值（用于百分比等精度要求高的场景）
     */
    private BigDecimal decimalValue;

    /**
     * 排行日期（YYYY-MM-DD，用于日榜）
     */
    private String rankDate;

    /**
     * 排行月份（YYYY-MM，用于月榜）
     */
    private String rankMonth;

    /**
     * 排行年份（YYYY，用于年榜）
     */
    private String rankYear;

    /**
     * 排行类型：ALL-总榜，DAILY-日榜，MONTHLY-月榜，YEARLY-年榜
     */
    private String rankType;

    /**
     * 额外数据（用于存储通关时间、使用角色等扩展信息）
     */
    @TableField(typeHandler = com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler.class)
    private Object extraData;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;
}
