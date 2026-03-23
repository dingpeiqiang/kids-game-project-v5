package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 主题资源文件实体
 * 对应数据库表：theme_assets
 */
@Data
@TableName("theme_assets")
public class ThemeAsset implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 资产 ID
     */
    @TableId(value = "asset_id", type = IdType.AUTO)
    private Long assetId;

    /**
     * 主题 ID
     */
    @TableField("theme_id")
    private Long themeId;

    /**
     * 资源键（如：bg_main）
     */
    @TableField("asset_key")
    private String assetKey;

    /**
     * 资源类型：image/audio/font/other
     */
    @TableField("asset_type")
    private String assetType;

    /**
     * 文件路径
     */
    @TableField("file_path")
    private String filePath;

    /**
     * 文件大小（字节）
     */
    @TableField("file_size")
    private Integer fileSize;

    /**
     * 文件哈希（用于去重）
     */
    @TableField("file_hash")
    private String fileHash;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;
}
