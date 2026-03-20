package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏记录实体
 */
@Data
@TableName("t_game_record")
public class GameRecord implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 记录ID
     */
    @TableId(value = "record_id", type = IdType.AUTO)
    private Long recordId;

    /**
     * 用户 ID（儿童）
     */
    @TableField("user_id")
    private Long kidId;

    /**
     * 游戏ID
     */
    private Long gameId;

    /**
     * 会话ID
     */
    private Long sessionId;

    /**
     * 游戏时长（秒）
     */
    private Long duration;

    /**
     * 游戏分数
     */
    private Integer score;

    /**
     * 消耗疲劳点
     */
    private Integer consumePoints;

    /**
     * 游玩日期
     */
    private String playDate;

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
