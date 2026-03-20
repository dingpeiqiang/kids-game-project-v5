package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 权限表
 * 参考Spring Security的Permission设计
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_permission")
public class Permission implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 权限ID
     */
    @TableId(value = "permission_id", type = IdType.AUTO)
    private Long permissionId;

    /**
     * 权限编码
     */
    private String permissionCode;

    /**
     * 权限名称
     */
    private String permissionName;

    /**
     * 权限类型：MENU-菜单, BUTTON-按钮, API-接口
     */
    private String permissionType;

    /**
     * 父权限ID
     */
    private Long parentId;

    /**
     * 路径/URL
     */
    private String path;

    /**
     * 组件名称
     */
    private String component;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 图标
     */
    private String icon;

    /**
     * 状态：0-禁用, 1-启用
     */
    private Integer status;

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
     * 权限类型常量
     */
    public static class PermissionType {
        public static final String MENU = "MENU";
        public static final String BUTTON = "BUTTON";
        public static final String API = "API";
    }
}
