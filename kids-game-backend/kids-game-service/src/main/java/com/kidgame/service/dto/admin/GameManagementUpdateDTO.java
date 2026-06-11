package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 游戏更新 DTO（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
public class GameManagementUpdateDTO implements Serializable {

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
     * 标签 ID 列表
     */
    private List<Long> tagIds;

    /**
     * 图标 URL
     */
    private String iconUrl;

    /**
     * 前端模块路径
     */
    private String modulePath;

    /**
     * 游戏配置（JSON）
     */
    private String gameConfig;

    /**
     * 排序权重
     */
    private Integer sortOrder;

    /**
     * 是否推荐：0-否，1-是
     */
    private Integer isFeatured;

    /**
     * 每分钟消耗游学币
     */
    private Integer consumePointsPerMinute;

    /**
     * 启动所需最低游学币度
     */
    private Integer minFatigueToStart;

    /**
     * 版本号
     */
    private String version;

    /**
     * 版本说明
     */
    private String versionDescription;

    /**
     * 状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回
     */
    private Integer status;
}
