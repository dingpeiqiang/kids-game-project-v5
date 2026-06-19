package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户游戏记录实体
 */
@Data
@TableName("user_game_record")
public class UserGameRecord {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("game_id")
    private Integer gameId;

    @TableField("score")
    private Integer score;

    @TableField("is_new_best")
    private Boolean isNewBest;

    @TableField("played_at")
    private LocalDateTime playedAt;

    @TableField("created_at")
    private LocalDateTime createdAt;
}