package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户扩展信息表（1:1关系）
 * 策略模式：不同用户类型存储不同扩展信息
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_profile")
public class UserProfile implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 扩展ID
     */
    @TableId(value = "profile_id", type = IdType.AUTO)
    private Long profileId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 扩展信息类型：KID_INFO-儿童信息, PARENT_INFO-家长信息
     */
    private String profileType;

    /**
     * 扩展信息（JSON格式）
     */
    @TableField("ext_info_json")
    private String profileData;

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
     * 扩展信息类型常量
     */
    public static class ProfileType {
        public static final String KID_INFO = "KID_INFO";
        public static final String PARENT_INFO = "PARENT_INFO";
    }
}
