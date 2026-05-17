package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏评论实体
 */
@Data
@TableName("t_game_comment")
public class GameComment implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 评论ID
     */
    @TableId(value = "comment_id", type = IdType.AUTO)
    private Long commentId;

    /**
     * 用户ID（儿童）
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 游戏ID
     */
    @TableField("game_id")
    private Long gameId;

    /**
     * 评论内容
     */
    private String content;

    /**
     * 评分（1-5）
     */
    private Integer score;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Long createTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}