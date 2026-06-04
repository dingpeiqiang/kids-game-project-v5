package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 角色表
 * 参考Spring Security的Role设计
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_role")
public class Role implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 角色ID
     */
    @TableId(value = "role_id", type = IdType.AUTO)
    private Long roleId;

    /**
     * 角色编码
     */
    private String roleCode;

    /**
     * 角色名称
     */
    private String roleName;

    /**
     * 角色描述
     */
    private String description;

    /**
     * 角色类型：SYSTEM-系统角色, CUSTOM-自定义角色
     */
    private String roleType;

    /**
     * 数据权限范围：ALL-全部数据, DEPT-部门数据, SELF-个人数据
     */
    private String dataScope;

    /**
     * 状态：0-禁用, 1-启用
     */
    private Integer status;

    /**
     * 排序
     */
    private Integer sortOrder;

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
     * 角色类型常量
     */
    public static class RoleType {
        public static final String SYSTEM = "SYSTEM";
        public static final String CUSTOM = "CUSTOM";
    }

    /**
     * 数据权限范围常量
     */
    public static class DataScope {
        public static final String ALL = "ALL";
        public static final String DEPT = "DEPT";
        public static final String SELF = "SELF";
    }
}
