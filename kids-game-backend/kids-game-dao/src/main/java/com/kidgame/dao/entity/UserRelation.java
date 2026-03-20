package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户关系表（多对多）
 * 参考：Slack的工作区成员关系
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_relation")
public class UserRelation implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 关系ID
     */
    @TableId(value = "relation_id", type = IdType.AUTO)
    private Long relationId;

    /**
     * 关系类型：PARENT_KID-家长儿童关系, ADMIN_KID-管理员儿童关系
     */
    @EnumValue
    private RelationType relationType;

    /**
     * 用户A（如家长ID）
     */
    private Long userA;

    /**
     * 用户B（如儿童ID）
     */
    private Long userB;

    /**
     * 角色：PARENT-家长, GUARDIAN-监护人, TUTOR-辅导员
     */
    @EnumValue
    private RoleType roleType;

    /**
     * 是否主要监护人
     */
    private Boolean isPrimary;

    /**
     * 权限级别：1-仅查看, 2-部分控制, 3-完全控制
     */
    private Integer permissionLevel;

    /**
     * 关系状态：0-待确认, 1-已建立, 2-已取消
     */
    private Integer status;

    /**
     * 备注说明
     */
    private String remark;

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
     * 关系类型枚举
     */
    public enum RelationType {
        PARENT_KID(1, "家长儿童关系"),
        ADMIN_KID(2, "管理员儿童关系"),
        SIBLING(3, "兄弟姐妹关系");

        @EnumValue
        private final int code;
        private final String desc;

        RelationType(int code, String desc) {
            this.code = code;
            this.desc = desc;
        }

        public int getCode() {
            return code;
        }

        public String getDesc() {
            return desc;
        }

        public static RelationType fromCode(int code) {
            for (RelationType type : values()) {
                if (type.code == code) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown relation type code: " + code);
        }
    }

    /**
     * 角色类型枚举
     */
    public enum RoleType {
        FATHER(1, "父亲"),
        MOTHER(2, "母亲"),
        GUARDIAN(3, "监护人"),
        TUTOR(4, "辅导员");

        @EnumValue
        private final int code;
        private final String desc;

        RoleType(int code, String desc) {
            this.code = code;
            this.desc = desc;
        }

        public int getCode() {
            return code;
        }

        public String getDesc() {
            return desc;
        }

        public static RoleType fromCode(int code) {
            for (RoleType type : values()) {
                if (type.code == code) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown role type code: " + code);
        }
    }
}
