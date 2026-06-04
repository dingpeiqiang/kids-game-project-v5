package com.kidgame.service.dto;

import lombok.Data;

/**
 * 家长信息DTO（用于返回给儿童查看）
 */
@Data
public class ParentInfoDTO {

    /**
     * 家长ID
     */
    private Long parentId;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 头像
     */
    private String avatar;

    /**
     * 角色类型：1-父亲，2-母亲，3-监护人，4-辅导员
     */
    private Integer roleType;

    /**
     * 角色类型描述
     */
    private String roleTypeDesc;

    /**
     * 是否主要监护人
     */
    private Boolean isPrimary;

    /**
     * 权限级别：1-仅查看，2-部分控制，3-完全控制
     */
    private Integer permissionLevel;

    /**
     * 绑定时间
     */
    private Long createTime;
}
