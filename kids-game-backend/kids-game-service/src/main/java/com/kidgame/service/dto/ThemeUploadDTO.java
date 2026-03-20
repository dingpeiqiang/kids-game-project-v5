package com.kidgame.service.dto;

import lombok.Data;

/**
 * 主题上传请求
 */
@Data
public class ThemeUploadDTO {

    /**
     * 主题名称
     */
    private String themeName;

    /**
     * 作者名称
     */
    private String authorName;

    /**
     * 价格（游戏币）
     */
    private Integer price;

    /**
     * 缩略图 URL
     */
    private String thumbnailUrl;

    /**
     * 描述
     */
    private String description;

    /**
     * 主题配置 JSON（包含资源/样式）
     */
    private String configJson;

    /**
     * 状态：on_sale/offline/pending
     */
    private String status;

    /**
     * 所有者类型：GAME-游戏，APPLICATION-应用
     */
    private String ownerType;

    /**
     * 所有者 ID(游戏 ID 或应用 ID)
     */
    private Long ownerId;

    /**
     * 主题配置对象（用于接收 JSON 对象）
     */
    private Object config;
}
