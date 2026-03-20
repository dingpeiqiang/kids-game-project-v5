package com.kidgame.service.dto;

import lombok.Data;

/**
 * 家长选项DTO（用于孩子注册时选择）
 */
@Data
public class ParentOptionDTO {

    /**
     * 家长ID
     */
    private Long parentId;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 真实姓名
     */
    private String realName;

    /**
     * 手机号（脱敏显示）
     */
    private String maskedPhone;

    /**
     * 注册时间
     */
    private Long createTime;
}
