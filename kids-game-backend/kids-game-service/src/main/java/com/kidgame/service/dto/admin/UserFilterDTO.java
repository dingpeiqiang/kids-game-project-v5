package com.kidgame.service.dto.admin;

import lombok.Data;

/**
 * 用户筛选条件 DTO
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
public class UserFilterDTO {

    /**
     * 用户名（模糊搜索）
     */
    private String username;

    /**
     * 用户类型：0-KID, 1-PARENT, 2-ADMIN
     */
    private Integer userType;

    /**
     * 状态：0-禁用，1-正常，2-锁定
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
