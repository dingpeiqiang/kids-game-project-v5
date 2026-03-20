package com.kidgame.service.dto;

import com.kidgame.dao.entity.GamePermission;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotNull;

/**
 * 游戏权限DTO
 */
@Data
@Schema(description = "游戏权限请求对象")
public class GamePermissionDTO {

    @Schema(description = "用户ID（儿童）")
    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @Schema(description = "游戏ID")
    @NotNull(message = "游戏ID不能为空")
    private Long gameId;

    @Schema(description = "权限类型：ALLOW/BLOCK/LIMIT_TIME/LIMIT_COUNT")
    @NotNull(message = "权限类型不能为空")
    private String permissionType;

    @Schema(description = "时间限制（分钟）")
    private Integer timeLimitMinutes;

    @Schema(description = "次数限制")
    private Integer countLimit;

    @Schema(description = "备注")
    private String remark;

    /**
     * 转换为实体
     */
    public GamePermission toEntity() {
        GamePermission permission = new GamePermission();
        permission.setUserId(userId);
        permission.setGameId(gameId);
        permission.setPermissionType(permissionType);
        // 将限制参数转换为JSON格式
        if (timeLimitMinutes != null || countLimit != null) {
            permission.setPermissionParams(buildPermissionParams());
        }
        permission.setCreateTime(System.currentTimeMillis());
        permission.setUpdateTime(System.currentTimeMillis());
        return permission;
    }

    /**
     * 构建权限参数JSON
     */
    private String buildPermissionParams() {
        StringBuilder params = new StringBuilder("{");
        if (timeLimitMinutes != null) {
            params.append("\"max_minutes\":").append(timeLimitMinutes);
        }
        if (countLimit != null) {
            if (timeLimitMinutes != null) {
                params.append(",");
            }
            params.append("\"max_count\":").append(countLimit);
        }
        params.append(",\"reset_period\":\"DAILY\"}");
        return params.toString();
    }
}
