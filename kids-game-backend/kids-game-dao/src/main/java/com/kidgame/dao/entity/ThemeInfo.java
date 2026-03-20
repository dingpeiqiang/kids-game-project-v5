package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 主题信息实体
 */
@Data
@TableName("theme_info")
public class ThemeInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主题 ID
     */
    @TableId(value = "theme_id", type = IdType.AUTO)
    private Long themeId;

    /**
     * 作者 ID
     */
    @TableField("author_id")
    private Long authorId;

    /**
     * 所有者类型：GAME-游戏，APPLICATION-应用
     */
    @TableField("owner_type")
    private String ownerType;

    /**
     * 所有者 ID(游戏 ID 或应用 ID)
     */
    @TableField("owner_id")
    private Long ownerId;

    /**
     * 主题名称
     */
    @TableField("theme_name")
    private String themeName;

    /**
     * 适用范围：all-全游戏/specific-指定游戏
     */
    @TableField("applicable_scope")
    private String applicableScope;

    /**
     * 作者名称
     */
    @TableField("author_name")
    private String authorName;

    /**
     * 价格（游戏币）
     */
    @TableField("price")
    private Integer price;

    /**
     * 状态：on_sale/offline/pending
     */
    @TableField("status")
    private String status;

    /**
     * 下载次数
     */
    @TableField("download_count")
    private Integer downloadCount;

    /**
     * 总收益
     */
    @TableField("total_revenue")
    private Integer totalRevenue;

    /**
     * 缩略图 URL
     */
    @TableField("thumbnail_url")
    private String thumbnailUrl;

    /**
     * 描述
     */
    @TableField("description")
    private String description;

    /**
     * 主题配置（包含资源/样式）
     */
    @TableField("config_json")
    private String configJson;

    /**
     * 是否为默认主题：0-否，1-是
     */
    @TableField("is_default")
    private Boolean isDefault;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
