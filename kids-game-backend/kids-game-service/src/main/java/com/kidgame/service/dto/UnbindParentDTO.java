package com.kidgame.service.dto;

import lombok.Data;

/**
 * 解除家长绑定请求DTO
 */
@Data
public class UnbindParentDTO {

    /**
     * 儿童ID
     */
    private Long kidId;

    /**
     * 家长ID
     */
    private Long parentId;

    /**
     * 操作人ID（家长或管理员）
     */
    private Long operatorId;
}
