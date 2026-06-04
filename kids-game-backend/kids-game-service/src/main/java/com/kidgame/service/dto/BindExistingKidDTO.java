package com.kidgame.service.dto;

import lombok.Data;

/**
 * 家长绑定已有孩子请求DTO
 */
@Data
public class BindExistingKidDTO {

    /**
     * 孩子用户名
     */
    private String kidUsername;

    /**
     * 家长ID
     */
    private Long parentId;

    /**
     * 角色类型：1-父亲，2-母亲，3-监护人，4-辅导员
     */
    private Integer roleType;

    /**
     * 是否主要监护人（默认false）
     */
    private Boolean isPrimary;

    /**
     * 权限级别：1-仅查看，2-部分控制，3-完全控制
     */
    private Integer permissionLevel;
}
