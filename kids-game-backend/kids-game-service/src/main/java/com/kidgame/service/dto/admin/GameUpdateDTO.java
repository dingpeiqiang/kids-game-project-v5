package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;

/**
 * 更新游戏信息请求 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class GameUpdateDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 游戏名称
     */
    private String gameName;

    /**
     * 游戏分类
     */
    private String category;

    /**
     * 适龄阶段
     */
    private String grade;

    /**
     * 图标 URL
     */
    private String iconUrl;

    /**
     * 封面 URL
     */
    private String coverUrl;

    /**
     * 资源 CDN 地址
     */
    private String resourceUrl;

    /**
     * 游戏描述
     */
    private String description;

    /**
     * 前端模块路径
     */
    private String modulePath;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 每分钟消耗疲劳点数
     */
    private Integer consumePointsPerMinute;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;
}
