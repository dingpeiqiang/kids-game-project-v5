package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户主题偏好实体
 * 存储每个用户对每个游戏/应用的当前使用主题
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_theme_preference")
public class UserThemePreference implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 偏好 ID
     */
    @TableId(value = "preference_id", type = IdType.AUTO)
    private Long preferenceId;

    /**
     * 用户 ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 所有者类型：GAME-游戏，APPLICATION-应用
     */
    @TableField("owner_type")
    private String ownerType;

    /**
     * 所有者 ID（游戏 ID 或应用 ID）
     */
    @TableField("owner_id")
    private Long ownerId;

    /**
     * 主题 ID
     */
    @TableField("theme_id")
    private Long themeId;

    /**
     * 是否启用：0-否，1-是
     */
    @TableField("is_active")
    private Integer isActive;

    /**
     * 创建时间
     */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
