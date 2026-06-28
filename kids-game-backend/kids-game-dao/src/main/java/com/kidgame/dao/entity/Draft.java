package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通用草稿实体类
 * 支持多种内容类型的草稿存储
 */
@Data
@TableName("t_draft")
public class Draft {

    /**
     * 草稿ID
     */
    @TableId(value = "draft_id", type = IdType.AUTO)
    private Long draftId;

    /**
     * 作者ID
     */
    private Long authorId;

    /**
     * 作者类型：USER-用户, ADMIN-管理员
     */
    private String authorType;

    /**
     * 内容类型：THEME-主题, GAME_CONFIG-游戏配置, ARTICLE-文章等
     */
    private String contentType;

    /**
     * 草稿名称
     */
    private String draftName;

    /**
     * 草稿标题（可选）
     */
    private String draftTitle;

    /**
     * 草稿内容JSON
     */
    private String contentJson;

    /**
     * 元数据JSON（扩展字段）
     */
    private String metadataJson;

    /**
     * 缩略图URL
     */
    private String thumbnailUrl;

    /**
     * 关联实体类型
     */
    private String relatedEntityType;

    /**
     * 关联实体ID
     */
    private Long relatedEntityId;

    /**
     * 状态：draft-草稿, archived-已归档, published-已发布
     */
    private String status;

    /**
     * 内容大小（字节）
     */
    private Integer contentSize;

    /**
     * 草稿版本号
     */
    private Integer version;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 发布时间
     */
    private LocalDateTime publishedAt;

    /**
     * 标签（逗号分隔）
     */
    private String tags;

    /**
     * 备注说明
     */
    private String remark;
}
