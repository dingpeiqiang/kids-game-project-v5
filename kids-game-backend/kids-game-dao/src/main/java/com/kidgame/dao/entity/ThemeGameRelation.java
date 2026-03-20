package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 主题 - 游戏关系实体（多对多）
 */
@Data
@TableName("theme_game_relation")
public class ThemeGameRelation implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 关系 ID
     */
    @TableId(value = "relation_id", type = IdType.AUTO)
    private Long relationId;

    /**
     * 主题 ID
     */
    @TableField("theme_id")
    private Long themeId;

    /**
     * 游戏 ID
     */
    @TableField("game_id")
    private Long gameId;

    /**
     * 游戏代码（如：snake-vue3）
     */
    @TableField("game_code")
    private String gameCode;

    /**
     * 是否为该游戏的默认主题
     */
    @TableField("is_default")
    private Boolean isDefault;

    /**
     * 排序权重
     */
    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;
}
