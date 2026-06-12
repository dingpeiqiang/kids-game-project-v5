package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户收藏游戏表
 */
@Data
@TableName("t_user_favorite")
public class Favorite implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 收藏ID
     */
    @TableId(value = "favorite_id", type = IdType.AUTO)
    private Long favoriteId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 游戏ID
     */
    private Long gameId;

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