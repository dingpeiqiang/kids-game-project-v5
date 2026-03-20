package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 家长用户实体
 */
@Data
@TableName("t_parent")
public class Parent implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 家长ID
     */
    @TableId(value = "parent_id", type = IdType.AUTO)
    private Long parentId;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 加密密码
     */
    private String password;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 真实姓名
     */
    private String realName;

    /**
     * 实名认证状态
     */
    private Integer isVerified;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;

    /**
     * 登录Token（仅用于返回，不存储到数据库）
     */
    @TableField(exist = false)
    private String token;
}
