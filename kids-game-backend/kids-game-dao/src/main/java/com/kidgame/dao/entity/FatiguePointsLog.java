package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 疲劳点日志实体
 */
@Data
@TableName("t_fatigue_points_log")
public class FatiguePointsLog implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 日志ID
     */
    @TableId(value = "log_id", type = IdType.AUTO)
    private Long logId;

    /**
     * 用户ID（儿童）
     */
    private Long userId;

    /**
     * 变化类型：1-游戏消耗，2-答题获得，3-每日重置
     */
    private Integer changeType;

    /**
     * 变化点数（正数表示增加，负数表示减少）
     */
    private Integer changePoints;

    /**
     * 变化后点数
     */
    private Integer currentPoints;

    /**
     * 关联ID（如游戏会话ID、题目ID等）
     */
    private Long relatedId;

    /**
     * 关联类型：GAME_SESSION-游戏会话，QUESTION-题目
     */
    private String relatedType;

    /**
     * 备注
     */
    private String remark;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;
}
