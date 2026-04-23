package com.kidgame.service.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户排名信息VO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRankVO {
    private Integer rank;      // 排名,null表示无记录
    private Long score;        // 分数
    private Boolean hasRecord; // 是否有记录
}
