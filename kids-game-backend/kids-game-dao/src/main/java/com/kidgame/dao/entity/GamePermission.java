package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 游戏权限表（通用权限控制）
 * 支持所有用户类型（儿童、家长、管理员）
 * 支持多种资源类型（游戏、模块、功能等）
 * 支持 BLOCK-屏蔽, LIMIT_TIME-限时, LIMIT_COUNT-限次, ALLOW-允许 等权限类型
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
@TableName("t_game_permission")
public class GamePermission implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 权限ID
     */
    @TableId(value = "permission_id", type = IdType.AUTO)
    private Long permissionId;

    /**
     * 用户ID（支持所有用户类型）
     */
    private Long userId;

    /**
     * 用户类型：0-儿童，1-家长，2-管理员
     */
    private Integer userType;

    /**
     * 资源类型：GAME-游戏，MODULE-模块，FEATURE-功能
     */
    private String resourceType;

    /**
     * 资源ID（对应 resourceType，如游戏ID、模块ID等）
     */
    private Long gameId;

    /**
     * 权限类型：ALLOW-允许，BLOCK-屏蔽，LIMIT_TIME-限时，LIMIT_COUNT-限次
     */
    private String permissionType;

    /**
     * 限制参数（JSON格式）
     * 例如：{"max_minutes": 30, "max_count": 3, "reset_period": "DAILY"}
     */
    private String permissionParams;

    /**
     * 备注说明
     */
    private String remark;

    /**
     * 创建人ID
     */
    private Long createdBy;

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
        public static final Integer KID = 0;
        public static final Integer PARENT = 1;
        public static final Integer ADMIN = 2;
    }

    /**
     * 资源类型常量
     */
    public static class ResourceType {
        public static final String GAME = "GAME";
        public static final String MODULE = "MODULE";
        public static final String FEATURE = "FEATURE";
    }

    /**
     * 权限类型常量
     */
    public static class PermissionType {
        public static final String ALLOW = "ALLOW";
        public static final String BLOCK = "BLOCK";
        public static final String LIMIT_TIME = "LIMIT_TIME";
        public static final String LIMIT_COUNT = "LIMIT_COUNT";
    }

    /**
     * 重置周期常量
     */
    public static class ResetPeriod {
        public static final String DAILY = "DAILY";
        public static final String WEEKLY = "WEEKLY";
        public static final String MONTHLY = "MONTHLY";
    }
}
