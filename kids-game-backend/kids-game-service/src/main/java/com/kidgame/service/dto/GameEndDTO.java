package com.kidgame.service.dto;

import lombok.Data;

/**
 * 结束游戏请求
 */
@Data
public class GameEndDTO {

    /**
     * 会话ID
     */
    private Long sessionId;

    /**
     * 游戏分数
     */
    private Integer score;
}
