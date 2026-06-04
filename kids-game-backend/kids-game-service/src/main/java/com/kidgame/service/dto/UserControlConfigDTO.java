package com.kidgame.service.dto;

import com.kidgame.dao.entity.UserControlConfig;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotNull;

/**
 * 用户管控配置DTO
 */
@Data
@Schema(description = "用户管控配置请求对象")
public class UserControlConfigDTO {

    @Schema(description = "用户ID（儿童）")
    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @Schema(description = "每日总时长限制（分钟）")
    private Integer dailyTimeLimitMinutes;

    @Schema(description = "疲劳点阈值（分钟）")
    private Integer fatiguePointMinutes;

    @Schema(description = "强制休息时长（分钟）")
    private Integer restDurationMinutes;

    @Schema(description = "疲劳控制模式：SOFT/HARD/OFF")
    private String fatigueControlMode = "SOFT";

    @Schema(description = "允许开始时间 HH:mm:ss")
    private String allowedStartTime;

    @Schema(description = "允许结束时间 HH:mm:ss")
    private String allowedEndTime;

    @Schema(description = "备注")
    private String remark;

    /**
     * 转换为实体
     */
    public UserControlConfig toEntity() {
        UserControlConfig config = new UserControlConfig();
        config.setUserId(userId);
        config.setDailyDuration(dailyTimeLimitMinutes);
        config.setSingleDuration(fatiguePointMinutes);
        config.setAllowedTimeStart(allowedStartTime);
        config.setAllowedTimeEnd(allowedEndTime);
        config.setCreateTime(System.currentTimeMillis());
        config.setUpdateTime(System.currentTimeMillis());
        return config;
    }
}
