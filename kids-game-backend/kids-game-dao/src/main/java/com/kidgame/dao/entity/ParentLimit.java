package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 家长管控规则实体
 */
@Data
@TableName("t_parent_limit")
public class ParentLimit implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 规则ID
     */
    @TableId(value = "limit_id", type = IdType.AUTO)
    private Long limitId;

    /**
     * 家长ID
     */
    private Long parentId;

    /**
     * 儿童ID
     */
    private Long kidId;

    /**
     * 每日时长上限（分钟）
     */
    private Integer dailyDuration;

    /**
     * 单次时长上限（分钟）
     */
    private Integer singleDuration;

    /**
     * 允许游戏开始时间
     */
    private String allowedTimeStart;

    /**
     * 允许游戏结束时间
     */
    private String allowedTimeEnd;

    /**
     * 答对1题获得的疲劳点数
     */
    private Integer answerGetPoints;

    /**
     * 每日答题赚点上限
     */
    private Integer dailyAnswerLimit;

    /**
     * 屏蔽的游戏ID列表（JSON数组）
     */
    private String blockedGames;

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
