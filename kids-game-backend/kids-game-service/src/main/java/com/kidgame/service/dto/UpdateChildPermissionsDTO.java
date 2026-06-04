package com.kidgame.service.dto;

import lombok.Data;

/**
 * 更新孩子游戏权限请求
 */
@Data
public class UpdateChildPermissionsDTO {

    /**
     * 儿童ID
     */
    private Long kidId;

    /**
     * 每日游戏时长限制（分钟）
     */
    private Integer dailyDuration;

    /**
     * 单次游戏时长限制（分钟）
     */
    private Integer singleDuration;

    /**
     * 游戏开始时间（HH:mm格式）
     */
    private String startTime;

    /**
     * 游戏结束时间（HH:mm格式）
     */
    private String endTime;

    /**
     * 是否启用疲劳点系统
     */
    private Boolean enableFatiguePoints;
}
