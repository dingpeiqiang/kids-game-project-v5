package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏标签表（支持多标签）
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_game_tag")
public class GameTag implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 标签ID
     */
    @TableId(value = "tag_id", type = IdType.AUTO)
    private Long tagId;

    /**
     * 标签名称
     */
    private String tagName;

    /**
     * 标签类型：CATEGORY-分类, FEATURE-特性, RECOMMEND-推荐
     */
    private String tagType;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;

    /**
     * 标签类型常量
     */
    public static class TagType {
        public static final String CATEGORY = "CATEGORY";
        public static final String FEATURE = "FEATURE";
        public static final String RECOMMEND = "RECOMMEND";
    }
}
