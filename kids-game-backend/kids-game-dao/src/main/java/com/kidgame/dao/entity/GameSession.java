package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏会话实体
 */
@Data
@TableName("t_game_session")
public class GameSession implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 会话ID
     */
    @TableId(value = "session_id", type = IdType.AUTO)
    private Long sessionId;

    /**
     * 用户ID（儿童或家长）
     */
    private Long userId;

    /**
     * 游戏ID
     */
    private Long gameId;

    /**
     * 会话令牌（用于游戏验证）
     */
    @TableField("session_token")
    private String sessionToken;

    /**
     * 会话状态：0-已结束，1-进行中，2-已暂停
     */
    private Integer status;

    /**
     * 开始时间
     */
    private Long startTime;

    /**
     * 结束时间
     */
    private Long endTime;

    /**
     * 游玩时长（秒）
     */
    private Long duration;

    /**
     * 获得分数
     */
    private Integer score;

    /**
     * 消耗疲劳点
     */
    private Integer consumePoints;

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
