package com.kidgame.service.dto;

import lombok.Data;

/**
 * 儿童注册请求
 */
@Data
public class KidRegisterDTO {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 年级
     */
    private String grade;

    /**
     * 头像
     */
    private String avatar;

    /**
     * 家长手机号（至少一个，用于自动绑定家长）
     */
    private String parentPhone;

    /**
     * 家长角色类型（可选，默认为监护人）：1-父亲，2-母亲，3-监护人，4-辅导员
     */
    private Integer parentRoleType;
}

