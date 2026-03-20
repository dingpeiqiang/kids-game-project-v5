package com.kidgame.service.dto;

import lombok.Data;

/**
 * 更新主要监护人请求DTO
 */
@Data
public class UpdatePrimaryGuardianDTO {

    /**
     * 儿童ID
     */
    private Long kidId;

    /**
     * 新的主要监护人ID
     */
    private Long newPrimaryParentId;

    /**
     * 操作人ID（当前主要监护人或管理员）
     */
    private Long operatorId;
}
