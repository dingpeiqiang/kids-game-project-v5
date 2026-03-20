package com.kidgame.service.dto;

import lombok.Data;

/**
 * 添加孩子请求
 */
@Data
public class AddChildDTO {

    /**
     * 孩子昵称
     */
    private String nickname;

    /**
     * 头像（emoji或URL）
     */
    private String avatar;

    /**
     * 年级（幼儿园小班到小学三年级）
     */
    private String grade;

    /**
     * 登录密码
     */
    private String password;

    /**
     * 家长ID
     */
    private Long parentId;
}
