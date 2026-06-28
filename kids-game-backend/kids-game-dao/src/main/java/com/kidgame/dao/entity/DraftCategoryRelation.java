package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 草稿分类关联实体
 * 对应数据库表：draft_category_relation
 */
@Data
@TableName("t_draft_category_relation")
public class DraftCategoryRelation implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 草稿 ID
     */
    @TableField("draft_id")
    private Long draftId;

    /**
     * 分类 ID
     */
    @TableField("category_id")
    private Long categoryId;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;
}
