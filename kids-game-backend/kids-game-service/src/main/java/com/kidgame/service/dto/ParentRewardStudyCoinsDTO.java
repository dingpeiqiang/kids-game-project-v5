package com.kidgame.service.dto;

import lombok.Data;

/**
 * 家长奖励游学币
 */
@Data
public class ParentRewardStudyCoinsDTO {

    private Long kidId;

    /** 奖励游学币数量（1-50） */
    private Integer points;

    private String remark;
}