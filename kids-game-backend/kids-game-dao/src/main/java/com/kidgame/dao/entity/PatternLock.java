package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 图案解锁实体
 * 存储用户的图案解锁数据（加密后存储）
 */
@Data
@TableName("t_pattern_lock")
public class PatternLock implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID（家长或儿童）
     */
    private Long userId;

    /**
     * 用户类型：PARENT-家长, KID-儿童
     */
    private String userType;

    /**
     * 加密后的图案数据
     */
    private String encryptedPattern;

    /**
     * 加密盐值
     */
    private String salt;

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
     * 用户类型常量
     */
    public static class UserType {
        public static final String PARENT = "PARENT";
        public static final String KID = "KID";
    }
}
