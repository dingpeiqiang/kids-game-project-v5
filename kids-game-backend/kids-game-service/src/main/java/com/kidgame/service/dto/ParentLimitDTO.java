package com.kidgame.service.dto;

import lombok.Data;

/**
 * 家长管控规则请求
 */
@Data
public class ParentLimitDTO {

    /**
     * 儿童ID
     */
    private Long kidId;

    /**
     * 每日时长上限（分钟）
     */
    private Integer dailyDuration;

    /**
     * 单次时长上限（分钟）
     */
    private Integer singleDuration;

    /**
     * 允许游戏开始时间（HH:mm）
     */
    private String allowedTimeStart;

    /**
     * 允许游戏结束时间（HH:mm）
     */
    private String allowedTimeEnd;
}
