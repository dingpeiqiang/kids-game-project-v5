package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

import static com.baomidou.mybatisplus.annotation.FieldStrategy.IGNORED;

/**
 * 儿童用户实体（映射到 t_user 表的儿童用户）
 */
@Data
@TableName("t_user")
public class Kid implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 用户ID
     */
    @TableId(value = "user_id", type = IdType.AUTO)
    private Long kidId;

    /**
     * 用户类型：0-儿童
     */
    @TableField(value = "user_type", insertStrategy = IGNORED)
    private Integer userType;

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
     * 头像URL
     */
    private String avatar;

    /**
     * 状态
     */
    private Integer status;

    /**
     * 账号过期时间
     */
    private Long accountExpireTime;

    /**
     * 密码过期时间
     */
    private Long passwordExpireTime;

    /**
     * 最后登录时间
     */
    private Long lastLoginTime;

    /**
     * 最后登录IP
     */
    private String lastLoginIp;

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

    // 以下字段不对应数据库字段，用于兼容旧代码
    @TableField(exist = false)
    private String grade;

    @TableField(exist = false)
    private Long parentId;

    @TableField(exist = false)
    private String deviceId;

    // 疲劳点相关字段（从 UserProfile 中读取）
    @TableField(exist = false)
    private Integer fatiguePoints;

    @TableField(exist = false)
    private Integer dailyAnswerPoints;

    @TableField(exist = false)
    private Long fatigueUpdateTime;
}
