package com.kidgame.service.dto.admin;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;
import java.util.List;

/**
 * 游戏创建 DTO（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
public class GameManagementCreateDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 游戏编码
     */
    @NotBlank(message = "游戏编码不能为空", groups = CreateGroup.class)
    private String gameCode;

    /**
     * 游戏名称
     */
    @NotBlank(message = "游戏名称不能为空", groups = CreateGroup.class)
    private String gameName;

    /**
     * 游戏分类
     */
    @NotBlank(message = "游戏分类不能为空", groups = CreateGroup.class)
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
    private Integer sortOrder = 0;

    /**
     * 是否推荐：0-否，1-是
     */
    private Integer isFeatured = 0;

    /**
     * 每分钟消耗游学币
     */
    private Integer consumePointsPerMinute = 1;

    /**
     * 启动所需最低游学币度
     */
    private Integer minFatigueToStart = 0;

    /**
     * 验证分组接口 - 创建操作
     */
    public interface CreateGroup {
    }
}
