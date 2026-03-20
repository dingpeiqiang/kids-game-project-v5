package com.kidgame.service.dto;

import com.kidgame.dao.entity.UserRelation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotNull;

/**
 * 用户关系DTO
 */
@Data
@Schema(description = "用户关系请求对象")
public class UserRelationDTO {

    @Schema(description = "监护人ID")
    @NotNull(message = "监护人ID不能为空")
    private Long guardianUserId;

    @Schema(description = "儿童ID")
    @NotNull(message = "儿童ID不能为空")
    private Long kidUserId;

    @Schema(description = "关系类型：FATHER/MOTHER/GUARDIAN/TUTOR")
    @NotNull(message = "关系类型不能为空")
    private String relationType;

    @Schema(description = "是否为主监护人")
    private Boolean isPrimary = false;

    @Schema(description = "权限级别：FULL/PARTIAL/VIEW_ONLY")
    private String permissionLevel = "FULL";

    @Schema(description = "备注")
    private String remark;

    /**
     * 转换为实体
     */
    public UserRelation toEntity() {
        UserRelation relation = new UserRelation();
        relation.setUserA(guardianUserId);
        relation.setUserB(kidUserId);
        relation.setRelationType(UserRelation.RelationType.PARENT_KID);
        relation.setRoleType(UserRelation.RoleType.valueOf(relationType));
        relation.setIsPrimary(isPrimary);
        relation.setPermissionLevel(convertPermissionLevel(permissionLevel));
        relation.setRemark(remark);
        relation.setStatus(1); // 已建立
        relation.setCreateTime(System.currentTimeMillis());
        relation.setUpdateTime(System.currentTimeMillis());
        return relation;
    }

    /**
     * 转换权限级别
     */
    private Integer convertPermissionLevel(String level) {
        if ("FULL".equals(level)) {
            return 3;
        } else if ("PARTIAL".equals(level)) {
            return 2;
        } else {
            return 1; // VIEW_ONLY
        }
    }
}
