package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 屏蔽游戏表（替代JSON字段）
 * 优化查询性能，支持索引
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_blocked_game")
public class BlockedGame implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 儿童用户ID
     */
    private Long kidId;

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
