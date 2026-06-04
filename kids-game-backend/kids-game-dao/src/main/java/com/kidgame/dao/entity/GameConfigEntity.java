package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏配置实体
 */
@Data
@TableName("t_game_config")
public class GameConfigEntity implements Serializable {

   private static final long serialVersionUID = 1L;

    /**
     * 配置 ID
     */
    @TableId(value = "config_id", type = IdType.AUTO)
   private Long configId;

    /**
     * 游戏 ID
     */
   private Long gameId;

    /**
     * 配置键名
     */
   private String configKey;

    /**
     * 配置值
     */
   private String configValue;

    /**
     * 配置说明
     */
   private String description;

    /**
     * 创建时间（毫秒时间戳）
     */
   private Long createTime;

    /**
     * 更新时间（毫秒时间戳）
     */
   private Long updateTime;

    /**
     * 逻辑删除：0-未删除，1-已删除
     */
    @TableLogic
   private Integer deleted;
}
