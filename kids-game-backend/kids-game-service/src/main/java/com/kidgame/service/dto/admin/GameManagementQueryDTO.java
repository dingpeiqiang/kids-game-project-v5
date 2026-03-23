package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;

/**
 * 游戏查询 DTO（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
public class GameManagementQueryDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 游戏名称（模糊搜索）
     */
    private String gameName;

    /**
     * 游戏编码
     */
    private String gameCode;

    /**
     * 游戏分类
     */
    private String category;

    /**
     * 适龄阶段
     */
    private String grade;

    /**
     * 状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回
     */
    private Integer status;

    /**
     * 标签 ID（多个标签用逗号分隔）
     */
    private String tagIds;

    /**
     * 是否推荐
     */
    private Boolean isFeatured;

    /**
     * 创建人 ID
     */
    private Long creatorId;

    /**
     * 页码
     */
    private Integer page = 1;

    /**
     * 每页数量
     */
    private Integer size = 10;

    /**
     * 排序字段
     */
    private String sortBy = "create_time";

    /**
     * 排序方式：asc, desc
     */
    private String sortOrder = "desc";
}
