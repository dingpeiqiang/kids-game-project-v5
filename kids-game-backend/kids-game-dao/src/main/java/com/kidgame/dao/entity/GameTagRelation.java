package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏标签关联实体
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
@TableName("t_game_tag_relation")
public class GameTagRelation implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 关联 ID
     */
    @TableId(value = "relation_id", type = IdType.AUTO)
    private Long relationId;

    /**
     * 游戏 ID
     */
    @TableField("game_id")
    private Long gameId;

    /**
     * 标签 ID
     */
    @TableField("tag_id")
    private Long tagId;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Long createTime;
}
