package com.kidgame.service.dto.admin;

import lombok.Data;

/**
 * 游戏筛选条件 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class GameFilterDTO {

    /**
     * 游戏名称（模糊搜索）
     */
    private String gameName;

    /**
     * 游戏分类
     */
    private String category;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;

    /**
     * 页码
     */
    private Integer page = 1;

    /**
     * 每页数量
     */
    private Integer size = 10;
}
