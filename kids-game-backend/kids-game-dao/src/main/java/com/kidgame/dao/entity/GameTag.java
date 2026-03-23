package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏标签实体
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
@TableName("t_game_tag")
public class GameTag implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 标签 ID
     */
    @TableId(value = "tag_id", type = IdType.AUTO)
    private Long tagId;

    /**
     * 标签代码
     */
    @TableField("tag_code")
    private String tagCode;

    /**
     * 标签名称
     */
    @TableField("tag_name")
    private String tagName;

    /**
     * 所属分类
     */
    @TableField("category")
    private String category;

    /**
     * 图标 emoji
     */
    @TableField("icon")
    private String icon;

    /**
     * 排序
     */
    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 状态：0-禁用，1-启用
     */
    @TableField("status")
    private Integer status;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Long createTime;

    /**
     * 更新时间
     */
    @TableField("update_time")
    private Long updateTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;
}
